import Link from "next/link";
import Image from "next/image";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3 group">
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
      <div className="flex flex-col justify-center">
        <h1 className="
          font-mono
          text-lg 
          tracking-wider
          text-foreground
          font-semibold
          leading-none
          select-none
          transition-colors 
          duration-200
          group-hover:text-primary
        ">
          DATABUDDY
        </h1>
        <div className="h-0.5 w-full bg-gradient-to-r from-primary/60 to-transparent rounded-full mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    </Link>
  );
} 