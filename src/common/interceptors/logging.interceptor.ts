import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Http');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const { method, url, ip } = req;
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - now;
          this.logger.log(`${method} ${url} ${context.switchToHttp().getResponse().statusCode} ${ms}ms - ${ip}`);
        },
        error: () => {
          const ms = Date.now() - now;
          this.logger.warn(`${method} ${url} - ${ms}ms - ${ip}`);
        },
      }),
    );
  }
}
