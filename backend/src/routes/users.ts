import express, { Request, Response } from 'express';
import User from '../models/user';
import { AuthService } from '../services/auth.service';
import { validate } from '../middleware/validate';
import { registerSchema } from '../schemas/auth.schema';
import { verifyToken } from '../middleware/auth';

const router = express.Router();

/**
 * GET /api/users/me
 * Get current user profile
 */
router.get('/me', verifyToken, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

/**
 * POST /api/users/register
 * Register new user
 */
router.post(
  '/register',
  validate(registerSchema),
  async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      const result = await AuthService.register({
        email,
        password,
        firstName,
        lastName,
      });

      res.status(201).json({
        message: 'User registered successfully',
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      res.status(400).json({ message });
    }
  }
);

export default router;
