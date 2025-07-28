# epicenter.sh

A web interface for managing and connecting to OpenCode servers. Connect to multiple assistants, manage sessions, and chat with AI assistants directly from your browser.

## Features

- **Assistant Management**: Connect to multiple OpenCode servers with custom configurations
- **Session Management**: Create, manage, and navigate between chat sessions
- **Real-time Status**: Live connection status and assistant information
- **Secure Authentication**: Username/password authentication with configurable defaults
- **Responsive Design**: Works seamlessly across desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js 18+ and bun
- Access to one or more OpenCode servers

### Development

1. Install dependencies:

```bash
bun install
```

2. Start the development server:

```bash
bun dev
```

3. Open [http://localhost:5173](http://localhost:5173) in your browser

### Building for Production

```bash
bun build
```

Preview the production build:

```bash
bun preview
```

## Deployment

This project is configured for Cloudflare Pages deployment:

```bash
bun deploy
```

## Usage

1. **Add an Assistant**: Click "Add Assistant" to configure a connection to your OpenCode server
2. **Connect**: Use the "Connect" button to establish a connection and view assistant details
3. **Start Chatting**: Navigate to an assistant to create sessions and start conversations
4. **Manage Settings**: Configure default credentials in the settings modal

## Tech Stack

- **Framework**: SvelteKit 2 with Svelte 5
- **Styling**: Tailwind CSS 4
- **UI Components**: Custom component library with shadcn-svelte patterns
- **State Management**: TanStack Query for server state, Svelte stores for client state
- **Deployment**: Cloudflare Pages
- **Type Safety**: TypeScript with OpenAPI code generation

## Project Structure

```
src/
├── lib/
│   ├── components/     # Reusable UI components
│   ├── query/         # API client and query definitions
│   ├── stores/        # Client-side state management
│   └── utils/         # Utility functions
├── routes/            # SvelteKit routes
│   ├── assistants/    # Assistant and session management
│   └── +layout.svelte # App shell and navigation
└── app.html          # HTML template
```
