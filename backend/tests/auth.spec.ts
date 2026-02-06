import { describe, it, expect, vi } from 'vitest';
import { createAdminAuth } from '../src/api/middleware/auth';
import { Request, Response, NextFunction } from 'express';

describe('Admin Auth Middleware', () => {
    it('should call next() for valid key', () => {
        const apiKey = 'super-secret-key';
        const middleware = createAdminAuth(apiKey);
        const req = {
            header: vi.fn().mockReturnValue(apiKey)
        } as unknown as Request;
        const res = {} as Response;
        const next = vi.fn();

        middleware(req, res, next);
        expect(next).toHaveBeenCalled();
        expect((req as any).isAdmin).toBe(true);
    });

    it('should return 403 for invalid key', () => {
        const apiKey = 'super-secret-key';
        const middleware = createAdminAuth(apiKey);
        const req = {
            header: vi.fn().mockReturnValue('wrong-key')
        } as unknown as Request;
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        } as unknown as Response;
        const next = vi.fn();

        middleware(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 for missing key', () => {
        const apiKey = 'super-secret-key';
        const middleware = createAdminAuth(apiKey);
        const req = {
            header: vi.fn().mockReturnValue(undefined)
        } as unknown as Request;
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        } as unknown as Response;
        const next = vi.fn();

        middleware(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 for partial match (timing attack simulation)', () => {
        // This test just checks basic mismatch behavior, not actual timing
        const apiKey = 'super-secret-key';
        const middleware = createAdminAuth(apiKey);
        const req = {
            header: vi.fn().mockReturnValue('super-secret-ke') // one char missing
        } as unknown as Request;
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        } as unknown as Response;
        const next = vi.fn();

        middleware(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });
});
