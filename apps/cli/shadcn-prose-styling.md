# Creating Custom Prose Styles with Shadcn's Design System

I was building a chat interface and hit an interesting decision: how do I style markdown content while maintaining consistency with Shadcn's theming? 

The obvious answer seemed to be Tailwind's typography plugin. Install it, slap a `.prose` class on your content, done. But here's the thing that took me too long to realize: the typography plugin and Shadcn's design system don't play well together.

## The Problem with @tailwindcss/typography

The typography plugin comes with its own opinionated color system. It applies explicit colors to headings, links, and other elements that don't respect your theme's color tokens. When you try to use `text-foreground` on a parent element, it gets overridden by the plugin's higher-specificity styles.

I spent way too much time adding `text-foreground` to every single heading level before realizing the real issue. The plugin was fighting against Shadcn's theming system.

## The Solution: Roll Your Own

So I removed the typography plugin entirely and created a custom `prose.css` that uses Shadcn's design tokens. Here's what that looks like:

```css
@import 'tailwindcss';

.prose {
  @apply max-w-[65ch] text-foreground;

  /* Headings automatically inherit the foreground color */
  & h1 {
    @apply scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl;
  }

  & h2 {
    @apply scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight mt-12 first:mt-0;
  }

  /* Links use your primary color */
  & a {
    @apply font-medium text-primary underline underline-offset-4;
  }

  /* Code blocks use your muted background */
  & pre {
    @apply bg-muted text-foreground rounded-md p-4 my-6 text-sm overflow-y-auto;
  }
}
```

The key insight: by using Shadcn's semantic color tokens (`text-foreground`, `bg-muted`, `text-primary`), everything automatically adapts to your theme. Light mode, dark mode, custom themes - it all just works.

## Handling Special Cases

Sometimes you need prose content on a primary background (like in a chat bubble). That's where `.prose-invert` comes in:

```css
.prose-invert {
  @apply text-primary-foreground;
}
```

That's it. Just one line. When you have prose content on a primary background, add both classes:

```svelte
<Chat.BubbleMessage class="flex flex-col gap-1 prose prose-invert">
  <!-- Your markdown content here -->
</Chat.BubbleMessage>
```

The beauty of this approach is its simplicity. Since all the prose styles inherit from the parent, changing to `text-primary-foreground` automatically updates all child elements. No need to override every single element like the typography plugin's `.prose-invert` class does.

## The Setup

1. **Remove the typography plugin** from your Tailwind config:
   ```js
   // Remove this line from tailwind.config.js plugins
   // require('@tailwindcss/typography')
   ```

2. **Create your `prose.css`** with custom styles using Shadcn tokens

3. **Import it** in your main CSS:
   ```css
   @import './prose.css';
   ```

4. **Use it** in your components:
   ```svelte
   <!-- Regular prose -->
   <div class="prose">
     {@html markdownContent}
   </div>
   
   <!-- Prose on primary background -->
   <div class="prose prose-invert">
     {@html markdownContent}
   </div>
   ```

That's it. No fighting with plugin specificity. No manually adding colors to every element. Just clean, theme-aware typography that follows your design system.

## Why This Matters

When you remove the typography plugin and use Shadcn's tokens:
- Colors automatically adapt to your theme
- No specificity battles
- Simpler, more maintainable CSS
- Perfect integration with your design system

The lesson: Sometimes the "convenient" solution (typography plugin) adds more complexity than rolling your own. When you're already using a design system like Shadcn, embrace it fully rather than mixing in conflicting opinions.