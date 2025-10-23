import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/user';
import { authConfig } from '../config/auth';

export class AuthError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number = 401) {
        super(message);
        this.name = 'AuthError';
        this.statusCode = statusCode;
    }
}

interface TokenPayload {
    userId: string;
    type?: string;
}

export class AuthService {
    /**
     * Generate access and refresh token pair
     */
    static generateTokenPair(userId: string) {
        const accessToken = jwt.sign({ userId }, authConfig.jwt.secret, {
            expiresIn: authConfig.jwt.expiresIn,
        });

        const refreshToken = jwt.sign(
            { userId, type: 'refresh' },
            authConfig.refresh.secret,
            {
                expiresIn: authConfig.refresh.expiresIn,
            },
        );

        return { accessToken, refreshToken };
    }

    /**
     * Validate JWT token. Pass 'refresh' for tokenType to validate a refresh token.
     */
    static validateToken(
        token: string,
        tokenType: 'access' | 'refresh' = 'access',
    ): TokenPayload {
        if (!token || typeof token !== 'string') {
            throw new AuthError('Invalid token format', 400);
        }
        try {
            const secret =
                tokenType === 'refresh'
                    ? authConfig.refresh.secret
                    : authConfig.jwt.secret;
            const decoded = jwt.verify(token, secret) as TokenPayload;
            return decoded;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new AuthError('Token expired', 401);
            }
            throw new AuthError('Invalid token', 401);
        }
    }

    /**
     * Login user with email and password
     */
    static async login(email: string, password: string) {
        if (
            !email ||
            typeof email !== 'string' ||
            !password ||
            typeof password !== 'string'
        ) {
            throw new AuthError('Invalid credentials', 400);
        }

        const sanitizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: sanitizedEmail }).select(
            '+password',
        );

        if (!user || !user.password) {
            throw new AuthError('Invalid credentials', 401);
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            throw new AuthError('Invalid credentials', 401);
        }

        const tokens = this.generateTokenPair(user.id);

        return {
            user: {
                _id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
            },
            ...tokens,
        };
    }

    /**
     * Register new user
     */
    static async register(userData: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
    }) {
        if (!userData.email || typeof userData.email !== 'string') {
            throw new AuthError('Invalid email', 400);
        }

        const sanitizedEmail = userData.email.toLowerCase().trim();
        const existingUser = await User.findOne({ email: sanitizedEmail });

        if (existingUser) {
            throw new AuthError('User with this email already exists', 409);
        }

        const user = new User({
            ...userData,
            email: sanitizedEmail,
        });
        await user.save();

        const tokens = this.generateTokenPair(user.id);

        return {
            user: {
                _id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
            },
            ...tokens,
        };
    }

    /**
     * Refresh access token
     */
    static async refreshToken(refreshToken: string) {
        const decoded = this.validateToken(refreshToken, 'refresh');

        if (decoded.type !== 'refresh') {
            throw new AuthError('Invalid refresh token type', 401);
        }

        return this.generateTokenPair(decoded.userId);
    }
}
