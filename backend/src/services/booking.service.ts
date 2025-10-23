import mongoose from 'mongoose';
import Hotel from '../models/hotel';
import { BookingType } from '../shared/types';
import Stripe from 'stripe';
import { CacheService } from './cache.service';

const getStripeClient = (): Stripe => {
  const apiKey = process.env.STRIPE_API_KEY;
  if (!apiKey) {
    throw new Error('STRIPE_API_KEY is not configured');
  }
  return new Stripe(apiKey);
};
const COMMISSION_RATE = 0.15; // 15% platform commission

export class BookingService {
  /**
   * Check if hotel is available for selected dates
   */
  static async checkAvailability(
    hotelId: string,
    checkIn: Date,
    checkOut: Date
  ): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(hotelId)) {
      throw new Error('Invalid hotel ID');
    }
    
    const hotel = await Hotel.findById(hotelId);

    if (!hotel) {
      throw new Error('Hotel not found');
    }

    // Check for date conflicts with existing bookings
    const hasConflict = hotel.bookings.some((booking: BookingType) => {
      // Skip cancelled bookings
      if (booking.status === 'cancelled') {
        return false;
      }

      // Check if dates overlap
      return checkIn < booking.checkOut && checkOut > booking.checkIn;
    });

    return !hasConflict;
  }

  /**
   * Create Stripe payment intent with commission calculation
   */
  static async createPaymentIntent(
    hotelId: string,
    numberOfNights: number,
    userId: string
  ) {
    if (!mongoose.Types.ObjectId.isValid(hotelId)) {
      throw new Error('Invalid hotel ID');
    }
    
    const hotel = await Hotel.findById(hotelId);

    if (!hotel) {
      throw new Error('Hotel not found');
    }

    if (!hotel.isActive) {
      throw new Error('Hotel is not available');
    }

    const totalCost = hotel.pricePerNight * numberOfNights;
    const commission = Math.round(totalCost * COMMISSION_RATE);
    const hostPayout = totalCost - commission;

    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCost * 100, // Convert to cents
      currency: 'usd',
      metadata: {
        hotelId,
        userId,
        commission: commission.toString(),
        hostPayout: hostPayout.toString(),
        numberOfNights: numberOfNights.toString(),
      },
    });

    if (!paymentIntent.client_secret) {
      throw new Error('Failed to create payment intent');
    }

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      totalCost,
      commission,
      hostPayout,
    };
  }

  /**
   * Create booking with transaction support
   */
  static async createBooking(
    hotelId: string,
    bookingData: Partial<BookingType>,
    paymentIntentId: string,
    userId: string
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Verify payment intent
      const stripe = getStripeClient();
      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId
      );

      if (!paymentIntent) {
        throw new Error('Payment intent not found');
      }

      if (paymentIntent.status !== 'succeeded') {
        throw new Error(
          `Payment not successful. Status: ${paymentIntent.status}`
        );
      }

      // 2. Verify payment intent metadata matches request
      if (
        paymentIntent.metadata.hotelId !== hotelId ||
        paymentIntent.metadata.userId !== userId
      ) {
        throw new Error('Payment intent mismatch');
      }

      // 3. Check availability again (prevent race condition)
      const isAvailable = await this.checkAvailability(
        hotelId,
        new Date(bookingData.checkIn!),
        new Date(bookingData.checkOut!)
      );

      if (!isAvailable) {
        throw new Error('Hotel no longer available for selected dates');
      }

      // 4. Create booking with commission
      const commission = parseInt(paymentIntent.metadata.commission);

      const newBooking: Partial<BookingType> = {
        ...bookingData,
        userId,
        commission,
        status: 'confirmed',
        createdAt: new Date(),
      };

      // 5. Add booking to hotel
      const hotel = await Hotel.findByIdAndUpdate(
        hotelId,
        { $push: { bookings: newBooking } },
        { new: true, session }
      );

      if (!hotel) {
        throw new Error('Hotel not found');
      }

      // 6. Commit transaction
      await session.commitTransaction();

      // 7. Invalidate cache
      await CacheService.invalidateHotelCache(hotelId);

      // 8. Get the created booking
      const createdBooking = hotel.bookings[hotel.bookings.length - 1];

      // TODO: Send confirmation email
      // TODO: Update analytics

      return createdBooking;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get all bookings for a user
   */
  static async getUserBookings(userId: string) {
    const hotels = await Hotel.find({
      bookings: { $elemMatch: { userId } },
    }).lean();

    // Map hotels to include only user's bookings
    const results = hotels.map((hotel: any) => {
      const userBookings = hotel.bookings.filter(
        (booking: any) => booking.userId === userId && booking.status !== 'cancelled'
      );

      return {
        ...hotel,
        bookings: userBookings,
      };
    });

    // Filter out hotels with no active bookings
    return results.filter((hotel) => hotel.bookings.length > 0);
  }

  /**
   * Cancel booking with refund policy
   */
  static async cancelBooking(
    hotelId: string,
    bookingId: string,
    userId: string
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const hotel = await Hotel.findById(hotelId);

      if (!hotel) {
        throw new Error('Hotel not found');
      }

      const booking = hotel.bookings.find(
        (b: any) => b._id.toString() === bookingId && b.userId === userId
      );

      if (!booking) {
        throw new Error('Booking not found or unauthorized');
      }

      if (booking.status === 'cancelled') {
        throw new Error('Booking already cancelled');
      }

      // Calculate refund based on cancellation policy
      const hoursUntilCheckin =
        (booking.checkIn.getTime() - Date.now()) / (1000 * 60 * 60);

      let refundAmount = 0;
      let refundPercentage = 0;

      if (hoursUntilCheckin > 24) {
        // Full refund if more than 24 hours before check-in
        refundAmount = booking.totalCost;
        refundPercentage = 100;
      } else if (hoursUntilCheckin > 12) {
        // 50% refund if 12-24 hours before check-in
        refundAmount = Math.round(booking.totalCost * 0.5);
        refundPercentage = 50;
      }
      // No refund if less than 12 hours

      // Update booking status
      await Hotel.updateOne(
        { _id: hotelId, 'bookings._id': bookingId },
        {
          $set: {
            'bookings.$.status': 'cancelled',
            'bookings.$.cancelledAt': new Date(),
            'bookings.$.refundAmount': refundAmount,
          },
        },
        { session }
      );

      // TODO: Process refund with Stripe
      // if (refundAmount > 0) {
      //   await stripe.refunds.create({
      //     payment_intent: booking.paymentIntentId,
      //     amount: refundAmount * 100,
      //   });
      // }

      await session.commitTransaction();

      // Invalidate cache
      await CacheService.invalidateHotelCache(hotelId);

      return {
        refundAmount,
        refundPercentage,
        message:
          refundAmount > 0
            ? `Booking cancelled. Refund of $${refundAmount} (${refundPercentage}%) will be processed.`
            : 'Booking cancelled. No refund available due to cancellation policy.',
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
