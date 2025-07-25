import { chQueryWithMeta } from '@databuddy/db';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const {
      tableName,
      query: customQuery,
      limit = 10_000,
    } = await request.json();

    if (!(tableName || customQuery)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Table name or a custom query is required',
        },
        { status: 400 }
      );
    }

    const query = customQuery || `SELECT * FROM ${tableName} LIMIT ${limit}`;
    const result = await chQueryWithMeta(query);

    // Convert to CSV
    const headers = result.meta?.map((col) => col.name).join(',') || '';
    const rows = result.data
      .map((row) =>
        result.meta
          ?.map((col) => {
            const value = row[col.name];
            // Escape commas and quotes in CSV
            if (value === null || value === undefined) {
              return '';
            }
            const stringValue = String(value);
            if (
              stringValue.includes(',') ||
              stringValue.includes('"') ||
              stringValue.includes('\n')
            ) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          })
          .join(',')
      )
      .join('\n');

    const csv = `${headers}\n${rows}`;

    const filename = (tableName || 'custom_query').replace('.', '_');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}_export_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export data',
      },
      { status: 500 }
    );
  }
}
