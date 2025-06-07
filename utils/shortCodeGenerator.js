import { nanoid } from "nanoid";

const BASE62_CHARS =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export class ShortCodeGenerator {
  static generateFromId(id) {
    let result = "";
    let num = id;

    while (num > 0) {
      result = BASE62_CHARS[num % 62] + result;
      num = Math.floor(num / 62);
    }

    return result.padStart(6, "a");
  }

  static generateRandom(length = 6) {
    return nanoid(length).replace(
      /[_-]/g,
      () => BASE62_CHARS[Math.floor(Math.random() * 62)]
    );
  }

  static validateCustomAlias(alias) {
    const isValid = /^[a-zA-Z0-9]{3,20}$/.test(alias);
    const reservedWords = [
      "api",
      "www",
      "admin",
      "dashboard",
      "analytics",
      "health",
    ];

    return {
      isValid: isValid && !reservedWords.includes(alias.toLowerCase()),
      error: !isValid
        ? "Alias must be 3-20 alphanumeric characters"
        : reservedWords.includes(alias.toLowerCase())
        ? "This alias is reserved"
        : null,
    };
  }
}
