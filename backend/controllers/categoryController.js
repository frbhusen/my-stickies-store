const Category = require('../models/Category');
const Product = require('../models/Product');

exports.getAllCategories = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = {};
    if (type) {
      if (type === 'product') {
        filter.$or = [{ type: 'product' }, { type: { $exists: false } }, { type: null }];
      } else {
        filter.type = type;
      }
    }
    const categories = await Category.find(filter);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description, defaultPrice, defaultDiscount, type, image, parentCategory } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, '-');

    const category = new Category({
      name,
      description,
      image,
      defaultPrice,
      defaultDiscount,
      parentCategory: parentCategory || null,
      type: type || 'product',
      slug
    });
    await category.save();

    res.status(201).json({ message: 'Category created successfully', category });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { name, description, defaultPrice, defaultDiscount, applyDefaultsToProducts, type, image, parentCategory } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, '-');

    const update = { name, description, image, defaultPrice, defaultDiscount, slug, parentCategory: parentCategory || null };
    if (typeof type !== 'undefined') {
      update.type = type;
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Optionally propagate defaults to all products in this category
    if (applyDefaultsToProducts && category) {
      const update = {};
      if (typeof defaultPrice !== 'undefined') update.price = defaultPrice;
      if (typeof defaultDiscount !== 'undefined') update.discount = defaultDiscount;
      if (typeof description !== 'undefined') update.description = description;
      if (Object.keys(update).length > 0) {
        update.updatedAt = Date.now();
        await Product.updateMany({ category: category._id }, update);
      }
    }

    res.json({ message: 'Category updated successfully', category });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
