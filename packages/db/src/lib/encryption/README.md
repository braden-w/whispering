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

The `createEncryptionUtils` factory creates encryption utilities bound to a specific user and context:

```typescript
const encryptionUtils = await createEncryptionUtils({
  userId: 'user-123',
  env: ctx.env,
  salt: 'my-feature-v1',
  purpose: 'api-key-encryption'
});
```

The factory:
1. **Derives a unique key** by combining:
   - Master key from `BETTER_AUTH_SECRET`
   - Salt (for versioning)
   - User ID (for user isolation)
   - Purpose (for context separation)
2. **Returns utility functions** that use this key

## Key Derivation Pattern

```
Master Key + Salt + User ID + Purpose → SHA256 → Base64 → Encryption Key
```

This ensures:
- **User isolation**: Each user's data is encrypted with a different key
- **Context separation**: Different features use different keys
- **Version control**: Salt allows key rotation when needed

## Usage Examples

### Assistant Password Encryption
```typescript
// Define constants for this feature
const ASSISTANT_PASSWORD_SALT = 'epicenter-assistant-password-v1';
const ASSISTANT_PASSWORD_PURPOSE = 'assistant-password-encryption';

// Create utilities
const encryptionUtils = await createEncryptionUtils({
  userId: ctx.user.id,
  env: ctx.env,
  salt: ASSISTANT_PASSWORD_SALT,
  purpose: ASSISTANT_PASSWORD_PURPOSE,
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
const API_KEY_SALT = 'epicenter-api-keys-v1';
const API_KEY_PURPOSE = 'api-key-encryption';

const encryptionUtils = await createEncryptionUtils({
  userId: ctx.user.id,
  env: ctx.env,
  salt: API_KEY_SALT,
  purpose: API_KEY_PURPOSE,
});

// Encrypt and store API keys
const encryptedKey = await encryptionUtils.encrypt(apiKey);
```

### OAuth Token Encryption
```typescript
const OAUTH_TOKEN_SALT = 'epicenter-oauth-tokens-v1';
const OAUTH_TOKEN_PURPOSE = 'oauth-token-encryption';

const encryptionUtils = await createEncryptionUtils({
  userId: ctx.user.id,
  env: ctx.env,
  salt: OAUTH_TOKEN_SALT,
  purpose: OAUTH_TOKEN_PURPOSE,
});

// Encrypt refresh tokens
const encryptedToken = await encryptionUtils.encrypt(refreshToken);
```

## Security Considerations

1. **Master Key Security**: The `BETTER_AUTH_SECRET` must be kept secure and never exposed
2. **Key Rotation**: Change the salt version to rotate keys (requires data migration)
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
            userId + salt + purpose

Retrieving Sensitive Data:
DB → Encrypted Data → createEncryptionUtils → decrypt() → Plain Text
                            ↑
                    userId + salt + purpose
```

The key insight: The same parameters (userId, salt, purpose) must be used for both encryption and decryption to derive the same key.