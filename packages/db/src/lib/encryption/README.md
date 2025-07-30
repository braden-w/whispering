# Encryption Utilities

This module provides symmetric encryption utilities for securely storing and retrieving sensitive data that needs to be decrypted later (like passwords, API keys, tokens, etc.).

## What is Symmetric Encryption?

Symmetric encryption is a two-way transformation where:
- You can encrypt data to store it securely
- You can decrypt it later to retrieve the original value
- The same key is used for both encryption and decryption

```typescript
// Original data: "mySecretPassword123"
// After encryption: "U2FsdGVkX1+..." (encrypted string)
// After decryption: "mySecretPassword123" (back to original)
```

## How the Factory Pattern Works

The `createEncryptionUtils` factory creates encryption utilities bound to a specific user and purpose:

```typescript
const encryptionUtils = await createEncryptionUtils({
  userId: 'user-123',
  env: ctx.env,
  purpose: 'assistant-config'
});
```

The factory:
1. **Derives a unique key** by combining:
   - Master key from `BETTER_AUTH_SECRET`
   - Purpose string (for key separation)
   - User ID (for user isolation)
2. **Returns utility functions** that use this key

## Key Derivation Pattern

```
Master Key + Purpose + User ID → SHA256 → Base64 → Encryption Key
```

This ensures:
- **User isolation**: Each user's data is encrypted with a different key
- **Purpose separation**: Different purposes use different keys
- **Security**: Keys are derived using cryptographic standards

## The `purpose` Parameter

The `purpose` parameter ensures that keys derived for different purposes are cryptographically distinct.

**Important**: The `purpose` parameter should NOT include version information. Version should be stored separately with the encrypted data structure.

## Usage Examples

### Assistant Configuration Encryption
```typescript
// Define purpose for key separation
const ASSISTANT_CONFIG_PURPOSE = 'assistant-config';

// Create utilities
const encryptionUtils = await createEncryptionUtils({
  userId: ctx.user.id,
  env: ctx.env,
  purpose: ASSISTANT_CONFIG_PURPOSE,
});

// Encrypt before storing
const encrypted = await encryptionUtils.encrypt(plainPassword);
await db.insert(assistantConfig).values({
  password: encrypted,
  // ... other fields
});

// Decrypt when retrieving
const decrypted = await encryptionUtils.decrypt(config.password);
```

### API Key Encryption
```typescript
const API_KEY_PURPOSE = 'api-keys';

const encryptionUtils = await createEncryptionUtils({
  userId: ctx.user.id,
  env: ctx.env,
  purpose: API_KEY_PURPOSE,
});

// Encrypt and store API keys
const encryptedKey = await encryptionUtils.encrypt(apiKey);
```

### OAuth Token Encryption
```typescript
const OAUTH_TOKEN_PURPOSE = 'oauth-tokens';

const encryptionUtils = await createEncryptionUtils({
  userId: ctx.user.id,
  env: ctx.env,
  purpose: OAUTH_TOKEN_PURPOSE,
});

// Encrypt refresh tokens
const encryptedToken = await encryptionUtils.encrypt(refreshToken);
```

## Purpose String Best Practices

When creating purpose strings, follow these guidelines:

1. **Use descriptive purpose names**:
   - `'assistant-config'` - For assistant configuration data
   - `'user-data'` - For general user data
   - `'authentication'` - For auth-related secrets
   - `'api-keys'` - For API key storage
   - `'oauth-tokens'` - For OAuth tokens

2. **Do NOT include version in purpose string**:
   - ❌ Bad: `'assistant-config-v1'`
   - ✅ Good: `'assistant-config'`

3. **Keep it simple and consistent**:
   - Use lowercase with hyphens
   - Be descriptive but concise
   - Use the same purpose string for the same use case across your app

## Version Management

Version information should be stored separately from the encryption process. When you need to track encryption versions:

1. Store version in your database schema
2. Include version in the encrypted data structure
3. Handle version during migration, not key derivation

Example:
```typescript
// Store version with your data
await db.insert(assistantConfig).values({
  password: encrypted,
  encryptionVersion: 1, // Track version separately
  // ... other fields
});
```

## Security Considerations

1. **Master Key Security**: The `BETTER_AUTH_SECRET` must be kept secure and never exposed
2. **Key Rotation**: When rotating keys, migrate data by decrypting with old key and re-encrypting with new key
3. **Error Handling**: Always handle decryption errors gracefully
4. **Type Safety**: Use the `EncryptedData` type to ensure proper handling

## When to Use Encryption vs Hashing

**Use Encryption When:**
- You need to retrieve the original value later
- Storing passwords for external services
- Storing API keys, tokens, or secrets
- Any data that needs to be used in its original form

**Use Hashing When:**
- Storing user passwords for authentication
- You only need to verify if input matches stored value
- One-way transformation is sufficient
- See `/lib/hashing` for password hashing utilities

## Visual Flow

```
Storing Sensitive Data:
Plain Text → createEncryptionUtils → encrypt() → Encrypted Data → Store in DB
                    ↑
            userId + purpose

Retrieving Sensitive Data:
DB → Encrypted Data → createEncryptionUtils → decrypt() → Plain Text
                            ↑
                    userId + purpose
```

The key insight: The same parameters (userId, purpose) must be used for both encryption and decryption to derive the same key.