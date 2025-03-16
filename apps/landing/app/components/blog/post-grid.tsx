import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Clock, Eye } from 'lucide-react';

interface Author {
  id: string;
  name: string | null;
  image: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  postCount?: number;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  postCount?: number;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  published: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  author: Author;
  categories: Category[];
  tags: Tag[];
  readingTime?: number;
}

interface PostGridProps {
  posts: Post[];
}

export function PostGrid({ posts }: PostGridProps) {
  // Calculate estimated reading time if not provided
  const getReadingTime = (content: string) => {
    if (!content) return 3; // Default reading time
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {posts.map((post) => (
        <Card 
          key={post.id} 
          className="group bg-slate-900/50 border-slate-800 hover:border-sky-500/30 transition-all duration-300 overflow-hidden hover:shadow-[0_0_15px_rgba(56,189,248,0.15)]"
        >
          <Link href={`/blog/${post.slug}`} className="block">
            {post.coverImage ? (
              <div className="relative h-52 w-full overflow-hidden">
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            ) : (
              <div className="relative h-52 w-full bg-gradient-to-br from-slate-800/50 to-slate-900/50 flex items-center justify-center">
                <div className="text-slate-600 text-lg font-medium">Databuddy Analytics</div>
              </div>
            )}
            
            <CardHeader className="pb-2">
              <div className="flex flex-wrap gap-2 mb-3">
                {post.categories?.slice(0, 2).map((category: Category) => (
                  <Link 
                    key={category.id} 
                    href={`/blog/category/${category.slug}`}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors mr-3"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
              <h2 className="text-xl font-bold text-white line-clamp-2 group-hover:text-sky-400 transition-colors">
                {post.title}
              </h2>
            </CardHeader>
            
            <CardContent className="pb-2">
              {post.excerpt && (
                <p className="text-slate-400 line-clamp-3 mb-4 group-hover:text-slate-300 transition-colors">
                  {post.excerpt}
                </p>
              )}
              
              <div className="flex flex-wrap gap-2">
                {post.tags && post.tags.slice(0, 3).map((tag: Tag) => (
                  <Badge 
                    key={tag.id} 
                    variant="outline" 
                    className="bg-transparent border-slate-700 text-slate-400 text-xs"
                  >
                    #{tag.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
            
            <CardFooter className="text-sm text-slate-500 flex justify-between border-t border-slate-800/50 mt-2 pt-3">
              <div className="flex items-center">
                {post.author?.image ? (
                  <div className="relative h-6 w-6 rounded-full overflow-hidden mr-2 ring-1 ring-slate-700 group-hover:ring-sky-500/30 transition-all">
                    <Image
                      src={post.author.image}
                      alt={post.author.name || 'Author'}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center mr-2 text-xs text-slate-400">
                    {post.author?.name?.charAt(0) || 'A'}
                  </div>
                )}
                <span className="group-hover:text-slate-300 transition-colors">{post.author?.name || 'Anonymous'}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center text-slate-500 group-hover:text-slate-300 transition-colors">
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  <time dateTime={new Date(post.createdAt).toISOString()}>
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                  </time>
                </div>
                <div className="flex items-center text-slate-500 group-hover:text-slate-300 transition-colors">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{post.readingTime || getReadingTime(post.content)} min</span>
                </div>
              </div>
            </CardFooter>
          </Link>
        </Card>
      ))}
    </div>
  );
} 