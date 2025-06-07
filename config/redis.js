import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: "https://pleased-bobcat-10671.upstash.io",
  token: "ASmvAAIjcDE2MzkwZDlkMGI0ZTc0OWFkODRlMGZmYTk5ODk1NDY3ZnAxMA",
});

try {
  await redis.ping();
  console.log("✅ Redis connected successfully");
} catch (error) {
  console.error("❌ Redis connection failed:", error);
}
