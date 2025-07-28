# Epicenter CLI

The unified command-line interface for the [epicenter.sh](https://epicenter.sh) ecosystem.

## Requirements

This CLI requires [Bun](https://bun.sh). Install it first:

```bash
curl -fsSL https://bun.sh/install | bash
```

## Usage

No installation needed! Just use `bunx`:

```bash
bunx @epicenter/cli sh
```

### Start OpenCode Server with Smart Defaults

The `sh` command provides intelligent opencode integration with automatic configuration:

```bash
# Simple usage with all smart defaults
bunx @epicenter/cli sh

# The CLI automatically:
# - Discovers an available port (starting from 4096)
# - Enables Cloudflare tunnel
# - Sets CORS origins to https://epicenter.sh
# - Opens epicenter.sh assistant in your browser
```

### Customize Settings

You can override any of the smart defaults:

```bash
# Use a specific port
bunx @epicenter/cli sh --port 8080

# Disable tunnel
bunx @epicenter/cli sh --no-tunnel

# Add additional CORS origins
bunx @epicenter/cli sh --cors-origins https://epicenter.sh https://custom.domain.com

# Disable auto-opening browser
bunx @epicenter/cli sh --no-open
```

### Examples

```bash
# Default: Auto port discovery, tunnel, CORS, and auto-open
bunx @epicenter/cli sh

# Custom port with tunnel disabled
bunx @epicenter/cli sh --port 3000 --no-tunnel

# Multiple CORS origins
bunx @epicenter/cli sh --cors-origins https://epicenter.sh https://localhost:3000
```

## How It Works

The Epicenter CLI imports the opencode serve functionality from the [`@epicenter/opencode`](https://github.com/getepicenter/opencode) package and wraps it with intelligent defaults:

1. **Port Discovery**: Automatically finds an available port starting from 4096
2. **Smart Defaults**: Pre-configures tunnel, CORS, and browser opening for epicenter.sh
3. **Override Flexibility**: All defaults can be customized via command-line flags

## Technical Details

- **Port Range**: Searches for available ports from 4096-4196
- **Default CORS**: `https://epicenter.sh`
- **Tunnel**: Enabled by default using `cloudflared`
- **Auto-open**: Opens epicenter.sh assistant automatically when tunnel is active

## Development

```bash
# Install dependencies
bun install

# Run in development mode
bun run dev

# Build for production
bun run build

# Type checking
bun run typecheck
```

## Architecture

- **CLI Framework**: Built with `yargs` for robust command-line handling
- **Port Discovery**: Uses Node.js `net` module to test port availability
- **OpenCode Integration**: Imports and wraps functionality from `@epicenter/opencode`

## Related Projects

- [`@epicenter/opencode`](https://github.com/getepicenter/opencode) - OpenCode fork with epicenter.sh integration
- [opencode](https://github.com/sst/opencode) - Original opencode project
