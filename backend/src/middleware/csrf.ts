import { doubleCsrf } from 'csrf-csrf';
import { Request, Response } from 'express';

const isProduction = process.env.NODE_ENV === 'production';

const csrfConfig = doubleCsrf({
  getSecret: () => process.env.JWT_SECRET_KEY!,
  getSessionIdentifier: (req: Request) => {
    // Use a consistent session identifier from cookies
    // The double-submit pattern relies on the cookie + token matching
    return 'csrf-session';
  },
  // Use __Host- prefix in production for extra security
  cookieName: isProduction ? '__Host-x-csrf-token' : 'x-csrf-token',
  cookieOptions: {
    // 'none' required for cross-domain cookies (frontend/backend on different domains)
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
    secure: isProduction,
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
