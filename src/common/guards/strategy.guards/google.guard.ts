import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getRequest(context: ExecutionContext) {
    return context.switchToHttp().getRequest();
  }
}
