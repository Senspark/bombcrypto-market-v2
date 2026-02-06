import {PaginationQuery} from '@/domain/models/pagination';

// Query builder result
export interface QueryResult {
    sql: string;
    params: unknown[];
}

// RHS (Right-Hand-Side) operator types
export type RhsOperator = 'gte' | 'lte' | 'eq';

// Parse RHS colon format: "gte:20" -> { operator: 'gte', value: '20' }
export interface RhsValue {
    operator: RhsOperator;
    value: string;
}

export function parseRhsValue(input: string): RhsValue | null {
    const parts = input.split(':');
    if (parts.length !== 2) return null;

    const operator = parts[0].toLowerCase() as RhsOperator;
    if (!['gte', 'lte', 'eq'].includes(operator)) return null;

    return {operator, value: parts[1]};
}

// Parse array of RHS values and group by operator
export function parseRhsValues(inputs: string[]): Map<RhsOperator, string> {
    const result = new Map<RhsOperator, string>();
    for (const input of inputs) {
        const parsed = parseRhsValue(input);
        if (parsed) {
            result.set(parsed.operator, parsed.value);
        }
    }
    return result;
}

// SQL Query Builder class
export class QueryBuilder {
    private selectCols: string[] = [];
    private fromTable: string = '';
    private whereClauses: string[] = [];
    private orderByClauses: string[] = [];
    private limitValue: number | null = null;
    private offsetValue: number | null = null;
    private params: unknown[] = [];

    select(...columns: string[]): this {
        this.selectCols.push(...columns);
        return this;
    }

    from(table: string): this {
        this.fromTable = table;
        return this;
    }

    // Add WHERE clause with parameterized value
    where(clause: string, ...values: unknown[]): this {
        // Replace $? placeholders with actual parameter positions
        let paramIndex = this.params.length;
        const processedClause = clause.replace(/\$\?/g, () => {
            paramIndex++;
            return `$${paramIndex}`;
        });
        this.whereClauses.push(processedClause);
        this.params.push(...values);
        return this;
    }

    // Add IN clause: column IN ($1, $2, ...)
    whereIn(column: string, values: unknown[]): this {
        if (values.length === 0) return this;

        const placeholders = values.map((_, i) => `$${this.params.length + i + 1}`);
        this.whereClauses.push(`${column} IN (${placeholders.join(', ')})`);
        this.params.push(...values);
        return this;
    }

    // Add >= clause
    whereGte(column: string, value: unknown): this {
        this.params.push(value);
        this.whereClauses.push(`${column} >= $${this.params.length}`);
        return this;
    }

    // Add <= clause
    whereLte(column: string, value: unknown): this {
        this.params.push(value);
        this.whereClauses.push(`${column} <= $${this.params.length}`);
        return this;
    }

    // Add = clause
    whereEq(column: string, value: unknown): this {
        this.params.push(value);
        this.whereClauses.push(`${column} = $${this.params.length}`);
        return this;
    }

    // Add OR clause: (condition1 OR condition2 OR ...)
    whereOr(conditions: string[]): this {
        if (conditions.length === 0) return this;
        this.whereClauses.push(`(${conditions.join(' OR ')})`);
        return this;
    }

    // Add raw WHERE clause without parameters
    whereRaw(clause: string): this {
        this.whereClauses.push(clause);
        return this;
    }

    // Add ORDER BY clause
    orderBy(column: string, direction: 'asc' | 'desc' = 'desc'): this {
        this.orderByClauses.push(`${column} ${direction.toUpperCase()}`);
        return this;
    }

    // Add LIMIT clause
    limit(value: number): this {
        this.limitValue = value;
        return this;
    }

    // Add OFFSET clause
    offset(value: number): this {
        this.offsetValue = value;
        return this;
    }

    // Apply pagination from PaginationQuery
    paginate(pagination: PaginationQuery): this {
        this.limit(pagination.size);
        this.offset((pagination.page - 1) * pagination.size);
        this.orderBy(pagination.orderBy, pagination.orderDirection);
        return this;
    }

    // Build SELECT query
    build(): QueryResult {
        const parts: string[] = [];

        // SELECT
        if (this.selectCols.length > 0) {
            parts.push(`SELECT ${this.selectCols.join(', ')}`);
        } else {
            parts.push('SELECT *');
        }

        // FROM
        parts.push(`FROM ${this.fromTable}`);

        // WHERE
        if (this.whereClauses.length > 0) {
            parts.push(`WHERE ${this.whereClauses.join(' AND ')}`);
        }

        // ORDER BY
        if (this.orderByClauses.length > 0) {
            parts.push(`ORDER BY ${this.orderByClauses.join(', ')}`);
        }

        // LIMIT
        if (this.limitValue !== null) {
            parts.push(`LIMIT ${this.limitValue}`);
        }

        // OFFSET
        if (this.offsetValue !== null) {
            parts.push(`OFFSET ${this.offsetValue}`);
        }

        return {
            sql: parts.join(' '),
            params: this.params,
        };
    }

    // Build COUNT query (for pagination total count)
    buildCount(): QueryResult {
        const parts: string[] = [];

        // SELECT COUNT(*)
        parts.push('SELECT COUNT(*)::int as count');

        // FROM
        parts.push(`FROM ${this.fromTable}`);

        // WHERE (same as build)
        if (this.whereClauses.length > 0) {
            parts.push(`WHERE ${this.whereClauses.join(' AND ')}`);
        }

        return {
            sql: parts.join(' '),
            params: this.params,
        };
    }

    // Get current params (for building related queries)
    getParams(): unknown[] {
        return [...this.params];
    }

    // Reset builder for reuse
    reset(): this {
        this.selectCols = [];
        this.fromTable = '';
        this.whereClauses = [];
        this.orderByClauses = [];
        this.limitValue = null;
        this.offsetValue = null;
        this.params = [];
        return this;
    }
}

// Insert builder for upsert operations
export class InsertBuilder {
    private tableName: string = '';
    private columns: string[] = [];
    private values: unknown[] = [];
    private onConflictColumn: string = '';
    private onConflictAction: string = '';
    private returningCols: string[] = [];

    into(table: string): this {
        this.tableName = table;
        return this;
    }

    cols(...columns: string[]): this {
        this.columns.push(...columns);
        return this;
    }

    vals(...values: unknown[]): this {
        this.values.push(...values);
        return this;
    }

    onConflict(column: string, action: string = 'DO UPDATE SET updated_at = NOW()'): this {
        this.onConflictColumn = column;
        this.onConflictAction = action;
        return this;
    }

    returning(...columns: string[]): this {
        this.returningCols.push(...columns);
        return this;
    }

    build(): QueryResult {
        const placeholders = this.values.map((_, i) => `$${i + 1}`);

        let sql = `INSERT INTO ${this.tableName} (${this.columns.join(', ')}) VALUES (${placeholders.join(', ')})`;

        if (this.onConflictColumn) {
            sql += ` ON CONFLICT (${this.onConflictColumn}) ${this.onConflictAction}`;
        }

        if (this.returningCols.length > 0) {
            sql += ` RETURNING ${this.returningCols.join(', ')}`;
        }

        return {
            sql,
            params: this.values,
        };
    }
}

// Update builder
export class UpdateBuilder {
    private tableName: string = '';
    private setClauses: string[] = [];
    private whereClauses: string[] = [];
    private params: unknown[] = [];

    table(name: string): this {
        this.tableName = name;
        return this;
    }

    set(column: string, value: unknown): this {
        this.params.push(value);
        this.setClauses.push(`${column} = $${this.params.length}`);
        return this;
    }

    setRaw(clause: string): this {
        this.setClauses.push(clause);
        return this;
    }

    where(column: string, value: unknown): this {
        this.params.push(value);
        this.whereClauses.push(`${column} = $${this.params.length}`);
        return this;
    }

    whereRaw(clause: string): this {
        this.whereClauses.push(clause);
        return this;
    }

    whereLte(column: string, value: unknown): this {
        this.params.push(value);
        this.whereClauses.push(`${column} <= $${this.params.length}`);
        return this;
    }

    build(): QueryResult {
        let sql = `UPDATE ${this.tableName} SET ${this.setClauses.join(', ')}`;

        if (this.whereClauses.length > 0) {
            sql += ` WHERE ${this.whereClauses.join(' AND ')}`;
        }

        return {
            sql,
            params: this.params,
        };
    }
}

// Helper to create builders
export function createQueryBuilder(): QueryBuilder {
    return new QueryBuilder();
}

export function createInsertBuilder(): InsertBuilder {
    return new InsertBuilder();
}

export function createUpdateBuilder(): UpdateBuilder {
    return new UpdateBuilder();
}

// Helper functions for pagination
export function getOffset(page: number, size: number): number {
    if (page <= 0) return 0;
    return (page - 1) * size;
}

export function getTotalPages(totalCount: number, pageSize: number): number {
    if (pageSize <= 0) return 0;
    return Math.ceil(totalCount / pageSize);
}

export function getHasMore(page: number, totalCount: number, pageSize: number): boolean {
    return page * pageSize < totalCount;
}
