import express, { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { validate } from '../middleware/validate';
import { loginSchema, refreshTokenSchema } from '../schemas/auth.schema';
import { verifyToken } from '../middleware/auth';

const router = express.Router();

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post(
  '/login',
  validate(loginSchema),
  async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      const result = await AuthService.login(email, password);

      res.status(200).json({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      res.status(401).json({ message });
    }
  }
);

/**
 * GET /api/auth/validate-token
 * Validate current access token
 */
router.get('/validate-token', verifyToken, (req: Request, res: Response) => {
  res.status(200).json({ userId: req.userId });
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post(
  '/refresh',
  validate(refreshTokenSchema),
  async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;

      const tokens = await AuthService.refreshToken(refreshToken);

      res.status(200).json(tokens);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Token refresh failed';
      res.status(401).json({ message });
    }
  }
);

/**
 * POST /api/auth/logout
 * Logout (client-side token removal)
 */
router.post('/logout', (req: Request, res: Response) => {
  // Token is removed on client side
  res.status(200).json({ message: 'Logged out successfully' });
});

export default router;
