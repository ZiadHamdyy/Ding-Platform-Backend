/// <reference types="cookie-parser" />
import 'express';
import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Response {
    cookie(name: string, value: string, options?: any): this;
    clearCookie(name: string, options?: any): this;
  }
}

declare module 'express' {
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

