import { nanoid } from 'nanoid';
import { Client } from 'pg';

export interface PostgresConnectionInfo {
	host: string;
	port: number;
	database: string;
	username: string;
	password: string;
	ssl?: boolean;
}

export interface CreateUserResult {
	connectionUrl: string;
	username: string;
	password: string;
}

export type PermissionLevel = 'readonly' | 'admin';

export function parsePostgresUrl(url: string): PostgresConnectionInfo {
	try {
		const urlObj = new URL(url);
		return {
			host: urlObj.hostname,
			port: urlObj.port ? Number.parseInt(urlObj.port, 10) : 5432,
			database: urlObj.pathname.slice(1),
			username: urlObj.username,
			password: urlObj.password,
			ssl: urlObj.searchParams.get('sslmode') === 'require',
		};
	} catch (error) {
		throw new Error(`Invalid PostgreSQL URL: ${error.message}`);
	}
}

export function buildPostgresUrl(info: PostgresConnectionInfo): string {
	const url = new URL('postgresql://');
	url.hostname = info.host;
	url.port = info.port.toString();
	url.username = info.username;
	url.password = info.password;
	url.pathname = `/${info.database}`;

	if (info.ssl) {
		url.searchParams.set('sslmode', 'require');
	}

	return url.toString();
}

export async function testConnection(url: string): Promise<void> {
	const client = new Client({
		connectionString: url,
		connectionTimeoutMillis: 10_000,
		query_timeout: 5000,
	});

	try {
		await client.connect();
		await client.query('SELECT 1');
	} catch (error) {
		throw new Error(`Failed to connect: ${error.message}`);
	} finally {
		await client.end();
	}
}

function isManagedDatabase(connectionInfo: PostgresConnectionInfo): boolean {
	const managedIndicators = [
		'neon.tech',
		'amazonaws.com',
		'supabase.co',
		'render.com',
		'railway.app',
	];

	const hostAndUser =
		`${connectionInfo.host} ${connectionInfo.username}`.toLowerCase();
	return managedIndicators.some((indicator) => hostAndUser.includes(indicator));
}

export function isNeonDatabase(url: string): boolean {
	try {
		const connectionInfo = parsePostgresUrl(url);
		const isNeon =
			connectionInfo.host.includes('neon.tech') ||
			connectionInfo.host.includes('neondb.net');
		return isNeon;
	} catch {
		return false;
	}
}

export async function getConnectionUrl(
	adminUrl: string,
	permissionLevel: PermissionLevel = 'readonly'
): Promise<CreateUserResult> {
	// For Neon databases, use the original URL directly
	if (isNeonDatabase(adminUrl)) {
		const connectionInfo = parsePostgresUrl(adminUrl);
		const result = {
			connectionUrl: adminUrl,
			username: connectionInfo.username,
			password: connectionInfo.password,
		};
		return result;
	}

	// For other databases, create a new user
	const result = await createUser(adminUrl, permissionLevel);
	return result;
}

async function createClient(
	connectionInfo: PostgresConnectionInfo
): Promise<Client> {
	const client = new Client({
		host: connectionInfo.host,
		port: connectionInfo.port,
		database: connectionInfo.database,
		user: connectionInfo.username,
		password: connectionInfo.password,
		ssl: connectionInfo.ssl ? { rejectUnauthorized: false } : false,
		connectionTimeoutMillis: 30_000,
		query_timeout: 30_000,
	});

	await client.connect();
	return client;
}

async function checkUserPrivileges(
	client: Client,
	username: string
): Promise<{
	isSuperuser: boolean;
	canCreateRole: boolean;
	canCreateDb: boolean;
}> {
	const result = await client.query(
		`SELECT rolsuper, rolcreatedb, rolcreaterole 
		 FROM pg_roles WHERE rolname = $1`,
		[username]
	);

	if (result.rows.length === 0) {
		throw new Error('Unable to verify user privileges');
	}

	const row = result.rows[0];
	return {
		isSuperuser: row.rolsuper,
		canCreateRole: row.rolcreaterole,
		canCreateDb: row.rolcreatedb,
	};
}

async function grantReadonlyPermissions(
	client: Client,
	username: string,
	connectionInfo: PostgresConnectionInfo
): Promise<void> {
	// Basic schema access
	await client.query(`GRANT USAGE ON SCHEMA public TO "${username}"`);
	await client.query(
		`GRANT SELECT ON ALL TABLES IN SCHEMA public TO "${username}"`
	);
	await client.query(
		`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO "${username}"`
	);

	// Monitoring permissions
	const monitoringTables = [
		'pg_stat_database',
		'pg_stat_user_tables',
		'pg_stat_user_indexes',
	];

	// Grant monitoring permissions in parallel
	const monitoringPromises = monitoringTables.map(async (table) => {
		try {
			await client.query(`GRANT SELECT ON ${table} TO "${username}"`);
		} catch {
			// Ignore errors for missing tables
		}
	});
	await Promise.all(monitoringPromises);

	// Try to grant stats permissions
	if (
		isManagedDatabase(connectionInfo) &&
		connectionInfo.host.includes('neon')
	) {
		try {
			await client.query(`GRANT pg_read_all_data TO "${username}"`);
		} catch {
			// Ignore if can't grant
		}
	} else {
		try {
			await client.query(`GRANT pg_read_all_stats TO "${username}"`);
		} catch {
			// Fallback to basic stats
			try {
				await client.query(
					`GRANT SELECT ON pg_stat_statements TO "${username}"`
				);
			} catch {
				// Ignore if not available
			}
		}
	}
}

async function grantAdminPermissions(
	client: Client,
	username: string,
	connectionInfo: PostgresConnectionInfo,
	userPrivs: { isSuperuser: boolean }
): Promise<void> {
	// Full schema privileges
	await client.query(`GRANT ALL PRIVILEGES ON SCHEMA public TO "${username}"`);
	await client.query(
		`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "${username}"`
	);
	await client.query(
		`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "${username}"`
	);

	// System catalog access
	await client.query(
		`GRANT SELECT ON ALL TABLES IN SCHEMA information_schema TO "${username}"`
	);
	await client.query(
		`GRANT SELECT ON ALL TABLES IN SCHEMA pg_catalog TO "${username}"`
	);

	// Superuser privileges if possible
	if (userPrivs.isSuperuser) {
		await client.query(`ALTER USER "${username}" WITH SUPERUSER`);
	}

	// Stats permissions (same as readonly)
	if (
		isManagedDatabase(connectionInfo) &&
		connectionInfo.host.includes('neon')
	) {
		try {
			await client.query(`GRANT pg_read_all_data TO "${username}"`);
		} catch {
			// Ignore if can't grant
		}
	} else {
		try {
			await client.query(`GRANT pg_read_all_stats TO "${username}"`);
		} catch {
			// Ignore if can't grant
		}
	}
}

export async function createUser(
	adminUrl: string,
	permissionLevel: PermissionLevel = 'readonly'
): Promise<CreateUserResult> {
	const connectionInfo = parsePostgresUrl(adminUrl);
	const client = await createClient(connectionInfo);

	const userPrefix = permissionLevel === 'admin' ? 'admin' : 'readonly';
	const username = `databuddy_${userPrefix}_${nanoid(8)
		.toLowerCase()
		.replace(/[^a-z0-9]/g, '')}`;
	const password = nanoid(32).replace(/[^a-zA-Z0-9]/g, '');

	try {
		// Check admin privileges
		const userPrivs = await checkUserPrivileges(
			client,
			connectionInfo.username
		);

		if (
			permissionLevel === 'admin' &&
			!userPrivs.isSuperuser &&
			!(userPrivs.canCreateDb && userPrivs.canCreateRole)
		) {
			throw new Error('Insufficient privileges to create admin user');
		}

		if (
			permissionLevel === 'readonly' &&
			!userPrivs.isSuperuser &&
			!userPrivs.canCreateDb
		) {
			throw new Error('Insufficient privileges to create user');
		}

		// Create user
		const createUserQuery = `CREATE USER "${username}" WITH PASSWORD '${password.replace(/'/g, "''")}'${
			permissionLevel === 'admin' ? ' CREATEDB CREATEROLE' : ''
		} CONNECTION LIMIT 5`;

		await client.query(createUserQuery);
		await client.query(
			`GRANT CONNECT ON DATABASE "${connectionInfo.database}" TO "${username}"`
		);

		// Grant permissions
		if (permissionLevel === 'admin') {
			await grantAdminPermissions(client, username, connectionInfo, userPrivs);
		} else {
			await grantReadonlyPermissions(client, username, connectionInfo);
		}

		const newConnectionInfo: PostgresConnectionInfo = {
			...connectionInfo,
			username,
			password,
		};

		const connectionUrl = buildPostgresUrl(newConnectionInfo);
		await testConnection(connectionUrl);

		return { connectionUrl, username, password };
	} catch (error) {
		// Cleanup on error
		try {
			await client.query(`DROP USER IF EXISTS "${username}"`);
		} catch {
			// Ignore cleanup errors
		}
		throw new Error(
			`Failed to create ${permissionLevel} user: ${error.message}`
		);
	} finally {
		await client.end();
	}
}

export async function deleteUser(
	adminUrl: string,
	username: string
): Promise<void> {
	const connectionInfo = parsePostgresUrl(adminUrl);
	const client = await createClient(connectionInfo);

	try {
		// Check if user exists
		const userCheck = await client.query(
			'SELECT 1 FROM pg_roles WHERE rolname = $1',
			[username]
		);
		if (userCheck.rows.length === 0) {
			return;
		}

		// Terminate connections
		try {
			await client.query(
				`SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
				 WHERE usename = $1 AND pid <> pg_backend_pid()`,
				[username]
			);
		} catch {
			// Ignore termination errors
		}

		await client.query(`DROP USER "${username}"`);
	} finally {
		await client.end();
	}
}

export async function listDatabuddyUsers(adminUrl: string): Promise<string[]> {
	const connectionInfo = parsePostgresUrl(adminUrl);
	const client = await createClient(connectionInfo);

	try {
		const result = await client.query(
			`SELECT rolname FROM pg_roles WHERE rolname LIKE 'databuddy_%' ORDER BY rolname`
		);
		return result.rows.map((row) => row.rolname);
	} finally {
		await client.end();
	}
}

export async function validateReadonlyAccess(url: string): Promise<boolean> {
	const client = new Client({
		connectionString: url,
		connectionTimeoutMillis: 10_000,
		query_timeout: 5000,
	});

	try {
		await client.connect();
		try {
			await client.query('CREATE TEMP TABLE readonly_test (id INTEGER)');
			await client.query('DROP TABLE readonly_test');
			return false; // Can write, not readonly
		} catch {
			return true; // Cannot write, is readonly
		}
	} finally {
		await client.end();
	}
}

// Backward compatibility
export const createReadonlyUser = (adminUrl: string) =>
	createUser(adminUrl, 'readonly');
export const createAdminUser = (adminUrl: string) =>
	createUser(adminUrl, 'admin');
