
import Link from "next/link";
import { ArrowLeft, Home, Search, HelpCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-slate-950">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-[10px] opacity-50">
            <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-blue-500 rounded-full mix-blend-screen filter blur-[80px] opacity-20 animate-blob" />
            <div className="absolute top-1/4 right-1/3 w-[500px] h-[500px] bg-sky-400 rounded-full mix-blend-screen filter blur-[80px] opacity-20 animate-blob animation-delay-2000" />
            <div className="absolute bottom-1/3 right-1/2 w-[500px] h-[500px] bg-indigo-500 rounded-full mix-blend-screen filter blur-[80px] opacity-20 animate-blob animation-delay-4000" />
          </div>
        </div>
      </div>

      <div className="flex-1 relative z-10 container mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
        <div
          className="max-w-2xl mx-auto"
        >
          <h1 className="text-7xl font-bold bg-gradient-to-r from-sky-400 via-blue-500 to-sky-600 bg-clip-text text-transparent mb-6">
            404
          </h1>
          <h2 className="text-3xl font-bold text-white mb-4">Page Not Found</h2>
          <p className="text-slate-400 text-lg mb-8">
            Oops! The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>

          {/* Navigation options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 p-4 bg-slate-900/50 border border-slate-800 rounded-lg hover:bg-slate-800/50 transition-colors"
            >
              <Home className="h-5 w-5 text-sky-500" />
              <span className="text-white font-medium">Back to Home</span>
            </Link>
            <Link
              href="/contact"
              className="flex items-center justify-center gap-2 p-4 bg-slate-900/50 border border-slate-800 rounded-lg hover:bg-slate-800/50 transition-colors"
            >
              <Mail className="h-5 w-5 text-sky-500" />
              <span className="text-white font-medium">Contact Support</span>
            </Link>
            <Link
              href="/blog"
              className="flex items-center justify-center gap-2 p-4 bg-slate-900/50 border border-slate-800 rounded-lg hover:bg-slate-800/50 transition-colors"
            >
              <Search className="h-5 w-5 text-sky-500" />
              <span className="text-white font-medium">Browse Articles</span>
            </Link>
            <Link
              href="/#faq"
              className="flex items-center justify-center gap-2 p-4 bg-slate-900/50 border border-slate-800 rounded-lg hover:bg-slate-800/50 transition-colors"
            >
              <HelpCircle className="h-5 w-5 text-sky-500" />
              <span className="text-white font-medium">Check FAQs</span>
            </Link>
          </div>

          <Button
            asChild
            className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-medium px-6 py-3 rounded-lg shadow-lg shadow-sky-500/20"
          >
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-5 w-5" />
              Return to Homepage
            </Link>
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-6 border-t border-slate-800/50">
        <div className="container mx-auto px-4 text-center text-slate-500">
          <p>© {new Date().getFullYear()} Databuddy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
} 