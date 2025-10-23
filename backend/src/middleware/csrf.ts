import { doubleCsrf } from 'csrf-csrf';
import { Request, Response } from 'express';

const csrfConfig = doubleCsrf({
  getSecret: () => process.env.JWT_SECRET_KEY!,
  getSessionIdentifier: (req: Request) => (req as any).sessionID || '',
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

export const csrfProtection = csrfConfig.doubleCsrfProtection;

export const csrfTokenRoute = (req: Request, res: Response) => {
  const token = csrfConfig.generateCsrfToken(req, res);
  res.json({ token });
};
