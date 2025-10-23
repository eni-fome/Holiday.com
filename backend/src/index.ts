import express, { Request, Response } from 'express';
import cors from 'cors';
import 'dotenv/config';
import mongoose from 'mongoose';
import mongoSanitize from 'express-mongo-sanitize';
import userRoutes from './routes/users';
import authRoutes from './routes/auth';
import cookieParser from 'cookie-parser';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import myHotelRoutes from './routes/my-hotels';
import hotelRoutes from './routes/hotels';
import bookingRoutes from './routes/my-bookings';
import { setupSecurity } from './middleware/security';
import { connectDatabase } from './config/database';
import { csrfProtection, csrfTokenRoute } from './middleware/csrf';

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Connect to MongoDB with indexes
connectDatabase().catch((error) => {
    console.error('Failed to connect to database:', error?.message || 'Unknown error');
    process.exit(1);
});

const app = express();

// Security middleware (helmet, compression, rate limiting)
const { authLimiter, apiLimiter, paymentLimiter, uploadLimiter } = setupSecurity(app);

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Sanitize data to prevent NoSQL injection
app.use(mongoSanitize());

// CORS configuration - supports both Bearer tokens and cookies
const allowedOrigins = [
    'https://holiday-c8zb.onrender.com',
    'http://localhost:5173',
    'http://localhost:5174',
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}))


// Static files
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// CSRF token endpoint
app.get('/api/csrf-token', csrfTokenRoute);

// API routes with rate limiting and CSRF protection
app.use('/api/auth', authLimiter, csrfProtection, authRoutes);
app.use('/api/users', apiLimiter, csrfProtection, userRoutes);
app.use('/api/my-hotels', uploadLimiter, csrfProtection, myHotelRoutes);
app.use('/api/hotels', apiLimiter, csrfProtection, hotelRoutes);
app.use('/api/my-bookings', apiLimiter, csrfProtection, bookingRoutes);

// SPA fallback
app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: Function) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        message: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message,
    });
});

const PORT = process.env.PORT || 7000;

app.listen(PORT, () => {
    const sanitizedPort = String(PORT).replace(/[^0-9]/g, '');
    const sanitizedEnv = (process.env.NODE_ENV || 'development').replace(/[^a-zA-Z]/g, '');
    console.log(`🚀 Server running on port ${sanitizedPort}`);
    console.log(`📝 Environment: ${sanitizedEnv}`);
});
