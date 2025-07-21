# Workspace Setup Guide

This guide explains how to set up an OpenCode workspace with the three-layer architecture that enables secure remote access with proper CORS handling.

## Architecture Overview

The setup uses three layers:

1. **OpenCode Server** (Private Port): Your actual development server running locally
2. **Caddy Proxy** (Public Port): Adds CORS headers for browser compatibility
3. **ngrok Tunnel**: Provides secure internet access with authentication

```
Internet → ngrok (HTTPS) → Caddy (Public Port) → OpenCode (Private Port)
```

## Why This Architecture?

- **OpenCode** doesn't include CORS headers, which browsers require for cross-origin requests
- **Caddy** acts as a reverse proxy, adding the necessary CORS headers
- **ngrok** provides secure internet access with basic authentication

## Step-by-Step Setup

### Step 1: Start OpenCode Server

Run OpenCode on the private port (automatically generated, e.g., 50123):

```bash
opencode serve -p 50123
```

This starts your development server locally. The port is randomly generated to avoid conflicts.

### Step 2: Start Caddy Proxy

Run Caddy on the public port (e.g., 51234) to add CORS headers:

```bash
caddy run --config - --adapter caddyfile << 'EOF'
:51234 {
    header Access-Control-Allow-Origin "*"
    header Access-Control-Allow-Methods "GET, POST, OPTIONS"
    header Access-Control-Allow-Headers "*"
    header Access-Control-Allow-Credentials "true"
    
    @options {
        method OPTIONS
    }
    respond @options 204
    
    reverse_proxy localhost:50123
}
EOF
```

This command:
- Listens on the public port (51234)
- Adds CORS headers to all responses
- Handles preflight OPTIONS requests
- Proxies all other requests to OpenCode on the private port

### Step 3: Expose with ngrok

Finally, expose the public port to the internet with authentication:

```bash
ngrok http 51234 --basic-auth="username:password"
```

This creates a secure HTTPS tunnel with basic authentication.

## Port Configuration

The system automatically generates two different random ports:

- **Private Port**: Used by OpenCode (49152-65535 range)
- **Public Port**: Used by Caddy (49152-65535 range)

The modal includes port availability checking to ensure the generated ports are free.

## Troubleshooting

### Port Already in Use

The system automatically checks if ports are available. If you see a warning:
1. Click "Regenerate Available Ports" in the configuration section
2. Or manually change the port numbers

### CORS Errors

If you still see CORS errors:
1. Ensure Caddy is running and properly configured
2. Check that you're connecting to the ngrok URL, not directly to localhost
3. Verify the proxy chain is working: ngrok → Caddy → OpenCode

### Connection Failed

1. Verify all three services are running
2. Check the ngrok URL is correct (look for `Forwarding https://...`)
3. Ensure credentials match what you provided to ngrok
4. Test the connection using the "Test Connection" button

## Security Considerations

- Always use strong passwords for ngrok basic authentication
- The setup uses HTTPS via ngrok for encrypted connections
- Consider IP whitelisting in ngrok for additional security
- Regularly rotate credentials

## Alternative Setups

### Development Only (No Internet Access)

If you only need local access, you can skip ngrok:
1. Run OpenCode on any port
2. Access directly at `http://localhost:PORT`

### Direct ngrok (No CORS Support)

If your client doesn't need CORS headers:
```bash
opencode serve -p 50123
ngrok http 50123 --basic-auth="username:password"
```

Note: This won't work with browser-based clients due to CORS restrictions.