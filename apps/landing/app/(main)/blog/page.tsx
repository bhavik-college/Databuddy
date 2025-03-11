"use client"

import { useEffect, useState } from "react";
import Background from "../../components/background";
import Navbar from "../../components/navbar";
import Footer from "../../components/footer";
import FadeIn from "../../components/FadeIn";
import Link from "next/link";
import { ArrowRight, CalendarIcon, Clock } from "lucide-react";
import { BlogSidebar } from "@/app/components/blog/sidebar";
import { calculateReadingTime } from "@/app/lib/blog-utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAllPosts, getAllCategories, getAllTags } from "@/app/lib/blog-api";

// Define types for our data
interface Author {
  name: string | null;
  image: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  createdAt: string;
  author: Author;
  categories: Category[];
  tags: Tag[];
}

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<(Category & { postCount: number })[]>([]);
  const [tags, setTags] = useState<(Tag & { postCount: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch blog posts, categories, and tags in parallel
        const [postsData, categoriesData, tagsData] = await Promise.all([
          getAllPosts(),
          getAllCategories(),
          getAllTags()
        ]);
        
        setPosts(postsData as Post[]);
        setCategories(categoriesData as (Category & { postCount: number })[]);
        setTags(tagsData as (Tag & { postCount: number })[]);
      } catch (err: unknown) {
        console.error("Error fetching blog data:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(date instanceof Date ? date : new Date(date));
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((part: string) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 overflow-hidden">
        <Background />
        <div className="relative z-10 h-full overflow-auto scrollbar-hide">
          <Navbar />
          <main className="container mx-auto px-4 py-16">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-500 mb-4">
                Databuddy Blog
              </h1>
              <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                Loading blog content...
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-8">
                <div className="space-y-12">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden animate-pulse">
                      <div className="h-[300px] bg-slate-800"></div>
                      <div className="p-6 md:p-8">
                        <div className="h-6 bg-slate-800 rounded w-1/3 mb-4"></div>
                        <div className="h-10 bg-slate-800 rounded w-3/4 mb-4"></div>
                        <div className="h-20 bg-slate-800 rounded w-full mb-6"></div>
                        <div className="flex justify-between">
                          <div className="h-6 bg-slate-800 rounded w-1/3"></div>
                          <div className="h-6 bg-slate-800 rounded w-1/4"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-4">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 animate-pulse">
                  <div className="h-8 bg-slate-800 rounded w-1/2 mb-6"></div>
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-6 bg-slate-800 rounded w-full"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 overflow-hidden">
        <Background />
        <div className="relative z-10 h-full overflow-auto scrollbar-hide">
          <Navbar />
          <main className="container mx-auto px-4 py-16">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-500 mb-4">
                Databuddy Blog
              </h1>
              <p className="text-lg text-red-500 max-w-2xl mx-auto">
                Error loading blog content: {error}
              </p>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden">
      <Background />
      <div className="relative z-10 h-full overflow-auto scrollbar-hide">
        <Navbar />
        <main className="container mx-auto px-4 py-16">
          <FadeIn>
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-500 mb-4">
                Databuddy Blog
              </h1>
              <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                Insights, updates, and articles about privacy-first analytics, 
                data ownership, and maximizing your website performance.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-8">
              <FadeIn delay={100}>
                {posts.length > 0 ? (
                  <div className="space-y-12">
                    {posts.map((post) => {
                      const readingTime = calculateReadingTime(post.content);
                      
                      return (
                        <article key={post.id} className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                          {post.coverImage && (
                            <div className="relative w-full h-[300px]">
                              <img 
                                src={post.coverImage} 
                                alt={post.title} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          
                          <div className="p-6 md:p-8">
                            <div className="flex flex-wrap gap-2 mb-4">
                              {post.categories.map(category => (
                                <Link key={category.id} href={`/blog/category/${category.slug}`}>
                                  <Badge variant="outline" className="hover:bg-slate-800 transition-colors cursor-pointer">
                                    {category.name}
                                  </Badge>
                                </Link>
                              ))}
                            </div>
                            
                            <Link href={`/blog/${post.slug}`}>
                              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 hover:text-sky-400 transition-colors">
                                {post.title}
                              </h2>
                            </Link>
                            
                            {post.excerpt && (
                              <p className="text-slate-300 mb-6">
                                {post.excerpt}
                              </p>
                            )}
                            
                            <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-slate-400">
                              <div className="flex items-center gap-4">
                                {/* Author */}
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    {post.author.image ? (
                                      <AvatarImage src={post.author.image} alt={post.author.name || 'Author'} />
                                    ) : null}
                                    <AvatarFallback>{getInitials(post.author.name)}</AvatarFallback>
                                  </Avatar>
                                  <span>{post.author.name || 'Anonymous'}</span>
                                </div>
                                
                                {/* Date */}
                                <div className="flex items-center gap-1">
                                  <CalendarIcon className="h-4 w-4" />
                                  <span>{formatDate(post.createdAt)}</span>
                                </div>
                                
                                {/* Reading Time */}
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{readingTime} min read</span>
                                </div>
                              </div>
                              
                              <Link 
                                href={`/blog/${post.slug}`}
                                className="flex items-center text-sky-400 hover:text-sky-300 transition-colors"
                              >
                                Read more
                                <ArrowRight className="h-4 w-4 ml-1" />
                              </Link>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="h-16 w-16 bg-sky-500/20 rounded-full flex items-center justify-center">
                        <Clock className="h-8 w-8 text-sky-400" />
                      </div>
                      <h2 className="text-2xl font-semibold text-white">Coming Soon</h2>
                      <p className="text-slate-300 max-w-lg">
                        We&apos;re working on some amazing content for our blog. Check back soon for insights on privacy-first analytics and data ownership.
                      </p>
                    </div>
                  </div>
                )}
              </FadeIn>
            </div>
            
            {/* Sidebar */}
            <div className="lg:col-span-4">
              <FadeIn delay={150}>
                <div className="sticky top-24">
                  <BlogSidebar
                    recentPosts={posts.slice(0, 5)}
                    categories={categories}
                    tags={tags}
                  />
                </div>
              </FadeIn>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
} 