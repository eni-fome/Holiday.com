import Hotel from '../models/hotel';
import { CacheService } from './cache.service';
import { sanitizeSearchQuery } from '../utils/sanitize';
import { HotelSearchResponse } from '../shared/types';

export class HotelService {
  /**
   * Search hotels with caching and optimized aggregation
   */
  static async searchHotels(queryParams: any): Promise<HotelSearchResponse> {
    try {
      const cacheKey = CacheService.cacheKey('hotel:search', queryParams);
      const cached = await CacheService.get<HotelSearchResponse>(cacheKey);

      if (cached) {
        return cached;
      }

      const query = sanitizeSearchQuery(queryParams);

    // Sorting options
    let sortOptions: any = {};
    switch (queryParams.sortOption) {
      case 'starRating':
        sortOptions = { starRating: -1, lastUpdated: -1 };
        break;
      case 'pricePerNightAsc':
        sortOptions = { pricePerNight: 1, lastUpdated: -1 };
        break;
      case 'pricePerNightDesc':
        sortOptions = { pricePerNight: -1, lastUpdated: -1 };
        break;
      default:
        // Featured hotels first, then by date
        sortOptions = { featured: -1, lastUpdated: -1 };
    }

    const pageSize = 5;
    const pageNumber = parseInt(queryParams.page || '1');
    const skip = (pageNumber - 1) * pageSize;

    // OPTIMIZED: Single aggregation query instead of 2 separate queries
    const [result] = await Hotel.aggregate([
      { $match: query },
      {
        $facet: {
          hotels: [
            { $sort: sortOptions },
            { $skip: skip },
            { $limit: pageSize },
            {
              $project: {
                bookings: 0, // Don't send bookings to public
              },
            },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    ]);

    const hotels = result.hotels;
    const total = result.totalCount[0]?.count || 0;

    const response: HotelSearchResponse = {
      data: hotels,
      pagination: {
        total,
        page: pageNumber,
        pages: Math.ceil(total / pageSize),
      },
    };

      // Cache for 5 minutes
      await CacheService.set(cacheKey, response, 300);

      return response;
    } catch (error) {
      console.error('Search hotels error:', error);
      throw new Error('Failed to search hotels');
    }
  }

  /**
   * Get latest hotels for homepage
   */
  static async getLatestHotels(limit: number = 6) {
    const cacheKey = `hotel:latest:${limit}`;
    const cached = await CacheService.get(cacheKey);

    if (cached) {
      return cached;
    }

    const hotels = await Hotel.find({ isActive: true })
      .sort({ featured: -1, lastUpdated: -1 })
      .limit(limit)
      .select('-bookings')
      .lean();

    // Cache for 10 minutes
    await CacheService.set(cacheKey, hotels, 600);

    return hotels;
  }

  /**
   * Get hotel by ID (public view - no bookings)
   */
  static async getHotelById(id: string, includeBookings: boolean = false) {
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid hotel ID');
    }
    
    try {
      const cacheKey = `hotel:${id}:${includeBookings}`;
      const cached = await CacheService.get(cacheKey);

      if (cached) {
        return cached;
      }

      const query = Hotel.findById(id);

      if (!includeBookings) {
        query.select('-bookings');
      }

      const hotel = await query.lean();

      if (hotel) {
        // Cache for 10 minutes
        await CacheService.set(cacheKey, hotel, 600);
      }

      return hotel;
    } catch (error) {
      console.error('Get hotel by ID error:', error);
      throw new Error('Failed to fetch hotel');
    }
  }

  /**
   * Get user's hotels (for my-hotels page)
   */
  static async getHotelsByUserId(userId: string) {
    const hotels = await Hotel.find({ userId, isActive: true })
      .sort('-lastUpdated')
      .lean();

    return hotels;
  }

  /**
   * Get hotel by ID and user (for editing)
   */
  static async getHotelByIdAndUser(hotelId: string, userId: string) {
    const hotel = await Hotel.findOne({
      _id: hotelId,
      userId,
      isActive: true,
    }).lean();

    return hotel;
  }

  /**
   * Create new hotel
   */
  static async createHotel(hotelData: any) {
    const hotel = new Hotel({
      ...hotelData,
      lastUpdated: new Date(),
      isActive: true,
    });

    await hotel.save();

    // Invalidate caches
    await CacheService.invalidateHotelCache();

    return hotel;
  }

  /**
   * Update hotel
   */
  static async updateHotel(
    hotelId: string,
    userId: string,
    hotelData: any
  ) {
    try {
      const hotel = await Hotel.findOneAndUpdate(
        { _id: hotelId, userId, isActive: true },
        {
          ...hotelData,
          lastUpdated: new Date(),
        },
        { new: true }
      );

      if (!hotel) {
        return null;
      }

      // Invalidate caches
      await CacheService.invalidateHotelCache(hotelId);

      return hotel;
    } catch (error) {
      console.error('Update hotel error:', error);
      throw new Error('Failed to update hotel');
    }
  }

  /**
   * Delete hotel (soft delete)
   */
  static async deleteHotel(hotelId: string, userId: string) {
    const hotel = await Hotel.findOneAndUpdate(
      { _id: hotelId, userId },
      { isActive: false },
      { new: true }
    );

    if (!hotel) {
      throw new Error('Hotel not found or unauthorized');
    }

    // Invalidate caches
    await CacheService.invalidateHotelCache(hotelId);

    return hotel;
  }
}
