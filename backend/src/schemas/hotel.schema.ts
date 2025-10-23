import { z } from 'zod';

const HOTEL_TYPES = [
  'Budget',
  'Boutique',
  'Luxury',
  'Ski Resort',
  'Business',
  'Family',
  'Romantic',
  'Hiking Resort',
  'Cabin',
  'Beach Resort',
  'Golf Resort',
  'Motel',
  'All Inclusive',
  'Pet Friendly',
  'Self Catering',
] as const;

const FACILITIES = [
  'Free WiFi',
  'Parking',
  'Airport Shuttle',
  'Family Rooms',
  'Non-Smoking Rooms',
  'Outdoor Pool',
  'Spa',
  'Fitness Center',
] as const;

export const createHotelSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(100),
    city: z.string().min(2).max(50),
    country: z.string().min(2).max(50),
    description: z.string().min(10).max(2000),
    type: z.enum(HOTEL_TYPES, {
      message: 'Invalid hotel type',
    }),
    pricePerNight: z.coerce.number().min(10).max(100000),
    starRating: z.coerce.number().min(1).max(5),
    adultCount: z.coerce.number().min(1).max(20),
    childCount: z.coerce.number().min(0).max(20),
    facilities: z.array(z.string()).min(1).max(10),
  }),
});

export const updateHotelSchema = z.object({
  params: z.object({
    hotelId: z.string().min(1),
  }),
  body: z.object({
    name: z.string().min(3).max(100).optional(),
    city: z.string().min(2).max(50).optional(),
    country: z.string().min(2).max(50).optional(),
    description: z.string().min(10).max(2000).optional(),
    type: z.enum(HOTEL_TYPES).optional(),
    pricePerNight: z.coerce.number().min(10).max(100000).optional(),
    starRating: z.coerce.number().min(1).max(5).optional(),
    adultCount: z.coerce.number().min(1).max(20).optional(),
    childCount: z.coerce.number().min(0).max(20).optional(),
    facilities: z.array(z.string()).min(1).max(10).optional(),
  }),
});

export const searchHotelSchema = z.object({
  query: z.object({
    destination: z.string().max(100).optional(),
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),
    adultCount: z.coerce.number().min(1).max(20).optional(),
    childCount: z.coerce.number().min(0).max(20).optional(),
    page: z.coerce.number().min(1).optional(),
    stars: z
      .union([
        z.array(z.coerce.number().min(1).max(5)),
        z.coerce.number().min(1).max(5),
      ])
      .optional(),
    types: z.union([z.array(z.string()), z.string()]).optional(),
    facilities: z.union([z.array(z.string()), z.string()]).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    sortOption: z
      .enum(['starRating', 'pricePerNightAsc', 'pricePerNightDesc'])
      .optional(),
  }),
});

export const bookingSchema = z.object({
  params: z.object({
    hotelId: z.string().min(1),
  }),
  body: z.object({
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    email: z.string().email(),
    adultCount: z.number().min(1).max(20),
    childCount: z.number().min(0).max(20),
    checkIn: z.string(),
    checkOut: z.string(),
    totalCost: z.number().min(0),
    paymentIntentId: z.string().min(1),
  }),
});

export const hotelIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Hotel ID is required'),
  }),
});
