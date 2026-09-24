const mongoose = require('mongoose');
const User = require('../models/user.schema');
const Order = require('../models/order.schema');
const Product = require('../models/product.schema');
const CommissionPayment = require('../models/commissionPayment.schema');
const { submitOrderToGoogleForm } = require('../services/googleForm.service');

function orderResponse(order) {
  const result = order.toJSON();
  if (result.influencer_id && typeof result.influencer_id === 'object') {
    result.influencer_name = result.influencer_id.name;
    result.influencer_id = result.influencer_id.id;
  } else {
    result.influencer_name = null;
  }
  return result;
}

async function sumField(model, match, field) {
  const [result] = await model.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: `$${field}` } } },
  ]);
  return result?.total || 0;
}

async function restoreStock(products) {
  if (products.length === 0) return;
  await Product.bulkWrite(products.map((product) => ({
    updateOne: {
      filter: { _id: product.product_id },
      update: { $inc: { quantity: product.quantity } },
    },
  })));
}

async function reserveStock(products) {
  const reservedProducts = [];
  for (const product of products) {
    const result = await Product.updateOne(
      { _id: product.product_id, quantity: { $gte: product.quantity } },
      { $inc: { quantity: -product.quantity } }
    );

    if (result.modifiedCount !== 1) {
      await restoreStock(reservedProducts);
      const error = new Error(`الكمية المطلوبة من المنتج ${product.name} غير متاحة`);
      error.statusCode = 400;
      throw error;
    }
    reservedProducts.push(product);
  }
}

async function getOrders(req, res, next) {
  try {
    if (req.user.role === 'admin') {
      const orders = await Order.find()
        .sort({ created_at: -1 })
        .populate('influencer_id', 'name');
      return res.json(orders.map(orderResponse));
    }

    if (!mongoose.isObjectIdOrHexString(req.user.id)) {
      return res.status(401).json({ error: 'الجلسة غير صالحة، يرجى تسجيل الدخول مجددًا' });
    }

    const orders = await Order.find({ influencer_id: req.user.id })
      .select('customer_name customer_phone governorate address products order_value discount_amount commission_amount status created_at')
      .sort({ created_at: -1 });

    return res.json(orders.map((order) => {
      const result = order.toJSON();
      result.customer_phone = result.customer_phone
        ? `****${result.customer_phone.slice(-4)}`
        : null;
      return result;
    }));
  } catch (error) {
    return next(error);
  }
}

async function getAdminStats(req, res, next) {
  try {
    const activeOrders = { status: { $ne: 'cancelled' } };
    const [
      totalOrders,
      totalRevenue,
      pendingOrders,
      totalCommission,
      paidCommission,
      totalInfluencers,
      topInfluencers,
      recentOrderDocuments,
    ] = await Promise.all([
      Order.countDocuments(activeOrders),
      sumField(Order, activeOrders, 'order_value'),
      Order.countDocuments({ status: 'pending' }),
      sumField(Order, activeOrders, 'commission_amount'),
      sumField(CommissionPayment, {}, 'amount'),
      User.countDocuments({ role: 'influencer', is_active: true }),
      User.aggregate([
        { $match: { role: 'influencer' } },
        {
          $lookup: {
            from: 'orders',
            localField: '_id',
            foreignField: 'influencer_id',
            as: 'orders',
          },
        },
        {
          $project: {
            _id: 0,
            name: 1,
            promo_code: 1,
            order_count: { $size: '$orders' },
            total_sales: {
              $sum: {
                $map: {
                  input: '$orders',
                  as: 'order',
                  in: { $cond: [{ $ne: ['$$order.status', 'cancelled'] }, '$$order.order_value', 0] },
                },
              },
            },
          },
        },
        { $sort: { total_sales: -1 } },
        { $limit: 1 },
      ]),
      Order.find().sort({ created_at: -1 }).limit(5).populate('influencer_id', 'name'),
    ]);

    return res.json({
      totalOrders,
      totalRevenue,
      pendingOrders,
      totalCommission,
      paidCommission,
      pendingCommission: totalCommission - paidCommission,
      totalInfluencers,
      topInfluencer: topInfluencers[0] || null,
      recentOrders: recentOrderDocuments.map(orderResponse),
    });
  } catch (error) {
    return next(error);
  }
}

async function getInfluencerStats(req, res, next) {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ error: 'غير مسموح' });
    }
    if (!mongoose.isObjectIdOrHexString(req.user.id)) {
      return res.status(401).json({ error: 'الجلسة غير صالحة، يرجى تسجيل الدخول مجددًا' });
    }

    const influencerId = new mongoose.Types.ObjectId(req.user.id);
    const activeOrders = { influencer_id: influencerId, status: { $ne: 'cancelled' } };
    const [user, totalOrders, totalSales, totalCommission, paidCommission] = await Promise.all([
      User.findById(influencerId).select('name promo_code discount_rate commission_rate'),
      Order.countDocuments(activeOrders),
      sumField(Order, activeOrders, 'order_value'),
      sumField(Order, activeOrders, 'commission_amount'),
      sumField(CommissionPayment, { influencer_id: influencerId }, 'amount'),
    ]);

    if (!user) return res.status(404).json({ error: 'الإنفلونسر غير موجود' });

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        promo_code: user.promo_code,
        discount_rate: user.discount_rate,
        commission_rate: user.commission_rate,
      },
      totalOrders,
      totalSales,
      totalCommission,
      paidCommission,
      pendingCommission: totalCommission - paidCommission,
    });
  } catch (error) {
    return next(error);
  }
}

async function validatePromoCode(req, res, next) {
  try {
    const { promo_code } = req.body;
    if (!promo_code) return res.status(400).json({ error: 'يرجى إدخال البرومو كود' });

    const influencer = await User.findOne({
      promo_code: promo_code.toUpperCase().trim(),
      role: 'influencer',
      is_active: true,
    }).select('name promo_code discount_rate commission_rate');

    if (!influencer) {
      return res.status(404).json({ valid: false, error: 'البرومو كود غير صحيح أو غير نشط' });
    }
    return res.json({ valid: true, influencer });
  } catch (error) {
    return next(error);
  }
}

async function createOrder(req, res, next) {
  try {
    const { customer_name, customer_phone, governorate, address, products, promo_code } = req.body;

    if (!customer_name || !customer_phone || !governorate || !address) {
      return res.status(400).json({ error: 'اسم العميل ورقم الواتساب والمحافظة والعنوان مطلوبة' });
    }
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'يجب اختيار منتج واحد على الأقل' });
    }

    const productIds = new Set();
    const requestedProducts = [];
    for (const item of products) {
      const quantity = Number(item.quantity);
      if (!mongoose.isObjectIdOrHexString(item.product_id) || !Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({ error: 'بيانات المنتجات أو الكميات غير صحيحة' });
      }
      const productId = new mongoose.Types.ObjectId(item.product_id).toString();
      if (productIds.has(productId)) {
        return res.status(400).json({ error: 'لا يمكن تكرار نفس المنتج في الأوردر' });
      }
      productIds.add(productId);
      requestedProducts.push({ product_id: productId, quantity });
    }

    const productDocuments = await Product.find({ _id: { $in: [...productIds] } });
    if (productDocuments.length !== requestedProducts.length) {
      return res.status(400).json({ error: 'أحد المنتجات المختارة غير موجود' });
    }

    const productsById = new Map(productDocuments.map((product) => [product.id, product]));
    const orderProducts = requestedProducts.map((item) => {
      const product = productsById.get(item.product_id);
      return {
        product_id: product._id,
        name: product.name,
        code: product.code,
        price: product.price,
        quantity: item.quantity,
        subtotal: product.price * item.quantity,
      };
    });
    const orderValue = orderProducts.reduce((total, product) => total + product.subtotal, 0);

    let influencer = null;
    let discountAmount = 0;
    let commissionAmount = 0;
    let finalCode = null;

    if (promo_code && promo_code.trim()) {
      finalCode = promo_code.toUpperCase().trim();
      influencer = await User.findOne({
        promo_code: finalCode,
        role: 'influencer',
        is_active: true,
      });
      if (!influencer) {
        return res.status(400).json({ error: 'البرومو كود غير صحيح أو غير نشط' });
      }
      discountAmount = (orderValue * influencer.discount_rate) / 100;
      commissionAmount = (orderValue * influencer.commission_rate) / 100;
    }

    await reserveStock(orderProducts);
    let order;
    try {
      order = await Order.create({
        customer_name: customer_name.trim(),
        customer_phone: customer_phone.trim(),
        governorate: governorate.trim(),
        address: address.trim(),
        products: orderProducts,
        order_value: orderValue,
        promo_code: finalCode,
        influencer_id: influencer?._id || null,
        discount_amount: discountAmount,
        commission_amount: commissionAmount,
      });
    } catch (error) {
      await restoreStock(orderProducts);
      throw error;
    }

    try {
      await submitOrderToGoogleForm(order);
      order.google_form_synced = true;
      await Order.updateOne({ _id: order._id }, { $set: { google_form_synced: true } });
    } catch (googleFormError) {
      console.error('Failed to submit order to Google Form:', googleFormError.message);
    }

    await order.populate('influencer_id', 'name');
    return res.status(201).json(orderResponse(order));
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
    return next(error);
  }
}

async function updateOrder(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isObjectIdOrHexString(id)) {
      return res.status(404).json({ error: 'الأوردر غير موجود' });
    }

    const { status } = req.body;
    const validStatuses = ['pending', 'delivered', 'cancelled'];
    if (!status) return res.status(400).json({ error: 'لا توجد بيانات للتحديث' });
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'حالة الأوردر غير صحيحة' });
    }

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: 'الأوردر غير موجود' });

    const wasCancelled = order.status === 'cancelled';
    const willBeCancelled = status === 'cancelled';
    let stockAction = null;

    try {
      if (!wasCancelled && willBeCancelled) {
        await restoreStock(order.products);
        stockAction = 'restored';
      } else if (wasCancelled && !willBeCancelled) {
        await reserveStock(order.products);
        stockAction = 'reserved';
      }

      await Order.updateOne({ _id: order._id }, { $set: { status } });
      order.status = status;
    } catch (error) {
      if (stockAction === 'restored') await reserveStock(order.products);
      if (stockAction === 'reserved') await restoreStock(order.products);
      throw error;
    }

    await order.populate('influencer_id', 'name');
    return res.json(orderResponse(order));
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
    return next(error);
  }
}

async function deleteOrder(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isObjectIdOrHexString(id)) {
      return res.status(404).json({ error: 'الأوردر غير موجود' });
    }

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: 'الأوردر غير موجود' });

    const shouldRestoreStock = order.status !== 'cancelled';
    if (shouldRestoreStock) await restoreStock(order.products);
    try {
      await order.deleteOne();
    } catch (error) {
      if (shouldRestoreStock) await reserveStock(order.products);
      throw error;
    }

    return res.json({ message: 'تم حذف الأوردر بنجاح' });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
    return next(error);
  }
}

module.exports = {
  getOrders,
  getAdminStats,
  getInfluencerStats,
  validatePromoCode,
  createOrder,
  updateOrder,
  deleteOrder,
};
