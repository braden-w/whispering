<p align="center">
  <a href="https://whispering.bradenwong.com">
    <img width="180" src="./apps/web-desktop-app/static/studio_microphone.png" alt="Whispering">
  </a>
  <h1 align="center">Whispering</h1>
  <p align="center"><em>Seamless speech-to-text at your fingertips, powered by OpenAI</em></p>
</p>

<p align="center">
  <a href="LICENSE" target="_blank">
    <img alt="MIT License" src="https://img.shields.io/github/license/braden-w/whispering.svg?style=flat-square" />
  </a>

  <!-- TypeScript Badge -->
  <img alt="TypeScript" src="https://img.shields.io/badge/-TypeScript-blue?style=flat-square&logo=typescript&logoColor=white" />

  <!-- Rust Badge -->
  <img alt="Rust" src="https://img.shields.io/badge/-Rust-orange?style=flat-square&logo=rust&logoColor=white" />

  <a href="https://chrome.google.com/webstore/detail/whispering/oilbfihknpdbpfkcncojikmooipnlglo" target="_blank">
    <img alt="Chrome" src="https://img.shields.io/chrome-web-store/stars/oilbfihknpdbpfkcncojikmooipnlglo?color=blue&label=Chrome&style=flat-square&logo=google-chrome&logoColor=white" />
  </a>

<!--   <a href="https://addons.mozilla.org/en-US/firefox/addon/whispering/" target="_blank">
    <img alt="Firefox" src="https://img.shields.io/amo/stars/whispering?color=orange&label=Firefox&style=flat-square&logo=firefox&logoColor=white" />
  </a>
 -->
  <a href="https://github.com/braden-w/whispering/releases" target="_blank">
    <img alt="macOS" src="https://img.shields.io/badge/-macOS-black?style=flat-square&logo=apple&logoColor=white" />
  </a>

  <a href="https://github.com/braden-w/whispering/releases" target="_blank">
    <img alt="Windows" src="https://img.shields.io/badge/-Windows-blue?style=flat-square&logo=windows&logoColor=white" />
  </a>

  <a href="https://github.com/braden-w/whispering/releases" target="_blank">
    <img alt="Linux" src="https://img.shields.io/badge/-Linux-yellow?style=flat-square&logo=linux&logoColor=white" />
  </a>
</p>

---

Whispering is an open-source project designed to streamline your voice-to-text experience by leveraging the OpenAI Whisper API.

Whispering offers two key functionalities:

1. **Recording Button for Chat GPT**: The extension adds a handy recording button in the ChatGPT website, enabling you to record and generate transcriptions from your voice directly in the chat.
2. **Keyboard shortcut**: Access Whisper's speech-to-text anywhere with a single keyboard shortcut

After transcription is completed, it is automatically copied into your clipboard and can be configured to automatically paste.

## Why Whispering?

Whispering enables you to bring seamless speech-to-text capabilities to your workflow without context switching between websites. By eliminating manual transcribing and excessive button clicks, you can save time, boost productivity, and type faster.Instead, effortless record and paste your transcription.

<!-- ![Whispering Banner](https://whispering.bradenwong.com/assets/Banner.png) -->

<!-- ## Table of Contents

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
- [Support and Feedback](#support-and-feedback) -->

## Demo

[https://user-images.githubusercontent.com/13159333/227335178-7d926d84-f752-4cbd-84af-0b2dcc483c66.mp4](https://user-images.githubusercontent.com/13159333/227335178-7d926d84-f752-4cbd-84af-0b2dcc483c66.mp4)

## Installation

### Chrome Extension

You can install the Chrome Extension from the Chrome web store here:

  <a href="https://chrome.google.com/webstore/detail/whispering/oilbfihknpdbpfkcncojikmooipnlglo" target="_blank">
    <img alt="Download Chrome Extension" src="https://img.shields.io/chrome-web-store/stars/oilbfihknpdbpfkcncojikmooipnlglo?color=blue&label=Chrome&style=flat-square&logo=google-chrome&logoColor=white" />
  </a>

Once installed, you will find a Whispering icon on the Chrome extensions bar. Click on this icon to open the extension. To use the Whisper API feature, simply click the 'Start Recording' microphone button to record your voice, and then 'Stop Recording' square button when you're done. Your transcription will appear in the text box below.

To access the ChatGPT feature, navigate to the ChatGPT web page. You'll see a new recording button in the chat interface. Click this button to start and stop recording, and the transcribed text will be automatically inserted into the chat input field.

To access the shortcut feature, press <kbd>Control</kbd> + <kbd>Shift</kbd> + <kbd>X</kbd> or <kbd>Command</kbd> + <kbd>Shift</kbd> + <kbd>X</kbd> to start recording from any website. The transcription will be automatically copied into your clipboard and paste into the current input field.

### Web App

To start using the Whispering web app, click the button below:

[![Open Web App](https://img.shields.io/badge/Open-Web%20App-blue)](https://whispering.bradenwong.com/)

### Download Desktop App

To download the Whispering desktop app, you can access the latest release here:

  <a href="https://github.com/braden-w/whispering/releases" target="_blank">
    <img alt="macOS" src="https://img.shields.io/badge/-macOS-black?style=flat-square&logo=apple&logoColor=white" />
  </a>

  <a href="https://github.com/braden-w/whispering/releases" target="_blank">
    <img alt="Windows" src="https://img.shields.io/badge/-Windows-blue?style=flat-square&logo=windows&logoColor=white" />
  </a>

  <a href="https://github.com/braden-w/whispering/releases" target="_blank">
    <img alt="Linux" src="https://img.shields.io/badge/-Linux-yellow?style=flat-square&logo=linux&logoColor=white" />
  </a>

Press <kbd>Control</kbd> + <kbd>Shift</kbd> + <kbd>;</kbd> or <kbd>Command</kbd> + <kbd>Shift</kbd> + <kbd>;</kbd> to start recording from anywhere on your desktop. The application will come into focus while recording, and will minimize when you stop recording. The transcription will be automatically copied into your clipboard and can be configured to automatically paste.

## Built With

#### Web and Desktop

Whispering web and desktop app is built using the following technologies and libraries:

- [Tauri](https://tauri.studio/en/docs/intro/): A framework for building lightweight, secure, and fast cross-platform applications with web technologies.
- [SvelteKit](https://kit.svelte.dev/docs): A framework for building web applications and the Tauri frontend.
- [svelte-french-toast](https://svelte-french-toast.com): A simple, customizable toast library for Svelte applications.
- [TailwindCSS](https://tailwindcss.com/docs): A utility-first CSS framework for rapidly building custom user interfaces.
- [Cloudflare Pages](https://developers.cloudflare.com/): A global cloud platform for deploying static pages.

#### Extension

The Whispering Chrome extension is built using:

- [Plasmo](https://docs.plasmo.com/): A framework for building Chrome extensions.
- [Svelte](https://svelte.dev/): A JavaScript framework for building user interfaces.
- [Tailwind CSS](https://tailwindcss.com/): A utility-first CSS framework.
- [Chrome API](https://developer.chrome.com/docs/extensions/reference/): The Chrome extension API.

## Development

To set up the project on your local machine, follow these steps:

1. Clone the repository: `git clone https://github.com/braden-w/whispering.git`
2. Change into the project directory: `cd whispering`
3. Install the necessary dependencies: `pnpm i`
4. Run the development server: `pnpm dev`
5. The desktop app should open for local development. To develop the web app, open your browser and navigate to `http://localhost:5173`.

The Whispering web and desktop app can be found under `apps/web-desktop-app`, and the extension can be found under `apps/chrome-extension`.

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
