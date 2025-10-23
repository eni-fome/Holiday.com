import express, { Request, Response } from 'express';
import { HotelService } from '../services/hotel.service';
import { BookingService } from '../services/booking.service';
import { validate } from '../middleware/validate';
import {
  searchHotelSchema,
  hotelIdSchema,
  bookingSchema,
} from '../schemas/hotel.schema';
import { verifyToken } from '../middleware/auth';

const router = express.Router();

/**
 * GET /api/hotels/search
 * Search hotels with filters and caching
 */
router.get(
  '/search',
  validate(searchHotelSchema),
  async (req: Request, res: Response) => {
    try {
      const result = await HotelService.searchHotels(req.query);
      res.json(result);
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ message: 'Search failed' });
    }
  }
);

/**
 * GET /api/hotels
 * Get latest hotels for homepage
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt((req.query.limit as string) || '6'), 50);
    if (isNaN(limit) || limit < 1) {
      return res.status(400).json({ message: 'Invalid limit parameter' });
    }
    const hotels = await HotelService.getLatestHotels(limit);
    res.json(hotels);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch hotels';
    console.error('Fetch hotels error:', message);
    res.status(500).json({ message: 'Failed to fetch hotels' });
  }
});

/**
 * GET /api/hotels/:id
 * Get hotel details by ID (no bookings exposed)
 */
router.get(
  '/:id',
  validate(hotelIdSchema),
  async (req: Request, res: Response) => {
    try {
      const hotel = await HotelService.getHotelById(req.params.id, false);

      if (!hotel) {
        return res.status(404).json({ message: 'Hotel not found' });
      }

      res.json(hotel);
    } catch (error) {
      console.error('Fetch hotel error:', error);
      res.status(500).json({ message: 'Failed to fetch hotel' });
    }
  }
);

/**
 * POST /api/hotels/:hotelId/availability
 * Check hotel availability for dates
 */
router.post(
  '/:hotelId/availability',
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const { checkIn, checkOut } = req.body;

      if (!checkIn || !checkOut) {
        return res
          .status(400)
          .json({ message: 'Check-in and check-out dates required' });
      }

      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      
      if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date format' });
      }

      const isAvailable = await BookingService.checkAvailability(
        req.params.hotelId,
        checkInDate,
        checkOutDate
      );

      res.json({ available: isAvailable });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Availability check failed';
      res.status(500).json({ message });
    }
  }
);

/**
 * POST /api/hotels/:hotelId/bookings/payment-intent
 * Create Stripe payment intent with commission
 */
router.post(
  '/:hotelId/bookings/payment-intent',
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const { numberOfNights } = req.body;

      if (!numberOfNights || numberOfNights < 1) {
        return res.status(400).json({ message: 'Invalid number of nights' });
      }

      const result = await BookingService.createPaymentIntent(
        req.params.hotelId,
        parseInt(numberOfNights),
        req.userId
      );

      res.json(result);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Payment intent creation failed';
      res.status(500).json({ message });
    }
  }
);

/**
 * POST /api/hotels/:hotelId/bookings
 * Create booking after successful payment (with transaction)
 */
router.post(
  '/:hotelId/bookings',
  verifyToken,
  validate(bookingSchema),
  async (req: Request, res: Response) => {
    try {
      const booking = await BookingService.createBooking(
        req.params.hotelId,
        req.body,
        req.body.paymentIntentId,
        req.userId
      );

      res.status(201).json(booking);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Booking creation failed';
      res.status(400).json({ message });
    }
  }
);

/**
 * POST /api/hotels/:hotelId/bookings/:bookingId/cancel
 * Cancel booking with refund policy
 */
router.post(
  '/:hotelId/bookings/:bookingId/cancel',
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const result = await BookingService.cancelBooking(
        req.params.hotelId,
        req.params.bookingId,
        req.userId
      );

      res.json(result);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Booking cancellation failed';
      res.status(400).json({ message });
    }
  }
);

export default router;
