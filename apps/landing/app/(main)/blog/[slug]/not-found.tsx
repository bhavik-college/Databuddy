import Link from 'next/link'
import Background from '@/app/components/background'
import Navbar from '@/app/components/navbar'
import Footer from '@/app/components/footer'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'

export default function BlogPostNotFound() {
  return (
    <div className="fixed inset-0 overflow-hidden">
      <Background />
      <div className="relative z-10 h-full overflow-auto scrollbar-hide">
        <Navbar />
        
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="h-24 w-24 bg-sky-500/20 rounded-full flex items-center justify-center">
                <FileQuestion className="h-12 w-12 text-sky-400" />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-4">Blog Post Not Found</h1>
            
            <p className="text-slate-300 mb-8">
              The blog post you&apos;re looking for doesn&apos;t exist or may have been moved.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link href="/blog">
                  Back to Blog
                </Link>
              </Button>
              
              <Button variant="outline" asChild>
                <Link href="/">
                  Go to Homepage
                </Link>
              </Button>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  )
} 