import { hashPassword, verifyPassword } from 'better-auth/crypto';

/**
 * Hash a password using Better Auth's scrypt implementation.
 *
 * This creates a one-way hash that cannot be reversed to get the original password.
 * The hash includes a salt to prevent rainbow table attacks.
 *
 * @example
 * ```typescript
 * // When user registers or changes password
 * const plainPassword = "mySecretPassword123";
 * const hash = await hashPassword(plainPassword);
 * // Returns: "YmFzZTY0c2FsdA==:aGFzaGVkUGFzc3dvcmRIZXJl..."
 * //           ↑ salt (base64) ↑ : ↑ hash (base64) ↑
 *
 * // Store this hash in your database
 * await db.insert(assistantConfig).values({
 *   password: hash, // Never store the plain password!
 *   // ... other fields
 * });
 * ```
 *
 * @param password - The plain text password to hash
 * @returns A string in format "salt:hash" (both base64 encoded)
 *
 * @details
 * How it works internally:
 * 1. Generates a random 16-byte salt (prevents identical passwords from having same hash)
 * 2. Runs scrypt algorithm with:
 *    - N=16384 (CPU/memory cost parameter)
 *    - r=8 (block size)
 *    - p=1 (parallelization factor)
 * 3. Produces a 32-byte key
 * 4. Returns salt and hash concatenated with ':'
 *
 * Why scrypt?
 * - Memory-hard: Requires ~16MB RAM, making GPU/ASIC attacks expensive
 * - Time-hard: Takes ~100-200ms, slowing brute force attempts
 * - Proven: Battle-tested algorithm used by many auth systems
 */
export { hashPassword };

/**
 * Verify a password against a stored hash.
 *
 * This checks if a plain text password matches a previously hashed password
 * without ever storing or comparing the plain text versions.
 *
 * @example
 * ```typescript
 * // When user logs in
 * const userInput = "mySecretPassword123";
 * const storedHash = "YmFzZTY0c2FsdA==:aGFzaGVkUGFzc3dvcmRIZXJl..."; // From DB
 *
 * const isValid = await verifyPassword({
 *   password: userInput,
 *   hash: storedHash
 * });
 *
 * if (isValid) {
 *   // Password is correct, allow access
 * } else {
 *   // Password is wrong, deny access
 * }
 * ```
 *
 * @param options.password - The plain text password to verify
 * @param options.hash - The stored hash from the database
 * @returns True if password matches, false otherwise
 *
 * @details
 * How verification works:
 * 1. Extracts the salt from the stored hash (before the ':')
 * 2. Hashes the input password using that same salt
 * 3. Compares the new hash with the stored hash (after the ':')
 * 4. Uses timing-safe comparison to prevent timing attacks
 *
 * Security notes:
 * - Never logs or stores the plain password
 * - Comparison takes same time whether passwords match or not
 * - Invalid hash format returns false (doesn't throw)
 */
export { verifyPassword };

/**
 * Common password hashing flow:
 *
 * ```
 * REGISTRATION/PASSWORD CHANGE:
 * User Input → "password123" → hashPassword() → "salt:hash" → Store in DB
 *
 * LOGIN/VERIFICATION:
 * User Input → "password123" ┐
 *                            ├→ verifyPassword() → true/false
 * Database   → "salt:hash" ──┘
 * ```
 *
 * Best Practices:
 * 1. Always hash passwords before storing
 * 2. Never log password values (even hashed ones)
 * 3. Use HTTPS to protect passwords in transit
 * 4. Consider rate limiting login attempts
 * 5. Hash on the server, never trust client-side hashing alone
 */
