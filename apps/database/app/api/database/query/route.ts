import { chQueryWithMeta } from '@databuddy/db';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Query is required and must be a string',
        },
        { status: 400 }
      );
    }

    // Basic security check - prevent dangerous operations in production
    const dangerousKeywords = [
      'DROP DATABASE',
      'TRUNCATE',
      'DELETE FROM system',
    ];
    const upperQuery = query.toUpperCase();

    for (const keyword of dangerousKeywords) {
      if (upperQuery.includes(keyword)) {
        return NextResponse.json(
          {
            success: false,
            error: `Query contains dangerous keyword: ${keyword}`,
          },
          { status: 403 }
        );
      }
    }

    const result = await chQueryWithMeta(query);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error executing query:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to execute query',
      },
      { status: 500 }
    );
  }
}
