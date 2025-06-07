import express from "express";
import { URLService } from "../services/urlService.js";
import { analyticsRateLimit } from "../middleware/rateLimiter.js";
import {
  validateShortCode,
  checkValidationResult,
} from "../middleware/validation.js";

const router = express.Router();

// GET /api/analytics/:shortCode - Get analytics
router.get(
  "/:shortCode",
  analyticsRateLimit,
  validateShortCode,
  checkValidationResult,
  async (req, res, next) => {
    try {
      const { shortCode } = req.params;

      const analytics = await URLService.getAnalytics(shortCode);

      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      if (error.message === "URL not found") {
        return res.status(404).json({
          error: "Short URL not found",
        });
      }
      next(error);
    }
  }
);

export default router;
