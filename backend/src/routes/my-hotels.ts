import express, { Request, Response } from "express";
import multer from "multer";
import cloudinary from "cloudinary";
import Hotel from "../models/hotel";
import { verifyToken } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createHotelSchema, updateHotelSchema } from "../schemas/hotel.schema";
import { HotelService } from "../services/hotel.service";
import { CacheService } from "../services/cache.service";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

router.post(
  "/",
  verifyToken,
  upload.array("imageFiles", 6),
  async (req: Request, res: Response) => {
    try {
      const imageFiles = req.files as Express.Multer.File[];

      // Upload images to Cloudinary
      const imageUrls = await uploadImages(imageFiles);

      const allowedFields = ['name', 'city', 'country', 'description', 'type', 'adultCount', 'childCount', 'facilities', 'pricePerNight', 'starRating'];
      const hotelData: any = {
        imageUrls,
        userId: req.userId,
        lastUpdated: new Date(),
        isActive: true,
      };
      
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          hotelData[field] = req.body[field];
        }
      });

      const hotel = await HotelService.createHotel(hotelData);
      res.status(201).json(hotel);
    } catch (error) {
      console.error('Create hotel error:', error);
      res.status(500).json({ message: 'Failed to create hotel' });
    }
  }
);

router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const hotels = await HotelService.getHotelsByUserId(req.userId);
    res.json(hotels);
  } catch (error) {
    console.error('Fetch my hotels error:', error);
    res.status(500).json({ message: "Error fetching hotels" });
  }
});

router.get("/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const hotel = await HotelService.getHotelByIdAndUser(req.params.id, req.userId);

    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    res.json(hotel);
  } catch (error) {
    console.error('Fetch hotel by ID error:', error);
    res.status(500).json({ message: "Error fetching hotel" });
  }
});

router.put(
  "/:hotelId",
  verifyToken,
  upload.array("imageFiles"),
  async (req: Request, res: Response) => {
    try {
      // Upload new images if provided
      const files = req.files as Express.Multer.File[];
      const newImageUrls = files.length > 0 ? await uploadImages(files) : [];

      const allowedFields = ['name', 'city', 'country', 'description', 'type', 'adultCount', 'childCount', 'facilities', 'pricePerNight', 'starRating'];
      const updatedData: any = {
        imageUrls: [
          ...newImageUrls,
          ...(req.body.imageUrls || []),
        ],
        lastUpdated: new Date(),
      };
      
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updatedData[field] = req.body[field];
        }
      });

      const hotel = await HotelService.updateHotel(
        req.params.hotelId,
        req.userId,
        updatedData
      );

      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }

      // Invalidate cache
      await CacheService.invalidateHotelCache(req.params.hotelId);

      res.status(200).json(hotel);
    } catch (error) {
      console.error('Update hotel error:', error);
      res.status(500).json({ message: "Failed to update hotel" });
    }
  }
);

async function uploadImages(imageFiles: Express.Multer.File[]) {
  const uploadPromises = imageFiles.map(async (image) => {
    const b64 = Buffer.from(image.buffer).toString("base64");
    let dataURI = "data:" + image.mimetype + ";base64," + b64;
    const res = await cloudinary.v2.uploader.upload(dataURI);
    return res.url;
  });

  const imageUrls = await Promise.all(uploadPromises);
  return imageUrls;
}

export default router;
