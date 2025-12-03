import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs/internal/Observable';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { uploadOptions } from '../../configs/multer/upload-options';

@Injectable()
export class uploadPostFilesInterceptor implements NestInterceptor {
  constructor(private readonly fieldsConfig: any) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();

    // Create a Multer-specific interceptor ON THE FLY
    const multerInterceptor = FileFieldsInterceptor(
      this.fieldsConfig,
      uploadOptions,
    );

    // Execute Multer interceptor first before continuing
    return new (multerInterceptor as any)().intercept(context, next);
  }
}
