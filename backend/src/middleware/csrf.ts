import { doubleCsrf } from 'csrf-csrf';
import { Request, Response, NextFunction } from 'express';

const { generateToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => process.env.JWT_SECRET_KEY!,
  cookieName: '__Host-psifi.x-csrf-token',
  cookieOptions: {
    sameSite: 'strict',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
});

export const csrfProtection = doubleCsrfProtection;

export const csrfTokenRoute = (req: Request, res: Response) => {
  const token = generateToken(req, res);
  res.json({ token });
};
