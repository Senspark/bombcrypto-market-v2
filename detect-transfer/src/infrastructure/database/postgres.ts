import {Pool, PoolConfig, QueryResult, QueryResultRow} from 'pg';
import {Logger} from '@/utils/logger';

export interface DatabasePool {
    query<T extends QueryResultRow = QueryResultRow>(
        text: string,
        values?: unknown[]
    ): Promise<QueryResult<T>>;

    getClient(): Promise<PoolClient>;

    end(): Promise<void>;
}

export interface PoolClient {
    query<T extends QueryResultRow = QueryResultRow>(
        text: string,
        values?: unknown[]
    ): Promise<QueryResult<T>>;

    release(): void;
}

function parseDSN(dsn: string): PoolConfig {
    try {
        const url = new URL(dsn);
        const config: PoolConfig = {
            user: url.username,
            password: url.password,
            host: url.hostname,
            port: parseInt(url.port, 10) || 5432,
            database: url.pathname.slice(1),
        };

        const sslmode = url.searchParams.get('sslmode');
        if (sslmode === 'disable') {
            config.ssl = false;
        } else if (sslmode === 'require' || sslmode === 'verify-full') {
            config.ssl = true;
        }

        const searchPath = url.searchParams.get('search_path');
        if (searchPath) {
            config.options = `-c search_path=${searchPath}`;
        }

        return config;
    } catch {
        throw new Error(`Invalid PostgreSQL DSN format: ${dsn}`);
    }
}

export async function createPostgresPool(
    dsn: string,
    logger: Logger
): Promise<DatabasePool> {
    const poolConfig = parseDSN(dsn);

    const pool = new Pool({
        ...poolConfig,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
    });

    try {
        const client = await pool.connect();
        logger.info('PostgreSQL connection established successfully');
        client.release();
    } catch (error) {
        logger.error('Failed to connect to PostgreSQL:', error);
        throw error;
    }

    pool.on('error', (err) => {
        logger.error('Unexpected error on idle PostgreSQL client:', err);
    });

    return {
        query: <T extends QueryResultRow = QueryResultRow>(
            text: string,
            values?: unknown[]
        ) => pool.query<T>(text, values),

        getClient: async () => {
            const client = await pool.connect();
            return {
                query: <T extends QueryResultRow = QueryResultRow>(
                    text: string,
                    values?: unknown[]
                ) => client.query<T>(text, values),
                release: () => client.release(),
            };
        },

        end: () => pool.end(),
    };
}

export async function withTransaction<T>(
    pool: DatabasePool,
    fn: (client: PoolClient) => Promise<T>
): Promise<T> {
    const client = await pool.getClient();
    try {
        await client.query('BEGIN');
        const result = await fn(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}
