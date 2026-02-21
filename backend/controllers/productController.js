const Product = require('../models/Product');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');

exports.getAllProducts = async (req, res) => {
  try {
    const { category, search, type } = req.query;
    let filter = { active: true };
    const andFilters = [];

    // Debug incoming query for troubleshooting filtering issues
    // eslint-disable-next-line no-console
    console.debug('getAllProducts -> incoming query', req.query);

    if (type) {
      if (type === 'product') {
        andFilters.push({ $or: [{ type: 'product' }, { type: { $exists: false } }, { type: null }] });
      } else {
        andFilters.push({ type });
      }
    }

    // support category by slug or id
    if (category) {
      let categoryDoc = null;
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(category)) {
        categoryDoc = await Category.findById(category);
      }
      if (!categoryDoc) {
        categoryDoc = await Category.findOne({ slug: category });
      }
      if (categoryDoc) {
        filter.category = categoryDoc._id;
      }
    }

    // support filtering by subCategory (slug or id)
    if (req.query.subCategory) {
      let subCategoryVal = req.query.subCategory;
      const mongoose = require('mongoose');
      let subCatDoc = null;
      if (mongoose.Types.ObjectId.isValid(subCategoryVal)) {
        subCatDoc = await SubCategory.findById(subCategoryVal);
      }
      if (!subCatDoc) {
        subCatDoc = await SubCategory.findOne({ slug: subCategoryVal });
      }
      if (subCatDoc) {
        filter.subCategory = subCatDoc._id;
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

    // Debug final filter used for DB query
    // eslint-disable-next-line no-console
    console.debug('getAllProducts -> final filter', JSON.stringify(filter));

    const products = await Product.find(filter).populate('category').populate('subCategory').sort({ order: 1, createdAt: 1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Batch update multiple products' category and/or subCategory
exports.batchUpdateProducts = async (req, res) => {
  try {
    const { ids, category, subCategory, description } = req.body;
    // log input for debugging
    // eslint-disable-next-line no-console
    console.debug('batchUpdateProducts -> payload', { ids, category, subCategory });
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'ids array is required' });
    }

    let categoryDoc = null;
    let subCategoryDoc = null;

    if (subCategory) {
      subCategoryDoc = await SubCategory.findById(subCategory).populate('category');
      if (!subCategoryDoc) return res.status(400).json({ message: 'Invalid sub-category' });
      categoryDoc = subCategoryDoc.category;
    }

    if (category) {
      categoryDoc = await Category.findById(category);
      if (!categoryDoc) return res.status(400).json({ message: 'Invalid category' });
    }

    if (!categoryDoc && !subCategoryDoc && typeof description === 'undefined') {
      return res.status(400).json({ message: 'Either category/subCategory or description must be provided' });
    }

    // If target category is eservice, ensure subCategory is provided
    if (categoryDoc && categoryDoc.type === 'eservice' && !subCategoryDoc) {
      return res.status(400).json({ message: 'Sub-category is required for e-services' });
    }

    // Ensure subCategory belongs to the provided category when both provided
    if (categoryDoc && subCategoryDoc) {
      const parentId = subCategoryDoc.category?._id ? subCategoryDoc.category._id.toString() : String(subCategoryDoc.category);
      const targetId = categoryDoc._id.toString();
      // debug ids
      // eslint-disable-next-line no-console
      console.debug('batchUpdateProducts -> parentId, targetId', parentId, targetId);
      if (parentId !== targetId) {
        return res.status(400).json({ message: 'Sub-category does not belong to the target category', parentId, targetId });
      }
    }

    const updatedProducts = [];

    // determine starting order in target scope when moving categories
    let nextOrder = null;
    if (categoryDoc || subCategoryDoc) {
      const orderFilter = subCategoryDoc
        ? { subCategory: subCategoryDoc._id }
        : { category: categoryDoc._id, subCategory: { $exists: false } };
      const maxInScope = await Product.find(orderFilter).sort({ order: -1 }).limit(1);
      nextOrder = maxInScope[0]?.order ? maxInScope[0].order + 1 : 1;
    }

    for (const id of ids) {
      const prod = await Product.findById(id);
      if (!prod) continue;

      if (categoryDoc || subCategoryDoc) {
        prod.category = categoryDoc._id;
        if (subCategoryDoc) prod.subCategory = subCategoryDoc._id;
        else prod.subCategory = undefined;
        prod.order = nextOrder++;
        // update type to reflect category/subcategory if available
        prod.type = subCategoryDoc?.type || categoryDoc.type || prod.type;
      }
      if (typeof description !== 'undefined') {
        prod.description = description;
      }

      await prod.save();
      await prod.populate('category');
      await prod.populate('subCategory');
      updatedProducts.push(prod);
    }

    res.json({ message: 'Batch update completed', updatedCount: updatedProducts.length, products: updatedProducts });
  } catch (error) {
    // better logging for debugging
    // eslint-disable-next-line no-console
    console.error('batchUpdateProducts error', error);
    res.status(500).json({ message: 'Server error', error: error.message, stack: error.stack });
  }
};

    exports.moveProduct = async (req, res) => {
      try {
        const { id } = req.params;
        const { direction } = req.body; // 'up' or 'down'
        const { category, subCategory } = req.query;

        const product = await Product.findById(id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        // build scope filter
        const filter = { active: true };
        if (subCategory) filter.subCategory = subCategory;
        else if (category) filter.category = category;
        else if (product.subCategory) filter.subCategory = product.subCategory;
        else if (product.category) filter.category = product.category;

        // ensure consistent ordering
        const list = await Product.find(filter).sort({ order: 1, createdAt: 1 });
        const idx = list.findIndex(p => p._id.toString() === id.toString());
        if (idx === -1) return res.status(400).json({ message: 'Product not in scope' });

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

        res.json({ message: 'Product moved successfully' });
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

    const resolvedPrice = typeof price !== 'undefined' && price !== '' ? Number(price) : (subCategoryDoc?.defaultPrice ?? categoryDoc.defaultPrice);
    const resolvedDiscount = typeof discount !== 'undefined' && discount !== '' ? Number(discount) : (subCategoryDoc?.defaultDiscount ?? (categoryDoc.defaultDiscount || 0));
    const resolvedDescription = description && description.trim().length > 0 ? description : (categoryDoc.description || '');

    if (typeof resolvedPrice === 'undefined' || resolvedPrice === null || resolvedPrice === '') {
      return res.status(400).json({ message: 'Price is required (set on product or category)' });
    }

    const resolvedType = type || categoryDoc.type || 'product';
    // Do NOT inherit image from sub-category. Each product should have its own image.
    const resolvedImage = image;

    // determine order within scope (subCategory > category)
    let orderValue = 0;
    if (subCategoryDoc) {
      const max = await Product.find({ subCategory: subCategoryDoc._id }).sort({ order: -1 }).limit(1);
      orderValue = max[0]?.order ? max[0].order + 1 : 1;
    } else if (categoryDoc) {
      const max = await Product.find({ category: categoryDoc._id, subCategory: { $exists: false } }).sort({ order: -1 }).limit(1);
      orderValue = max[0]?.order ? max[0].order + 1 : 1;
    }

    const product = new Product({
      name,
      description: resolvedDescription,
      price: resolvedPrice,
      discount: resolvedDiscount,
      image: resolvedImage,
      category: categoryDoc._id,
      subCategory: subCategoryDoc?._id,
      order: orderValue,
      type: resolvedType
    });

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
    const { name, description, price, discount, image, category, active, type, subCategory } = req.body;

    const update = { updatedAt: Date.now() };
    if (typeof name !== 'undefined') update.name = name;
    if (typeof description !== 'undefined') update.description = description;
    if (typeof price !== 'undefined' && price !== '' && price !== null) update.price = Number(price);
    if (typeof discount !== 'undefined' && discount !== '' && discount !== null) update.discount = Number(discount);
    if (typeof image !== 'undefined') update.image = image;
    if (typeof category !== 'undefined') update.category = category;
    if (typeof subCategory !== 'undefined') update.subCategory = subCategory === '' ? undefined : subCategory;
    if (typeof active !== 'undefined') update.active = active;
    if (typeof type !== 'undefined') update.type = type;

    let subCategoryDoc = null;
    if (typeof subCategory !== 'undefined' && subCategory) {
      subCategoryDoc = await SubCategory.findById(subCategory).populate('category');
      if (!subCategoryDoc) {
        return res.status(400).json({ message: 'Invalid sub-category' });
      }
      update.category = subCategoryDoc.category?._id;
      // Do NOT copy sub-category image into product on update — product keeps its own image
      if (typeof update.type === 'undefined') {
        update.type = subCategoryDoc.type || 'eservice';
      }
    }

    // If price/description are not provided but category has defaults, fill them
    if ((typeof update.price === 'undefined' || update.price === '') && (category || update.category)) {
      // Prefer sub-category defaults when available
      if (subCategoryDoc && typeof subCategoryDoc.defaultPrice !== 'undefined') {
        update.price = subCategoryDoc.defaultPrice;
      } else {
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

      if (!update.price && subCategoryDoc && typeof subCategoryDoc.defaultDiscount !== 'undefined' && typeof update.discount === 'undefined') {
        update.discount = subCategoryDoc.defaultDiscount;
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
