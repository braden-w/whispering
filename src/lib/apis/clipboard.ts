export function writeText(text: string) {
  // Create a temporary textarea element
  const textarea = document.createElement("textarea")

  // Set the value of the textarea to the desired text
  textarea.value = text

  // Make the textarea hidden
  textarea.style.position = "fixed"
  textarea.style.opacity = "0"

  // Append the textarea to the document
  document.body.appendChild(textarea)

  // Select the text within the textarea
  textarea.select()

  try {
    // Copy the selected text to the clipboard
    const successful = document.execCommand("copy")
    if (!successful) {
      throw new Error("Unable to write to clipboard.")
    }
  } catch (err) {
    console.error("Failed to write to clipboard:", err)
  } finally {
    // Clean up by removing the temporary textarea
    document.body.removeChild(textarea)
  }
}
