# RPC Query System

A lightweight, maintainable, and easy-to-understand query system for analytics data using parameterized ClickHouse SQL queries.

## Core Principles

- **Parameterized Queries**: All values are passed as parameters, never hardcoded
- **Lightweight**: Minimal dependencies, focused on core functionality
- **Maintainable**: Clear structure, reusable components, easy to extend
- **Type Safe**: Full TypeScript support with proper type definitions

## Architecture

### Core Components

1. **Types** (`types.ts`): Defines the query system interfaces
2. **Utils** (`utils.ts`): Common utility functions for building queries
3. **Builder Utils** (`builder-utils.ts`): Factory functions for creating query builders
4. **Builders** (`builders/`): Domain-specific query builders

### Query Flow

```
Client Request → Query Builder → Parameterized SQL → Database Execution → Results
```

## Usage

### Basic Query Execution

```typescript
import { executeQuery } from './index'

const results = await executeQuery(
  'error_types',           // Query name
  'website-123',           // Website ID
  { from: '2024-01-01', to: '2024-01-31' }, // Date range
  { browser: 'chrome' },   // Optional filters
  100,                     // Limit
  0                        // Offset
)
```

### Creating New Query Builders

1. **Create a new builder file** in `builders/`:

```typescript
// builders/custom.ts
import type { QueryBuilderGroup } from '../types'
import { buildCommonSelect, buildCommonWhereClauses, buildCommonGroupBy, buildCommonOrderBy } from '../utils'

function createCustomBuilder(
  websiteId: string,
  dateRange: { from: string; to: string },
  filters?: Record<string, unknown>,
  limit = 100,
  offset = 0
) {
  const select = buildCommonSelect({
    metric: 'COUNT(*) as count',
    unique_users: 'uniq(anonymous_id) as unique_users'
  })

  const { clause: whereClause, params: whereParams } = buildCommonWhereClauses(
    websiteId,
    dateRange.from,
    dateRange.to,
    { event_filter: 'event_name = \'custom_event\'' }
  )

  const groupBy = buildCommonGroupBy({
    category: 'category'
  })

  const orderBy = buildCommonOrderBy({ count: 'count DESC' })

  const query = `
    SELECT ${select}
    FROM analytics.events
    WHERE ${whereClause}
    GROUP BY ${groupBy}
    ORDER BY ${orderBy}
    LIMIT {limit:UInt64} OFFSET {offset:UInt64}
  `

  return {
    query,
    params: {
      ...whereParams,
      limit,
      offset
    }
  }
}

export const customBuilders: QueryBuilderGroup = {
  custom_metrics: (websiteId, dateRange, filters, limit, offset) =>
    createCustomBuilder(websiteId, dateRange, filters, limit, offset)
}
```

2. **Register the builder** in `index.ts`:

```typescript
import { customBuilders } from './builders/custom'

const allBuilders = {
  ...errorBuilders,
  ...pageBuilders,
  ...customBuilders, // Add your new builders here
}
```

## Utility Functions

### `buildCommonSelect(fields)`
Builds a SELECT clause from field definitions:

```typescript
const select = buildCommonSelect({
  visitors: 'uniq(anonymous_id) as visitors',
  pageviews: 'COUNT(*) as pageviews'
})
// Result: "uniq(anonymous_id) as visitors, COUNT(*) as pageviews"
```

### `buildCommonWhereClauses(websiteId, startDate, endDate, extraFilters)`
Builds common WHERE clauses with parameters:

```typescript
const { clause, params } = buildCommonWhereClauses(
  'website-123',
  '2024-01-01',
  '2024-01-31',
  { event_filter: 'event_name = \'page_view\'' }
)
// Result: "client_id = {websiteId:String} AND time >= parseDateTimeBestEffort({startDate:String}) AND ..."
```

### `buildCommonGroupBy(fields)`
Builds a GROUP BY clause:

```typescript
const groupBy = buildCommonGroupBy({
  path: 'path',
  browser: 'browser_name'
})
// Result: "path, browser_name"
```

### `buildCommonOrderBy(fields)`
Builds an ORDER BY clause:

```typescript
const orderBy = buildCommonOrderBy({
  pageviews: 'pageviews DESC',
  visitors: 'visitors ASC'
})
// Result: "pageviews DESC, visitors ASC"
```

## Parameter Types

The system supports ClickHouse parameter types:

- `{param:String}` - String values
- `{param:UInt64}` - Unsigned 64-bit integers
- `{param:Array(String)}` - String arrays
- `{param:Float64}` - 64-bit floating point numbers

## Best Practices

### 1. Always Use Parameters
❌ **Don't hardcode values:**
```sql
WHERE client_id = 'website-123'
```

✅ **Use parameters:**
```sql
WHERE client_id = {websiteId:String}
```

### 2. Reuse Common Patterns
Use the utility functions to maintain consistency:

```typescript
// ✅ Good - uses common utilities
const select = buildCommonSelect({
  visitors: 'uniq(anonymous_id) as visitors',
  pageviews: 'COUNT(*) as pageviews'
})

// ❌ Avoid - manual string building
const select = 'uniq(anonymous_id) as visitors, COUNT(*) as pageviews'
```

### 3. Keep Builders Focused
Each builder should handle one specific type of query:

```typescript
// ✅ Good - focused on error types
function createErrorTypesBuilder(...) { ... }

// ❌ Avoid - trying to handle multiple query types
function createGenericBuilder(...) { ... }
```

### 4. Use Descriptive Names
Choose clear, descriptive names for your query builders:

```typescript
// ✅ Good
export const errorBuilders = {
  recent_errors: ...,
  error_types: ...,
  error_trends: ...
}

// ❌ Avoid
export const builders = {
  query1: ...,
  query2: ...,
  query3: ...
}
```

## Error Handling

The system provides clear error messages:

```typescript
// Query not found
throw new Error(`Query builder not found for: ${name}`)

// Execution failed
throw new Error('Query execution failed')
```

## Extending the System

### Adding New Metric Types

1. Add metric definitions to `utils.ts`:
```typescript
export const METRICS = {
  // ... existing metrics
  custom: `
    COUNT(*) as total_events,
    uniq(anonymous_id) as unique_users
  `
}
```

2. Create builders that use the new metrics:
```typescript
const select = buildCommonSelect({
  ...METRICS.custom,
  category: 'category'
})
```

### Adding New Filter Types

Extend the `getWhereClause` function in `utils.ts`:

```typescript
export function getWhereClause(filters?: QueryFilters) {
  // ... existing logic
  
  // Add new filter types
  if (operator === 'contains') {
    conditions.push(`${key} ILIKE '%' || {${paramKey}:String} || '%'`)
  }
}
```

## Testing

Test your query builders by creating unit tests:

```typescript
import { createErrorTypesBuilder } from './builders/errors'

describe('Error Types Builder', () => {
  it('should generate correct SQL with parameters', () => {
    const result = createErrorTypesBuilder(
      'website-123',
      { from: '2024-01-01', to: '2024-01-31' },
      { browser: 'chrome' },
      10,
      0
    )

    expect(result.query).toContain('SELECT')
    expect(result.query).toContain('{websiteId:String}')
    expect(result.params.websiteId).toBe('website-123')
  })
})
```

## Migration Guide

### From Old Drizzle System

1. **Replace SQL template literals** with parameterized queries
2. **Update builder signatures** to return `QueryWithParams`
3. **Use utility functions** instead of manual string building
4. **Register builders** in the main index file

### Example Migration

**Before (Drizzle):**
```typescript
const query = sql`
  SELECT ${sql.raw(select)}
  FROM ${sql.raw(table)}
  WHERE ${sql.join(whereClauses, sql` AND `)}
`
```

**After (Parameterized):**
```typescript
const query = `
  SELECT ${select}
  FROM ${table}
  WHERE ${whereClause}
`

return { query, params }
```

This system provides a solid foundation for building maintainable, secure, and efficient analytics queries while keeping the codebase lightweight and easy to understand.