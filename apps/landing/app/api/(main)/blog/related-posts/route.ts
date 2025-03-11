import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const categoryIds = searchParams.getAll('categoryId');
    const tagIds = searchParams.getAll('tagId');
    const limit = parseInt(searchParams.get('limit') || '3', 10);

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

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
    console.error('Error fetching related posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch related posts' },
      { status: 500 }
    );
  }
} 