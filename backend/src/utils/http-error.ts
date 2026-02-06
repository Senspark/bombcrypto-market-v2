import {Response} from 'express';

export class HttpError extends Error {
    constructor(
        public statusCode: number,
        message: string
    ) {
        super(message);
        this.name = 'HttpError';
    }
}

export class BadRequestError extends HttpError {
    constructor(message = 'Bad Request') {
        super(400, message);
    }
}

export class UnauthorizedError extends HttpError {
    constructor(message = 'Unauthorized') {
        super(401, message);
    }
}

export class ForbiddenError extends HttpError {
    constructor(message = 'Forbidden') {
        super(403, message);
    }
}

export class NotFoundError extends HttpError {
    constructor(message = 'Not Found') {
        super(404, message);
    }
}

export class InternalServerError extends HttpError {
    constructor(message = 'Internal Server Error') {
        super(500, message);
    }
}

export interface ErrorResponse {
    error: string;
    message: string;
    statusCode: number;
}

export function sendError(res: Response, error: HttpError | Error): void {
    if (error instanceof HttpError) {
        res.status(error.statusCode).json({
            error: error.name,
            message: error.message,
            statusCode: error.statusCode,
        } as ErrorResponse);
    } else {
        res.status(500).json({
            error: 'InternalServerError',
            message: error.message || 'An unexpected error occurred',
            statusCode: 500,
        } as ErrorResponse);
    }
}
