import { z } from 'zod';

export function exactHttpBaseUrlSchema(pathname: string) {
  return z
    .url()
    .check((context) => {
      const value = context.value;
      const url = new URL(value);
      const normalizedPath = url.pathname.replace(/\/+$/, '') || '/';
      if (value.includes('?') || value.includes('#')) {
        context.issues.push({
          code: 'custom',
          input: value,
          message: 'URL must not contain query or fragment',
        });
      }
      if (/\/{2,}$/.test(url.pathname)) {
        context.issues.push({
          code: 'custom',
          input: value,
          message: 'URL must not contain repeated trailing slashes',
        });
      }
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        context.issues.push({
          code: 'custom',
          input: value,
          message: 'URL protocol must be http or https',
        });
      }
      if (url.username || url.password) {
        context.issues.push({
          code: 'custom',
          input: value,
          message: 'URL must not contain credentials',
        });
      }
      if (normalizedPath !== pathname) {
        context.issues.push({
          code: 'custom',
          input: value,
          message: `URL path must be exactly ${pathname}`,
        });
      }
    })
    .transform((value) => value.replace(/\/+$/, ''));
}
