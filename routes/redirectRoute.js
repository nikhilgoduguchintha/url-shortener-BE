import express from "express";
import { URLService } from "../services/urlService.js";

const router = express.Router();

// GET /:shortCode - Redirect to original URL
router.get("/:shortCode", async (req, res) => {
  try {
    const { shortCode } = req.params;

    // Skip if it's an API route or static file
    if (shortCode.startsWith("api") || shortCode.includes(".")) {
      return res.status(404).json({ error: "Not found" });
    }

    const originalUrl = await URLService.getOriginalUrl(shortCode);

    if (!originalUrl) {
      return res.status(404).json({
        error: "Short URL not found or expired",
      });
    }

    // Record click analytics (async)
    const clientInfo = {
      ip:
        req.ip ||
        req.connection.remoteAddress ||
        req.headers["x-forwarded-for"],
      userAgent: req.get("User-Agent"),
      referrer: req.get("Referrer"),
    };
    console.log("break point 1:- ", clientInfo);

    URLService.recordClick(shortCode, clientInfo);

    // Redirect to original URL
    res.redirect(301, originalUrl);
  } catch (error) {
    console.error("Redirect error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
