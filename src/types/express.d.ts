import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    headers: {
      [key: string]: string | string[] | undefined;
      authorization?: string;
      Authorization?: string;
    };
  }

  interface Response {
    cookie(name: string, value: string, options?: any): this;
    clearCookie(name: string, options?: any): this;
  }
}

