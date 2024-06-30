<p align="center">
  <a href="https://whispering.bradenwong.com">
    <img width="180" src="./apps/web-desktop-app/static/studio_microphone.png" alt="Whispering">
  </a>
  <h1 align="center">Whispering</h1>
  <p align="center"><em>Seamless speech-to-text at your fingertips, powered by OpenAI</em></p>
</p>

<p align="center">
  <!-- Latest Version Badge -->
  <img src="https://img.shields.io/github/v/release/braden-w/whispering?style=flat-square&label=Latest%20Version&color=brightgreen" />
  <!-- License Badge -->
  <a href="LICENSE" target="_blank">
    <img alt="MIT License" src="https://img.shields.io/github/license/braden-w/whispering.svg?style=flat-square" />
  </a>
  <!-- Badges for Technologies -->
  <img alt="TypeScript" src="https://img.shields.io/badge/-TypeScript-blue?style=flat-square&logo=typescript&logoColor=white" />
  <img alt="Rust" src="https://img.shields.io/badge/-Rust-orange?style=flat-square&logo=rust&logoColor=white" />
  <!-- Platform Support Badges -->
  <a href="https://chrome.google.com/webstore/detail/whispering/oilbfihknpdbpfkcncojikmooipnlglo" target="_blank">
    <img alt="Chrome" src="https://img.shields.io/chrome-web-store/stars/oilbfihknpdbpfkcncojikmooipnlglo?color=blue&label=Chrome&style=flat-square&logo=google-chrome&logoColor=white" />
  </a>
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

## Project Overview

Whispering is an open-source, cross-platform transcription app that leverages the OpenAI Whisper API for efficient speech-to-text conversion.

With Whispering, you can seamlessly integrate speech-to-text capabilities into your workflow, eliminating the need for manual transcription and reducing unnecessary clicks. This boosts productivity and saves time.

## Features

Whispering offers two key functionalities:

1. **Seamless integration with ChatGPT**: The extension adds a handy recording button in the ChatGPT website, enabling you to record and generate transcriptions from your voice directly in the chat.

![ChatGPT Box](./images/chat_box.jpg)

2. **Record and transcribe across any website**: Access Whisper's speech-to-text anywhere with a global keyboard shortcut, enabling seamless transcription in any website.

After transcription is completed, it is automatically copied into your clipboard and can be configured to automatically paste.

## Demo

https://github.com/braden-w/whispering/assets/13159333/e9d72422-a743-468f-858d-4ecde0dfe238

## Installation

### Chrome Extension

You can install the Chrome Extension from the Chrome web store here:

<a href="https://chrome.google.com/webstore/detail/whispering/oilbfihknpdbpfkcncojikmooipnlglo" target="_blank">
  <img alt="Download Chrome Extension" src="https://img.shields.io/chrome-web-store/stars/oilbfihknpdbpfkcncojikmooipnlglo?color=blue&label=Chrome&style=flat-square&logo=google-chrome&logoColor=white" />
</a>

### Web App

To start using the Whispering web app, click the button below:

[![Open Web App](https://img.shields.io/badge/Open-Web%20App-blue)](https://whispering.bradenwong.com/)

### Download Desktop App

To download the Whispering desktop app:

1. Go to the [latest releases page](https://github.com/braden-w/whispering/releases) and download the corresponding installation file `.msi` file for Windows and `.dmg` for MacOS.
2. Double click the downloaded file to install it.
3. For Windows, if prompted as unsafe, you can click on `More Info` -> `Run Anyway` to proceed with the installation (I was unable to sign the app due to my lack of a Windows laptop for development, but the app is safe to use).
4. Ready to use!

## Usage

### Chrome Extension

After installing the Chrome Extension, you will find a Whispering icon on the Chrome extensions bar. Click on this icon to open the extension. To use the Whisper API feature, simply click the 'Start Recording' microphone button to record your voice, and then 'Stop Recording' square button when you're done. Your transcription will appear in the text box below.

To access the ChatGPT feature, navigate to the ChatGPT web page. You'll see a new recording button in the chat interface. Click this button to start and stop recording, and the transcribed text will be automatically inserted into the chat input field.

To access the shortcut feature, press <kbd>Control</kbd> + <kbd>Shift</kbd> + <kbd>X</kbd> or <kbd>Command</kbd> + <kbd>Shift</kbd> + <kbd>X</kbd> to start recording from any website. The transcription will be automatically copied into your clipboard and paste into the current input field.

### Web App

To start using the Whispering web app, click the button below:

[![Open Web App](https://img.shields.io/badge/Open-Web%20App-blue)](https://whispering.bradenwong.com/)

### Desktop App

After installing the Whispering desktop app, press <kbd>Control</kbd> + <kbd>Shift</kbd> + <kbd>;</kbd> or <kbd>Command</kbd> + <kbd>Shift</kbd> + <kbd>;</kbd> to start recording from anywhere on your desktop. The application will come into focus while recording, and will minimize when you stop recording. The transcription will be automatically copied into your clipboard and can be configured to automatically paste.

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
- [svelte-french-toast](https://svelte-french-toast.com): A simple, customizable toast library for Svelte applications.
- [TailwindCSS](https://tailwindcss.com/docs): A utility-first CSS framework for rapidly building custom user interfaces.
- [Chrome API](https://developer.chrome.com/docs/extensions/reference/): The Chrome extension API.
- [Zapsplat.com](https://www.zapsplat.com/): A royalty-free sound effects library.

## Development

To set up the project on your local machine, follow these steps:

1. Clone the repository: `git clone https://github.com/braden-w/whispering.git`
2. Change into the project directory: `cd whispering`
3. Install the necessary dependencies: `pnpm i`
4. Run the development server: `pnpm dev`
5. The desktop app should open for local development. To develop the web app, open your browser and navigate to `http://localhost:5173`.

The Whispering web and desktop app can be found under `apps/web-desktop-app`, and the extension can be found under `apps/browser-extension`.

## Build Instructions

### Chrome

1. `cd apps/browser-extension`
2. `pnpm i`
3. `pnpm plasmo build --zip`
4. Output should be found in `apps/browser-extension/build`

### Firefox

1. `cd apps/browser-extension`
2. `pnpm i`
3. `pnpm plasmo build --target=firefox-mv2 --zip`
4. Output should be found in `apps/browser-extension/build`

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
