import { NextFunction, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

declare global {
  namespace Express {
    interface Request {
      userId: string;
      user?: any;
    }
  }
}

/**
 * Middleware to verify JWT token and authenticate user
 */
export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = await AuthService.validateToken(token);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (token) {
    try {
      const decoded = await AuthService.validateToken(token);
      req.userId = decoded.userId;
    } catch (error) {
      // Continue without authentication
    }
  }
  next();
};

