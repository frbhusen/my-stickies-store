const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const sendOrderEmail = async (order) => {
  try {
    const itemsHTML = order.items
      .map(item => {
        const desc = item.productDescription ? `<div style="font-size:12px;color:#555;margin-top:4px;">${item.productDescription}</div>` : '';
        const cat = item.categoryName ? `<div style="font-size:12px;color:#555;margin-top:4px;"><strong>Category:</strong> ${item.categoryName}</div>` : '';
        const sub = item.subCategoryName ? `<div style="font-size:12px;color:#555;"><strong>Sub-Category:</strong> ${item.subCategoryName}</div>` : '';
        const subDesc = item.subCategoryDescription ? `<div style="font-size:12px;color:#555;margin-top:2px;">${item.subCategoryDescription}</div>` : '';
        return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; vertical-align: top;">
            <div style="font-weight:600">${item.productName}</div>
            ${desc}
            ${cat}
            ${sub}
            ${subDesc}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; vertical-align: top;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; vertical-align: top;">SYP ${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
      `
      }).join('');

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: `New Order Received: ${order.orderNumber}`,
      html: `
        <h2>New Order Received</h2>
        <p><strong>Order Number:</strong> ${order.orderNumber}</p>
        
        <h3>Customer Information</h3>
        <p><strong>Name:</strong> ${order.customer.fullName}</p>
        <p><strong>Phone:</strong> ${order.customer.phoneNumber}</p>
        <p><strong>City:</strong> ${order.customer.city}</p>
        
        <h3>Order Items</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #047DCB; color: white;">
              <th style="padding: 10px; text-align: left;">Product</th>
              <th style="padding: 10px; text-align: left;">Quantity</th>
              <th style="padding: 10px; text-align: left;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>
        
        <p><strong style="font-size: 18px;">Total Amount: SYP ${order.totalAmount.toFixed(2)}</strong></p>
        <p style="color: #666; margin-top: 20px;">Log in to your admin panel to confirm and manage this order.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Order email sent to admin');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

const sendOrderConfirmationEmail = async (orderNumber, customerEmail) => {
  try {
    if (!customerEmail) return;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: customerEmail,
      subject: `Order Confirmation: ${orderNumber}`,
      html: `
        <h2>Thank you for your order!</h2>
        <p>Your order has been received and will be confirmed shortly.</p>
        <p><strong>Order Number:</strong> ${orderNumber}</p>
        <p>We will contact you soon with more information about your order.</p>
        <br>
        <p>Best regards,<br>My Stickies Team</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Confirmation email sent to customer');
  } catch (error) {
    console.error('Error sending confirmation email:', error);
  }
};

module.exports = {
  sendOrderEmail,
  sendOrderConfirmationEmail
};
