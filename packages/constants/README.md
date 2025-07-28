# @repo/constants

Environment constants and configuration management for the monorepo.

## Simple API - Grouped by Platform

This package provides all constants and utilities grouped by runtime environment for clean imports:

### Vite/Client Contexts

Everything you need for client-side applications:

```typescript
import { APPS, APP_URLS, validateViteEnv, type ViteEnv } from '@repo/constants/vite';

// App constants (uses import.meta.env.MODE)
const authUrl = APPS.AUTH.URL;

// URL arrays for CORS, etc.
const corsOrigins = APP_URLS;

// Environment validation (MODE only)
const env = validateViteEnv(import.meta.env);
```

### Node.js/Server Contexts

Everything you need for server-side applications:

```typescript
import { APPS, APP_URLS, env, validateNodeEnv, type NodeEnv } from '@repo/constants/node';

// App constants (uses process.env.NODE_ENV)
const authUrl = APPS.AUTH.URL;

// Environment variables (includes validation)
const dbUrl = env.DATABASE_URL;

// URL arrays for CORS, etc.
const corsOrigins = APP_URLS;

// Custom validation
const myEnv = validateNodeEnv(customEnvObject);
```

### Cloudflare Workers Contexts

Everything you need for Cloudflare Workers with runtime environment:

```typescript
import { APPS, APP_URLS, validateNodeEnv, type NodeEnv } from '@repo/constants/cloudflare';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono<{ Bindings: NodeEnv }>();

app.use('/api/*', (c, next) =>
    cors({
        origin: APP_URLS(c.env),
        credentials: true,
    })(c, next),
);

// App constants (runtime resolution)
app.get('/config', (c) => {
    const authUrl = APPS(c.env).AUTH.URL;
    return c.json({ authUrl });
});
```

## Design Principles

### 1. Context Separation
Files are separated by runtime context to prevent import issues:
- Vite files use `import.meta.env.MODE`
- Node files use `process.env.NODE_ENV`  
- Never mix these in the same file

### 2. Minimal Imports
Each context gets exactly what it needs:
- Client code: Just URL constants
- Server code: Choose between constants-only or constants + validation
- Validation: Context-specific schemas only

### 3. Build-Time Resolution
Constants resolve at build time, not runtime:
- `MODE=production` → hardcoded production URLs
- `NODE_ENV=production` → hardcoded production URLs
- No runtime environment checking

## Migration Guide

### From Old Pattern
```typescript
// OLD: Runtime function with env parameter
import { APPS } from '@repo/constants';
const url = APPS(import.meta.env).SH.URL;
```

### To New Pattern
```typescript
// NEW: Build-time constants
import { APPS } from '@repo/constants/vite';
const url = APPS.SH.URL;
```

## File Structure

```
src/
├── vite/
│   ├── index.ts       # Barrel export (import from @repo/constants/vite)
│   ├── apps.ts        # APPS constants
│   └── schema.ts      # ViteEnv validation
├── node/
│   ├── index.ts       # Barrel export (import from @repo/constants/node)
│   ├── apps.ts        # APPS constants
│   ├── schema.ts      # NodeEnv validation
│   └── env.ts         # Full environment + validation
└── cloudflare/
    ├── index.ts       # Barrel export (import from @repo/constants/cloudflare)
    └── apps.ts        # Runtime APPS functions
```

## Exports

- `./vite` - All Vite/client constants and utilities
- `./node` - All Node.js/server constants and utilities
- `./cloudflare` - All Cloudflare Workers constants and utilities