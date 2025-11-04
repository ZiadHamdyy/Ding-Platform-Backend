import 'express';

declare module 'express-serve-static-core' {
  interface Response {
    cookie(name: string, value: string, options?: any): this;
    clearCookie(name: string, options?: any): this;
  }
}

