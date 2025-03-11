import { NextResponse } from 'next/server';
import prisma from "@/lib/db";

// Set cache control headers for the response
const cacheConfig = {
  revalidate: 3600, // Cache for 1 hour
};

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
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

    // Return response with cache headers
    return NextResponse.json(posts, {
      headers: {
        'Cache-Control': `public, s-maxage=${cacheConfig.revalidate}, stale-while-revalidate`,
      },
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
} 