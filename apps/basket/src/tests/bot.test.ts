import { describe, test, expect } from "bun:test";
import { isBot } from "../lists";
import bots from "../lists/bots";

describe("Bot Detection", () => {
  test("should detect common bots", () => {
    const commonBots = [
      "Googlebot/2.1 (+http://www.google.com/bot.html)",
      "Mozilla/5.0 (compatible; Bingbot/2.0; +http://www.bing.com/bingbot.htm)",
      "Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)",
      "Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)",
      "Mozilla/5.0 (compatible; DuckDuckBot/1.0; +http://duckduckgo.com/duckduckbot.html)",
      "Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)",
      "Mozilla/5.0 (compatible; SemrushBot/7~bl; +http://www.semrush.com/bot.html)",
      "Mozilla/5.0 (compatible; MJ12bot/v1.4.8; http://mj12bot.com/)",
      "Mozilla/5.0 (compatible; PetalBot;+https://webmaster.petalsearch.com/site/petalbot)",
      "Mozilla/5.0 (compatible; SeznamBot/3.2; +http://napoveda.seznam.cz/en/seznambot-intro/)",
    ];

    for (const userAgent of commonBots) {
      const result = isBot(userAgent);
      expect(result).toBeTruthy();
    }
  });

  test("should handle empty or invalid user agents", () => {
    const invalidUserAgents = [
      "",
      null,
      undefined,
      " ",
      "Mozilla/5.0",
      "Chrome/91.0.4472.124",
      "Safari/605.1.15",
    ];

    for (const userAgent of invalidUserAgents) {
      const result = isBot(userAgent as string);
      expect(result).toBeUndefined();
    }
  });

  test("should handle malformed bot user agents", () => {
    const malformedBots = [
      "Googlebot",
      "Bingbot",
      "YandexBot",
      "Baiduspider",
      "DuckDuckBot",
      "AhrefsBot",
      "SemrushBot",
      "MJ12bot",
      "PetalBot",
      "SeznamBot",
    ];

    for (const userAgent of malformedBots) {
      const result = isBot(userAgent);
      // Should still detect as bot even with malformed UA
      expect(result).toBeTruthy();
    }
  });

  test("should handle regex edge cases", () => {
    const edgeCases = [
      "Googlebot/2.1 (compatible; +http://www.google.com/bot.html)",
      "Mozilla/5.0 (compatible; Bingbot/2.0; +http://www.bing.com/bingbot.htm)",
      "Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)",
      "Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)",
      "Mozilla/5.0 (compatible; DuckDuckBot/1.0; +http://duckduckgo.com/duckduckbot.html)",
      "Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)",
      "Mozilla/5.0 (compatible; SemrushBot/7~bl; +http://www.semrush.com/bot.html)",
      "Mozilla/5.0 (compatible; MJ12bot/v1.4.8; http://mj12bot.com/)",
      "Mozilla/5.0 (compatible; PetalBot;+https://webmaster.petalsearch.com/site/petalbot)",
      "Mozilla/5.0 (compatible; SeznamBot/3.2; +http://napoveda.seznam.cz/en/seznambot-intro/)",
    ];

    for (const userAgent of edgeCases) {
      const result = isBot(userAgent);
      expect(result).toBeTruthy();
    }
  });
}); 