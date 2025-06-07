import { supabase } from "../config/database.js";
import { redis } from "../config/redis.js";
import { ShortCodeGenerator } from "../utils/shortCodeGenerator.js";
import { URLValidator } from "../utils/urlValidator.js";
import { AnalyticsService } from "../utils/analytics.js";

export class URLService {
  static async shortenUrl(originalUrl, customAlias = null) {
    if (!URLValidator.isValidURL(originalUrl)) {
      throw new Error("Invalid URL format");
    }
    if (URLValidator.isMaliciousURL(originalUrl)) {
      throw new Error("URL is not allowed");
    }

    const normalizedUrl = URLValidator.normalizeURL(originalUrl);

    const { data: existing } = await supabase
      .from("urls")
      .select("short_code")
      .eq("original_url", normalizedUrl)
      .eq("is_active", true)
      .limit(1);

    if (existing && existing.length > 0) {
      return {
        shortCode: existing[0].short_code,
        shortUrl: `${process.env.BASE_URL}/${existing[0].short_code}`,
        originalUrl: normalizedUrl,
        isExisting: true,
      };
    }

    let shortCode;

    if (customAlias) {
      const validation = ShortCodeGenerator.validateCustomAlias(customAlias);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
      const { data: aliasExists } = await supabase
        .from("urls")
        .select("id")
        .eq("short_code", customAlias)
        .limit(1);
      if (aliasExists && aliasExists.length > 0) {
        throw new Error("Custom alias is already taken");
      }
      shortCode = customAlias;
    } else {
      let attempts = 0;
      do {
        shortCode = ShortCodeGenerator.generateRandom();
        const { data: exists } = await supabase
          .from("urls")
          .select("id")
          .eq("short_code", shortCode)
          .limit(1);
        if (!exists || exists.length === 0) break;
        attempts++;
      } while (attempts < 5);

      if (attempts >= 5) {
        throw new Error(
          "Unable to generate unique short code. Please try again."
        );
      }
    }

    await supabase.from("urls").insert({
      original_url: normalizedUrl,
      short_code: shortCode,
      custom_alias: !!customAlias,
      is_active: true,
    });

    await redis.setex(`url:${shortCode}`, 3600, normalizedUrl);

    return {
      shortCode,
      shortUrl: `${process.env.BASE_URL}/${shortCode}`,
      originalUrl: normalizedUrl,
      isExisting: false,
    };
  }

  static async getOriginalUrl(shortCode) {
    try {
      const cached = await redis.get(`url:${shortCode}`);
      if (cached) {
        console.log("returned from cache");
      }
      if (cached) return cached;
    } catch (error) {
      console.warn("Redis cache miss:", error);
    }

    const { data, error } = await supabase
      .from("urls")
      .select("original_url")
      .eq("short_code", shortCode)
      .eq("is_active", true)
      .limit(1);

    if (error || !data || data.length === 0) return null;

    const originalUrl = data[0].original_url;
    await redis.setex(`url:${shortCode}`, 3600, originalUrl);
    return originalUrl;
  }

  static async recordClick(shortCode, clientInfo) {
    const { ip, userAgent, referrer } = clientInfo;

    // Step 1: Get URL ID
    const { data: urlResult, error: urlError } = await supabase
      .from("urls")
      .select("id")
      .eq("short_code", shortCode)
      .limit(1);

    if (urlError) {
      console.error("❌ Error fetching URL ID:", urlError);
      return;
    }

    if (!urlResult || urlResult.length === 0) {
      console.warn("⚠️ Short code not found:", shortCode);
      return;
    }

    const urlId = urlResult[0].id;
    const country = await AnalyticsService.getCountryFromIP(ip);
    const { browser, os, device } = AnalyticsService.parseUserAgent(userAgent);

    // Step 2: Insert click
    const { error: insertError } = await supabase.from("clicks").insert({
      url_id: urlId,
      ip_address: ip,
      user_agent: userAgent || "",
      referrer: referrer || "",
      country,
      browser,
      os,
      device,
    });

    if (insertError) {
      console.error("❌ Failed to insert click:", insertError);
    } else {
      console.log("✅ Click recorded successfully");
    }

    // Step 3: Increment click count
    const { error: rpcError } = await supabase.rpc("increment_click_count", {
      url_id_input: urlId,
    });

    if (rpcError) {
      console.error("❌ Failed to increment click count:", rpcError);
    } else {
      console.log("✅ Click count incremented");
    }
  }

  static async getAnalytics(shortCode) {
    const { data: urlData } = await supabase
      .from("urls")
      .select("id, original_url, click_count, created_at")
      .eq("short_code", shortCode)
      .limit(1);

    if (!urlData || urlData.length === 0) throw new Error("URL not found");
    const url = urlData[0];

    const { data: clicksByDay } = await supabase.rpc("get_clicks_by_day", {
      url_id_input: url.id,
    });

    const { data: topCountries } = await supabase.rpc("get_top_countries", {
      url_id_input: url.id,
    });

    const { data: uniqueClicks } = await supabase.rpc("get_unique_clicks", {
      url_id_input: url.id,
    });

    return {
      shortCode,
      originalUrl: url.original_url,
      totalClicks: url.click_count || 0,
      uniqueClicks: uniqueClicks?.[0]?.unique_clicks || 0,
      createdAt: url.created_at,
      clicksByDay:
        clicksByDay?.reduce((acc, row) => {
          acc[row.date] = row.clicks;
          return acc;
        }, {}) || {},
      topCountries: topCountries || [],
    };
  }
}
