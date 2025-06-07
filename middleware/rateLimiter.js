import rateLimit from "express-rate-limit";

export const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Specific rate limiters
export const shortenRateLimit = createRateLimiter(
  60 * 60 * 1000,
  10,
  "Too many URLs shortened from this IP, please try again after an hour."
);

export const analyticsRateLimit = createRateLimiter(
  60 * 1000,
  30,
  "Too many analytics requests, please try again after a minute."
);
