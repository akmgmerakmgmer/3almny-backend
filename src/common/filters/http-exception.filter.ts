import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let errorCode: string | undefined;
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res) {
        const r: any = res;
        message = r.message || message;
        errorCode = r.error;
        details = r.details;
      }
    } else if (exception?.message) {
      message = exception.message;
    }

    response.status(status).json({
      success: false,
      error: {
        code: errorCode || status,
        message,
        details,
        path: request.url,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
