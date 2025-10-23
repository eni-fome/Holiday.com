/**
 * Escape special regex characters to prevent ReDoS attacks
 */
export const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Sanitize search query parameters to prevent injection attacks
 */
export const sanitizeSearchQuery = (queryParams: any) => {
  const sanitized: any = {};

  // Destination search with escaped regex
  if (queryParams.destination) {
    const escaped = escapeRegex(queryParams.destination.trim());
    sanitized.$or = [
      { city: new RegExp(escaped, 'i') },
      { country: new RegExp(escaped, 'i') },
    ];
  }

  // Adult count filter
  if (queryParams.adultCount) {
    const count = parseInt(queryParams.adultCount);
    if (!isNaN(count) && count > 0) {
      sanitized.adultCount = { $gte: count };
    }
  }

  // Child count filter
  if (queryParams.childCount) {
    const count = parseInt(queryParams.childCount);
    if (!isNaN(count) && count >= 0) {
      sanitized.childCount = { $gte: count };
    }
  }

  // Facilities filter
  if (queryParams.facilities) {
    const facilities = Array.isArray(queryParams.facilities)
      ? queryParams.facilities
      : [queryParams.facilities];

    sanitized.facilities = {
      $all: facilities.filter((f: any) => typeof f === 'string'),
    };
  }

  // Hotel types filter
  if (queryParams.types) {
    const types = Array.isArray(queryParams.types)
      ? queryParams.types
      : [queryParams.types];

    sanitized.type = {
      $in: types.filter((t: any) => typeof t === 'string'),
    };
  }

  // Star rating filter
  if (queryParams.stars) {
    const stars = Array.isArray(queryParams.stars)
      ? queryParams.stars.map((star: string) => parseInt(star))
      : [parseInt(queryParams.stars)];

    const validStars = stars.filter((s: number) => !isNaN(s) && s >= 1 && s <= 5);

    if (validStars.length > 0) {
      sanitized.starRating = { $in: validStars };
    }
  }

  // Price filter - FIXED: Remove .toString() to enable numeric comparison
  if (queryParams.maxPrice) {
    const price = parseInt(queryParams.maxPrice);
    if (!isNaN(price) && price > 0) {
      sanitized.pricePerNight = { $lte: price };
    }
  }

  // Always filter for active hotels
  sanitized.isActive = true;

  return sanitized;
};
