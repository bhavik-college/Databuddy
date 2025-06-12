import bots from './bots';

export function isBot(ua: string) {
  if (!ua) return null;
  
  return bots.find((bot) => {
    try {
      return new RegExp(bot.regex).test(ua);
    } catch (e) {
      return false;
    }
  });
}