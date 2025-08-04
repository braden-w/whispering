# Epicenter: A Database for Your Mind, Built on Plain Text

What if we could store your digital life in secure plain-text files and SQLite?

Epicenter is a database for your mind. We store your data in a plain-text folder on your machine. It's open, tweakable, and yours. Grep it, open it in Obsidian, host it wherever you like.

We’re building an open-source software ecosystem—text editor, transcription tool, personal assistant, and more—that built on top of this database. The tools share so you can make connections across disciplines. Your ideas and data are never locked in.

Own your data. Use any model. Free and open source. ❤️

## The Problem

My thoughts are scattered across a dozen different apps. I journal into an app I don't trust. I plan my week in a calendar I'll abandon next month. My notes drift aimlessly in systems I've outgrown. And every time I switch apps, I forget what I was working on.

I'm tired of switching tools just to finish a single thought.

## The Solution

Epicenter is an open-source suite of tools built around a single idea: **Creativity thrives when you blur the lines between disciplines.**

Your tools should reflect that. Most tools divide you—one for writing, one for planning, one for research. We're building tools that share a folder and talk to each other—so you can stay in flow across every kind of work.

## How It Works

All Epicenter tools share a single memory: **a plain-text folder on your machine**. 

Open it in any editor. Grep it. Sync it. Host it wherever you like. Your data is never locked in.

In a world where every app wants to trap you and your data, we're building the opposite.

## Current Tools

### 🤖 [epicenter.sh](./apps/sh)
A local-first assistant you can chat with. It lives in your folder, and we want to make it the access point to everything you've ever written, thought, or built. Your second brain becomes your dialogue partner.

- [Full documentation →](./apps/sh)

### 🎙️ [Whispering](./apps/whispering)
Press shortcut → speak → get text. A desktop transcription app that cuts out the middleman (bring your own API key).

We eventually will enable transcription to feed directly into your shared memory.
- [Full documentation →](./apps/whispering)

### 🛠️ [Epicenter CLI](./apps/cli)
The command-line glue that connects everything. Smart defaults, automatic configuration, built for hackers.

## Where We're Headed

A growing software ecosystem—text editor, personal CRM, and more—all built around your shared local memory. Tools for people who read, write, build, and connect.

A renaissance workflow, built on plain text and real ownership.

## Join Us

**We're looking for contributors.**

If you're passionate about open source, local-first software, or are just a cracked Svelte/TypeScript developer—we'd love to build with you.

If you think like a generalist, build like a hacker, and value tools that respect your mind:

→ [Join our Discord and DM me](https://discord.gg/YWa5YVUSxa)  

## Quick Start

```bash
# Try epicenter.sh
bunx @epicenter/cli sh

# Or run locally
cd apps/sh && bun dev

# Download Whispering
# https://github.com/braden-w/whispering/releases
```

## Technical Details

**Built with:** Svelte 5, TypeScript, Tauri, Bun  
**Philosophy:** Local-first, plain text, open source  
**Architecture:** Monorepo with shared packages

```bash
# Development
git clone https://github.com/braden-w/whispering.git epicenter
cd epicenter && bun install
bun dev
```

## About Me

At 18, I taught myself to code while studying ethics, politics, and economics at Yale. Since then, I've averaged ~10k commits/year and worked at three YC startups. I wrote my 65-page senior thesis on open-source governance and digital platforms.

I care deeply about data ownership, open-source, and interdisciplinary thinking. I want this project to reflect that.

## License

[MIT](LICENSE). Build on it. Fork it. Make it yours. Please contribute if you can.

---

**Contact:** [github@bradenwong.com](mailto:github@bradenwong.com) | [Discord](https://discord.gg/YWa5YVUSxa) | [@braden_wong](https://twitter.com/braden_wong)