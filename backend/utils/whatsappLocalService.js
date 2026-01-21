// Default disabled: only enable WhatsApp when explicitly requested.
// This avoids Puppeteer/Chrome crashes on hosts without Chromium (e.g., Koyeb free tier).
const whatsappEnabled = process.env.ENABLE_WHATSAPP === '1' && process.env.DISABLE_WHATSAPP !== '1';

if (!whatsappEnabled) {
  module.exports = {
    isReady: () => false,
    sendWhatsApp: async () => null,
    sendOrderWhatsapps: async () => null
  };
  console.log('WhatsApp integration is disabled (set ENABLE_WHATSAPP=1 to enable)');
  return;
}

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const puppeteer = require('puppeteer');

// Uses LocalAuth to persist session in .wwebjs_auth directory
// Client ID can be configured via env var WHATSAPP_CLIENT_ID to allow multiple independent sessions.
const whatsappClientId = process.env.WHATSAPP_CLIENT_ID || 'my-stickies';
const client = new Client({
  authStrategy: new LocalAuth({ clientId: whatsappClientId }),
  puppeteer: {
    headless: true,
    executablePath: puppeteer.executablePath(),
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

let ready = false;

client.on('qr', (qr) => {
  console.log('WhatsApp local client QR received — scan it with your phone (scan shown below)');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  ready = true;
  console.log('✓ WhatsApp local client ready (you can now send messages from your number)');
});

client.on('auth_failure', (msg) => {
  console.error('WhatsApp auth failure:', msg);
});

try {
  client.initialize();
} catch (initErr) {
  // If another process has locked the userDataDir Puppeteer will throw.
  console.error('WhatsApp client failed to initialize:', initErr && initErr.message ? initErr.message : initErr);
  console.error('If you see "The browser is already running for ..." it means another process uses the same session directory.');
  console.error('Options: stop the other process; or run the runner with a different client id:');
  console.error('  node whatsappRunner.js my-stickies-runner');
}

function isReady() {
  return ready;
}

function formatNumberToWhatsAppId(number) {
  if (!number) return null;
  const n = number.trim();
  const withPlus = n.startsWith('+') ? n : `+${n}`;
  // whatsapp-web.js expects the id without + and with @c.us
  return withPlus.replace('+', '') + '@c.us';
}

async function sendWhatsApp(number, text) {
  if (!ready) {
    console.warn('WhatsApp local client not ready; message skipped');
    return null;
  }
  const id = formatNumberToWhatsAppId(number);
  if (!id) throw new Error('Invalid phone number for WhatsApp: ' + number);
  try {
    // Disable sendSeen to avoid triggering sendSeen on undefined chats
    const msg = await client.sendMessage(id, text, { sendSeen: false });
    console.log('WhatsApp local sent', msg.id? msg.id._serialized : msg);
    return msg;
  } catch (err) {
    console.error('Error sending WhatsApp local message:', err);
    throw err;
  }
}

async function sendOrderWhatsapps(order) {
  if (!order) return;
  try {
    // Only send a single message to the admin phone configured in ADMIN_PHONE.
    const adminNumber = process.env.ADMIN_PHONE;
    if (!adminNumber) {
      console.warn('ADMIN_PHONE not configured in .env — skipping WhatsApp message.');
      return;
    }

    // Compose admin message with order details
    const adminLines = [];
    adminLines.push(`New order received: ${order.orderNumber}`);
    if (order.customer) {
      adminLines.push(`Customer: ${order.customer.fullName || ''}`);
      if (order.customer.phoneNumber) adminLines.push(`Phone: ${order.customer.phoneNumber}`);
      if (order.customer.city) adminLines.push(`City: ${order.customer.city}`);
    }
    adminLines.push('Items:');
    (order.items || []).forEach(item => {
      adminLines.push(`- ${item.productName} x${item.quantity} = SYP ${((item.price || 0) * (item.quantity || 0)).toFixed(2)}`);
    });
    adminLines.push(`Total: SYP ${Number(order.totalAmount || 0).toFixed(2)}`);

    const adminMessage = adminLines.join('\n');

    try {
      await sendWhatsApp(adminNumber, adminMessage);
    } catch (err) {
      console.error('Failed to send WhatsApp message to ADMIN_PHONE', adminNumber, err);
    }
  } catch (err) {
    console.error('sendOrderWhatsapps error:', err);
  }
}

module.exports = {
  isReady,
  sendWhatsApp,
  sendOrderWhatsapps
};
