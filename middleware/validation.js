import { body, param, validationResult } from "express-validator";

export const validateShortenRequest = [
  body("url")
    .notEmpty()
    .withMessage("URL is required")
    .isURL({ protocols: ["http", "https"], require_protocol: true })
    .withMessage("Please provide a valid URL"),

  body("customAlias")
    .optional()
    .matches(/^[a-zA-Z0-9]{3,20}$/)
    .withMessage("Custom alias must be 3-20 alphanumeric characters"),
];

export const validateShortCode = [
  param("shortCode")
    .notEmpty()
    .withMessage("Short code is required")
    .matches(/^[a-zA-Z0-9]{3,20}$/)
    .withMessage("Invalid short code format"),
];

export const checkValidationResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array(),
    });
  }
  next();
};
