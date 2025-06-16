import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFavicon(url: string, size = 64) {
  return `https://www.google.com/s2/favicons?domain=${url}&sz=${size}`;
}
