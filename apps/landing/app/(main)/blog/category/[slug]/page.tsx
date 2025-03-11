import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Background from '@/app/components/background';
import Navbar from '@/app/components/navbar';
import Footer from '@/app/components/footer';
import { getAllCategories, getPostsByCategory, getRecentPosts, getAllTags } from '@/app/lib/blog-api';
import { BlogSidebar } from '@/app/components/blog/sidebar';
import { PostGrid } from '@/app/components/blog/post-grid';
import { Separator } from '@/components/ui/separator';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getAllCategories();
  const category = categories.find(cat => cat.slug === slug);
  
  if (!category) {
    return {
      title: 'Category Not Found | Databuddy Analytics',
      description: 'The requested category could not be found.'
    };
  }
  
  return {
    title: `${category.name} | Databuddy Analytics Blog`,
    description: `Browse all posts in the ${category.name} category.`,
    openGraph: {
      title: `${category.name} | Databuddy Analytics Blog`,
      description: `Browse all posts in the ${category.name} category.`,
    }
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const categories = await getAllCategories();
  const category = categories.find(cat => cat.slug === slug);
  
  if (!category) {
    notFound();
  }
  
  // Fetch posts for this category and sidebar data in parallel
  const [posts, recentPosts, tags] = await Promise.all([
    getPostsByCategory(category.id),
    getRecentPosts(5),
    getAllTags()
  ]);
  
  // Ensure categories and tags have postCount property
  const formattedCategories = categories.map(cat => ({
    ...cat,
    postCount: cat.postCount || 0
  }));
  
  const formattedTags = tags.map(tag => ({
    ...tag,
    postCount: tag.postCount || 0
  }));
  
  return (
    <div className="fixed inset-0 overflow-hidden">
      <Background />
      <div className="relative z-10 h-full overflow-auto scrollbar-hide font-nunito">
        <Navbar />
        
        <main className="container mx-auto px-4 py-12 md:py-16 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-16 gap-8 lg:gap-16">
            {/* Main Content */}
            <div className="lg:col-span-11">
              <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  Category: {category.name}
                </h1>
                <p className="text-slate-400">
                  Showing {posts.length} post{posts.length !== 1 ? 's' : ''} in this category
                </p>
              </div>
              
              <Separator className="mb-8 bg-slate-800/50" />
              
              {posts.length > 0 ? (
                <PostGrid posts={posts} />
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-400">No posts found in this category.</p>
                </div>
              )}
            </div>
            
            {/* Sidebar */}
            <div className="lg:col-span-5">
              <div className="sticky top-24">
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