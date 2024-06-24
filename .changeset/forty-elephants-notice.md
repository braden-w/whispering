---
'@repo/shared': major
'extension': major
'app': major
---

## Whispering 4.0 Changelog (Complete Overhaul, Svelte 5 Migration, Extension Messaging Rewrite)

### Major Transcription Overhaul

- **Supportive Transcription**: Improved support to prevent accidental recording situations, enhancing the reliability of the transcription process.

### Website Enhancements

- **Complete Redesign**: The website now features a dedicated recordings page, allowing users to view all recordings in a data table format and make necessary edits.
- **Retry Transcriptions**: Users can now retry transcriptions that may have failed, addressing a highly requested feature.

### Extension Improvements

- **Extension API Integration**: Transitioned to using a single recording instance as a proxy, communicating with the Whispering.com tab for actual recording. This simplifies the logic and enhances user understanding.
  - The website attaches toggle recording and cancel recording functions to the window object. The content script in the main world can trigger the `window.toggleRecording` or `window.cancelRecording` functions.

### Desktop App Upgrades

- **Global Keyboard Shortcut**: Introduced a global keyboard shortcut that functions reliably.
- **Bug Fixes**: Resolved the issue where the app would automatically display every time it was activated.
- **Performance Enhancements**: Implemented general performance improvements for a smoother experience.

### Technology Stack Updates

- **Migration to Svelte 5**: Migrated the entire app to Svelte 5, significantly enhancing performance.
- **Chrome Extension Rebuild**: Rebuilt the Chrome extension using React due to the lack of support for Svelte 5. The majority of the extension remains logic-based, with minimal React scripts.
