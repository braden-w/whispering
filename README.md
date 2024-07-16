<p align="center">
  <a href="https://whispering.bradenwong.com">
    <img width="180" src="./apps/app/src-tauri/icons/recorder_state/studio_microphone.png" alt="Whispering">
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

## Introduction

Whispering is an open-source, cross-platform transcription app that harnesses the power of the OpenAI Whisper API to provide efficient speech-to-text conversion. It's designed to seamlessly integrate into your workflow, eliminating the need for manual transcription and streamlining your productivity.

## Features

1. **Global Transcription**: Access Whisper's speech-to-text functionality anywhere with a global keyboard shortcut or within two button clicks.

2. **Cross-Platform Experience**:

   - Desktop App: Enables global transcription across all applications.
   - Browser Extension: Provides global transcription in the browser by communicating with the web app.

3. **Chat Integration**: The browser extension adds a recording button to ChatGPT and Claude websites, allowing direct voice input and transcription in the chat interface.

4. **Transcription Management**: Review and edit transcriptions within the Whispering app to ensure accuracy and clarity.

5. **Automatic Clipboard Integration**: Once transcription is complete, the text is automatically copied to your clipboard. An option for automatic pasting is also available.

## How It Works

1. Trigger Whispering using the global shortcut or button.
2. Speak your message.
3. Whispering transcribes your speech using the OpenAI Whisper API.
4. The transcription is copied to your clipboard and optionally pasted automatically.
5. Review and edit the transcription in the Whispering app if needed.

## Demo

https://github.com/braden-w/whispering/assets/13159333/e9d72422-a743-468f-858d-4ecde0dfe238

---

## Installation

### Web App

Visit [whispering.bradenwong.com](https://whispering.bradenwong.com/), which has the latest version of the `apps/app` folder hosted on Vercel.

### Chrome Extension

Install the Chrome Extension from the Chrome Web Store [here](https://chrome.google.com/webstore/detail/whispering/oilbfihknpdbpfkcncojikmooipnlglo).

### Desktop App

To download and install the Whispering desktop app, follow the steps for your operating system:

#### Windows

1. Download the installation package ending in `.msi` from the [latest releases page](https://github.com/braden-w/whispering/releases).
2. Open the downloaded `.msi` file to run the installer.
3. If prompted as unsafe, click on `More Info` -> `Run Anyway` to proceed with the installation.
4. Follow the on-screen instructions to complete the installation.

#### macOS

For macOS, follow these steps to install Whispering:

1. **Download the installation package**:
   - Visit the [latest releases page](https://github.com/braden-w/whispering/releases).
   - Choose the appropriate package:
     - For Apple Silicon: `Whispering_x.x.x_aarch64.dmg`
     - For Intel: `Whispering_x.x.x_x64.dmg`

2. **Install the application**:
   - Open the downloaded `.dmg` file.
   - Drag the Whispering app to the Applications folder.

3. **Launch Whispering**:
   - Open Whispering from the Applications folder.
   - If you see a warning about unverified developer:
     - Click `Cancel`
     - Right-click the app in Finder and select `Open`

4. **Troubleshooting** (Apple Silicon only):
   If you encounter the error `"Whispering" is damaged and can't be opened`:
   - Open Terminal
   - Run the following command:
     ```bash
     xattr -cr /Applications/Whispering.app
     ```
   - Try opening the application again

After completing these steps, Whispering should be ready to use on your macOS system.

#### Linux

For Linux, there are multiple installation options available. Choose the one that suits your environment:

1. **AppImage**:

   - Download the `.AppImage` file from the [latest releases page](https://github.com/braden-w/whispering/releases).
   - Make the file executable:
     ```bash
     chmod +x whispering_x.x.x_amd64.AppImage
     ```
   - Run the AppImage:
     ```bash
     ./whispering_x.x.x_amd64.AppImage
     ```

2. **DEB Package (Debian/Ubuntu)**:
   - Download the `.deb` file from the [latest releases page](https://github.com/braden-w/whispering/releases).
   - Install the package using `dpkg`:
     ```bash
     sudo dpkg -i whispering_x.x.x_amd64.deb
     ```
   - Resolve any dependency issues:
     ```bash
     sudo apt-get install -f
     ```

After installation, the app will be ready to use.

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

## Run Whispering in Local Development Mode

To set up the project on your local machine, follow these steps:

1. Clone the repository: `git clone https://github.com/braden-w/whispering.git`
2. Change into the project directory: `cd whispering`
3. Install the necessary dependencies: `pnpm i`

To run the Whispering desktop app and website in development mode:

4. Change into the app directory: `cd apps/app`
5. Run the development server: `pnpm tauri dev`

The desktop app should automatically open for local development. To develop the web app, open your browser and navigate to `http://localhost:5173`.

To run the Whispering Chrome extension in development mode:

4. Change into the extension directory: `cd apps/extension`
5. Run the development server: `pnpm dev --target=chrome-mv3`

To develop the chrome extension, load it into Chrome by navigating to `chrome://extensions`, enabling developer mode, and loading the `apps/extension/build/{platform}-{manifest-version}-dev` folder as an unpacked extension.

## Build The Executable Yourself

If you ever have concerns regarding the trustworthiness of the installers or would like more control, you can always build the executable yourself. This requires more setup, but it ensures that you are running the code you expect. Such is the beauty of open-source software!

### Chrome

1. Change into the extension directory: `cd apps/extension`
2. Install the necessary dependencies: `pnpm i`
3. Run Plasmo build: `pnpm plasmo build --target=chrome-mv3`
4. Output should be found in `apps/extension/build/chrome-mv3-prod`, which can be loaded into Chrome as an unpacked extension.
5. Alternatively, you can build the extension for the Chrome Web Store: `pnpm plasmo build --target=chrome-mv3 --release`

### Firefox

1. Change into the extension directory: `cd apps/extension`
2. Install the necessary dependencies: `pnpm i`
3. Run Plasmo build: `pnpm plasmo build --target=firefox-mv3`
4. Output should be found in `apps/extension/build/firefox-mv3-prod`, which can be loaded into Chrome as an unpacked extension.
5. Alternatively, you can build the extension for the Chrome Web Store: `pnpm plasmo build --target=firefox-mv3 --release`

### Desktop

1. Change into the app directory: `cd apps/app`
2. Install the necessary dependencies: `pnpm i`
3. Run Tauri Build: `pnpm tauri build`
4. You can find the executable in the `apps/app/target/release` directory.

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

## Sponsors

This project is supported by the following amazing people and organizations:

<!-- sponsors --><a href="https://github.com/DavidGP"><img src="https://github.com/DavidGP.png" width="60px" alt="" /></a><a href="https://github.com/cgbur"><img src="https://github.com/cgbur.png" width="60px" alt="Chris Burgess" /></a><a href="https://github.com/Wstnn"><img src="https://github.com/Wstnn.png" width="60px" alt="" /></a><a href="https://github.com/rkhrkh"><img src="https://github.com/rkhrkh.png" width="60px" alt="" /></a><a href="https://github.com/doxgt"><img src="https://github.com/doxgt.png" width="60px" alt="" /></a><!-- sponsors -->

## Support and Feedback

If you encounter any issues or have suggestions for improvements, please open an issue on the [GitHub issues tab](https://github.com/braden-w/whispering/issues) or contact me via [whispering@bradenwong.com](mailto:whispering@bradenwong.com). I really appreciate your feedback!

Thank you for using Whispering and happy writing!
