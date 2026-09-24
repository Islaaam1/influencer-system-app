const mongoose = require('mongoose');
const Product = require('../models/product.schema');
const Order = require('../models/order.schema');

async function getProducts(req, res, next) {
  try {
    const products = await Product.find().sort({ created_at: -1 });
    return res.json(products);
  } catch (error) {
    return next(error);
  }
}

async function createProduct(req, res, next) {
  try {
    const { name, code, price, quantity } = req.body;
    if (!name || !code || price === undefined || quantity === undefined) {
      return res.status(400).json({ error: 'اسم المنتج والكود والسعر والكمية مطلوبة' });
    }

    const product = await Product.create({
      name,
      code,
      price: Number(price),
      quantity: Number(quantity),
    });
    return res.status(201).json(product);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'كود المنتج مستخدم بالفعل' });
    }
    return next(error);
  }
}

async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isObjectIdOrHexString(id)) {
      return res.status(404).json({ error: 'المنتج غير موجود' });
    }

    const { name, code, price, quantity } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (code !== undefined) updates.code = code;
    if (price !== undefined) updates.price = Number(price);
    if (quantity !== undefined) updates.quantity = Number(quantity);
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'لا توجد بيانات للتحديث' });
    }

    const product = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
    if (!product) return res.status(404).json({ error: 'المنتج غير موجود' });
    return res.json(product);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'كود المنتج مستخدم بالفعل' });
    }
    return next(error);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isObjectIdOrHexString(id)) {
      return res.status(404).json({ error: 'المنتج غير موجود' });
    }

    const usedInActiveOrder = await Order.exists({
      'products.product_id': id,
      status: { $ne: 'cancelled' },
    });
    if (usedInActiveOrder) {
      return res.status(400).json({ error: 'لا يمكن حذف منتج موجود داخل أوردر نشط' });
    }

    const product = await Product.findByIdAndDelete(id);
    if (!product) return res.status(404).json({ error: 'المنتج غير موجود' });
    return res.json({ message: 'تم حذف المنتج بنجاح' });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getProducts, createProduct, updateProduct, deleteProduct };
