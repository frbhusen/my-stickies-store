// Simple runner to initialize the local WhatsApp client and keep the process alive
// Run this in a separate terminal: `node whatsappRunner.js`

// Usage: `node whatsappRunner.js [clientId]`
// If you want a separate session for this runner (no conflict with the backend), pass a different clientId.
const clientIdArg = process.argv[2];
if (clientIdArg) {
	process.env.WHATSAPP_CLIENT_ID = clientIdArg;
	console.log(`Starting WhatsApp runner with client id: ${clientIdArg}`);
} else {
	console.log('Starting WhatsApp runner — this will print a QR to scan if needed (using default client id).');
}

// Importing the service initializes the client (which prints QR when needed)
require('./utils/whatsappLocalService');

// Keep the Node process alive
setInterval(() => {}, 1e7);
