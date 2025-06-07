import validator from "validator";

export class URLValidator {
  static isValidURL(url) {
    try {
      return validator.isURL(url, {
        protocols: ["http", "https"],
        require_protocol: true,
        require_host: true,
        require_valid_protocol: true,
        allow_underscores: false,
      });
    } catch {
      return false;
    }
  }

  static normalizeURL(url) {
    try {
      const urlObj = new URL(url);
      // Remove trailing slash and fragments
      return urlObj.origin + urlObj.pathname.replace(/\/$/, "") + urlObj.search;
    } catch {
      return url;
    }
  }

  static isMaliciousURL(url) {
    const maliciousDomains = [
      "malware-site.com",
      "phishing-example.com",
      // Add more as needed
    ];

    try {
      const urlObj = new URL(url);
      return maliciousDomains.some((domain) =>
        urlObj.hostname.includes(domain)
      );
    } catch {
      return false;
    }
  }
}
