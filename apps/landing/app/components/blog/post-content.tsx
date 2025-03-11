import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, Clock } from 'lucide-react'
import Link from 'next/link'
import { SocialShare } from './social-share'

interface PostContentProps {
  title: string
  content: string
  coverImage?: string | null
  author: {
    name: string | null
    image: string | null
  }
  date: Date | string
  categories: {
    id: string
    name: string
    slug: string
  }[]
  tags: {
    id: string
    name: string
    slug: string
  }[]
  estimatedReadingTime?: number
  url?: string
}

export function PostContent({
  title,
  content,
  coverImage,
  author,
  date,
  categories,
  tags,
  estimatedReadingTime = 5,
  url = ''
}: PostContentProps) {
  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(date instanceof Date ? date : new Date(date))
  }

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <article className="max-w-4xl mx-auto">
      {/* Cover Image */}
      {coverImage && (
        <div className="relative w-full h-[400px] mb-10 rounded-xl overflow-hidden">
          <img
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Title and Meta */}
      <div className="mb-10">
        <h1 className="text-4xl md:text-5xl font-bold font-poppins text-white mb-6 leading-tight">{title}</h1>
        
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
          {/* Author */}
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 border border-sky-500/20">
              {author.image ? (
                <AvatarImage src={author.image} alt={author.name || 'Author'} />
              ) : null}
              <AvatarFallback className="bg-slate-800 text-sky-400">{getInitials(author.name)}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{author.name || 'Anonymous'}</span>
          </div>
          
          {/* Date */}
          <div className="flex items-center gap-1">
            <CalendarIcon className="h-4 w-4 text-sky-400/80" />
            <span>{formatDate(date)}</span>
          </div>
          
          {/* Reading Time */}
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-sky-400/80" />
            <span>{estimatedReadingTime} min read</span>
          </div>
        </div>
        
        {/* Categories and Tags */}
        <div className="flex flex-wrap gap-3 mt-6">
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <Link key={category.id} href={`/blog/category/${category.slug}`}>
                  <Badge 
                    variant="outline" 
                    className="border-sky-500/20 bg-slate-900/50 hover:bg-slate-800/70 hover:text-sky-400 transition-colors cursor-pointer"
                  >
                    {category.name}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
          
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <Link key={tag.id} href={`/blog/tag/${tag.slug}`}>
                  <Badge 
                    variant="secondary" 
                    className="bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-colors cursor-pointer"
                  >
                    {tag.name}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </div>
        
        {/* Social Share */}
        <div className="mt-8">
          <SocialShare title={title} url={url} />
        </div>
      </div>

      {/* Content */}
      <div className="prose prose-lg dark:prose-invert max-w-none 
        prose-headings:font-poppins prose-headings:text-white prose-headings:font-semibold prose-headings:leading-tight
        prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
        prose-p:text-base prose-p:leading-relaxed prose-p:text-gray-200
        prose-a:text-sky-400 prose-a:no-underline hover:prose-a:underline 
        prose-img:rounded-xl
        prose-strong:text-white prose-strong:font-semibold
        prose-em:text-gray-300 prose-em:italic
        prose-code:text-pink-400 prose-code:bg-slate-800/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
        prose-pre:bg-slate-800/50 prose-pre:border prose-pre:border-slate-700
        prose-blockquote:border-l-4 prose-blockquote:border-sky-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-300
        prose-li:text-gray-200 prose-li:marker:text-sky-400
        prose-table:border-collapse
        prose-th:border prose-th:border-sky-500/20 prose-th:bg-slate-800/50 prose-th:p-2
        prose-td:border prose-td:border-sky-500/10 prose-td:p-2
        prose-hr:border-sky-500/20">
        <div 
          dangerouslySetInnerHTML={{ __html: content }} 
          className="blog-content font-nunito"
        />
      </div>
      
      {/* Bottom Social Share */}
      <div className="mt-16 pt-6 border-t border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="text-slate-400 font-medium">Share this article:</span>
          <SocialShare title={title} url={url} />
        </div>
      </div>
    </article>
  )
} 