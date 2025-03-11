import { NextResponse } from 'next/server';
import prisma from "@/lib/db";

// Set cache control headers for the response
const cacheConfig = {
  revalidate: 3600, // Cache for 1 hour
};

// Fallback data in case of database errors
const fallbackTags = [
  {
    id: 'fallback-1',
    name: 'General',
    slug: 'general',
    createdAt: new Date(),
    updatedAt: new Date(),
    postCount: 0
  }
];

export async function GET() {
  try {
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

    // Return response with cache headers
    return NextResponse.json(
      tags.map(tag => ({
        ...tag,
        postCount: tag._count.posts
      })),
      {
        headers: {
          'Cache-Control': `public, s-maxage=${cacheConfig.revalidate}, stale-while-revalidate`,
        },
      }
    );
  } catch (error) {
    console.error('Error fetching tags:', error);
    
    // Return fallback data instead of error
    return NextResponse.json(
      fallbackTags,
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
} 