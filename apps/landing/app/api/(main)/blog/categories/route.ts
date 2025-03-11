import { NextResponse } from 'next/server';
import prisma from "@/lib/db";

// Set cache control headers for the response
const cacheConfig = {
  revalidate: 3600, // Cache for 1 hour
};

// Fallback data in case of database errors
const fallbackCategories = [
  {
    id: 'fallback-1',
    name: 'General',
    slug: 'general',
    description: 'General articles',
    createdAt: new Date(),
    updatedAt: new Date(),
    postCount: 0
  }
];

export async function GET() {
  try {
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

    // Return response with cache headers
    return NextResponse.json(
      categories.map(category => ({
        ...category,
        postCount: category._count.posts
      })),
      {
        headers: {
          'Cache-Control': `public, s-maxage=${cacheConfig.revalidate}, stale-while-revalidate`,
        },
      }
    );
  } catch (error) {
    console.error('Error fetching categories:', error);
    
    // Return fallback data instead of error
    return NextResponse.json(
      fallbackCategories,
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
} 