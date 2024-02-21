# Whispering: The Lightweight Ergonomic Wrapper for OpenAI Whisperer API

![Whispering Banner](https://whispering.bradenwong.com/assets/Banner.png)

Whispering is an open-source web and desktop app designed to streamline your voice-to-text experience, increase your writing productivity, and simplifying your workflow. By leveraging the OpenAI Whisperer API, Whispering allows you to record your voice, transcribe it, and copy the resulting text directly to your clipboard for seamless pasting.

## Table of Contents

- [Demo](#demo)
- [Why Choose Whispering?](#why-choose-whispering)
- [Accessing Whispering Web App](#accessing-whispering-web-app)
- [Download Desktop App](#download-desktop-app)
- [Built With](#built-with)
- [Getting Started](#getting-started)
- [Contributing](#contributing)
- [License](#license)
- [Support and Feedback](#support-and-feedback)

## Demo

[https://user-images.githubusercontent.com/13159333/227335178-7d926d84-f752-4cbd-84af-0b2dcc483c66.mp4](https://user-images.githubusercontent.com/13159333/227335178-7d926d84-f752-4cbd-84af-0b2dcc483c66.mp4)

## Why Choose Whispering?

Whispering was born from the frustrations of a tedious dictation process that involved visiting the official OpenAI website, clicking multiple buttons for each recording, and manually copying and pasting transcriptions. With Whispering, you can enjoy the following benefits:

- **Save Time**: Eliminate manual transcribing and excessive button clicks. Record, transcribe, and paste with just two clicks or two keystrokes.
- **Boost Productivity**: With fewer button clicks and context switching, Whispering increases your writing output, making it perfect for blog posts, essays, or writing prompts.
- **Simplify Workflows**: Effortlessly record, stop, and paste transcribed text with just a few keystrokes.

## Accessing Whispering Web App

To start using Whispering web app, click the button below:

[![Open Web App](https://img.shields.io/badge/Open-Web%20App-blue)](https://whispering.bradenwong.com/)

## Download Desktop App

To download the Whispering desktop app, click the button below:

[![Download Desktop App](https://img.shields.io/badge/Download-Desktop%20App-blue)](https://github.com/braden-w/whispering/releases)

### Highly Recommended: Installing LAME

Before proceeding with the installation of the DMG file, we highly recommend installing "lame" on your system. This program utilizes LAME for compressing audio files before uploading them to the OpenAI API, resulting in a significant reduction in processing time. By having LAME installed, you can enhance the efficiency and speed of audio file processing within the application.

https://formulae.brew.sh/formula/lame

#### Mac OS (using Homebrew)

1. Open a Terminal window on your Mac.
2. Install Homebrew if you have not already. You may do so by executing [the command found on its homepage](https://brew.sh). As of 2023, it is:

```shell
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

3. After Homebrew is installed, run the following command to install LAME:

```shell
brew install lame
```

#### Windows

1. Visit the [LAME download page on Sourceforge](https://sourceforge.net/projects/lame/files/lame) and download the latest stable version of LAME for Windows.
2. Once the download is complete, locate the downloaded executable file and double-click on it to start the installation process.

#### Linux

For Ubuntu/Debian-based distributions:

1. Open a Terminal window.
2. Execute the following command to install LAME:

```shell
sudo apt-get update && sudo apt-get install lame
```

For other distributions, consult your distribution's package manager or repository to find the appropriate command for installing LAME.

## Built With

Whispering is built using the following technologies and libraries:

- [Tauri](https://tauri.studio/en/docs/intro/): A framework for building lightweight, secure, and fast cross-platform applications with web technologies.
- [SvelteKit](https://kit.svelte.dev/docs): A framework for building web applications and the Tauri frontend.
- [svelte-french-toast](https://svelte-french-toast.com): A simple, customizable toast library for Svelte applications.
- [TailwindCSS](https://tailwindcss.com/docs): A utility-first CSS framework for rapidly building custom user interfaces.
- [RecordRTC](https://recordrtc.org/): A WebRTC JavaScript library for audio/video recording, screen capturing, and media streaming.
- [Cloudflare Pages](https://developers.cloudflare.com/): A global cloud platform for deploying static pages.

## Getting Started

To set up the project on your local machine, follow these steps:

1. Clone the repository: `git clone https://github.com/braden-w/whispering.git`
2. Change into the project directory: `cd whispering`
3. Install the necessary dependencies: `pnpm i`
4. Run the development server: `pnpm tauri dev`
5. The desktop app should open for local development. To develop the web app, open your browser and navigate to `http://localhost:5173`.

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
