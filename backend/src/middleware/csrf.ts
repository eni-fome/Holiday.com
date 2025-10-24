import { doubleCsrf } from 'csrf-csrf';
import { Request, Response } from 'express';

const csrfConfig = doubleCsrf({
  getSecret: () => process.env.JWT_SECRET_KEY!,
  getSessionIdentifier: (req: Request) => {
    // Use a cookie-based identifier instead of sessionID
    return req.cookies?.['csrf-session'] || '';
  },
  cookieName: 'x-csrf-token',
  cookieOptions: {
    sameSite: 'none', // Changed from 'strict' to allow cross-site cookies
    path: '/',
    secure: true, // Always true for production
    httpOnly: true,
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
});

export const csrfProtection = csrfConfig.doubleCsrfProtection;

export const csrfTokenRoute = (req: Request, res: Response) => {
  const token = csrfConfig.generateCsrfToken(req, res);
  res.json({ token });
};
