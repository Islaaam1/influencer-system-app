const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/user.schema');
const Order = require('../models/order.schema');
const CommissionPayment = require('../models/commissionPayment.schema');

async function generatePromoCode(name) {
  const firstName = name.split(' ')[0]
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z]/g, '')
    .substring(0, 6);

  if (!firstName || firstName.length < 2) {
    return `INF${Date.now().toString().slice(-4)}`;
  }

  let code = `${firstName}10`;
  let counter = 2;
  while (await User.exists({ promo_code: code })) {
    code = `${firstName.substring(0, 4)}${counter}10`;
    counter += 1;
  }

  return code;
}

function influencerResponse(user) {
  const result = user.toJSON();
  delete result.password;
  delete result.role;
  return result;
}

async function getInfluencers(req, res, next) {
  try {
    const influencers = await User.aggregate([
      { $match: { role: 'influencer' } },
      { $sort: { created_at: -1 } },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'influencer_id',
          as: 'orders',
        },
      },
      {
        $lookup: {
          from: 'commission_payments',
          localField: '_id',
          foreignField: 'influencer_id',
          as: 'payments',
        },
      },
      {
        $project: {
          _id: 0,
          id: { $toString: '$_id' },
          name: 1,
          email: 1,
          phone: 1,
          promo_code: 1,
          discount_rate: 1,
          commission_rate: 1,
          is_active: 1,
          created_at: 1,
          total_orders: { $size: '$orders' },
          total_sales: {
            $sum: {
              $map: {
                input: '$orders',
                as: 'order',
                in: { $cond: [{ $ne: ['$$order.status', 'cancelled'] }, '$$order.order_value', 0] },
              },
            },
          },
          total_commission: {
            $sum: {
              $map: {
                input: '$orders',
                as: 'order',
                in: { $cond: [{ $ne: ['$$order.status', 'cancelled'] }, '$$order.commission_amount', 0] },
              },
            },
          },
          paid_commission: { $sum: '$payments.amount' },
        },
      },
    ]);

    return res.json(influencers);
  } catch (error) {
    return next(error);
  }
}

async function createInfluencer(req, res, next) {
  try {
    let { name, email, phone, password, discount_rate = 10, commission_rate = 10, promo_code } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'الاسم والبريد الإلكتروني وكلمة المرور مطلوبة' });
    }

    email = email.trim().toLowerCase();
    if (await User.exists({ email })) {
      return res.status(400).json({ error: 'هذا البريد الإلكتروني مستخدم بالفعل' });
    }

    const finalCode = (promo_code || await generatePromoCode(name)).toUpperCase().trim();
    if (await User.exists({ promo_code: finalCode })) {
      return res.status(400).json({ error: 'البرومو كود مستخدم بالفعل، يرجى اختيار كود مختلف' });
    }

    const user = await User.create({
      name,
      email,
      phone: phone || null,
      password: await bcrypt.hash(password, 10),
      role: 'influencer',
      promo_code: finalCode,
      discount_rate: Number(discount_rate),
      commission_rate: Number(commission_rate),
    });

    return res.status(201).json({
      ...influencerResponse(user),
      total_orders: 0,
      total_sales: 0,
      total_commission: 0,
      paid_commission: 0,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'البريد الإلكتروني أو البرومو كود مستخدم بالفعل' });
    }
    return next(error);
  }
}

async function updateInfluencer(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isObjectIdOrHexString(id)) {
      return res.status(404).json({ error: 'الإنفلونسر غير موجود' });
    }

    const influencer = await User.findOne({ _id: id, role: 'influencer' });
    if (!influencer) return res.status(404).json({ error: 'الإنفلونسر غير موجود' });

    const { name, email, phone, password, discount_rate, commission_rate, promo_code, is_active } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email.trim().toLowerCase();
    if (phone !== undefined) updates.phone = phone || null;
    if (discount_rate !== undefined) updates.discount_rate = Number(discount_rate);
    if (commission_rate !== undefined) updates.commission_rate = Number(commission_rate);
    if (promo_code !== undefined) updates.promo_code = promo_code.toUpperCase().trim();
    if (is_active !== undefined) updates.is_active = [true, 1, '1'].includes(is_active);
    if (password) updates.password = await bcrypt.hash(password, 10);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'لا توجد بيانات للتحديث' });
    }

    Object.assign(influencer, updates);
    await influencer.save();
    return res.json(influencerResponse(influencer));
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'البريد الإلكتروني أو البرومو كود مستخدم بالفعل' });
    }
    return next(error);
  }
}

async function deleteInfluencer(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isObjectIdOrHexString(id)) {
      return res.status(404).json({ error: 'الإنفلونسر غير موجود' });
    }

    const influencer = await User.findOne({ _id: id, role: 'influencer' });
    if (!influencer) return res.status(404).json({ error: 'الإنفلونسر غير موجود' });

    await Promise.all([
      Order.updateMany({ influencer_id: id }, { $set: { influencer_id: null } }),
      CommissionPayment.deleteMany({ influencer_id: id }),
    ]);
    await influencer.deleteOne();

    return res.json({ message: 'تم حذف الإنفلونسر بنجاح' });
  } catch (error) {
    return next(error);
  }
}

async function payCommission(req, res, next) {
  try {
    const { id } = req.params;
    const { amount, notes } = req.body;
    if (!mongoose.isObjectIdOrHexString(id)) {
      return res.status(404).json({ error: 'الإنفلونسر غير موجود' });
    }

    const influencer = await User.findOne({ _id: id, role: 'influencer' }).select('name');
    if (!influencer) return res.status(404).json({ error: 'الإنفلونسر غير موجود' });

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'يرجى إدخال مبلغ صحيح' });
    }

    await CommissionPayment.create({
      influencer_id: id,
      amount: Number(amount),
      notes: notes || null,
    });

    return res.json({ message: `تم تسجيل دفع ${amount} جنيه لـ ${influencer.name}` });
  } catch (error) {
    return next(error);
  }
}

async function getCommissionHistory(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isObjectIdOrHexString(id)) return res.json([]);

    const payments = await CommissionPayment.find({ influencer_id: id }).sort({ paid_at: -1 });
    return res.json(payments);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getInfluencers,
  createInfluencer,
  updateInfluencer,
  deleteInfluencer,
  payCommission,
  getCommissionHistory,
};
