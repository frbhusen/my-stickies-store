const Product = require('../models/Product');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');

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

    const products = await Product.find(filter).populate('category').populate('subCategory').sort({ order: 1, createdAt: 1 });
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
    const { name, description, price, discount, image, category, type, subCategory } = req.body;

    let categoryDoc = null;
    let subCategoryDoc = null;
    if (subCategory) {
      subCategoryDoc = await SubCategory.findById(subCategory).populate('category');
      if (!subCategoryDoc) {
        return res.status(400).json({ message: 'Invalid sub-category' });
      }
      categoryDoc = subCategoryDoc.category;
    } else if (category) {
      categoryDoc = await Category.findById(category);
    }

    if (!categoryDoc) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    if ((type === 'eservice' || categoryDoc.type === 'eservice') && !subCategoryDoc) {
      return res.status(400).json({ message: 'Sub-category is required for e-services' });
    }

    const resolvedPrice = typeof price !== 'undefined' && price !== '' ? Number(price) : categoryDoc.defaultPrice;
    const resolvedDiscount = typeof discount !== 'undefined' && discount !== '' ? Number(discount) : (categoryDoc.defaultDiscount || 0);
    const resolvedDescription = description && description.trim().length > 0 ? description : (categoryDoc.description || '');

    if (typeof resolvedPrice === 'undefined' || resolvedPrice === null || resolvedPrice === '') {
      return res.status(400).json({ message: 'Price is required (set on product or category)' });
    }

    const resolvedType = type || categoryDoc.type || 'product';
    const resolvedImage = resolvedType === 'eservice' && subCategoryDoc?.image ? subCategoryDoc.image : image;

    if (resolvedType === 'eservice' && (!resolvedImage || resolvedImage.trim().length === 0)) {
      return res.status(400).json({ message: 'Sub-category image is required for e-services' });
    }

    const product = new Product({
      name,
      description: resolvedDescription,
      price: resolvedPrice,
      discount: resolvedDiscount,
      image: resolvedImage,
      category: categoryDoc._id,
      subCategory: subCategoryDoc?._id,
      type: resolvedType
    });

    // set order to end of list for this type
    const maxOrderDoc = await Product.findOne({ type: resolvedType }).sort({ order: -1 }).select('order');
    product.order = maxOrderDoc && typeof maxOrderDoc.order === 'number' ? maxOrderDoc.order + 1 : 0;

    await product.save();
    await product.populate('category');
    await product.populate('subCategory');

    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { name, description, price, discount, image, category, active, type, subCategory, order } = req.body;

    const update = { updatedAt: Date.now() };
    if (typeof name !== 'undefined') update.name = name;
    if (typeof description !== 'undefined') update.description = description;
    if (typeof price !== 'undefined') update.price = Number(price);
    if (typeof discount !== 'undefined') update.discount = Number(discount);
    if (typeof image !== 'undefined') update.image = image;
    if (typeof category !== 'undefined') update.category = category;
    if (typeof subCategory !== 'undefined') update.subCategory = subCategory;
    if (typeof active !== 'undefined') update.active = active;
    if (typeof type !== 'undefined') update.type = type;
    if (typeof order !== 'undefined') update.order = Number(order);

    if (typeof subCategory !== 'undefined' && subCategory) {
      const subCategoryDoc = await SubCategory.findById(subCategory).populate('category');
      if (!subCategoryDoc) {
        return res.status(400).json({ message: 'Invalid sub-category' });
      }
      update.category = subCategoryDoc.category?._id;
      if (subCategoryDoc.image) {
        update.image = subCategoryDoc.image;
      }
      if (typeof update.type === 'undefined') {
        update.type = subCategoryDoc.type || 'eservice';
      }
    }

    // If price/description are not provided but category has defaults, fill them
    if ((typeof update.price === 'undefined' || update.price === '') && (category || update.category)) {
      const categoryDoc = await Category.findById(update.category || category);
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
    ).populate('category').populate('subCategory');

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

// Move product up or down by swapping order with neighbour
exports.moveProduct = async (req, res) => {
  try {
    const { direction } = req.body; // 'up' or 'down'
    if (!['up', 'down'].includes(direction)) {
      return res.status(400).json({ message: 'Invalid direction' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    // Fetch all products of same type and sort by order then createdAt
    // Resolve type: treat missing/null type as 'product' for backwards compatibility
    const resolvedType = product.type === 'eservice' ? 'eservice' : 'product';

    // Try fast path: find nearest neighbour and swap their orders
    const sortDir = direction === 'up' ? -1 : 1;
    const neighbourQuery = resolvedType === 'eservice'
      ? { type: 'eservice', _id: { $ne: product._id } }
      : { $or: [{ type: 'product' }, { type: { $exists: false } }, { type: null }], _id: { $ne: product._id } };

    // When product.order is a number we can try to find neighbour by order
    if (typeof product.order === 'number') {
      const orderCond = direction === 'up' ? { $lt: product.order } : { $gt: product.order };
      const neighbour = await Product.findOne({ ...neighbourQuery, order: orderCond }).sort({ order: sortDir, createdAt: sortDir }).limit(1);

      if (neighbour && typeof neighbour.order === 'number' && neighbour.order !== product.order) {
        const tmp = product.order;
        product.order = neighbour.order;
        neighbour.order = tmp;
        await product.save();
        await neighbour.save();
        const updated = await Product.findById(product._id);
        return res.json({ message: 'Product moved', product: updated });
      }
    }

    // Fallback: full list reorder (stable, handles missing/duplicate orders)
    const list = resolvedType === 'eservice'
      ? await Product.find({ type: 'eservice' }).sort({ order: 1, createdAt: 1 })
      : await Product.find({ $or: [{ type: 'product' }, { type: { $exists: false } }, { type: null }] }).sort({ order: 1, createdAt: 1 });

    const index = list.findIndex(p => p._id.toString() === product._id.toString());
    if (index === -1) return res.status(404).json({ message: 'Product not found in list' });

    let swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= list.length) {
      return res.status(200).json({ message: 'Already at boundary', product });
    }

    // Swap positions in array
    const tmp = list[swapIndex];
    list[swapIndex] = list[index];
    list[index] = tmp;

    // Reassign order sequentially to ensure stable ordering
    for (let i = 0; i < list.length; i++) {
      if (list[i].order !== i) {
        list[i].order = i;
        // eslint-disable-next-line no-await-in-loop
        await list[i].save();
      }
    }

    const updated = await Product.findById(product._id);
    res.json({ message: 'Product moved', product: updated });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
