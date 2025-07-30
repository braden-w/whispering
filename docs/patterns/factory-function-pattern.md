# Factory Function Pattern: Reducing Repetitive Parameters

## The Problem

Sometimes you have multiple related functions that all require the same parameters. This leads to repetitive code where you're passing the same values over and over again.

## Real-World Example: Password Encryption Utilities

### Before: Repetitive Parameters

```typescript
// packages/db/src/lib/assistant-password/index.ts


/**
 * Encrypted password type for type safety
 */
export type EncryptedPassword = string & Brand<'EncryptedPassword'>;

/**
 * Salt version for key derivation. Increment this when rotating keys.
 */
const SALT = 'epicenter-assistant-password-v1';

/**
 * Purpose identifier for key derivation context
 */
const PURPOSE = 'assistant-password-encryption';

async function deriveKey({
  userId,
  env,
}: { userId: string; env: CloudflareEnv }): Promise<string> {
  const masterKey = env.BETTER_AUTH_SECRET;
  const keyMaterial = `${masterKey}:${SALT}:user:${userId}:${PURPOSE}`;
  return hashToBase64(keyMaterial);
}

export async function encryptAssistantPassword({
  password,
  userId,
  env,
}: {
  password: string;
  userId: string;
  env: CloudflareEnv;
}): Promise<EncryptedPassword> {
  const key = await deriveKey({ userId, env });
  const encrypted = await symmetricEncrypt({ key, data: password });
  return encrypted as EncryptedPassword;
}

export async function decryptAssistantPassword({
  encryptedPassword,
  userId,
  env,
}: {
  encryptedPassword: EncryptedPassword;
  userId: string;
  env: CloudflareEnv;
}): Promise<string> {
  const key = await deriveKey({ userId, env });
  return symmetricDecrypt({ key, data: encryptedPassword });
}
```

#### Usage Before (TRPC Routes)

```typescript
// apps/api/src/trpc/routers/assistant-config.ts

// In the list endpoint
const decrypted = await decryptAssistantPassword({
  encryptedPassword: config.password,
  userId: ctx.user.id,
  env: ctx.env,
});

// In the create endpoint
encryptedInput.password = await encryptAssistantPassword({
  password: input.password,
  userId: ctx.user.id,
  env: ctx.env,
});

// In the update endpoint
encryptedUpdateData.password = await encryptAssistantPassword({
  password: updateData.password,
  userId: ctx.user.id,
  env: ctx.env,
});
```

Notice how we're passing `userId` and `env` to every single function call. This is repetitive and error-prone. The functions are also similar in usage.

### After: Factory Function Pattern

Let's move these functions from the top level into a factory pattern. We take in the shared params and output functions that no longer need them. It's better too because their behavior should be colocated

```typescript
// packages/db/src/lib/assistant-password/index.ts

export function createAssistantPasswordUtils({
  userId,
  env,
}: {
  userId: string;
  env: CloudflareEnv;
}) {
  async function deriveKey(): Promise<string> {
    const masterKey = env.BETTER_AUTH_SECRET;
    const keyMaterial = `${masterKey}:${SALT}:user:${userId}:${PURPOSE}`;
    return hashToBase64(keyMaterial);
  }

  async function encrypt(password: string): Promise<EncryptedPassword> {
    const key = await deriveKey();
    const encrypted = await symmetricEncrypt({ key, data: password });
    return encrypted as EncryptedPassword;
  }

  async function decrypt(encryptedPassword: EncryptedPassword): Promise<string> {
    const key = await deriveKey();
    return symmetricDecrypt({ key, data: encryptedPassword });
  }

  return {
    deriveKey,
    encrypt,
    decrypt,
  };
}
```

or

```typescript
export function createAssistantPasswordUtils({
	userId,
	env,
}: {
	userId: string;
	env: Pick<CloudflareEnv, 'BETTER_AUTH_SECRET'>;
}) {
	const deriveKey = async (): Promise<string> => {
		const masterKey = env.BETTER_AUTH_SECRET;
		const keyMaterial =
			`${masterKey}:${SALT}:user:${userId}:${PURPOSE}` as const;
		return hashToBase64(keyMaterial);
	};

	return {
		async encrypt(password: string): Promise<EncryptedPassword> {
			const key = await deriveKey();
			const encrypted = await symmetricEncrypt({ key, data: password });
			return encrypted as EncryptedPassword;
		},

		async decrypt(encryptedPassword: EncryptedPassword): Promise<string> {
			const key = await deriveKey();
			return symmetricDecrypt({ key, data: encryptedPassword });
		},
	};
}
```

#### Usage After (TRPC Routes)

```typescript
// apps/api/src/trpc/routers/assistant-config.ts

// Create password utils once per request
const passwordUtils = createAssistantPasswordUtils({
  userId: ctx.user.id,
  env: ctx.env,
});

// In the list endpoint
const decrypted = await passwordUtils.decrypt(config.password);

// In the create endpoint
encryptedInput.password = await passwordUtils.encrypt(input.password);

// In the update endpoint
encryptedUpdateData.password = await passwordUtils.encrypt(updateData.password);
```

## Benefits of the Factory Pattern

1. Pass shared parameters once, not on every call
2. **Encapsulation**: Related functions are grouped together
3. **Type Safety**: TypeScript ensures all functions have access to the same context
4. **Cleaner API**: Function calls are simpler and more readable
5. **Closure Power**: The inner functions have access to the factory parameters via closure

## When to Use This Pattern

Use the factory function pattern when:

- You have 2+ related functions that share the same parameters
- The shared parameters don't change between function calls
- The functions logically belong together as a unit
- You find yourself passing the same values repeatedly

## Implementation Tips

1. **Name your factory well**: Use `create` prefix (e.g., `createAssistantPasswordUtils`)
2. **Return an object**: Makes it easy to destructure just what you need
3. **Keep it focused**: Only include truly related functions
4. **Document the factory**: Explain what context it captures

## Conclusion

The factory function pattern is a simple but powerful way to reduce parameter repetition and create cleaner, more maintainable APIs. When you find yourself passing the same parameters to multiple related functions, consider wrapping them in a factory function.

## The Pattern Evolves: Two Directions

Looking at this factory pattern, I'm starting to see how we could extract this further into more generalizable patterns. There are two interesting directions we could take this:

### Direction 1: Extract constants into factory function parameters, make it even more general

We could make the factory more configurable by moving salt and purpose into parameters instead of file-level constants. This way, it is no longer a factory just for Assistant passwords, but you could make it for any password:

```typescript
export function createPasswordUtils({
  userId,
  env,
  salt,
  purpose,
}: {
  userId: string;
  env: Pick<CloudflareEnv, 'BETTER_AUTH_SECRET'>;
  salt: string;
  purpose: string;
}) {
  const deriveKey = async (): Promise<string> => {
    const masterKey = env.BETTER_AUTH_SECRET;
    const keyMaterial = `${masterKey}:${salt}:user:${userId}:${purpose}`;
    return hashToBase64(keyMaterial);
  };

  return {
    async encrypt(password: string): Promise<EncryptedPassword> {
      const key = await deriveKey();
      const encrypted = await symmetricEncrypt({ key, data: password });
      return encrypted as EncryptedPassword;
    },

    async decrypt(encryptedPassword: EncryptedPassword): Promise<string> {
      const key = await deriveKey();
      return symmetricDecrypt({ key, data: encryptedPassword });
    },
  };
}

// Usage for different contexts
const assistantPasswordUtils = createPasswordUtils({
  userId: ctx.user.id,
  env: ctx.env,
  salt: 'epicenter-assistant-password-v1',
  purpose: 'assistant-password-encryption',
});

const apiKeyUtils = createPasswordUtils({
  userId: ctx.user.id,
  env: ctx.env,
  salt: 'epicenter-api-keys-v1',
  purpose: 'api-key-encryption',
});
```

This approach:
- Makes the factory reusable for different encryption contexts
- Keeps the key derivation logic centralized
- Allows versioning through the salt parameter
- Makes the purpose explicit and configurable

### Direction 2: Inversion of Control (Generic Crypto Factory)

Instead of baking the key derivation into `createAssistantPasswordUtils`, we could invert control and create a generic `createPasswordUtils` that just takes a key:

```typescript
// Generic password utility factory
export function createPasswordUtils(key: string) {
  return {
    async encrypt(password: string): Promise<EncryptedPassword> {
      const encrypted = await symmetricEncrypt({ key, data: password });
      return encrypted as EncryptedPassword;
    },

    async decrypt(encryptedPassword: EncryptedPassword): Promise<string> {
      return symmetricDecrypt({ key, data: encryptedPassword });
    },
  };
}
```
This way, it is up to the caller of `createPasswordUtils` to create the hash. This is beneficial if you want to make the key creation more bespoke. Instead of giving ingredients and the creation of Base64 is in the factory function, we move all of it out. There is less standardization on how the key is formed. This gives you a lot of flexibility:

```typescript
// Usage in TRPC context or route
async function deriveAssistantKey(userId: string, env: CloudflareEnv): Promise<string> {
  const masterKey = env.BETTER_AUTH_SECRET;
  const keyMaterial = `${masterKey}:assistant-password-v1:user:${userId}:assistant-password-encryption`;
  return hashToBase64(keyMaterial);
}

// In your TRPC route
const key = await deriveAssistantKey(ctx.user.id, ctx.env);
const passwordUtils = createPasswordUtils(key);
```

This approach separates the concerns:
- Key derivation logic can live in TRPC context or be reused across different contexts
- The crypto utilities become completely generic and reusable
- Different parts of your app can use different key derivation strategies


## Which Direction to Choose?

**Choose Direction 1 (Configuration-Driven) when:**
- You have a standard key derivation pattern across your app
- You want to centralize key derivation logic
- Different contexts mainly differ in salt/purpose but follow the same pattern
- You value consistency over flexibility

**Choose Direction 2 (Inversion of Control) when:**
- You need maximum flexibility in key derivation
- Different parts of your app have vastly different key strategies
- You want to keep crypto utilities completely pure and context-free
- Key derivation might involve async operations beyond simple hashing

In our case, direction 1 might be better initially since it maintains consistency while adding flexibility. We want to bake in logic for creation of salt. You can always refactor to full inversion of control later if needed.

One final thing you can do on top of Direction 1 is move derivation of the key from calling encrypt or decrypt and instead move it into calling the factory function:


```typescript
export async function createPasswordUtils({
  userId,
  env,
  salt,
  purpose,
}: {
  userId: string;
  env: Pick<CloudflareEnv, 'BETTER_AUTH_SECRET'>;
  salt: string;
  purpose: string;
}) {
  const masterKey = env.BETTER_AUTH_SECRET;
  const keyMaterial = `${masterKey}:${salt}:user:${userId}:${purpose}`;
  const key = await hashToBase64(keyMaterial);

  return {
    async encrypt(password: string): Promise<EncryptedPassword> {
      const encrypted = await symmetricEncrypt({ key, data: password });
      return encrypted as EncryptedPassword;
    },

    async decrypt(encryptedPassword: EncryptedPassword): Promise<string> {
      return symmetricDecrypt({ key, data: encryptedPassword });
    },
  };
}
```

Notice how there is no more need for `deriveKey`, we inline it. The downside is now the factory function becomes asynchronous. But since we know we don't need to lazily compute `key`, this might be our final form.