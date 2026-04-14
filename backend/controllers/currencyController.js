const currencyService = require('../services/currencyService');

exports.getRates = async (req, res) => {
  try {
    const { base } = req.query;
    const rates = await currencyService.getExchangeRates(base || 'USD');
    res.json({ success: true, data: rates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
