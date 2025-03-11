import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5', 10);

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
      },
      take: limit
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching recent posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent posts' },
      { status: 500 }
    );
  }
} 