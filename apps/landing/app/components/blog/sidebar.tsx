import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, Hash, Layers, Search, Mail, TrendingUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

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

interface Category {
  id: string
  name: string
  slug: string
  postCount: number
}

interface Tag {
  id: string
  name: string
  slug: string
  postCount: number
}

interface BlogSidebarProps {
  recentPosts: Post[]
  categories: Category[]
  tags: Tag[]
}

export function BlogSidebar({ recentPosts, categories, tags }: BlogSidebarProps) {
  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date instanceof Date ? date : new Date(date))
  }

  const sortedCategories = categories.sort((a, b) => b.postCount - a.postCount)
  const sortedTags = tags.sort((a, b) => b.postCount - a.postCount)

  return (
    <div className="space-y-8 font-nunito">
      {/* Search Box */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input 
            type="search" 
            placeholder="Search posts..." 
            className="pl-9 bg-slate-800/50 border-slate-700 focus:border-sky-500/50 text-slate-300"
          />
        </div>
      </div>
      
      
      {/* Recent Posts */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-5 shadow-sm space-y-4">
        <h3 className="text-lg font-poppins font-medium text-white border-b border-sky-500/20 pb-2 flex items-center">
          <CalendarIcon className="h-4 w-4 mr-2 text-sky-400" />
          Recent Posts
        </h3>
        
        {recentPosts.length > 0 ? (
          <ul className="space-y-5">
            {recentPosts.map(post => (
              <li key={post.id} className="group">
                <Link 
                  href={`/blog/${post.slug}`}
                  className="flex items-start gap-3"
                >
                  {post.coverImage ? (
                    <div className="w-16 h-16 rounded-md overflow-hidden shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                      <img 
                        src={post.coverImage} 
                        alt={post.title} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-slate-800/50 rounded-md flex items-center justify-center shrink-0">
                      <span className="text-slate-500 text-xs">No image</span>
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-medium text-white/90 group-hover:text-sky-400 transition-colors line-clamp-2">
                      {post.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {formatDate(post.createdAt)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">No recent posts</p>
        )}
      </div>

      {/* Popular Categories */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-5 shadow-sm space-y-4">
        <h3 className="text-lg font-poppins font-medium text-white border-b border-sky-500/20 pb-2 flex items-center">
          <Layers className="h-4 w-4 mr-2 text-sky-400" />
          Categories
        </h3>
        
        {sortedCategories.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {sortedCategories.map(category => (
              <Link key={category.id} href={`/blog/category/${category.slug}`}>
                <Badge 
                  variant="outline" 
                  className="bg-transparent border-slate-700 hover:bg-slate-800/50 hover:border-sky-500/30 transition-colors cursor-pointer text-slate-300 hover:text-sky-300"
                >
                  {category.name}
                  <span className="text-xs ml-1 opacity-70">({category.postCount})</span>
                </Badge>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No categories</p>
        )}
      </div>

      {/* Popular Tags */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-5 shadow-sm space-y-4">
        <h3 className="text-lg font-poppins font-medium text-white border-b border-sky-500/20 pb-2 flex items-center">
          <Hash className="h-4 w-4 mr-2 text-sky-400" />
          Popular Tags
        </h3>
        
        {sortedTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {sortedTags.slice(0, 15).map(tag => (
              <Link key={tag.id} href={`/blog/tag/${tag.slug}`}>
                <Badge 
                  variant="secondary" 
                  className="bg-sky-500/5 hover:bg-sky-500/10 text-sky-300 border border-sky-500/10 hover:border-sky-500/20 transition-colors cursor-pointer"
                >
                  #{tag.name}
                  <span className="text-xs ml-1 opacity-70">({tag.postCount})</span>
                </Badge>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No tags</p>
        )}
      </div>
      
      {/* Call to Action */}
      <div className="bg-gradient-to-br from-indigo-900/20 to-slate-900/70 border border-indigo-500/20 rounded-lg p-5 shadow-sm">
        <h3 className="text-lg font-poppins font-medium text-white mb-2">Need Data Analytics?</h3>
        <p className="text-sm text-slate-400 mb-4">Discover how Databuddy Analytics can transform your business data into actionable insights.</p>
        <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white">
          <Link href="/contact">Get Started</Link>
        </Button>
      </div>
    </div>
  )
} 