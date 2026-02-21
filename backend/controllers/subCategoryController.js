const SubCategory = require('../models/SubCategory');
const Category = require('../models/Category');
const Product = require('../models/Product');

exports.getAllSubCategories = async (req, res) => {
  try {
    const { type, category } = req.query;
    const filter = {};
    if (type) {
      filter.type = type;
    }
    if (category) {
      filter.category = category;
    }
    const subCategories = await SubCategory.find(filter).populate('category').sort({ order: 1, createdAt: 1 });
    res.json(subCategories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createSubCategory = async (req, res) => {
  try {
    const { name, description, image, category, type, defaultPrice, defaultDiscount } = req.body;
    const parentCategory = await Category.findById(category);
    if (!parentCategory) {
      return res.status(400).json({ message: 'Invalid parent category' });
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-');
    // determine order within parent category
    let orderVal = 0;
    const max = await SubCategory.find({ category }).sort({ order: -1 }).limit(1);
    orderVal = max[0]?.order ? max[0].order + 1 : 1;

    const subCategory = new SubCategory({
      name,
      description,
      image,
      category,
      type: type || 'eservice',
      defaultPrice: typeof defaultPrice !== 'undefined' && defaultPrice !== '' ? Number(defaultPrice) : undefined,
      defaultDiscount: typeof defaultDiscount !== 'undefined' && defaultDiscount !== '' ? Number(defaultDiscount) : 0,
      slug,
      order: orderVal
    });

    await subCategory.save();
    await subCategory.populate('category');

    res.status(201).json({ message: 'Sub-category created successfully', subCategory });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateSubCategory = async (req, res) => {
  try {
    const { name, description, image, category, type, defaultPrice, defaultDiscount } = req.body;

    const existing = await SubCategory.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Sub-category not found' });
    }

    const update = { updatedAt: Date.now() };
    if (typeof name !== 'undefined') {
      update.name = name;
      update.slug = name.toLowerCase().replace(/\s+/g, '-');
    }
    if (typeof description !== 'undefined') update.description = description;
    if (typeof image !== 'undefined') update.image = image;
    if (typeof type !== 'undefined') update.type = type;
    if (typeof defaultPrice !== 'undefined') update.defaultPrice = defaultPrice === '' ? undefined : Number(defaultPrice);
    if (typeof defaultDiscount !== 'undefined') update.defaultDiscount = Number(defaultDiscount);

    if (typeof category !== 'undefined') {
      const parentCategory = await Category.findById(category);
      if (!parentCategory) {
        return res.status(400).json({ message: 'Invalid parent category' });
      }
      update.category = category;
    }

    const subCategory = await SubCategory.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    ).populate('category');

    if (!subCategory) {
      return res.status(404).json({ message: 'Sub-category not found' });
    }

    const hasSavedPrice = typeof subCategory.defaultPrice !== 'undefined' && subCategory.defaultPrice !== null;
    const hasSavedDiscount = typeof subCategory.defaultDiscount !== 'undefined' && subCategory.defaultDiscount !== null;

    let updatedProductsCount = 0;
    // Always override all products in this sub-category with saved defaults
    if (hasSavedPrice || hasSavedDiscount) {
      const productUpdate = {};
      if (hasSavedPrice) productUpdate.price = Number(subCategory.defaultPrice);
      if (hasSavedDiscount) productUpdate.discount = Number(subCategory.defaultDiscount);
      const result = await Product.updateMany({ subCategory: subCategory._id }, { $set: productUpdate });
      updatedProductsCount = result?.modifiedCount || result?.nModified || 0;
    }

    res.json({ message: 'Sub-category updated successfully', subCategory, updatedProductsCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteSubCategory = async (req, res) => {
  try {
    const subCategory = await SubCategory.findByIdAndDelete(req.params.id);
    if (!subCategory) {
      return res.status(404).json({ message: 'Sub-category not found' });
    }
    res.json({ message: 'Sub-category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.moveSubCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { direction } = req.body; // 'up' or 'down'

    const sub = await SubCategory.findById(id);
    if (!sub) return res.status(404).json({ message: 'Sub-category not found' });

    const filter = { category: sub.category };
    const list = await SubCategory.find(filter).sort({ order: 1, createdAt: 1 });
    const idx = list.findIndex(s => s._id.toString() === id.toString());
    if (idx === -1) return res.status(400).json({ message: 'Sub-category not in scope' });

    let swapWith = null;
    if (direction === 'up' && idx > 0) swapWith = list[idx - 1];
    if (direction === 'down' && idx < list.length - 1) swapWith = list[idx + 1];

    if (!swapWith) return res.status(400).json({ message: 'Cannot move in that direction' });

    const current = list[idx];
    const temp = current.order;
    current.order = swapWith.order;
    swapWith.order = temp;

    await current.save();
    await swapWith.save();

    res.json({ message: 'Sub-category moved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
