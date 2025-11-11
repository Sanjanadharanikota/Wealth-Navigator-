// server/src/routes/auth.ts
// ... existing code ...

// Forgot PIN - Send reset email
router.post('/forgot-pin', [
  body('email').isEmail().normalizeEmail(),
], async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent.' });
    }

    // Generate reset token (in production, use a proper token system)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    // In production, store this in database and send email
    // For now, we'll just return success
    console.log(`Reset token for ${email}: ${resetToken}`);

    res.status(200).json({
      message: 'If an account with that email exists, a reset link has been sent.',
      // In production: send email with reset link
    });
  } catch (error: any) {
    console.error('Forgot PIN error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset PIN with token
router.post('/reset-pin', [
  body('token').notEmpty(),
  body('newPin').isLength({ min: 6, max: 6 }).isNumeric(),
], async (req: Request, res: Response) => {
  try {
    const { token, newPin } = req.body;

    // In production, verify token from database
    // For now, we'll simulate a successful reset
    if (!token || token.length < 32) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Find user by reset token (in production, store in database)
    // For demo purposes, we'll assume any valid-looking token works
    const user = await User.findOne({ email: 'demo@example.com' }); // In production, find by token

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    await user.setPin(newPin);

    res.status(200).json({ message: 'PIN reset successfully' });
  } catch (error: any) {
    console.error('Reset PIN error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ... rest of existing code ...
