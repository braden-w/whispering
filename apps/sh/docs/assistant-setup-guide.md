# Assistant Setup Guide

This guide explains how to set up and connect to an OpenCode assistant using the simplified architecture with built-in CORS support.

## Architecture Overview

The new setup uses a simplified architecture:

1. **OpenCode Server**: Your development server with built-in CORS headers
2. **Caddy Proxy** (Optional): Only for ngrok API access to enable auto-detection
3. **ngrok Tunnel** (Optional): Provides secure internet access with authentication

```
For local development:
Browser → OpenCode (Direct connection with CORS)

For internet access:
Internet → ngrok (HTTPS) → OpenCode (Direct connection)
```

## Why This Architecture?

- **OpenCode** now includes built-in CORS headers, eliminating the need for proxy layers
- **Direct connections** improve performance and reduce complexity
- **Caddy** is only needed for the ngrok auto-detection feature (optional)
- **ngrok** still provides secure internet access with authentication when needed

## Step-by-Step Setup

### Step 1: Start OpenCode Server

Run OpenCode on your desired port (e.g., 4096):

```bash
opencode serve -p 4096
```

This starts your development server with CORS headers enabled. The server can now accept direct browser connections without proxy issues.

### Step 2: (Optional) Enable ngrok Auto-Detection

**Note**: This step is completely optional and only needed if you want the "Auto-detect" button to work in the UI.

If you want the "Auto-detect" button to work in the UI, run Caddy to proxy the ngrok API:

```bash
caddy run --config - --adapter caddyfile << EOF
:4080 {
    # Add CORS headers to all responses
    header Access-Control-Allow-Origin "http://localhost:5173"
    header Access-Control-Allow-Methods "GET, POST, OPTIONS"
    header Access-Control-Allow-Headers "*"
    header Access-Control-Allow-Credentials "true"

    # Handle preflight OPTIONS requests
    @options {
        method OPTIONS
    }
    respond @options 204

    # Proxy all other requests to ngrok API
    reverse_proxy localhost:4040
}
EOF
```

**Note**: This is completely optional. You can skip this step and manually copy the ngrok URL instead.

### Step 3: (Optional) Expose with ngrok

To access your assistant from the internet:

You have two options:

**Option 1: Separate commands** (run in different terminals)

```bash
opencode serve -p 4096
ngrok http 4096
```

**Option 2: Combined command** (runs both and stops together)

```bash
opencode serve -p 4096 & ngrok http 4096; kill $!
```

This creates a secure HTTPS tunnel directly to your OpenCode server. Authentication is now handled at the OpenCode level.

## Port Configuration

The simplified setup requires minimal port configuration:

- **OpenCode**: Runs on any available port (default: 4096)
- **ngrok API**: Always 4040 (ngrok's default API port)
- **Caddy Proxy**: Always 4080 (only for optional ngrok API access)

When creating a new assistant, the system will suggest an available port starting from 4096. The actual port is included in the URL you provide (e.g., `https://abc123.ngrok.io` or `http://localhost:4096`).

## Connection Flows

### Local Development

```
Browser → http://localhost:4096
```

Direct connection to OpenCode with CORS headers included.

### Internet Access via ngrok

```
Browser → https://abc123.ngrok.io → localhost:4096
```

ngrok provides HTTPS tunnel, OpenCode handles the requests with CORS and authentication.

### ngrok Auto-Detection (Optional)

```
Browser → localhost:4080 → localhost:4040 (ngrok API)
```

Only used by the "Auto-detect" button in the UI.

## Benefits Over Previous Architecture

1. **Simpler Setup**: Only need to run OpenCode (and optionally ngrok)
2. **Better Performance**: No proxy overhead for every API request
3. **Fewer Dependencies**: Don't need complex proxy configurations
4. **Direct URLs**: Assistant URLs work directly without transformation
5. **Less Resource Usage**: Fewer processes running on your system

## Troubleshooting

### Connection Failed

1. Ensure OpenCode is running on the configured port
2. Check that the URL format is correct
3. Verify no firewall is blocking the connection
4. For ngrok URLs, ensure credentials match

### ngrok Auto-Detection Not Working

If the "Auto-detect" button doesn't work:

1. Verify Caddy is running on port 4080 (optional step 2)
2. Check ngrok is running and accessible on port 4040
3. Or simply copy the ngrok URL manually from the ngrok output

### CORS Errors

You should not see CORS errors with the new setup. If you do:

1. Ensure you're using an OpenCode build with CORS support
2. Check that you're connecting to the correct port
3. Verify the browser isn't caching old responses

## Security Considerations

- Authentication is handled at the OpenCode level
- ngrok provides HTTPS encryption for internet connections
- Consider IP whitelisting in ngrok for additional security
- Regularly rotate passwords
- For local-only development, you can skip ngrok entirely

## Migration from Previous Setup

If you were using the previous architecture:

1. **Update OpenCode**: Ensure you have a version with built-in CORS support
2. **Remove Complex Proxies**: You no longer need the Hono proxy or complex Caddy setups
3. **Update Assistant URLs**: URLs can now be used directly without proxy transformation
4. **URL-Based Configuration**: The system now uses the full URL instead of separate port configuration
5. **Authentication**: Username is no longer required; authentication is handled at the OpenCode level

### What Changed:

**Before** (Complex proxy chain):

```
Browser → Proxy (8787) → Caddy (8080) → OpenCode (4096)
```

**Now** (Direct connection):

```
Browser → OpenCode (4096)
```

The only proxy remaining is the optional Caddy instance for ngrok API access, which is only needed for the auto-detection feature.
