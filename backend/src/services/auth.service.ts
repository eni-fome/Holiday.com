import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/user';

interface TokenPayload {
  userId: string;
  type?: string;
}

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET_KEY!;
  private static readonly JWT_EXPIRES_IN = '7d';
  private static readonly REFRESH_EXPIRES_IN = '30d';

  /**
   * Generate access and refresh token pair
   */
  static async generateTokenPair(userId: string) {
    const accessToken = jwt.sign({ userId }, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });

    const refreshToken = jwt.sign(
      { userId, type: 'refresh' },
      this.JWT_SECRET,
      {
        expiresIn: this.REFRESH_EXPIRES_IN,
      }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Validate JWT token
   */
  static async validateToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as TokenPayload;
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Login user with email and password
   */
  static async login(email: string, password: string) {
    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      throw new Error('Invalid credentials');
    }
    
    const sanitizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: sanitizedEmail }).select('+password');

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    const tokens = await this.generateTokenPair(user.id);

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
      throw new Error('Invalid email');
    }
    
    const sanitizedEmail = userData.email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: sanitizedEmail });

    if (existingUser) {
      throw new Error('User already exists');
    }

    const user = new User({
      ...userData,
      email: sanitizedEmail
    });
    await user.save();

    const tokens = await this.generateTokenPair(user.id);

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
    const decoded = await this.validateToken(refreshToken);

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid refresh token');
    }

    return this.generateTokenPair(decoded.userId);
  }
}
