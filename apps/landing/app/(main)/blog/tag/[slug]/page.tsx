import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Background from '@/app/components/background';
import Navbar from '@/app/components/navbar';
import Footer from '@/app/components/footer';
import { getAllTags, getPostsByTag, getRecentPosts, getAllCategories } from '@/app/lib/blog-api';
import { BlogSidebar } from '@/app/components/blog/sidebar';
import { PostGrid } from '@/app/components/blog/post-grid';
import { RelatedTags } from '@/app/components/blog/related-tags';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Filter, Grid3X3, LayoutList, SortAsc, SortDesc } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tags = await getAllTags();
  const tag = tags.find(t => t.slug === slug);
  
  if (!tag) {
    return {
      title: 'Tag Not Found | Databuddy Analytics',
      description: 'The requested tag could not be found.'
    };
  }
  
  return {
    title: `#${tag.name} | Databuddy Analytics Blog`,
    description: `Browse all posts tagged with #${tag.name}. Discover insights, tutorials, and resources related to ${tag.name} in data analytics.`,
    keywords: [`${tag.name}`, 'data analytics', 'blog', 'insights', 'tutorials'],
    openGraph: {
      title: `#${tag.name} | Databuddy Analytics Blog`,
      description: `Browse all posts tagged with #${tag.name}. Discover insights, tutorials, and resources related to ${tag.name} in data analytics.`,
      type: 'website',
      url: `/blog/tag/${slug}`,
      images: [
        {
          url: '/images/og-image.jpg',
          width: 1200,
          height: 630,
          alt: `Databuddy Analytics - ${tag.name} tag`
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: `#${tag.name} | Databuddy Analytics Blog`,
      description: `Browse all posts tagged with #${tag.name}. Discover insights, tutorials, and resources.`,
      images: ['/images/og-image.jpg']
    }
  };
}

export default async function TagPage({ params }: Props) {
  const { slug } = await params;
  const tags = await getAllTags();
  const tag = tags.find(t => t.slug === slug);
  
  if (!tag) {
    notFound();
  }
  
  // Fetch posts for this tag and sidebar data in parallel
  const [posts, recentPosts, categories] = await Promise.all([
    getPostsByTag(tag.id),
    getRecentPosts(5),
    getAllCategories()
  ]);
  
  // Ensure categories and tags have postCount property
  const formattedCategories = categories.map(cat => ({
    ...cat,
    postCount: cat.postCount || 0
  }));
  
  const formattedTags = tags.map(t => ({
    ...t,
    postCount: t.postCount || 0
  }));
  
  return (
    <div className="fixed inset-0 overflow-hidden">
      <Background />
      <div className="relative z-10 h-full overflow-auto scrollbar-hide font-nunito">
        <Navbar />
        
        <main className="container mx-auto px-4 py-12 md:py-16 max-w-6xl">
          {/* Breadcrumb navigation */}
          <nav className="mb-8 text-sm text-slate-400" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li><Link href="/" className="hover:text-sky-400 transition-colors">Home</Link></li>
              <li><span className="mx-2">/</span></li>
              <li><Link href="/blog" className="hover:text-sky-400 transition-colors">Blog</Link></li>
              <li><span className="mx-2">/</span></li>
              <li><Link href="/blog/tags" className="hover:text-sky-400 transition-colors">Tags</Link></li>
              <li><span className="mx-2">/</span></li>
              <li className="text-sky-400 font-medium">#{tag.name}</li>
            </ol>
          </nav>
          
          <div className="grid grid-cols-1 lg:grid-cols-16 gap-8 lg:gap-16">
            {/* Main Content */}
            <div className="lg:col-span-11">
              <div className="mb-8">
                <Link href="/blog" className="inline-flex items-center text-sky-400 hover:text-sky-300 transition-colors mb-4">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to all posts
                </Link>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                  <span className="text-sky-400">#{tag.name}</span>
                </h1>
                <p className="text-slate-400 mb-4">
                  Showing {posts.length} post{posts.length !== 1 ? 's' : ''} with this tag
                </p>
                
                {/* Post filters and sorting */}
                <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 px-3 text-xs bg-slate-800/50 border-slate-700 text-slate-300">
                      <Filter className="h-3 w-3 mr-1" />
                      Filter
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 px-3 text-xs bg-slate-800/50 border-slate-700 text-slate-300">
                      <SortDesc className="h-3 w-3 mr-1" />
                      Newest
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-slate-800/50 border-slate-700 text-slate-300">
                      <Grid3X3 className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-slate-800/50 border-slate-700 text-slate-300">
                      <LayoutList className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <Separator className="mb-8 bg-slate-800/50" />
              
              {posts.length > 0 ? (
                <>
                  <PostGrid posts={posts} />
                  
                  {/* Related tags section (mobile only) */}
                  <div className="mt-12 lg:hidden">
                    <RelatedTags 
                      currentTagId={tag.id} 
                      tags={formattedTags} 
                      title="Explore Related Tags"
                    />
                  </div>
                </>
              ) : (
                <div className="text-center py-12 bg-slate-900/30 border border-slate-800 rounded-lg">
                  <p className="text-slate-400 mb-4">No posts found with this tag.</p>
                  <Button asChild variant="outline" className="bg-slate-800/50 border-slate-700 text-slate-300 hover:text-sky-400">
                    <Link href="/blog">Browse all posts</Link>
                  </Button>
                </div>
              )}
            </div>
            
            {/* Sidebar */}
            <div className="lg:col-span-5">
              <div className="sticky top-24 space-y-8">
                {/* Related tags (desktop only) */}
                <div className="hidden lg:block">
                  <RelatedTags 
                    currentTagId={tag.id} 
                    tags={formattedTags} 
                    title="Explore Related Tags"
                  />
                </div>
                
                <BlogSidebar
                  recentPosts={recentPosts}
                  categories={formattedCategories}
                  tags={formattedTags}
                />
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
} 