import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import User from '../models/User';
import { generateToken, generateRefreshToken, authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Register new user
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('name').trim().notEmpty(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user
      const user = new User({
        email,
        passwordHash,
        name,
        consentTimestamp: new Date(),
      });

      await user.save();

      const token = generateToken((user._id as any).toString());
      const refreshToken = generateRefreshToken((user._id as any).toString());

      res.status(201).json({
        message: 'User registered successfully',
        token,
        refreshToken,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

// Login
router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify password
      if (!user.passwordHash) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = generateToken((user._id as any).toString());
      const refreshToken = generateRefreshToken((user._id as any).toString());

      res.json({
        message: 'Login successful',
        token,
        refreshToken,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          hasWebAuthn: user.webAuthnCredentials.length > 0,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

// PhonePe-style registration with PIN
router.post(
  '/register-with-pin',
  [
    body('email').isEmail().normalizeEmail(),
    body('name').trim().notEmpty(),
    body('pin').isLength({ min: 4, max: 6 }).isNumeric(),
    body('phone').optional().isMobilePhone('any'),
    body('dateOfBirth').optional().isISO8601(),
    body('monthlyIncome').optional().isNumeric(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, name, pin, phone, dateOfBirth, monthlyIncome } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash PIN
      const pinHash = await bcrypt.hash(pin, 12);

      // Create user
      const user = new User({
        email,
        name,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        monthlyIncome,
        pinHash,
        hasBankConnected: false,
        onboardingComplete: false,
        consentTimestamp: new Date(),
      });

      await user.save();

      const token = generateToken((user._id as any).toString());
      const refreshToken = generateRefreshToken((user._id as any).toString());

      res.status(201).json({
        message: 'User registered successfully',
        token,
        refreshToken,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          hasBankConnected: user.hasBankConnected,
          onboardingComplete: user.onboardingComplete,
        },
        onboardingStep: 'bank_connection',
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

// Verify PIN for login
router.post(
  '/verify-pin',
  [
    body('email').isEmail().normalizeEmail(),
    body('pin').isLength({ min: 4, max: 6 }).isNumeric(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, pin } = req.body;

      // Find user and include pinHash
      const user = await User.findOne({ email }).select('+pinHash');
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify PIN
      const isValidPIN = await bcrypt.compare(pin, user.pinHash);
      if (!isValidPIN) {
        return res.status(401).json({ error: 'Invalid PIN' });
      }

      const token = generateToken((user._id as any).toString());
      const refreshToken = generateRefreshToken((user._id as any).toString());

      res.json({
        verified: true,
        token,
        refreshToken,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          hasBankConnected: user.hasBankConnected,
          onboardingComplete: user.onboardingComplete,
          hasWebAuthn: user.webAuthnCredentials.length > 0,
        },
      });
    } catch (error) {
      console.error('PIN verification error:', error);
      res.status(500).json({ error: 'Verification failed' });
    }
  }
);

// Get onboarding status
router.get('/onboarding-status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let nextStep = 'complete';
    if (!user.hasBankConnected) {
      nextStep = 'bank_connection';
    }

    res.json({
      onboardingComplete: user.onboardingComplete,
      hasBankConnected: user.hasBankConnected,
      nextStep,
    });
  } catch (error) {
    console.error('Onboarding status error:', error);
    res.status(500).json({ error: 'Failed to get onboarding status' });
  }
});

export default router;
