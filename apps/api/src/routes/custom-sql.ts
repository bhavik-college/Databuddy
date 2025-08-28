import { chQueryWithMeta, TABLE_NAMES } from '@databuddy/db';
import { Elysia, t } from 'elysia';
import { getApiKeyFromHeader, hasWebsiteScope } from '../lib/api-key';

// SQL Query validation schema
const CustomSQLRequestSchema = t.Object({
	query: t.String({ minLength: 1, maxLength: 5000 }),
	clientId: t.String({ minLength: 1 }),
	parameters: t.Optional(
		t.Record(t.String(), t.Union([t.String(), t.Number(), t.Boolean()]))
	),
});

type CustomSQLRequestType = {
	query: string;
	clientId: string;
	parameters?: Record<string, string | number | boolean>;
};

const ALLOWED_OPERATIONS = [
	'SELECT',
	'WITH',
	'FROM',
	'WHERE',
	'GROUP BY',
	'ORDER BY',
	'HAVING',
	'LIMIT',
	'OFFSET',
	'JOIN',
	'LEFT JOIN',
	'RIGHT JOIN',
	'INNER JOIN',
	'UNION',
	'UNION ALL',
	'JSONExtract',
	'JSONExtractString',
	'JSONExtractInt',
	'JSONExtractFloat',
	'JSONExtractBool',
	'JSONExtractRaw',
	'CASE',
	'WHEN',
	'THEN',
	'ELSE',
	'END',
	'AS',
	'AND',
	'OR',
	'NOT',
	'IN',
	'EXISTS',
	'BETWEEN',
	'LIKE',
	'ILIKE',
	// Add common ClickHouse functions
	'COUNT',
	'SUM',
	'AVG',
	'MIN',
	'MAX',
	'UNIQ',
	'DISTINCT',
	'NOW',
	'TODAY',
	'INTERVAL',
	'TODATE',
	'TOSTARTOFMONTH',
	'TOSTARTOFWEEK',
	'TOSTARTOFDAY',
];

const FORBIDDEN_OPERATIONS = [
	'INSERT',
	'UPDATE',
	'DELETE',
	'DROP',
	'CREATE',
	'ALTER',
	'TRUNCATE',
	'REPLACE',
	'MERGE',
	'CALL',
	'EXEC',
	'EXECUTE',
	'DECLARE',
	'SET',
	'USE',
	'SHOW',
	'DESCRIBE',
	// Remove EXPLAIN and ANALYZE - they're useful for query optimization
	'OPTIMIZE',
	'REPAIR',
	'LOCK',
	'UNLOCK',
	'GRANT',
	'REVOKE',
	'COMMIT',
	'ROLLBACK',
	'SAVEPOINT',
	'RELEASE',
	'START TRANSACTION',
	'BEGIN',
	'INFORMATION_SCHEMA',
	'SYSTEM',
	'ADMIN',
	'SUPER',
	'FILE',
	'PROCESS',
	'RELOAD',
	'SHUTDOWN',
	'REFERENCES',
	'INDEX',
	'TRIGGER',
	'EVENT',
	'ROUTINE',
	// ClickHouse-specific dangerous functions
	'HOSTNAME',
	'FQDN',
	'VERSION',
	'UPTIME',
	'GETOSKERNEL',
	'GETCPUCOUNT',
	'GETMEMORYSIZE',
	'READFILE',
	'WRITEFILE',
	'FILESYSTEM',
	'DICTGET',
	'REMOTE',
	'CLUSTER',
	'SHARD',
	'REPLICA',
];

const FORBIDDEN_PATTERNS = [
	/\/\*.*?\*\//gi,
	/--.*$/gm,
	/;\s*$/gm,
	/\bOR\s+1\s*=\s*1\b/gi,
	/\bUNION\s+(?:ALL\s+)?SELECT\b/gi,
	/\b(?:CONCAT|CHAR|ASCII|SUBSTRING|MID|LENGTH)\s*\(/gi,
	/\bSLEEP\s*\(/gi,
	/\bBENCHMARK\s*\(/gi,
	/\bLOAD_FILE\s*\(/gi,
	/\bINTO\s+(?:OUTFILE|DUMPFILE)\b/gi,
	/\bEXTRACTVALUE\s*\(/gi,
	/\bUPDATEXML\s*\(/gi,
	// ClickHouse system table access patterns
	/\bFROM\s+system\./gi,
	/\bJOIN\s+system\./gi,
	/\binformation_schema\./gi,
	/\bdefault\./gi,
	// Dangerous ClickHouse functions
	/\burl\s*\(/gi,
	/\bfile\s*\(/gi,
	/\bs3\s*\(/gi,
	/\bhdfs\s*\(/gi,
	/\bmysql\s*\(/gi,
	/\bpostgresql\s*\(/gi,
	/\bremote\s*\(/gi,
	/\bcluster\s*\(/gi,
];

const ALLOWED_TABLES = [
	TABLE_NAMES.events,
	TABLE_NAMES.errors,
	TABLE_NAMES.custom_events,
	TABLE_NAMES.web_vitals,
];

const CLIENT_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

class SQLValidationError extends Error {
	readonly code: string;

	constructor(message: string, code = 'INVALID_SQL') {
		super(message);
		this.name = 'SQLValidationError';
		this.code = code;
	}
}

const TABLE_PATTERN = /(?:FROM|JOIN)\s+([a-zA-Z_][a-zA-Z0-9_.]*)/gi;
const WHERE_PATTERN = /\bWHERE\b/i;
const END_CLAUSE_PATTERN = /\b(GROUP\s+BY|ORDER\s+BY|LIMIT|HAVING)\b/i;
const CLAUSE_PATTERN = /\b(GROUP\s+BY|ORDER\s+BY|LIMIT|HAVING)\b/i;

const QuerySecurityValidator = {
	transformPropertiesSyntax(query: string): string {
		// Match properties.X patterns and convert to JSONExtract calls
		const propertiesPattern =
			/\bproperties\.([a-zA-Z_][a-zA-Z0-9_]*(?::(string|int|float|bool|raw))?)\b/gi;

		return query.replace(propertiesPattern, (_match, propertyWithType) => {
			const [propertyName, type] = propertyWithType.split(':');

			switch (type) {
				case 'int':
					return `JSONExtractInt(properties, '${propertyName}')`;
				case 'float':
					return `JSONExtractFloat(properties, '${propertyName}')`;
				case 'bool':
					return `JSONExtractBool(properties, '${propertyName}')`;
				case 'raw':
					return `JSONExtractRaw(properties, '${propertyName}')`;
				default:
					return `JSONExtractString(properties, '${propertyName}')`;
			}
		});
	},

	normalizeSQL(query: string): string {
		return query
			.replace(/\/\*[\s\S]*?\*\//g, '')
			.replace(/--.*$/gm, '')
			.replace(/\s+/g, ' ')
			.trim()
			.toUpperCase();
	},

	validateForbiddenOperations(normalizedQuery: string): void {
		for (const operation of FORBIDDEN_OPERATIONS) {
			// Use word boundaries to match whole words only, not substrings
			const regex = new RegExp(`\\b${operation}\\b`, 'i');
			if (regex.test(normalizedQuery)) {
				throw new SQLValidationError(
					`Forbidden operation detected: ${operation}`,
					'FORBIDDEN_OPERATION'
				);
			}
		}

		for (const pattern of FORBIDDEN_PATTERNS) {
			if (pattern.test(normalizedQuery)) {
				throw new SQLValidationError(
					'Query contains forbidden pattern or potential injection attempt',
					'FORBIDDEN_PATTERN'
				);
			}
		}
	},

	validateAllowedTables(normalizedQuery: string): void {
		const matches = normalizedQuery.matchAll(TABLE_PATTERN);

		for (const match of matches) {
			const tableName = match[1]?.toLowerCase();
			if (!tableName) {
				continue;
			}

			const isAllowed = ALLOWED_TABLES.some((allowedTable) => {
				const allowedLower = allowedTable.toLowerCase();
				return (
					tableName === allowedLower ||
					tableName === allowedLower.split('.').pop() ||
					allowedLower.endsWith(`.${tableName}`)
				);
			});

			if (!isAllowed) {
				throw new SQLValidationError(
					`Access to table '${tableName}' is not allowed`,
					'FORBIDDEN_TABLE'
				);
			}
		}
	},

	validateQueryStart(normalizedQuery: string): void {
		const startsWithSelect = normalizedQuery.startsWith('SELECT');
		const startsWithWith = normalizedQuery.startsWith('WITH');
		const hasValidStart = startsWithSelect || startsWithWith;
		if (!hasValidStart) {
			throw new SQLValidationError(
				'Query must start with SELECT or WITH',
				'INVALID_QUERY_START'
			);
		}
	},

	validateQueryComplexity(normalizedQuery: string): void {
		const selectMatches = normalizedQuery.match(/\bSELECT\b/g);
		const selectCount = selectMatches ? selectMatches.length : 0;
		if (selectCount > 5) {
			throw new SQLValidationError(
				'Query complexity too high (max 5 SELECT statements allowed)',
				'QUERY_TOO_COMPLEX'
			);
		}

		// Allow UNION for legitimate analytics queries
		const unionMatches = normalizedQuery.match(/\bUNION\b/g);
		const unionCount = unionMatches ? unionMatches.length : 0;
		if (unionCount > 2) {
			throw new SQLValidationError(
				'Too many UNION operations (max 2 allowed)',
				'UNION_LIMIT_EXCEEDED'
			);
		}
	},

	validateQuerySyntax(normalizedQuery: string): void {
		if (normalizedQuery.includes('/*') || normalizedQuery.includes('--')) {
			throw new SQLValidationError(
				'Comments are not allowed in queries',
				'COMMENTS_NOT_ALLOWED'
			);
		}

		if (normalizedQuery.includes(';')) {
			throw new SQLValidationError(
				'Multiple statements not allowed',
				'MULTIPLE_STATEMENTS_NOT_ALLOWED'
			);
		}

		if (normalizedQuery.includes('\\') || normalizedQuery.includes('%')) {
			throw new SQLValidationError(
				'Escape sequences and URL encoding not allowed',
				'ENCODING_NOT_ALLOWED'
			);
		}
	},

	validateParenthesesBalance(normalizedQuery: string): void {
		let parenCount = 0;
		for (const char of normalizedQuery) {
			if (char === '(') {
				parenCount++;
			}
			if (char === ')') {
				parenCount--;
			}
			if (parenCount < 0) {
				throw new SQLValidationError(
					'Unbalanced parentheses in query',
					'INVALID_SYNTAX'
				);
			}
		}
		if (parenCount !== 0) {
			throw new SQLValidationError(
				'Unbalanced parentheses in query',
				'INVALID_SYNTAX'
			);
		}
	},

	validateQueryStructure(normalizedQuery: string): void {
		this.validateQueryStart(normalizedQuery);
		this.validateQueryComplexity(normalizedQuery);
		this.validateQuerySyntax(normalizedQuery);
		this.validateParenthesesBalance(normalizedQuery);
	},

	validateClientId(clientId: string): void {
		if (!clientId || typeof clientId !== 'string') {
			throw new SQLValidationError('Invalid client ID', 'INVALID_CLIENT_ID');
		}

		if (!CLIENT_ID_PATTERN.test(clientId)) {
			throw new SQLValidationError(
				'Invalid client ID format',
				'INVALID_CLIENT_ID'
			);
		}
	},

	validateNoDirectClientIdReference(query: string): void {
		const normalizedQuery = query.trim().toUpperCase();
		if (
			normalizedQuery.includes('CLIENT_ID') &&
			!normalizedQuery.includes('{CLIENTID:STRING}')
		) {
			throw new SQLValidationError(
				'Query cannot reference client_id directly - use parameterized queries',
				'CLIENT_REFERENCE_FORBIDDEN'
			);
		}
	},

	injectClientIdFilter(query: string): string {
		const normalizedQuery = query.trim().toUpperCase();

		if (normalizedQuery.startsWith('SELECT')) {
			return this.injectClientIdIntoSelect(query);
		}

		if (normalizedQuery.startsWith('WITH')) {
			return this.handleWithQuery(query);
		}

		throw new SQLValidationError(
			'Unsupported query structure',
			'UNSUPPORTED_QUERY'
		);
	},

	injectClientIdIntoSelect(query: string): string {
		const whereMatch = query.match(WHERE_PATTERN);

		if (whereMatch) {
			return this.addToExistingWhere(query, whereMatch);
		}

		return this.addNewWhere(query);
	},

	addToExistingWhere(query: string, whereMatch: RegExpMatchArray): string {
		const whereIndex = (whereMatch.index ?? 0) + whereMatch[0].length;
		const afterWhere = query.substring(whereIndex);
		const endClauseMatch = afterWhere.match(END_CLAUSE_PATTERN);

		if (endClauseMatch) {
			const whereCondition = afterWhere.substring(0, endClauseMatch.index ?? 0);
			const remainingClauses = afterWhere.substring(endClauseMatch.index ?? 0);
			const beforeWhere = query.substring(0, whereIndex);

			return `${beforeWhere} client_id = {clientId:String} AND (${whereCondition.trim()}) ${remainingClauses}`;
		}

		const beforeWhere = query.substring(0, whereIndex);
		return `${beforeWhere} client_id = {clientId:String} AND (${afterWhere.trim()})`;
	},

	addNewWhere(query: string): string {
		const clauseMatch = query.match(CLAUSE_PATTERN);

		if (clauseMatch) {
			const clauseIndex = clauseMatch.index ?? 0;
			const beforeClause = query.substring(0, clauseIndex);
			const afterClause = query.substring(clauseIndex);
			return `${beforeClause} WHERE client_id = {clientId:String} ${afterClause}`;
		}

		return `${query} WHERE client_id = {clientId:String}`;
	},

	handleWithQuery(query: string): string {
		const normalizedQuery = query.trim().toUpperCase();
		if (!normalizedQuery.includes('CLIENT_ID = {CLIENTID:STRING}')) {
			throw new SQLValidationError(
				'WITH queries must include client filtering using WHERE client_id = {clientId:String}',
				'WITH_QUERY_REQUIRES_CLIENT_FILTER'
			);
		}
		return query;
	},

	validateClientAccess(query: string, clientId: string): string {
		this.validateClientId(clientId);
		this.validateNoDirectClientIdReference(query);
		return this.injectClientIdFilter(query);
	},

	validateAgainstAttackVectors(query: string): void {
		const attackVectors = [
			/'\s*OR\s*'.*?'\s*=\s*'/gi,
			/'\s*OR\s*1\s*=\s*1/gi,
			/'\s*OR\s*'1'\s*=\s*'1/gi,
			/'\s*AND\s*1\s*=\s*1/gi,
			/WAITFOR\s+DELAY/gi,
			/pg_sleep\s*\(/gi,
			/SLEEP\s*\(/gi,
			/\bIF\s*\(/gi,
			/\bCASE\s+WHEN/gi,
			/CAST\s*\(/gi,
			/CONVERT\s*\(/gi,
			/;\s*DROP/gi,
			/;\s*DELETE/gi,
			/;\s*UPDATE/gi,
			/;\s*INSERT/gi,
		];

		for (const vector of attackVectors) {
			if (vector.test(query)) {
				throw new SQLValidationError(
					'Query matches known attack pattern',
					'ATTACK_PATTERN_DETECTED'
				);
			}
		}
	},

	validateAndSecureQuery(query: string, clientId: string): string {
		if (!query || typeof query !== 'string') {
			throw new SQLValidationError(
				'Query must be a non-empty string',
				'INVALID_INPUT'
			);
		}

		if (query.length > 5000) {
			throw new SQLValidationError(
				'Query too long (max 5,000 characters)',
				'QUERY_TOO_LONG'
			);
		}

		QuerySecurityValidator.validateAgainstAttackVectors(query);

		// Transform properties.X syntax to JSONExtract calls before validation
		const transformedQuery =
			QuerySecurityValidator.transformPropertiesSyntax(query);

		const normalizedQuery =
			QuerySecurityValidator.normalizeSQL(transformedQuery);

		QuerySecurityValidator.validateForbiddenOperations(normalizedQuery);
		QuerySecurityValidator.validateQueryStructure(normalizedQuery);
		QuerySecurityValidator.validateAllowedTables(normalizedQuery);

		return QuerySecurityValidator.validateClientAccess(
			transformedQuery,
			clientId
		);
	},
};

interface ClickHouseQueryResult {
	data: Record<string, unknown>[];
	meta?: Array<{ name: string; type: string }>;
	execution_time?: number;
	rows_read?: number;
}

async function executeClickHouseQuery(
	query: string,
	parameters: Record<string, unknown> = {}
): Promise<ClickHouseQueryResult> {
	try {
		const result = await chQueryWithMeta(query, parameters);

		return {
			data: result.data,
			meta: result.meta,
			execution_time: result.statistics?.elapsed || undefined,
			rows_read: result.statistics?.rows_read || undefined,
		};
	} catch (error) {
		console.error('ClickHouse query execution failed:', error);
		throw new Error(
			`ClickHouse query failed: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}

export const customSQL = new Elysia({ prefix: '/v1/custom-sql' })
	.post(
		'/execute',
		async ({
			body,
			request,
			set,
		}: {
			body: CustomSQLRequestType;
			request: Request;
			set: { status: number };
		}) => {
			// Get API key directly from request headers
			const apiKey = await getApiKeyFromHeader(request.headers);
			try {
				if (!apiKey) {
					set.status = 401;
					return {
						success: false,
						error: 'API key required for custom SQL access',
						code: 'AUTH_REQUIRED',
					};
				}

				const hasCustomSQLScope = apiKey.scopes.includes('write:custom-sql');
				const hasGlobalScope =
					apiKey.scopes.includes('read:data') ||
					apiKey.scopes.includes('read:analytics');

				if (!(hasCustomSQLScope || hasGlobalScope)) {
					set.status = 403;
					return {
						success: false,
						error:
							'API key must have write:custom-sql or read:analytics scope for custom SQL access',
						code: 'INSUFFICIENT_SCOPE',
					};
				}

				if (!hasCustomSQLScope) {
					const hasAccess = await hasWebsiteScope(
						apiKey,
						body.clientId,
						'read:data'
					);
					if (!hasAccess) {
						set.status = 403;
						return {
							success: false,
							error: `API key does not have access to client ID: ${body.clientId}`,
							code: 'CLIENT_ACCESS_DENIED',
						};
					}
				}

				const secureQuery = QuerySecurityValidator.validateAndSecureQuery(
					body.query,
					body.clientId
				);

				const queryParameters = {
					clientId: body.clientId,
					...body.parameters,
				};

				const result = await executeClickHouseQuery(
					secureQuery,
					queryParameters
				);

				return {
					success: true,
					data: result.data,
					meta: {
						rowCount: result.data.length,
						columns: result.meta?.map((col) => col.name) || [],
						executionTime: result.execution_time || null,
						rowsRead: result.rows_read || null,
						clientId: body.clientId,
					},
				};
			} catch (error) {
				console.error('Custom SQL execution failed:', error);

				if (error instanceof SQLValidationError) {
					set.status = 400;
					return {
						success: false,
						error: error.message,
						code: error.code,
					};
				}

				set.status = 500;
				return {
					success: false,
					error:
						'Query execution failed. Please check your query syntax and try again.',
					code: 'EXECUTION_ERROR',
				};
			}
		},
		{
			body: CustomSQLRequestSchema,
		}
	)
	.get('/schema', () => {
		return {
			success: true,
			schema: {
				allowedTables: ALLOWED_TABLES,
				allowedOperations: ALLOWED_OPERATIONS,
				forbiddenOperations: FORBIDDEN_OPERATIONS,
				maxQueryLength: 5000,
				maxNestedSelects: 3,
				parameterization: {
					clientIdParameter: '{clientId:String}',
					required: 'All queries must use parameterized client filtering',
				},
				propertiesSyntax: {
					description:
						'Automatic JSONExtract transformation from properties.X syntax',
					syntax: 'properties.property_name[:type]',
					supportedTypes: ['string', 'int', 'float', 'bool', 'raw'],
					examples: [
						'properties.browser_name',
						'properties.user_id:int',
						'properties.is_active:bool',
						'properties.metadata:raw',
					],
					defaultType: 'string (JSONExtractString)',
				},
			},
		};
	})
	.get('/examples', () => {
		return {
			success: true,
			examples: [
				{
					name: 'Monthly Events Count',
					description: 'Get monthly event counts for your client',
					query: `
						SELECT
							toStartOfMonth(time) as month_start,
							count() as event_count
						FROM analytics.events
						WHERE
							time >= now() - INTERVAL 6 MONTH
						GROUP BY month_start
						ORDER BY month_start DESC
					`.trim(),
				},
				{
					name: 'Top Pages by Views',
					description: 'Get most popular pages',
					query: `
						SELECT
							path,
							count() as page_views,
							uniq(session_id) as unique_sessions
						FROM analytics.events
						WHERE
							time >= now() - INTERVAL 30 DAY
							AND event_name = 'page_view'
						GROUP BY path
						ORDER BY page_views DESC
						LIMIT 10
					`.trim(),
				},
				{
					name: 'Browser Analytics (with properties.X syntax)',
					description: 'Analyze browser usage using properties.X syntax',
					query: `
						SELECT
							properties.browser_name,
							count() as events,
							uniq(anonymous_id) as unique_users
						FROM analytics.events
						WHERE
							time >= now() - INTERVAL 7 DAY
							AND properties.browser_name IS NOT NULL
						GROUP BY properties.browser_name
						ORDER BY events DESC
					`.trim(),
				},
				{
					name: 'User Analytics with Typed Properties',
					description: 'Analyze user behavior with typed property extraction',
					query: `
						SELECT
							properties.user_id:int as user_id,
							properties.is_premium:bool as is_premium,
							properties.session_duration:float as session_duration,
							count() as total_events
						FROM analytics.events
						WHERE
							time >= now() - INTERVAL 30 DAY
							AND properties.user_id:int IS NOT NULL
						GROUP BY
							properties.user_id:int,
							properties.is_premium:bool,
							properties.session_duration:float
						ORDER BY total_events DESC
						LIMIT 20
					`.trim(),
				},
				{
					name: 'Error Events Analysis',
					description: 'Analyze error events',
					query: `
						SELECT
							path,
							count() as error_count
						FROM analytics.errors
						WHERE
							timestamp >= now() - INTERVAL 7 DAY
						GROUP BY path
						ORDER BY error_count DESC
						LIMIT 10
					`.trim(),
				},
			],
		};
	});
