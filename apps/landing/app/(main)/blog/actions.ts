"use server";

import prisma from "@/lib/db";
import { unstable_cache } from "next/cache";

// Get all published blog posts
export const getAllPublishedPosts = unstable_cache(
  async () => {
    return await prisma.post.findMany({
      where: { 
        published: true 
      },
      include: {
        author: {
          select: {
            name: true,
            image: true
          }
        },
        categories: true,
        tags: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  },
  ["published-posts"],
  { revalidate: 3600 } // Revalidate every hour
);

// Get a single blog post by slug
export const getPostBySlug = unstable_cache(
  async (slug: string) => {
    return await prisma.post.findUnique({
      where: { 
        slug,
        published: true
      },
      include: {
        author: {
          select: {
            name: true,
            image: true
          }
        },
        categories: true,
        tags: true
      }
    });
  },
  ["post-by-slug"],
  { revalidate: 3600 } // Revalidate every hour
);

// Get related posts based on categories and tags
export const getRelatedPosts = unstable_cache(
  async (postId: string, categoryIds: string[], tagIds: string[], limit = 3) => {
    return await prisma.post.findMany({
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
            name: true,
            image: true
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
  },
  ["related-posts"],
  { revalidate: 3600 } // Revalidate every hour
);

// Get recent posts
export const getRecentPosts = unstable_cache(
  async (limit = 5) => {
    return await prisma.post.findMany({
      where: { 
        published: true 
      },
      include: {
        author: {
          select: {
            name: true,
            image: true
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
  },
  ["recent-posts"],
  { revalidate: 3600 } // Revalidate every hour
);

// Get all categories with post count
export const getAllCategories = unstable_cache(
  async () => {
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
    }));
  },
  ["all-categories"],
  { revalidate: 3600 } // Revalidate every hour
);

// Get all tags with post count
export const getAllTags = unstable_cache(
  async () => {
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
    }));
  },
  ["all-tags"],
  { revalidate: 3600 } // Revalidate every hour
); 