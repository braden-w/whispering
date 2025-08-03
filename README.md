# Epicenter

Own your data. Use any model. Free and open source. ❤️

## What is Epicenter?

Epicenter is an ecosystem of open-source tools that put you in control of your AI interactions. No middlemen, no subscriptions, no data collection—just direct connections to the AI providers of your choice.

We believe AI tools should be:
- **Transparent**: Open source code you can audit
- **Private**: Your data stays on your devices
- **Affordable**: Pay providers directly, not middleman markups
- **Flexible**: Use any model, any provider, any deployment

## The Epicenter Ecosystem

### 🎙️ [Whispering](./apps/whispering)
Press shortcut → speak → get text. A desktop transcription app that cuts out the middleman.
- Pay actual API costs (as low as $0.02/hour)
- Your audio never touches our servers
- Works with Groq, OpenAI, ElevenLabs, or completely offline
- [Full documentation →](./apps/whispering)

### 🤖 [epicenter.sh](./apps/sh)
Self-hosted AI coding assistants with a clean web interface.
- Connect to OpenCode servers locally or through tunnels
- Your code stays on your machine
- Flexible deployment options
- [Full documentation →](./apps/sh)

### 🛠️ [Epicenter CLI](./apps/cli)
The unified command-line interface for the Epicenter ecosystem.
- Smart defaults for OpenCode integration
- Automatic port discovery and tunneling
- Zero-config setup
- [Full documentation →](./apps/cli)

## Quick Start

### Whispering
```bash
# Download from GitHub releases
# https://github.com/braden-w/whispering/releases/latest

# Or try in browser
# https://whispering.bradenwong.com
```

### epicenter.sh
```bash
# Run locally
cd apps/sh
bun install
bun dev
```

### Epicenter CLI
```bash
# No installation needed! Just run:
bunx @epicenter/cli sh
```

## Why Epicenter?

I was tired of AI tools that:
- Charge 10-100x markup on API costs
- Store your data on their servers
- Lock you into their ecosystem
- Hide their code and business model

So I built Epicenter—a collection of tools that respect your privacy, your wallet, and your freedom to choose.

## Development

This is a monorepo managed with Turborepo and Bun workspaces.

### Prerequisites
- [Bun](https://bun.sh) (v1.2.19+)
- Node.js 18+

### Setup
```bash
# Clone the repository
git clone https://github.com/braden-w/whispering.git epicenter
cd epicenter

# Install dependencies
bun install

# Run all apps in development
bun dev

# Or run a specific app
cd apps/whispering && bun dev
cd apps/sh && bun dev
cd apps/cli && bun dev
```

### Project Structure
```
epicenter/
├── apps/
│   ├── whispering/   # Desktop transcription app
│   ├── sh/           # Web interface for AI assistants
│   ├── cli/          # Command-line tools
│   └── api/          # Shared API services
├── packages/         # Shared packages
│   ├── ui/          # Shared UI components
│   ├── constants/   # Shared constants
│   └── utils/       # Shared utilities
└── docs/            # Documentation
```

### Building
```bash
# Build all apps
bun run build

# Build specific app
cd apps/whispering && bun run build
```

### Version Management
```bash
# Update version across all packages
bun run bump-version <new-version>
```

## Contributing

We welcome contributions to any part of the Epicenter ecosystem! Whether it's:
- New AI service integrations
- UI/UX improvements
- Bug fixes
- Documentation

See individual app READMEs for specific contribution guidelines.

## License

All Epicenter tools are released under the [MIT License](LICENSE). Use them, modify them, learn from them, and build upon them freely.

## Support

- Community: [Discord](https://discord.gg/YWa5YVUSxa)
- Issues: [GitHub Issues](https://github.com/braden-w/whispering/issues)
- Email: [whispering@bradenwong.com](mailto:whispering@bradenwong.com)

---

Built with ❤️ for the open-source community. Because AI tools should work for you, not the other way around.