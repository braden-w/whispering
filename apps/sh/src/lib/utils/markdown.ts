import DOMPurify from 'isomorphic-dompurify';
import { marked } from 'marked';

// Configure marked for better code block handling
marked.setOptions({
	breaks: true, // Convert line breaks to <br>
	gfm: true, // GitHub Flavored Markdown
});

/**
 * Detects if text likely contains markdown formatting
 */
export function isMarkdownContent(text: string): boolean {
	// Check for common markdown patterns
	const markdownPatterns = [
		/```[\s\S]*?```/g, // Code blocks
		/`[^`]+`/g, // Inline code
		/^#{1,6}\s/gm, // Headers
		/\*\*[^*]+\*\*/g, // Bold
		/\*[^*]+\*/g, // Italic
		/_[^_]+_/g, // Italic underscore
		/~~[^~]+~~/g, // Strikethrough
		/^\s*[-*+]\s/gm, // Unordered lists
		/^\s*\d+\.\s/gm, // Ordered lists
		/^\s*>\s/gm, // Blockquotes
		/\[([^\]]+)\]\(([^)]+)\)/g, // Links
	];

	return markdownPatterns.some((pattern) => pattern.test(text));
}

/**
 * Converts markdown text to sanitized HTML
 */
export function parseMarkdown(text: string): string {
	try {
		const rawHtml = marked.parse(text);
		return DOMPurify.sanitize(rawHtml, {
			ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
			ALLOWED_TAGS: [
				'p',
				'br',
				'strong',
				'em',
				'u',
				's',
				'code',
				'pre',
				'h1',
				'h2',
				'h3',
				'h4',
				'h5',
				'h6',
				'ul',
				'ol',
				'li',
				'blockquote',
				'a',
				'img',
				'table',
				'thead',
				'tbody',
				'tr',
				'td',
				'th',
			],
		});
	} catch (error) {
		console.warn('Failed to parse markdown:', error);
		// Fallback to original text if parsing fails
		return DOMPurify.sanitize(text);
	}
}
