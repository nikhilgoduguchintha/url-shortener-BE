import UAParser from "ua-parser-js";

export class AnalyticsService {
  static parseUserAgent(userAgent) {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    return {
      browser: `${result.browser.name || "Unknown"} ${
        result.browser.version || ""
      }`.trim(),
      os: `${result.os.name || "Unknown"} ${result.os.version || ""}`.trim(),
      device: result.device.type || "desktop",
    };
  }

  static async getCountryFromIP(ip) {
    try {
      if (ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1") {
        return "LO";
      }

      // Using free ip-api service for MVP
      const response = await fetch(
        `http://ip-api.com/json/${ip}?fields=country,countryCode`
      );
      const data = await response.json();
      return data.countryCode || "UN";
    } catch {
      return "UN";
    }
  }
}
