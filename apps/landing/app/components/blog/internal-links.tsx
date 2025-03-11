import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string | null
}

interface InternalLinksProps {
  relatedPosts: Post[]
  currentPostId: string
  title?: string
}

export function InternalLinks({ relatedPosts, currentPostId, title = 'Related Articles' }: InternalLinksProps) {
  // Filter out the current post if it's in the related posts
  const filteredPosts = relatedPosts.filter(post => post.id !== currentPostId)
  
  if (filteredPosts.length === 0) {
    return null
  }
  
  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>You might also be interested in these articles</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {filteredPosts.map(post => (
            <li key={post.id} className="group">
              <Link 
                href={`/blog/${post.slug}`}
                className="flex items-start hover:text-blue-400 transition-colors"
              >
                <ArrowRight className="h-5 w-5 mr-2 mt-0.5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                <div>
                  <h3 className="font-medium">{post.title}</h3>
                  {post.excerpt && (
                    <p className="text-sm text-slate-400 line-clamp-1">{post.excerpt}</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
} 