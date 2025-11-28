// ===== FILE: src/common/filters/http-exception.filter.ts (TYPE-SAFE VERSION) =====
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorResponse } from '../interfaces';

// 🔥 TYPE-SAFE: Interface untuk HttpException response
interface HttpExceptionResponseObject {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // 🔥 TYPE-SAFE: Determine message based on response type
    let message: string | string[];
    let error: string | undefined;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else {
      const responseObj = exceptionResponse as HttpExceptionResponseObject;
      message = responseObj.message || 'Internal server error';
      error = responseObj.error;
    }

    // 🔥 TYPE-SAFE: Build error response using interface
    const errorResponse: ErrorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      message: Array.isArray(message) ? message.join(', ') : message,
      error,
    };

    response.status(status).json(errorResponse);
  }
}
