import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { CalendarIcon } from 'lucide-react'

interface Post {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  coverImage?: string | null
  createdAt: Date | string
  author: {
    name: string | null
    image: string | null
  }
}

interface RelatedPostsProps {
  posts: Post[]
}

export function RelatedPosts({ posts }: RelatedPostsProps) {
  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date instanceof Date ? date : new Date(date))
  }

  if (posts.length === 0) {
    return null
  }

  return (
    <div className="mt-16">
      <h2 className="text-2xl font-bold font-poppins text-white mb-8">Related Articles</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {posts.map(post => (
          <Link key={post.id} href={`/blog/${post.slug}`} className="group">
            <div className="h-full bg-slate-900/30 border border-slate-800/60 rounded-lg overflow-hidden hover:border-sky-500/30 transition-all hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] duration-300">
              <div className="relative h-48 w-full overflow-hidden">
                {post.coverImage ? (
                  <img 
                    src={post.coverImage} 
                    alt={post.title} 
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full bg-slate-800/50 flex items-center justify-center">
                    <span className="text-slate-500">No image</span>
                  </div>
                )}
              </div>
              
              <div className="p-5">
                <div className="flex items-center text-xs text-slate-400 mb-3">
                  <CalendarIcon className="h-3 w-3 mr-1 text-sky-400/70" />
                  <span>{formatDate(post.createdAt)}</span>
                </div>
                
                <h3 className="text-lg font-semibold font-poppins text-white group-hover:text-sky-400 transition-colors line-clamp-2 mb-3">
                  {post.title}
                </h3>
                
                {post.excerpt && (
                  <p className="text-sm text-slate-300 line-clamp-3 font-nunito">
                    {post.excerpt}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
} 