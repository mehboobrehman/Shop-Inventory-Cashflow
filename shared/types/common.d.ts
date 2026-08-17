/**
 * Common primitives and helpers shared across all modules.
 *
 * Conventions (per project decision):
 * - IDs are `string` (UUIDs)
 * - Monetary values are `number` (PKR, 2-decimal precision)
 * - Timestamps are `string` (ISO 8601)
 */
/** ISO 8601 timestamp string, e.g. "2026-07-24T10:00:00.000Z". */
export type ISODateString = string;
/** UUID string. */
export type UUID = string;
/** Monetary amount in PKR (2-decimal precision). */
export type Money = number;
/** Generic pagination request parameters. */
export interface PaginationParams {
    page?: number;
    limit?: number;
}
/** Generic pagination metadata returned with list responses. */
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
/** Generic paginated response wrapper. */
export interface PaginatedData<T> {
    items: T[];
    pagination: PaginationMeta;
}
//# sourceMappingURL=common.d.ts.map