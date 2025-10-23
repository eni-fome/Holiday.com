import mongoose, { SchemaDefinition } from 'mongoose';
import { BookingType, HotelType } from '../shared/types';

const bookingSchemaDefinition: SchemaDefinition<BookingType> = {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    adultCount: { type: Number, required: true },
    childCount: { type: Number, required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    userId: { type: String, required: true },
    totalCost: { type: Number, required: true },
    commission: { type: Number, required: true, default: 0 },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled'],
        default: 'confirmed',
    },
    createdAt: { type: Date, default: Date.now },
    cancelledAt: { type: Date },
    refundAmount: { type: Number },
};

const bookingSchema = new mongoose.Schema<BookingType>(
    bookingSchemaDefinition,
    { _id: false },
);

const hotelSchema = new mongoose.Schema<HotelType>(
    {
        userId: { type: String, required: true, index: true },
        name: { type: String, required: true },
        city: { type: String, required: true },
        country: { type: String, required: true },
        description: { type: String, required: true },
        type: { type: String, required: true },
        adultCount: { type: Number, required: true },
        childCount: { type: Number, required: true },
        facilities: [{ type: String, required: true }],
        pricePerNight: { type: Number, required: true },
        starRating: { type: Number, required: true, min: 1, max: 5 },
        imageUrls: [{ type: String, required: true }],
        lastUpdated: { type: Date, required: true },
        bookings: [bookingSchema],
        featured: { type: Boolean, default: false },
        featuredUntil: Date,
        featuredTier: {
            type: String,
            enum: ['none', 'basic', 'premium'],
            default: 'none',
        },
        isActive: { type: Boolean, default: true },
        isVerified: { type: Boolean, default: false },
    },
    { timestamps: true },
);

// PERFORMANCE INDEXES
hotelSchema.index({ city: 'text', country: 'text', name: 'text' });
hotelSchema.index({ pricePerNight: 1 });
hotelSchema.index({ starRating: -1 });
hotelSchema.index({ type: 1 });
hotelSchema.index({ lastUpdated: -1 });
hotelSchema.index({ featured: -1, lastUpdated: -1 });
hotelSchema.index({ isActive: 1 });
hotelSchema.index({ userId: 1, isActive: 1 });

const Hotel = mongoose.model<HotelType>('Hotel', hotelSchema);
export default Hotel;
