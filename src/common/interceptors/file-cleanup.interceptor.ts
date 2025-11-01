import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import * as fs from 'fs';

/**
 * Interceptor to cleanup uploaded files on error
 */
@Injectable()
export class FileCleanupInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const file = request.file;
    const files = request.files;

    return next.handle().pipe(
      catchError(err => {
        // Cleanup files on error
        if (file?.path) {
          this.deleteFile(file.path);
        }
        if (files && Array.isArray(files)) {
          files.forEach(f => {
            if (f.path) this.deleteFile(f.path);
          });
        }
        return throwError(() => err);
      }),
    );
  }

  private deleteFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error(`Failed to delete file ${filePath}:`, error);
    }
  }
}