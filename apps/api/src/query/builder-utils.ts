import type { FilterRequest, QueryWithParams } from './types'

export type QueryOptions = {
    select: string
    where?: string
    groupBy?: string
    orderBy?: string
}

const operatorMap = {
    eq: '=',
    ne: '!=',
    gt: '>',
    gte: '>=',
    lt: '<',
    lte: '<=',
    in: 'IN',
    not_in: 'NOT IN',
    contains: 'ILIKE',
    starts_with: 'ILIKE',
}

function getFilterSql(filter: FilterRequest) {
    const { field, operator, value } = filter;
    const placeholder = `{${field}:String}`;
    const op = operator as keyof typeof operatorMap;

    if (op === 'in' || op === 'not_in') {
        // For IN operators, the placeholder will be an array
        const arrayPlaceholder = `{${field}:Array(String)}`;
        return `${field} ${operatorMap[op]} ${arrayPlaceholder}`;
    }

    if (op === 'contains') {
        return `${field} ${operatorMap[op]} '%' || ${placeholder} || '%'`;
    }

    if (op === 'starts_with') {
        return `${field} ${operatorMap[op]} ${placeholder} || '%'`;
    }

    return `${field} ${operatorMap[op]} ${placeholder}`;
}


export const createQueryBuilder = (table: string, baseWhereClauses: string[] = []) => {
    return (
        websiteId: string,
        startDate: string,
        endDate: string,
        limit: number,
        offset: number,
        options: QueryOptions,
        filters: FilterRequest[] = [],
    ): QueryWithParams => {
        const { select, where, groupBy, orderBy } = options

        const baseWhereParts = [
            'client_id = {websiteId:String}',
            'timestamp >= parseDateTimeBestEffort({startDate:String})',
            'timestamp <= parseDateTimeBestEffort({endDate:String})',
            ...baseWhereClauses,
        ]
        const baseWhere = baseWhereParts.filter(Boolean).join(' AND ')

        const filterWhere = filters.length > 0
            ? filters.map(getFilterSql).join(' AND ')
            : ''

        const whereClause = [baseWhere, where, filterWhere].filter(Boolean).join(' AND ')


        const query = `
      SELECT ${select}
      FROM ${table}
      WHERE ${whereClause}
      ${groupBy ? `GROUP BY ${groupBy}` : ''}
      ${orderBy ? `ORDER BY ${orderBy}` : ''}
      LIMIT {limit:UInt64} OFFSET {offset:UInt64}
    `

        const params: Record<string, unknown> = {
            websiteId,
            startDate,
            endDate,
            limit,
            offset,
        }

        for (const filter of filters) {
            params[filter.field] = filter.value
        }

        return { query, params }
    }
} 