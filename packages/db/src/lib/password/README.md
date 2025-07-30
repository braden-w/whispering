# Password Hashing

This module re-exports Better Auth's password hashing utilities. We use the same scrypt algorithm that Better Auth uses to ensure consistency across the application.

## How Password Hashing Works

Password hashing is a one-way transformation that converts a plain text password into a scrambled string. You can't reverse it to get the original password back.

```typescript
// User enters: "mySecretPassword123"
// After hashing: "YmFzZTY0c2FsdA==:aGFzaGVkUGFzc3dvcmRIZXJl..."
```

## How Better Auth's scrypt Hashing Works

When you call `hashPassword("mySecretPassword123")`, here's what happens:

1. **Generate Salt**: Creates a random 16-byte salt (prevents rainbow table attacks)
2. **Run scrypt Algorithm**: Combines password + salt through CPU/memory intensive operations
3. **Format Output**: Returns `salt:hash` (both base64 encoded)

```typescript
const hash = await hashPassword("mySecretPassword123");
// Result: "YmFzZTY0c2FsdA==:aGFzaGVkUGFzc3dvcmRIZXJl..."
//          ↑ salt (base64) ↑ : ↑ hash (base64) ↑
```

## Where is the Hash Stored?

In your database! When a user sets a password:

```typescript
// User provides: "mySecretPassword123"
const hashedPassword = await hashPassword("mySecretPassword123");

// Store in database
await db.insert(assistantConfig).values({
  userId: "user123",
  password: hashedPassword, // Store the hash, not "mySecretPassword123"
  // ... other fields
});
```

## How Password Verification Works

When a user tries to log in:

```typescript
// User enters: "mySecretPassword123"
// Database has: "YmFzZTY0c2FsdA==:aGFzaGVkUGFzc3dvcmRIZXJl..."

const isValid = await verifyPassword({
  password: "mySecretPassword123", // What user typed
  hash: "YmFzZTY0c2FsdA==:aGFzaGVkUGFzc3dvcmRIZXJl..." // From database
});
```

Here's what `verifyPassword` does:
1. **Extract salt** from the stored hash (before the `:`)
2. **Hash the input password** with that same salt
3. **Compare** the new hash with the stored hash
4. **Return** true if they match, false otherwise

## Why This is Secure

- **One-way**: Can't reverse the hash to get the password
- **Salt prevents rainbow tables**: Each password gets a unique salt
- **scrypt is slow on purpose**: Makes brute force attacks expensive
- **Memory-hard**: Requires lots of RAM, making GPU attacks harder

## Visual Flow

```
Registration:
User types → "password123" → hashPassword() → "salt:hash" → Store in DB

Login:
User types → "password123" → verifyPassword() → Compare with DB → ✓ or ✗
                                    ↑
                            "salt:hash" from DB
```

The key point: You never store the actual password, only the hash. Even if someone steals your database, they can't get the original passwords!