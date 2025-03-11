import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/db";

// Set cache control headers for the response
const cacheConfig = {
  revalidate: 3600, // Cache for 1 hour
};

export async function GET(request: NextRequest) {
  try {
    // Extract slug from URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const slug = pathParts[pathParts.length - 1];
    
    const post = await prisma.post.findUnique({
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

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Return response with cache headers
    return NextResponse.json(post, {
      headers: {
        'Cache-Control': `public, s-maxage=${cacheConfig.revalidate}, stale-while-revalidate`,
      },
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
} 