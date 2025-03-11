import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation'
import Background from '@/app/components/background'
import Navbar from '@/app/components/navbar'
import Footer from '@/app/components/footer'
import { getPostBySlug, getRelatedPosts, getRecentPosts, getAllCategories, getAllTags } from '../actions'
import { PostContent } from '@/app/components/blog/post-content'
import { RelatedPosts } from '@/app/components/blog/related-posts'
import { BlogSidebar } from '@/app/components/blog/sidebar'
import { calculateReadingTime, generateMetaDescription, generateSeoTitle } from '@/app/lib/blog-utils'
import { Separator } from '@/components/ui/separator'
import Script from 'next/script'

interface Props {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Generate metadata for the page
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Fetch post data
  const { slug } = await params
  const post = await getPostBySlug(slug)
  
  if (!post) {
    return {
      title: 'Post Not Found | Databuddy Analytics',
      description: 'The requested blog post could not be found.'
    }
  }
  
  // Generate meta description from content if no excerpt is available
  const description = post.excerpt || generateMetaDescription(post.content, 155)
  
  // Generate SEO-optimized title
  const title = generateSeoTitle(post.title)
  
  // Ensure we have a valid date string for ISO format
  const publishedTime = post.createdAt instanceof Date 
    ? post.createdAt.toISOString() 
    : new Date(post.createdAt).toISOString()
  
  // Construct the canonical URL for the post
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://databuddy.co'
  const canonicalUrl = `${baseUrl}/blog/${post.slug}`
  
  // Optionally access and extend parent metadata
  const previousImages = (await parent).openGraph?.images || []
  
  // Extract keywords from tags and categories
  const keywords = [
    ...post.tags.map(tag => tag.name),
    ...post.categories.map(category => category.name),
    'analytics', 'web analytics', 'privacy'
  ]
  
  return {
    title,
    description,
    keywords: keywords.join(', '),
    authors: post.author.name ? [{ name: post.author.name }] : undefined,
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      publishedTime,
      authors: post.author.name ? [post.author.name] : undefined,
      images: post.coverImage ? [post.coverImage, ...previousImages] : previousImages,
      url: canonicalUrl,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
    alternates: {
      canonical: canonicalUrl,
    }
  }
}

export default async function BlogPostPage({ params }: Props) {
  // Fetch post data
  const { slug } = await params
  const post = await getPostBySlug(slug)
  
  // If post not found, return 404
  if (!post) {
    notFound()
  }
  
  // Calculate reading time
  const readingTime = calculateReadingTime(post.content)
  
  // Get category and tag IDs for related posts
  const categoryIds = post.categories.map(category => category.id)
  const tagIds = post.tags.map(tag => tag.id)
  
  // Fetch related posts, recent posts, categories, and tags in parallel
  const [relatedPosts, recentPosts, categories, tags] = await Promise.all([
    getRelatedPosts(post.id, categoryIds, tagIds, 3),
    getRecentPosts(5),
    getAllCategories(),
    getAllTags()
  ])
  
  // Construct the canonical URL for the post
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://databuddy.co'
  const canonicalUrl = `${baseUrl}/blog/${post.slug}`
  
  // Prepare structured data for the article
  const publishDate = post.createdAt instanceof Date 
    ? post.createdAt.toISOString() 
    : new Date(post.createdAt).toISOString()
    
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || generateMetaDescription(post.content, 155),
    image: post.coverImage || `${baseUrl}/images/og_image.png`,
    datePublished: publishDate,
    dateModified: post.updatedAt ? new Date(post.updatedAt).toISOString() : publishDate,
    author: {
      '@type': 'Person',
      name: post.author.name || 'Databuddy Team'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Databuddy Analytics',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/images/logo.png`
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl
    }
  }
  
  return (
    <div className="fixed inset-0 overflow-hidden">
      <Background />
      <div className="relative z-10 h-full overflow-auto scrollbar-hide font-nunito">
        <Navbar />
        
        {/* Add structured data */}
        <Script id="structured-data" type="application/ld+json">
          {JSON.stringify(structuredData)}
        </Script>
        
        <main className="container mx-auto px-4 py-12 md:py-16 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-16 gap-8 lg:gap-16">
            {/* Main Content */}
            <div className="lg:col-span-11">
              <PostContent
                title={post.title}
                content={post.content}
                coverImage={post.coverImage}
                author={post.author}
                date={post.createdAt}
                categories={post.categories}
                tags={post.tags}
                estimatedReadingTime={readingTime}
                url={canonicalUrl}
              />
              
              <Separator className="my-16 bg-slate-800/50" />
              
              <RelatedPosts posts={relatedPosts} />
            </div>
            
            {/* Sidebar */}
            <div className="lg:col-span-5">
              <div className="sticky top-24">
                <BlogSidebar
                  recentPosts={recentPosts}
                  categories={categories}
                  tags={tags}
                />
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  )
} 