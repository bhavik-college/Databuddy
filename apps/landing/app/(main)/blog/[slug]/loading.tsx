import Background from '@/app/components/background'
import Navbar from '@/app/components/navbar'
import Footer from '@/app/components/footer'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

export default function BlogPostLoading() {
  return (
    <div className="fixed inset-0 overflow-hidden">
      <Background />
      <div className="relative z-10 h-full overflow-auto scrollbar-hide">
        <Navbar />
        
        <main className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-8">
              <article className="max-w-4xl mx-auto">
                {/* Cover Image Skeleton */}
                <Skeleton className="w-full h-[400px] mb-8 rounded-xl" />

                {/* Title and Meta Skeleton */}
                <div className="mb-8">
                  <Skeleton className="h-12 w-3/4 mb-6" />
                  
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Author */}
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    
                    {/* Date */}
                    <Skeleton className="h-4 w-32" />
                    
                    {/* Reading Time */}
                    <Skeleton className="h-4 w-24" />
                  </div>
                  
                  {/* Categories and Tags */}
                  <div className="flex flex-wrap gap-3 mt-4">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                </div>

                {/* Content Skeleton */}
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                
                <Separator className="my-16" />
                
                {/* Related Posts Skeleton */}
                <div className="mt-16">
                  <Skeleton className="h-8 w-48 mb-6" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                        <Skeleton className="h-48 w-full" />
                        <div className="p-4">
                          <Skeleton className="h-4 w-16 mb-2" />
                          <Skeleton className="h-6 w-full mb-2" />
                          <Skeleton className="h-4 w-5/6" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            </div>
            
            {/* Sidebar Skeleton */}
            <div className="lg:col-span-4">
              <div className="sticky top-24 space-y-6">
                {/* Recent Posts */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex gap-3 pb-3 border-b border-slate-800 last:border-0 last:pb-0">
                        <Skeleton className="w-16 h-16 rounded-md shrink-0" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Categories */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-28 rounded-full" />
                  </div>
                </div>
                
                {/* Tags */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                  <Skeleton className="h-6 w-20 mb-4" />
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-6 w-12 rounded-full" />
                    <Skeleton className="h-6 w-28 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  )
} 