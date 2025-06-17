import Link from "next/link";
import Image from "next/image";

import { Geist_Mono } from "next/font/google";

const geistMono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-geist-mono',
});

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <div className="relative flex-shrink-0 transition-transform duration-200">
        <Image
          src="/logo.svg"
          alt="DataBuddy Logo"
          width={32}
          height={32}
          className="drop-shadow-sm invert dark:invert-0 transition-all duration-200"
          priority
        />
      </div>
      <div className="flex items-center">
        <h1 className={`
          ${geistMono.variable}
          text-lg 
          tracking-wider
          text-foreground
          font-semibold
          leading-none
          select-none
          transition-colors 
          duration-200
        `}>
          DATABUDDY
        </h1>
      </div>
    </Link>
  );
} 