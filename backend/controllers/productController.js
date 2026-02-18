const Product = require('../models/Product');
const Category = require('../models/Category');

exports.getAllProducts = async (req, res) => {
  try {
    const { category, search, type } = req.query;
    let filter = { active: true };
    const andFilters = [];

    if (type) {
      if (type === 'product') {
        andFilters.push({ $or: [{ type: 'product' }, { type: { $exists: false } }, { type: null }] });
      } else {
        andFilters.push({ type });
      }
    }

    if (category) {
      const categoryDoc = await Category.findOne({ slug: category });
      if (categoryDoc) {
        filter.category = categoryDoc._id;
      }
    }

    if (search) {
      andFilters.push({
        $or: [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
        ]
      });
    }

    if (andFilters.length > 0) {
      filter.$and = andFilters;
    }

    const products = await Product.find(filter).populate('category');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, discount, image, category, type } = req.body;
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    const resolvedPrice = typeof price !== 'undefined' && price !== '' ? Number(price) : categoryDoc.defaultPrice;
    const resolvedDiscount = typeof discount !== 'undefined' && discount !== '' ? Number(discount) : (categoryDoc.defaultDiscount || 0);
    const resolvedDescription = description && description.trim().length > 0 ? description : (categoryDoc.description || '');

    if (typeof resolvedPrice === 'undefined' || resolvedPrice === null || resolvedPrice === '') {
      return res.status(400).json({ message: 'Price is required (set on product or category)' });
    }

    const resolvedType = type || categoryDoc.type || 'product';

    const product = new Product({
      name,
      description: resolvedDescription,
      price: resolvedPrice,
      discount: resolvedDiscount,
      image,
      category,
      type: resolvedType
    });

    await product.save();
    await product.populate('category');

    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { name, description, price, discount, image, category, active, type } = req.body;

    const update = { updatedAt: Date.now() };
    if (typeof name !== 'undefined') update.name = name;
    if (typeof description !== 'undefined') update.description = description;
    if (typeof price !== 'undefined') update.price = Number(price);
    if (typeof discount !== 'undefined') update.discount = Number(discount);
    if (typeof image !== 'undefined') update.image = image;
    if (typeof category !== 'undefined') update.category = category;
    if (typeof active !== 'undefined') update.active = active;
    if (typeof type !== 'undefined') update.type = type;

    // If price/description are not provided but category has defaults, fill them
    if ((typeof update.price === 'undefined' || update.price === '') && category) {
      const categoryDoc = await Category.findById(category);
      if (categoryDoc && typeof categoryDoc.defaultPrice !== 'undefined') {
        update.price = categoryDoc.defaultPrice;
      }
      if (categoryDoc && typeof categoryDoc.defaultDiscount !== 'undefined' && typeof update.discount === 'undefined') {
        update.discount = categoryDoc.defaultDiscount;
      }
      if (categoryDoc && typeof update.description === 'undefined' && categoryDoc.description) {
        update.description = categoryDoc.description;
      }
      if (categoryDoc && typeof update.type === 'undefined' && categoryDoc.type) {
        update.type = categoryDoc.type;
      }
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    ).populate('category');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product updated successfully', product });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
