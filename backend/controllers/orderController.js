const Order = require('../models/Order');
const Product = require('../models/Product');
const { sendOrderEmail, sendOrderConfirmationEmail } = require('../utils/emailService');
const localWhatsApp = require('../utils/whatsappLocalService');

exports.createOrder = async (req, res) => {
  try {
    // Debug: log incoming request body to help diagnose validation errors
    console.debug('createOrder request body:', JSON.stringify(req.body));
    const { customer, items: rawItems, totalAmount, email } = req.body;

    // Ensure items include productName/description and category/sub-category details
    const items = await Promise.all((rawItems || []).map(async itm => {
      const item = { ...itm };
      try {
        if (item.product) {
          const prod = await Product.findById(item.product)
            .select('name description price category subCategory')
            .populate('category', 'name')
            .populate('subCategory', 'name description');
          if (prod) {
            item.productName = item.productName || prod.name;
            item.productDescription = prod.description || item.productDescription || '';
            item.categoryName = prod.category?.name || item.categoryName || '';
            item.subCategoryName = prod.subCategory?.name || item.subCategoryName || '';
            item.subCategoryDescription = prod.subCategory?.description || item.subCategoryDescription || '';
            // If price not provided, fall back to product price
            if (!item.price && typeof prod.price !== 'undefined') {
              item.price = prod.price;
            }
          }
        }
      } catch (err) {
        // ignore product lookup failures and proceed with provided data
        console.warn('Failed to resolve product for order item:', err.message);
      }
      return item;
    }));

    const order = new Order({
      customer: {
        fullName: customer.fullName,
        phoneNumber: customer.phoneNumber,
        city: customer.city,
        email: email
      },
      items,
      totalAmount
    });

    await order.save();

    // Send email to admin
    await sendOrderEmail(order);

    // Send confirmation email to customer if provided
    if (email) {
      await sendOrderConfirmationEmail(order.orderNumber, email);
    }

    // Twilio-based WhatsApp integration removed (using local WhatsApp client only)

    // Send WhatsApp via local WhatsApp Web client if it's ready (free method)
    try {
      if (localWhatsApp && typeof localWhatsApp.isReady === 'function' && localWhatsApp.isReady()) {
        await localWhatsApp.sendOrderWhatsapps(order);
      } else {
        console.log('Local WhatsApp client not ready — skipping local WhatsApp messages');
      }
    } catch (localErr) {
      console.error('Error sending WhatsApp messages (local):', localErr);
    }

    res.status(201).json({ 
      message: 'Order created successfully',
      orderNumber: order.orderNumber,
      order 
    });
  } catch (error) {
    // Log full error for debugging (stack trace) and return concise message to client
    console.error('createOrder error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};

    if (status) {
      filter.status = status;
    }

    const orders = await Order.find(filter).populate('items.product').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status, notes, updatedAt: Date.now() },
      { new: true }
    ).populate('items.product');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ message: 'Order updated successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
