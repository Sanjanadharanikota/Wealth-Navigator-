const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { processReceipt } = require('../services/receiptProcessor');

// @route   POST /api/scan/receipt
// @desc    Process receipt image and extract expense data
// @access  Private
router.post('/receipt', protect, async (req, res) => {
  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ 
        success: false, 
        message: 'No image provided' 
      });
    }

    // Process the image (you'll need to implement this)
    const expenseData = await processReceipt(image);
    
    res.json({
      success: true,
      ...expenseData
    });
  } catch (error) {
    console.error('Receipt processing error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error processing receipt' 
    });
  }
});

module.exports = router;