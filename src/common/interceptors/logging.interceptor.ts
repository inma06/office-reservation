import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query, params, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const ip = request.ip || request.connection?.remoteAddress || 'unknown';
    const startTime = Date.now();

    // 요청 로깅
    this.logger.log(
      `→ ${method} ${url} - ${ip} - ${userAgent.substring(0, 50)}`,
    );

    // 요청 상세 정보 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      if (Object.keys(query).length > 0) {
        this.logger.debug(`Query: ${JSON.stringify(query)}`);
      }
      if (Object.keys(params).length > 0) {
        this.logger.debug(`Params: ${JSON.stringify(params)}`);
      }
      if (body && Object.keys(body).length > 0) {
        // 비밀번호는 로그에서 제외
        const sanitizedBody = { ...body };
        if (sanitizedBody.password) {
          sanitizedBody.password = '***';
        }
        this.logger.debug(`Body: ${JSON.stringify(sanitizedBody)}`);
      }
      if (headers.authorization) {
        const token = headers.authorization.substring(0, 20) + '...';
        this.logger.debug(`Authorization: ${token}`);
      }
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const duration = Date.now() - startTime;

          this.logger.log(
            `← ${method} ${url} ${statusCode} - ${duration}ms`,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || error.statusCode || 500;

          this.logger.error(
            `✗ ${method} ${url} ${statusCode} - ${duration}ms - ${error.message}`,
          );

          if (process.env.NODE_ENV === 'development') {
            this.logger.error(`Error Stack: ${error.stack}`);
          }
        },
      }),
    );
  }
}

