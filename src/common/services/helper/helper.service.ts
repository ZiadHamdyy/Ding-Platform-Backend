import { Injectable } from '@nestjs/common';

@Injectable()
export class HelperService {
  /**
   * Generate a slug from a string
   */
  generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Sanitize HTML content
   */
  sanitizeHtml(html: string): string {
    // Basic sanitization - you might want to use a library like DOMPurify
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  }

  /**
   * Truncate text to a specific length
   */
  truncate(text: string, length: number, suffix = '...'): string {
    if (text.length <= length) {
      return text;
    }
    return text.substring(0, length).trim() + suffix;
  }

  /**
   * Generate a random string
   */
  generateRandomString(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }
}
