import express, { Request, Response } from "express";
import { verifyToken } from "../middleware/auth";
import { BookingService } from "../services/booking.service";

const router = express.Router();

// GET /api/my-bookings - Get all bookings for the authenticated user
router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const bookings = await BookingService.getUserBookings(req.userId);
    res.status(200).json(bookings);
  } catch (error) {
    console.error('Fetch user bookings error:', error);
    res.status(500).json({ message: "Unable to fetch bookings" });
  }
});

export default router;
