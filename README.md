# Whispering: The Lightweight Ergonomic Wrapper for OpenAI Whisperer API

Whispering is an open-source project designed to streamline your voice-to-text experience, increase your writing productivity, and simplify your workflow. By leveraging the OpenAI Whisperer API, Whispering enables you to record your voice, transcribe it, and copy the resulting text directly to your clipboard for seamless pasting.

![Whispering Banner](https://whispering.bradenwong.com/assets/Banner.png)

## Table of Contents

- [Features](#features)
- [Whispering Web and Desktop App](#whispering-web-and-desktop-app)
  - [Demo](#demo)
  - [Accessing Whispering Web App](#accessing-whispering-web-app)
  - [Download Desktop App](#download-desktop-app)
  - [Built With](#built-with-web-desktop-app)
  - [Getting Started](#getting-started-web-desktop-app)
- [Whispering Chrome Extension](#whispering-chrome-extension)
  - [Description](#description)
  - [Installation](#installation)
  - [Usage](#usage)
  - [Built With](#built-with-chrome-extension)
  - [Getting Started with Development](#getting-started-with-development)
- [Contributing](#contributing)
- [License](#license)
- [Support and Feedback](#support-and-feedback)

## Features

- Reliable global keyboard shortcut: <kbd>Control</kbd> + <kbd>Shift</kbd> + <kbd>X</kbd> or <kbd>Command</kbd> + <kbd>Shift</kbd> + <kbd>X</kbd> to start recording on any website
- Effortless pasting: After transcription is completed, it will be inserted into the corresponding textbox. There is also an option to automatically copy it into your clipboard
- **Save time** by eliminating manual transcribing and excessive button clicks
- **Boost productivity** with fewer button clicks and context switching
- **Simplify workflows** with effortless recording, stopping, and pasting of transcribed text

## Whispering Web and Desktop App

The Whispering web and desktop app can be found under `apps/web-desktop-app`.

### Demo

[https://user-images.githubusercontent.com/13159333/227335178-7d926d84-f752-4cbd-84af-0b2dcc483c66.mp4](https://user-images.githubusercontent.com/13159333/227335178-7d926d84-f752-4cbd-84af-0b2dcc483c66.mp4)

### Accessing Whispering Web App

To start using Whispering web app, click the button below:

[![Open Web App](https://img.shields.io/badge/Open-Web%20App-blue)](https://whispering.bradenwong.com/)

### Download Desktop App

To download the Whispering desktop app, click the button below:

[![Download Desktop App](https://img.shields.io/badge/Download-Desktop%20App-blue)](https://github.com/braden-w/whispering/releases)

### Built With (Web and Desktop App)

Whispering web and desktop app is built using the following technologies and libraries:

- [Tauri](https://tauri.studio/en/docs/intro/): A framework for building lightweight, secure, and fast cross-platform applications with web technologies.
- [SvelteKit](https://kit.svelte.dev/docs): A framework for building web applications and the Tauri frontend.
- [svelte-french-toast](https://svelte-french-toast.com): A simple, customizable toast library for Svelte applications.
- [TailwindCSS](https://tailwindcss.com/docs): A utility-first CSS framework for rapidly building custom user interfaces.
- [Cloudflare Pages](https://developers.cloudflare.com/): A global cloud platform for deploying static pages.

### Getting Started (Web and Desktop App)

To set up the project on your local machine, follow these steps:

1. Clone the repository: `git clone https://github.com/braden-w/whispering.git`
2. Change into the project directory: `cd whispering`
3. Install the necessary dependencies: `pnpm i`
4. Run the development server: `pnpm tauri dev`
5. The desktop app should open for local development. To develop the web app, open your browser and navigate to `http://localhost:5173`.

## Whispering Chrome Extension

The Whispering Chrome extension can be found under `apps/chrome-extension`.

### Description

Whispering Chrome extension offers two key functionalities:

- **Access Whisper API**: This feature allows you to access the Whisper API from any webpage, thus enabling easy voice transcription without disrupting your browsing context.
- **Recording Button for Chat GPT**: The extension adds a handy recording button within the Chat GPT interface, enabling you to record your voice and generate transcriptions directly within the chat.

### Installation

To install the Whispering Chrome extension, follow these steps:

1. Visit the [GitHub release page](https://github.com/braden-w/whispering-extension/releases) and download the latest `Whispering_Extension_vX.Y.Z.zip` file.
2. Extract the contents of the .zip file to a preferred location on your computer where you'd like to store the extension files.
3. Open Google Chrome and navigate to the Extensions page by clicking on the three-dot menu in the top right corner, then select "More tools" > "Extensions" or enter `chrome://extensions/` in the address bar.
4. On the Extensions page, enable the "Developer mode" toggle located in the top right corner.
5. Click the "Load unpacked" button that appears after enabling Developer mode.
6. In the file explorer dialog that opens, find and select the folder where you extracted the contents of the .zip file.
7. Click "Open" or "Select Folder" (depending on your operating system), and the Whispering Extension will be installed in your browser.

After completing these steps, you should see the Whispering Extension icon in your browser's toolbar, and you're ready to enjoy the voice-to-text functionality across any website.

### Usage

Once installed, you will find a Whispering icon on the Chrome extensions bar. Click on this icon to open the extension. To use the Whisper API feature, simply click the 'Start Recording' button to record your voice, and then 'Stop Recording' when you're done. Your transcription will appear in the text box below.

For using the Recording Button with Chat GPT, navigate to the Chat GPT web page. You'll see a new recording button in the chat interface. Click this button to start and stop recording, and the transcribed text will be automatically inserted into the chat input field.

### Built With (Chrome Extension)

The Whispering Chrome extension is built using:

- [Plasmo](https://docs.plasmo.com/): A framework for building Chrome extensions.
- [Svelte](https://svelte.dev/): A JavaScript framework for building user interfaces.
- [Tailwind CSS](https://tailwindcss.com/): A utility-first CSS framework.
- [Chrome API](https://developer.chrome.com/docs/extensions/reference/): The Chrome extension API.

### Getting Started with Development

This is a [Plasmo extension](https://docs.plasmo.com/) project bootstrapped with [`plasmo init`](https://www.npmjs.com/package/plasmo).

First, run the development server:

```bash
pnpm dev
```

To make a production build, run the following:

```bash
pnpm build
```

This should create a production bundle for your extension, ready to be zipped and published to the stores.

## Contributing

We welcome contributions from the community! If you'd like to contribute to Whispering, please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bugfix: `git checkout -b feature/your-feature-name` or `git checkout -b fix/your-bugfix-name`
3. Make your changes and commit them with a descriptive message.
4. Push your branch to your forked repository: `git push origin your-branch-name`
5. Create a pull request from your forked repository to the original one.

Please ensure your code follows established conventions and is well-documented.

## License

Whispering is released under the [MIT License](https://opensource.org/licenses/MIT).

## Support and Feedback

If you encounter any issues or have suggestions for improvements, please open an issue on the [GitHub repository](https://github.com/braden-w/whispering/issues). We appreciate your feedback!

Thank you for using Whispering and happy writing!
