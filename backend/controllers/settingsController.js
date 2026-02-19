const Settings = require('../models/Settings');

exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { currency } = req.body;
    if (currency && !['SYP', 'USD'].includes(currency)) {
      return res.status(400).json({ message: 'Invalid currency' });
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    if (currency) {
      settings.currency = currency;
      settings.updatedAt = Date.now();
    }

    await settings.save();
    res.json({ message: 'Settings updated successfully', settings });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
