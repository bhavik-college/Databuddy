"use server";

import prisma from "@/lib/db";
import { unstable_cache } from "next/cache";
import { Post, SidebarPost, SidebarCategory, SidebarTag } from "@/app/types/blog";

// Get all published blog posts
export const getAllPublishedPosts = unstable_cache(
  async (): Promise<Post[]> => {
    const posts = await prisma.post.findMany({
      where: { 
        published: true 
      },
      include: {
        author: {
          select: {
            name: true
          }
        },
        categories: true,
        tags: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Transform the data to match our expected Post type
    const transformedPosts = posts.map(post => ({
      ...post,
      author: {
        name: post.author.name || 'Anonymous',
        image: null
      }
    }));
    
    return transformedPosts as unknown as Post[];
  },
  ["published-posts"],
  { revalidate: 3600 } // Revalidate every hour
);

// Get a single blog post by slug
export const getPostBySlug = unstable_cache(
  async (slug: string): Promise<Post | null> => {
    const post = await prisma.post.findUnique({
      where: { 
        slug,
        published: true
      },
      include: {
        author: {
          select: {
            name: true
          }
        },
        categories: true,
        tags: true
      }
    });
    
    if (!post) return null;
    
    // Transform the data to match our expected Post type
    const transformedPost = {
      ...post,
      author: {
        name: post.author.name || 'Anonymous',
        image: null
      }
    };
    
    return transformedPost as unknown as Post;
  },
  ["post-by-slug"],
  { revalidate: 3600 } // Revalidate every hour
);

// Get related posts based on categories and tags
export const getRelatedPosts = unstable_cache(
  async (postId: string, categoryIds: string[], tagIds: string[], limit = 3): Promise<Post[]> => {
    const posts = await prisma.post.findMany({
      where: {
        id: { not: postId },
        published: true,
        OR: [
          { categories: { some: { id: { in: categoryIds } } } },
          { tags: { some: { id: { in: tagIds } } } }
        ]
      },
      include: {
        author: {
          select: {
            name: true
          }
        },
        categories: true,
        tags: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });
    
    // Transform the data to match our expected Post type
    const transformedPosts = posts.map(post => ({
      ...post,
      author: {
        name: post.author.name || 'Anonymous',
        image: null
      }
    }));
    
    return transformedPosts as unknown as Post[];
  },
  ["related-posts"],
  { revalidate: 3600 } // Revalidate every hour
);

// Get recent posts
export const getRecentPosts = unstable_cache(
  async (limit = 5): Promise<SidebarPost[]> => {
    const posts = await prisma.post.findMany({
      where: { 
        published: true 
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        createdAt: true,
        author: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });
    
    // Transform the data to match our expected SidebarPost type
    const transformedPosts = posts.map(post => ({
      ...post,
      author: {
        name: post.author.name || 'Anonymous',
        image: null
      }
    }));
    
    return transformedPosts as unknown as SidebarPost[];
  },
  ["recent-posts"],
  { revalidate: 3600 } // Revalidate every hour
);

// Get all categories with post count
export const getAllCategories = unstable_cache(
  async (): Promise<SidebarCategory[]> => {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            posts: {
              where: {
                published: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return categories.map(category => ({
      ...category,
      postCount: category._count.posts
    })) as unknown as SidebarCategory[];
  },
  ["all-categories"],
  { revalidate: 3600 } // Revalidate every hour
);

// Get all tags with post count
export const getAllTags = unstable_cache(
  async (): Promise<SidebarTag[]> => {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: {
            posts: {
              where: {
                published: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return tags.map(tag => ({
      ...tag,
      postCount: tag._count.posts
    })) as unknown as SidebarTag[];
  },
  ["all-tags"],
  { revalidate: 3600 } // Revalidate every hour
); 