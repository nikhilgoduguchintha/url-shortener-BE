import express from "express";
import { URLService } from "../services/urlService.js";
import { shortenRateLimit } from "../middleware/rateLimiter.js";
import {
  validateShortenRequest,
  checkValidationResult,
} from "../middleware/validation.js";

const router = express.Router();

// POST /api/urls - Shorten URL
router.post(
  "/",
  shortenRateLimit,
  validateShortenRequest,
  checkValidationResult,
  async (req, res, next) => {
    try {
      const { url, customAlias } = req.body;

      const result = await URLService.shortenUrl(url, customAlias);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
