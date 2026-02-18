const SubCategory = require('../models/SubCategory');
const Category = require('../models/Category');

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
    const subCategories = await SubCategory.find(filter).populate('category');
    res.json(subCategories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createSubCategory = async (req, res) => {
  try {
    const { name, description, image, category, type } = req.body;
    const parentCategory = await Category.findById(category);
    if (!parentCategory) {
      return res.status(400).json({ message: 'Invalid parent category' });
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const subCategory = new SubCategory({
      name,
      description,
      image,
      category,
      type: type || 'eservice',
      slug
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
    const { name, description, image, category, type } = req.body;

    const update = { updatedAt: Date.now() };
    if (typeof name !== 'undefined') {
      update.name = name;
      update.slug = name.toLowerCase().replace(/\s+/g, '-');
    }
    if (typeof description !== 'undefined') update.description = description;
    if (typeof image !== 'undefined') update.image = image;
    if (typeof type !== 'undefined') update.type = type;

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

    res.json({ message: 'Sub-category updated successfully', subCategory });
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
