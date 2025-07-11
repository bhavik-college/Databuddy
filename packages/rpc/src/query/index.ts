import { db } from '@databuddy/db/client'
import type { QueryBuilder, QueryDateRange, QueryFilters, QueryWithParams } from './types'
import { errorBuilders } from './builders/errors'
import { pageBuilders } from './builders/pages'

// Combine all builders - easy to extend by adding new builder groups
const allBuilders = {
  ...errorBuilders,
  ...pageBuilders,
}

export async function executeQuery(
  name: string,
  websiteId: string,
  dateRange: QueryDateRange,
  filters?: QueryFilters,
  limit?: number,
  offset?: number
) {
  const builder: QueryBuilder | undefined = allBuilders[name]

  if (!builder) {
    throw new Error(`Query builder not found for: ${name}`)
  }

  const { query, params }: QueryWithParams = builder(websiteId, dateRange, filters, limit, offset)

  try {
    // Execute the query with parameters
    const results = await db.execute(query, params)
    return results
  } catch (error) {
    console.error(`Error executing query: ${name}`, error)
    throw new Error('Query execution failed')
  }
} 