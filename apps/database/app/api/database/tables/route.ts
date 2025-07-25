import { chQuery } from '@databuddy/db';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { includeSystem } = await request.json();

    let query = `
      SELECT 
        name,
        database,
        engine,
        total_rows,
        total_bytes
      FROM system.tables 
      WHERE database != 'system'
    `;

    if (!includeSystem) {
      query += ` AND database != 'information_schema' AND database != 'INFORMATION_SCHEMA'`;
    }

    query += ' ORDER BY database, name';

    const tables = await chQuery(query);

    return NextResponse.json({
      success: true,
      data: tables,
    });
  } catch (error) {
    console.error('Error fetching tables:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch tables',
      },
      { status: 500 }
    );
  }
}
