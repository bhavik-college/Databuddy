import type { ClickHouseClient, ResponseJSON } from '@clickhouse/client';
import type { IInterval } from '@databuddy/validation';
import { escape } from 'sqlstring';
import type {
  AnalyticsEvent,
  ErrorEvent,
  StripeCharge,
  StripePaymentIntent,
  StripeRefund,
  WebVitalsEvent,
} from './schema';

// Table type mapping
export interface TableMap {
  'analytics.events': AnalyticsEvent;
  'analytics.errors': ErrorEvent;
  'analytics.web_vitals': WebVitalsEvent;
  'analytics.stripe_payment_intents': StripePaymentIntent;
  'analytics.stripe_charges': StripeCharge;
  'analytics.stripe_refunds': StripeRefund;
}

export type TableName = keyof TableMap;

// Helper types for column operations
export type ColumnKeys<T extends TableName> = keyof TableMap[T];
export type ColumnValue<
  T extends TableName,
  K extends ColumnKeys<T>,
> = TableMap[T][K];

// Type definitions
type SqlValue = string | number | boolean | Date | null | Expression;
type QueryParam = SqlValue | SqlValue[];
type Operator =
  | '='
  | '>'
  | '<'
  | '>='
  | '<='
  | '!='
  | 'IN'
  | 'NOT IN'
  | 'LIKE'
  | 'NOT LIKE'
  | 'IS NULL'
  | 'IS NOT NULL'
  | 'BETWEEN';

type CTE = {
  name: string;
  query: Query | string;
};

type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL' | 'CROSS' | 'LEFT ANY';

type WhereCondition = {
  condition: string;
  operator: 'AND' | 'OR';
  isGroup?: boolean;
};

type HavingCondition = {
  condition: string;
  operator: 'AND' | 'OR';
};

type OrderByClause = {
  column: string;
  direction: 'ASC' | 'DESC';
};

type JoinClause = {
  type: JoinType;
  table: string | Expression | Query;
  condition: string;
  alias?: string;
};

type FillClause = {
  from: string | Date;
  to: string | Date;
  step: string;
};

type ConditionalCallback = (query: Query) => void;

/**
 * Represents a raw SQL expression that won't be escaped
 */
class Expression {
  constructor(private expression: string) {}

  toString(): string {
    return this.expression;
  }
}

/**
 * Main query builder class for ClickHouse queries
 */
export class Query<T = any> {
  private _select: string[] = [];
  private _except: string[] = [];
  private _from?: string | Expression;
  private _where: WhereCondition[] = [];
  private _groupBy: string[] = [];
  private _rollup = false;
  private _having: HavingCondition[] = [];
  private _orderBy: OrderByClause[] = [];
  private _limit?: number;
  private _offset?: number;
  private _final = false;
  private _settings: Record<string, string> = {};
  private _ctes: CTE[] = [];
  private _joins: JoinClause[] = [];
  private _skipNext = false;
  private _fill?: FillClause;
  private _transform?: Record<string, (item: T) => any>;
  private _union?: Query;
  private readonly _dateRegex = /\d{4}-\d{2}-\d{2}([\s:\d.]+)?/g;

  constructor(
    private readonly client: ClickHouseClient,
    private readonly timezone: string
  ) {}

  // SELECT methods
  /**
   * Add SELECT columns to the query
   */
  select<U>(
    columns: (string | null | undefined | false)[],
    type: 'merge' | 'replace' = 'replace'
  ): Query<U> {
    if (this._skipNext) return this as unknown as Query<U>;

    const validColumns = columns.filter((col): col is string => Boolean(col));

    if (type === 'merge') {
      this._select = [...this._select, ...validColumns];
    } else {
      this._select = validColumns;
    }

    return this as unknown as Query<U>;
  }

  /**
   * Add EXCEPT columns to exclude from SELECT
   */
  except(columns: string[]): this {
    this._except = [...this._except, ...columns];
    return this;
  }

  /**
   * Add WITH ROLLUP to GROUP BY
   */
  rollup(): this {
    this._rollup = true;
    return this;
  }

  // FROM methods
  /**
   * Set the FROM table/expression
   */
  from(table: string | Expression, final = false): this {
    this._from = table;
    this._final = final;
    return this;
  }

  /**
   * Add UNION ALL with another query
   */
  union(query: Query): this {
    this._union = query;
    return this;
  }

  // WHERE methods
  /**
   * Escape SQL values with proper type handling
   */
  private escapeValue(value: QueryParam): string {
    if (value === null) return 'NULL';
    if (value instanceof Expression) return `(${value.toString()})`;
    if (Array.isArray(value)) {
      return `(${value.map((v) => this.escapeValue(v)).join(', ')})`;
    }

    if (
      (typeof value === 'string' && this._dateRegex.test(value)) ||
      value instanceof Date
    ) {
      return this.escapeDate(value);
    }

    return escape(value);
  }

  /**
   * Add WHERE condition
   */
  where(column: string, operator: Operator, value?: QueryParam): this {
    if (this._skipNext) return this;
    const condition = this.buildCondition(column, operator, value);
    this._where.push({ condition, operator: 'AND' });
    return this;
  }

  /**
   * Build a condition string from column, operator, and value
   */
  public buildCondition(
    column: string,
    operator: Operator,
    value?: QueryParam
  ): string {
    switch (operator) {
      case 'IS NULL':
        return `${column} IS NULL`;
      case 'IS NOT NULL':
        return `${column} IS NOT NULL`;
      case 'BETWEEN':
        if (Array.isArray(value) && value.length === 2) {
          return `${column} BETWEEN ${this.escapeValue(value[0]!)} AND ${this.escapeValue(value[1]!)}`;
        }
        throw new Error('BETWEEN operator requires an array of two values');
      case 'IN':
      case 'NOT IN':
        if (!(Array.isArray(value) || value instanceof Expression)) {
          throw new Error(`${operator} operator requires an array value`);
        }
        return `${column} ${operator} ${this.escapeValue(value)}`;
      default:
        return `${column} ${operator} ${this.escapeValue(value!)}`;
    }
  }

  /**
   * Add AND WHERE condition
   */
  andWhere(column: string, operator: Operator, value?: QueryParam): this {
    const condition = this.buildCondition(column, operator, value);
    this._where.push({ condition, operator: 'AND' });
    return this;
  }

  /**
   * Add raw WHERE condition
   */
  rawWhere(condition: string): this {
    if (condition) {
      this._where.push({ condition, operator: 'AND' });
    }
    return this;
  }

  /**
   * Add OR WHERE condition
   */
  orWhere(column: string, operator: Operator, value?: QueryParam): this {
    const condition = this.buildCondition(column, operator, value);
    this._where.push({ condition, operator: 'OR' });
    return this;
  }

  // GROUP BY methods
  /**
   * Add GROUP BY columns
   */
  groupBy(columns: (string | null | undefined | false)[]): this {
    this._groupBy = columns.filter((col): col is string => Boolean(col));
    return this;
  }

  // HAVING methods
  /**
   * Add HAVING condition
   */
  having(column: string, operator: Operator, value: QueryParam): this {
    const condition = this.buildCondition(column, operator, value);
    this._having.push({ condition, operator: 'AND' });
    return this;
  }

  /**
   * Add AND HAVING condition
   */
  andHaving(column: string, operator: Operator, value: QueryParam): this {
    const condition = this.buildCondition(column, operator, value);
    this._having.push({ condition, operator: 'AND' });
    return this;
  }

  /**
   * Add OR HAVING condition
   */
  orHaving(column: string, operator: Operator, value: QueryParam): this {
    const condition = this.buildCondition(column, operator, value);
    this._having.push({ condition, operator: 'OR' });
    return this;
  }

  // ORDER BY methods
  /**
   * Add ORDER BY clause
   */
  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    if (this._skipNext) return this;
    this._orderBy.push({ column, direction });
    return this;
  }

  // LIMIT and OFFSET
  /**
   * Set LIMIT
   */
  limit(limit?: number): this {
    if (limit !== undefined) {
      this._limit = limit;
    }
    return this;
  }

  /**
   * Set OFFSET
   */
  offset(offset?: number): this {
    if (offset !== undefined) {
      this._offset = offset;
    }
    return this;
  }

  // SETTINGS
  /**
   * Add ClickHouse settings
   */
  settings(settings: Record<string, string>): this {
    Object.assign(this._settings, settings);
    return this;
  }

  /**
   * Add WITH (CTE) clause
   */
  with(name: string, query: Query | string): this {
    this._ctes.push({ name, query });
    return this;
  }

  // FILL
  /**
   * Add WITH FILL clause for time series
   */
  fill(from: string | Date, to: string | Date, step: string): this {
    this._fill = {
      from: this.escapeDate(from),
      to: this.escapeDate(to),
      step,
    };
    return this;
  }

  /**
   * Escape date values for SQL
   */
  private escapeDate(value: string | Date): string {
    if (value instanceof Date) {
      return escape(clix.datetime(value));
    }

    return value.replace(this._dateRegex, (match) => {
      return escape(match);
    });
  }

  // JOIN methods
  /**
   * Add INNER JOIN
   */
  join(table: string | Expression, condition: string, alias?: string): this {
    return this.joinWithType('INNER', table, condition, alias);
  }

  /**
   * Add INNER JOIN (explicit)
   */
  innerJoin(
    table: string | Expression,
    condition: string,
    alias?: string
  ): this {
    return this.joinWithType('INNER', table, condition, alias);
  }

  /**
   * Add LEFT JOIN
   */
  leftJoin(
    table: string | Expression | Query,
    condition: string,
    alias?: string
  ): this {
    return this.joinWithType('LEFT', table, condition, alias);
  }

  /**
   * Add LEFT ANY JOIN (ClickHouse specific)
   */
  leftAnyJoin(
    table: string | Expression | Query,
    condition: string,
    alias?: string
  ): this {
    return this.joinWithType('LEFT ANY', table, condition, alias);
  }

  /**
   * Add RIGHT JOIN
   */
  rightJoin(
    table: string | Expression,
    condition: string,
    alias?: string
  ): this {
    return this.joinWithType('RIGHT', table, condition, alias);
  }

  /**
   * Add FULL JOIN
   */
  fullJoin(
    table: string | Expression,
    condition: string,
    alias?: string
  ): this {
    return this.joinWithType('FULL', table, condition, alias);
  }

  /**
   * Add CROSS JOIN
   */
  crossJoin(table: string | Expression, alias?: string): this {
    return this.joinWithType('CROSS', table, '', alias);
  }

  /**
   * Internal method to add joins with specific type
   */
  private joinWithType(
    type: JoinType,
    table: string | Expression | Query,
    condition: string,
    alias?: string
  ): this {
    if (this._skipNext) return this;
    this._joins.push({
      type,
      table,
      condition: this.escapeDate(condition),
      alias,
    });
    return this;
  }

  // WHERE grouping methods
  /**
   * Start a WHERE group with AND
   */
  whereGroup(): WhereGroupBuilder {
    return new WhereGroupBuilder(this, 'AND');
  }

  /**
   * Start a WHERE group with OR
   */
  orWhereGroup(): WhereGroupBuilder {
    return new WhereGroupBuilder(this, 'OR');
  }

  /**
   * Build WHERE conditions string
   */
  private buildWhereConditions(conditions: WhereCondition[]): string {
    return conditions
      .map((w, i) => {
        const condition = w.isGroup ? `(${w.condition})` : w.condition;
        return i === 0 ? condition : `${w.operator} ${condition}`;
      })
      .join(' ');
  }

  /**
   * Build the complete SQL query
   */
  private buildQuery(): string {
    const parts: string[] = [];

    // Add WITH clause if CTEs exist
    if (this._ctes.length > 0) {
      const cteStatements = this._ctes.map((cte) => {
        const queryStr =
          typeof cte.query === 'string' ? cte.query : cte.query.toSQL();
        return `${cte.name} AS (${queryStr})`;
      });
      parts.push(`WITH ${cteStatements.join(', ')}`);
    }

    // SELECT
    if (this._select.length > 0) {
      parts.push(
        'SELECT',
        this._select.map((col) => this.escapeDate(col)).join(', ')
      );
    } else {
      parts.push('SELECT *');
    }

    if (this._except.length > 0) {
      parts.push('EXCEPT', `(${this._except.map(this.escapeDate).join(', ')})`);
    }

    // FROM
    if (this._from) {
      if (this._from instanceof Expression) {
        parts.push(`FROM (${this._from.toString()})`);
      } else {
        parts.push(`FROM ${this._from}${this._final ? ' FINAL' : ''}`);
      }

      // Add joins
      for (const join of this._joins) {
        const aliasClause = join.alias ? ` ${join.alias} ` : ' ';
        const conditionStr = join.condition ? `ON ${join.condition}` : '';
        const tableStr =
          join.table instanceof Query
            ? `(${join.table.toSQL()})`
            : join.table instanceof Expression
              ? `(${join.table.toString()})`
              : join.table;

        parts.push(
          `${join.type} JOIN ${tableStr}${aliasClause}${conditionStr}`
        );
      }
    }

    // WHERE
    if (this._where.length > 0) {
      parts.push('WHERE', this.buildWhereConditions(this._where));
    }

    // GROUP BY
    if (this._groupBy.length > 0) {
      parts.push('GROUP BY', this._groupBy.join(', '));
    }

    if (this._rollup) {
      parts.push('WITH ROLLUP');
    }

    // HAVING
    if (this._having.length > 0) {
      const conditions = this._having.map((h, i) => {
        return i === 0 ? h.condition : `${h.operator} ${h.condition}`;
      });
      parts.push('HAVING', conditions.join(' '));
    }

    // ORDER BY
    if (this._orderBy.length > 0) {
      const orderBy = this._orderBy.map((o) => {
        return `${o.column} ${o.direction}`;
      });
      parts.push('ORDER BY', orderBy.join(', '));
    }

    // Add FILL clause after ORDER BY
    if (this._fill) {
      const fromDate =
        this._fill.from instanceof Date
          ? clix.datetime(this._fill.from)
          : this._fill.from;
      const toDate =
        this._fill.to instanceof Date
          ? clix.datetime(this._fill.to)
          : this._fill.to;

      parts.push('WITH FILL');
      parts.push(`FROM ${fromDate}`);
      parts.push(`TO ${toDate}`);
      parts.push(`STEP ${this._fill.step}`);
    }

    // LIMIT & OFFSET
    if (this._limit !== undefined) {
      parts.push(`LIMIT ${this._limit}`);
      if (this._offset !== undefined) {
        parts.push(`OFFSET ${this._offset}`);
      }
    }

    // SETTINGS
    if (Object.keys(this._settings).length > 0) {
      const settings = Object.entries(this._settings)
        .map(([key, value]) => `${key} = ${value}`)
        .join(', ');
      parts.push(`SETTINGS ${settings}`);
    }

    if (this._union) {
      parts.push('UNION ALL', this._union.buildQuery());
    }

    return parts.join(' ');
  }

  /**
   * Transform JSON response with type conversion and custom transformers
   */
  transformJson<E extends ResponseJSON<any>>(json: E): E {
    const keys = Object.keys(json.data[0] || {});
    const response = {
      ...json,
      data: json.data.map((item) => {
        return keys.reduce((acc, key) => {
          const meta = json.meta?.find((m) => m.name === key);
          const transformer = this._transform?.[key];

          if (transformer) {
            return {
              ...acc,
              [key]: transformer(item),
            };
          }

          return {
            ...acc,
            [key]:
              item[key] && meta?.type.includes('Int')
                ? Number.parseFloat(item[key] as string)
                : item[key],
          };
        }, {} as T);
      }),
    };
    return response;
  }

  /**
   * Add custom transformers for result columns
   */
  transform(transformations: Record<string, (item: T) => any>): this {
    this._transform = transformations;
    return this;
  }

  // Execution methods
  /**
   * Execute the query and return results
   */
  async execute(): Promise<T[]> {
    const query = this.buildQuery();
    console.log('query', query);

    const result = await this.client.query({
      query,
      clickhouse_settings: {
        session_timezone: this.timezone,
      },
    });
    const json = await result.json<T>();
    return this.transformJson(json).data;
  }

  /**
   * Get the SQL string without executing
   */
  toSQL(): string {
    return this.buildQuery();
  }

  /**
   * Internal method to add WHERE conditions (for WhereGroupBuilder)
   */
  _addWhereCondition(condition: WhereCondition): this {
    this._where.push(condition);
    return this;
  }

  // Conditional execution methods
  /**
   * Skip next operation if condition is false
   */
  if(condition: any): this {
    this._skipNext = !condition;
    return this;
  }

  /**
   * End conditional block
   */
  endIf(): this {
    this._skipNext = false;
    return this;
  }

  /**
   * Execute callback when condition is true
   */
  when(condition: boolean, callback?: ConditionalCallback): this {
    if (condition && callback) {
      callback(this);
    }
    return this;
  }

  /**
   * Create a clone of this query
   */
  clone(): Query<T> {
    return new Query(this.client, this.timezone).merge(this);
  }

  /**
   * Merge another query into this one
   */
  merge(query: Query): this {
    if (this._skipNext) return this;

    this._from = query._from;
    this._select = [...this._select, ...query._select];
    this._except = [...this._except, ...query._except];
    this._where = [...this._where, ...query._where];
    this._ctes = [...this._ctes, ...query._ctes];
    this._joins = [...this._joins, ...query._joins];
    this._settings = { ...this._settings, ...query._settings };

    // Take the most restrictive LIMIT
    if (query._limit !== undefined) {
      this._limit =
        this._limit === undefined
          ? query._limit
          : Math.min(this._limit, query._limit);
    }

    this._orderBy = [...this._orderBy, ...query._orderBy];
    this._groupBy = [...this._groupBy, ...query._groupBy];
    this._having = [...this._having, ...query._having];

    return this;
  }
}

/**
 * Builder for grouped WHERE conditions
 */
export class WhereGroupBuilder {
  private conditions: WhereCondition[] = [];

  constructor(
    private readonly query: Query,
    private readonly groupOperator: 'AND' | 'OR'
  ) {}

  /**
   * Add WHERE condition to group
   */
  where(column: string, operator: Operator, value?: QueryParam): this {
    const condition = this.query.buildCondition(column, operator, value);
    this.conditions.push({ condition, operator: 'AND' });
    return this;
  }

  /**
   * Add AND WHERE condition to group
   */
  andWhere(column: string, operator: Operator, value?: QueryParam): this {
    const condition = this.query.buildCondition(column, operator, value);
    this.conditions.push({ condition, operator: 'AND' });
    return this;
  }

  /**
   * Add raw WHERE condition to group
   */
  rawWhere(condition: string): this {
    this.conditions.push({ condition, operator: 'AND' });
    return this;
  }

  /**
   * Add OR WHERE condition to group
   */
  orWhere(column: string, operator: Operator, value?: QueryParam): this {
    const condition = this.query.buildCondition(column, operator, value);
    this.conditions.push({ condition, operator: 'OR' });
    return this;
  }

  /**
   * End the group and return to the main query
   */
  end(): Query {
    const groupCondition = this.conditions
      .map((c, i) => (i === 0 ? c.condition : `${c.operator} ${c.condition}`))
      .join(' ');

    this.query._addWhereCondition({
      condition: groupCondition,
      operator: this.groupOperator,
      isGroup: true,
    });

    return this.query;
  }
}

/**
 * Create a new query instance
 */
export function clix(client: ClickHouseClient, timezone?: string): Query {
  return new Query(client, timezone ?? 'UTC');
}

/**
 * Create a type-safe query for a specific table
 */
export function clixTable<T extends TableName>(
  client: ClickHouseClient,
  tableName: T,
  timezone?: string
): Query<TableMap[T]> {
  return new Query<TableMap[T]>(client, timezone ?? 'UTC').from(tableName);
}

/**
 * Type-safe table query builders
 */
export const tables = {
  events: (client: ClickHouseClient, timezone?: string) =>
    clixTable(client, 'analytics.events', timezone),

  errors: (client: ClickHouseClient, timezone?: string) =>
    clixTable(client, 'analytics.errors', timezone),

  webVitals: (client: ClickHouseClient, timezone?: string) =>
    clixTable(client, 'analytics.web_vitals', timezone),

  stripePaymentIntents: (client: ClickHouseClient, timezone?: string) =>
    clixTable(client, 'analytics.stripe_payment_intents', timezone),

  stripeCharges: (client: ClickHouseClient, timezone?: string) =>
    clixTable(client, 'analytics.stripe_charges', timezone),

  stripeRefunds: (client: ClickHouseClient, timezone?: string) =>
    clixTable(client, 'analytics.stripe_refunds', timezone),
} as const;

/**
 * Create type-safe column references for a table
 */
export function columns<T extends TableName>(tableName: T) {
  return new Proxy({} as Record<ColumnKeys<T>, string>, {
    get(target, prop) {
      return String(prop);
    },
  });
}

/**
 * Example usage:
 *
 * const eventCols = columns('analytics.events');
 * const query = tables.events(client)
 *   .select([eventCols.id, eventCols.client_id, eventCols.event_name])
 *   .where(eventCols.client_id, '=', 'some-client-id')
 *   .where(eventCols.time, '>=', new Date('2024-01-01'));
 */

// Static helper methods
clix.exp = (expr: string | Query<any>) =>
  new Expression(expr instanceof Query ? expr.toSQL() : expr);

clix.date = (date: string | Date, wrapper?: string) => {
  const dateStr = new Date(date).toISOString().slice(0, 10);
  return wrapper ? `${wrapper}(${dateStr})` : dateStr;
};

clix.datetime = (date: string | Date, wrapper?: string) => {
  const datetime = new Date(date).toISOString().slice(0, 19).replace('T', ' ');
  return wrapper ? `${wrapper}(${datetime})` : datetime;
};

clix.dynamicDatetime = (date: string | Date, interval: IInterval) => {
  if (interval === 'month' || interval === 'week') {
    return clix.date(date);
  }
  return clix.datetime(date);
};

clix.toStartOf = (node: string, interval: IInterval, timezone?: string) => {
  switch (interval) {
    case 'minute': {
      return `toStartOfMinute(${node})`;
    }
    case 'hour': {
      return `toStartOfHour(${node})`;
    }
    case 'day': {
      return `toStartOfDay(${node})`;
    }
    case 'week': {
      return `toStartOfWeek(${node}${timezone ? `, 1, '${timezone}'` : ''})`;
    }
    case 'month': {
      return `toStartOfMonth(${node}${timezone ? `, '${timezone}'` : ''})`;
    }
  }
};

clix.toStartOfInterval = (
  node: string,
  interval: IInterval,
  origin: string | Date
) => {
  switch (interval) {
    case 'minute': {
      return `toStartOfInterval(toDateTime(${node}), INTERVAL 1 minute, toDateTime(${clix.datetime(origin)}))`;
    }
    case 'hour': {
      return `toStartOfInterval(toDateTime(${node}), INTERVAL 1 hour, toDateTime(${clix.datetime(origin)}))`;
    }
    case 'day': {
      return `toStartOfInterval(toDateTime(${node}), INTERVAL 1 day, toDateTime(${clix.datetime(origin)}))`;
    }
    case 'week': {
      return `toStartOfInterval(toDateTime(${node}), INTERVAL 1 week, toDateTime(${clix.datetime(origin)}))`;
    }
    case 'month': {
      return `toStartOfInterval(toDateTime(${node}), INTERVAL 1 month, toDateTime(${clix.datetime(origin)}))`;
    }
  }
};

clix.toInterval = (node: string, interval: IInterval) => {
  switch (interval) {
    case 'minute': {
      return `toIntervalMinute(${node})`;
    }
    case 'hour': {
      return `toIntervalHour(${node})`;
    }
    case 'day': {
      return `toIntervalDay(${node})`;
    }
    case 'week': {
      return `toIntervalWeek(${node})`;
    }
    case 'month': {
      return `toIntervalMonth(${node})`;
    }
  }
};

clix.toDate = (node: string, interval: IInterval) => {
  switch (interval) {
    case 'week':
    case 'month': {
      return `toDate(${node})`;
    }
    default: {
      return `toDateTime(${node})`;
    }
  }
};

export type { SqlValue, QueryParam, Operator };

// Inspired by openpanel.dev
