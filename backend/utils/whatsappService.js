// Twilio integration removed. This module is a no-op placeholder to keep
// existing call sites stable while using the free local WhatsApp method.

function sendWhatsApp() {
  console.warn('Twilio-based sendWhatsApp was removed. Using local WhatsApp instead.');
  return null;
}

async function sendOrderWhatsapps() {
  console.warn('Twilio-based sendOrderWhatsapps was removed. Using local WhatsApp instead.');
  return null;
}

module.exports = {
  sendWhatsApp,
  sendOrderWhatsapps
};
