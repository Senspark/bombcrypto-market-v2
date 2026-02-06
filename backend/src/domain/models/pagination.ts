export interface PaginationQuery {
    page: number;
    size: number;
    orderBy: string;
    orderDirection: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
    totalCount: number;
    totalPages: number;
    page: number;
    size: number;
    hasMore: boolean;
    transactions: T[];
}

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export function normalizePagination(query: Partial<PaginationQuery>): PaginationQuery {
    let size = query.size ?? DEFAULT_PAGE_SIZE;
    if (size > MAX_PAGE_SIZE) size = MAX_PAGE_SIZE;
    if (size < 1) size = DEFAULT_PAGE_SIZE;

    let page = query.page ?? 1;
    if (page < 1) page = 1;

    return {
        page,
        size,
        orderBy: query.orderBy ?? 'updated_at',
        orderDirection: query.orderDirection ?? 'desc',
    };
}
