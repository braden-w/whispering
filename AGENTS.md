- Always use `type` instead of `interface` in Typescript.
- When moving components to new locations, always update relative imports to absolute imports (e.g., change `import Component from '../Component.svelte'` to `import Component from '$lib/components/Component.svelte'`)
- When functions are only used in the return statement of a factory/creator function, use object method shorthand syntax instead of defining them separately. For example, instead of:
  ```typescript
  function myFunction() {
    const helper = () => { /* ... */ };
    return { helper };
  }
  ```
  Use:
  ```typescript
  function myFunction() {
    return {
      helper() { /* ... */ }
    };
  }
  ```

# Mutation Pattern Preference

## In Svelte Files (.svelte)
Always prefer `createMutation` from TanStack Query for mutations. This provides:
- Loading states (`isPending`)
- Error states (`isError`)
- Success states (`isSuccess`)
- Better UX with automatic state management

### The Preferred Pattern
Pass `onSuccess` and `onError` as the second argument to `.mutate()` to get maximum context:

```svelte
<script lang="ts">
  import { createMutation } from '@tanstack/svelte-query';
  import * as rpc from '$lib/query';

  // Create mutation with just .options (no parentheses!)
  const deleteSessionMutation = createMutation(rpc.sessions.deleteSession.options);
  
  // Local state that we can access in callbacks
  let isDialogOpen = $state(false);
</script>

<Button 
  onclick={() => {
    // Pass callbacks as second argument to .mutate()
    deleteSessionMutation.mutate({ sessionId }, {
      onSuccess: () => {
        // Access local state and context
        isDialogOpen = false;
        toast.success('Session deleted');
        goto('/sessions');
      },
      onError: (error) => {
        toast.error(error.title, { description: error.description });
      },
    });
  }}
  disabled={deleteSessionMutation.isPending}
>
  {#if deleteSessionMutation.isPending}
    Deleting...
  {:else}
    Delete
  {/if}
</Button>
```

### Why This Pattern?
- **More context**: Access to local variables and state at the call site
- **Better organization**: Success/error handling is co-located with the action
- **Flexibility**: Different calls can have different success/error behaviors

## In TypeScript Files (.ts)
Always use `.execute()` since createMutation requires component context:

```typescript
// In a .ts file (e.g., load function, utility)
const result = await rpc.sessions.createSession.execute({ 
  body: { title: 'New Session' } 
});

const { data, error } = result;
if (error) {
  // Handle error
} else if (data) {
  // Handle success
}
```

## Exception: When to Use .execute() in Svelte Files
Only use `.execute()` in Svelte files when:
1. You don't need loading states
2. You're performing a one-off operation
3. You need fine-grained control over async flow

## Inline Simple Handler Functions
When a handler function only calls `.mutate()`, inline it directly:

```svelte
<!-- Good: Inline simple handlers -->
<Button onclick={() => shareMutation.mutate({ id })}>
  Share
</Button>

<!-- Avoid: Unnecessary wrapper function -->
<script>
  function handleShare() {
    shareMutation.mutate({ id });
  }
</script>
<Button onclick={handleShare}>
  Share
</Button>
```

# Standard Workflow
1. First think through the problem, read the codebase for relevant files, and write a plan to docs/specs/[timestamp] [feature-name].md where [timestamp] is the timestamp in YYYYMMDDThhmmss format and [feature-name] is the name of the feature.
2. The plan should have a list of todo items that you can check off as you complete them
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Please every step of the way just give me a high level explanation of what changes you made
6. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
7. Finally, add a review section to the .md file with a summary of the changes you made and any other relevant information.


# Human-Readable Control Flow
When refactoring complex control flow, mirror natural human reasoning patterns:

1. **Ask the human question first**: "Can I use what I already have?" → early return for happy path
2. **Assess the situation**: "What's my current state and what do I need to do?" → clear, mutually exclusive conditions  
3. **Take action**: "Get what I need" → consolidated logic at the end
4. **Use natural language variables**: `canReuseCurrentSession`, `isSameSettings`, `hasNoSession`: names that read like thoughts
5. **Avoid artificial constructs**: No nested conditions that don't match how humans actually think through problems

Transform this: nested conditionals with duplicated logic
Into this: linear flow that mirrors human decision-making

# Honesty
Be brutally honest, don't be a yes man. 
If I am wrong, point it out bluntly. 
I need honest feedback on my code.

# Shadcn-svelte Best Practices

## Component Organization
- When using $state, $derived, or functions in Svelte component files that are only referenced once in the component markup, inline them directly in the markup for better code locality
- Use the CLI for adding/managing shadcn-svelte components: `bunx shadcn-svelte@latest add [component]`
- Each component should be in its own folder under `$lib/components/ui/` with an `index.ts` export file
- Follow kebab-case for component folder names (e.g., `dialog/`, `toggle-group/`)
- Group related sub-components in the same folder (e.g., all dialog parts in `dialog/`)

## Import Patterns
Use the appropriate import pattern based on component complexity:

**Namespace imports** (preferred for multi-part components):
```typescript
import * as Dialog from '$lib/components/ui/dialog';
import * as ToggleGroup from '$lib/components/ui/toggle-group';
```

**Named imports** (for single components):
```typescript
import { Button } from '$lib/components/ui/button';
import { Input } from '$lib/components/ui/input';
```

## Styling and Customization
- Always use the `cn()` utility from `$lib/utils` for combining Tailwind classes
- Modify component code directly rather than overriding styles with complex CSS
- Use `tailwind-variants` for component variant systems
- Follow the `background`/`foreground` convention for colors
- Leverage CSS variables for theme consistency

## Component Usage Patterns
- Use proper component composition following shadcn-svelte patterns:
```svelte
<Dialog.Root bind:open={isOpen}>
  <Dialog.Trigger>
    <Button>Open</Button>
  </Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Title</Dialog.Title>
    </Dialog.Header>
  </Dialog.Content>
</Dialog.Root>
```

## Custom Components
- When extending shadcn components, create wrapper components that maintain the design system
- Add JSDoc comments for complex component props
- Ensure custom components follow the same organizational patterns
- Consider semantic appropriateness (e.g., use section headers instead of cards for page sections)

# Self-Contained Component Pattern

## Prefer Component Composition Over Parent State Management
When building interactive components (especially with dialogs/modals), create self-contained components rather than managing state at the parent level.

### The Anti-Pattern (Parent State Management)
```svelte
<!-- Parent component -->
<script>
  let deletingItem = $state(null);
  
  function handleDelete(item) {
    // delete logic
    deletingItem = null;
  }
</script>

{#each items as item}
  <Button onclick={() => deletingItem = item}>Delete</Button>
{/each}

<AlertDialog open={!!deletingItem}>
  <!-- Single dialog for all items -->
</AlertDialog>
```

### The Pattern (Self-Contained Components)
```svelte
<!-- DeleteItemButton.svelte -->
<script>
  let { item } = $props();
  let open = $state(false);
  
  function handleDelete() {
    // delete logic directly in component
  }
</script>

<AlertDialog.Root bind:open>
  <AlertDialog.Trigger>
    <Button>Delete</Button>
  </AlertDialog.Trigger>
  <AlertDialog.Content>
    <!-- Dialog content -->
  </AlertDialog.Content>
</AlertDialog.Root>

<!-- Parent component -->
{#each items as item}
  <DeleteItemButton {item} />
{/each}
```

### Why This Pattern Works
- **No parent state pollution**: Parent doesn't need to track which item is being deleted
- **Better encapsulation**: All delete logic lives in one place
- **Simpler mental model**: Each row has its own delete button with its own dialog
- **No callbacks needed**: Component handles everything internally
- **Scales better**: Adding new actions doesn't complicate the parent

### When to Apply This Pattern
- Action buttons in table rows (delete, edit, etc.)
- Confirmation dialogs for list items
- Any repeating UI element that needs modal interactions
- When you find yourself passing callbacks just to update parent state

The key insight: It's perfectly fine to instantiate multiple dialogs (one per row) rather than managing a single shared dialog with complex state. Modern frameworks handle this efficiently, and the code clarity is worth it.

# Documentation & README Writing Guidelines

## Technical Writing Voice

### Core Principles
- **Start with the problem or decision**: "I was building X and hit this decision" not "When building applications..."
- **Show the insight first**: Lead with what you realized, then explain why
- **Use concrete examples**: Show actual code or scenarios, not abstract concepts
- **Make it conversational**: Write like you're explaining to a colleague at lunch

### Sentence Structure
- **Short, punchy observations**: "That's it. No Result types. No error handling dance."
- **Build rhythm**: Mix short sentences with longer explanations
- **Use fragments for emphasis**: "Every. Single. Operation."
- **Ask the reader's unspoken question**: "But why all this complexity for localStorage?"

### Technical Explanations
- **Explain the 'why' before the 'how'**: "localStorage is synchronous. Why am I adding async complexity?"
- **Call out the obvious**: "Here's the thing that took me too long to realize"
- **Use comparisons**: "I was treating localStorage like a remote database. But it's not."
- **End with the lesson**: Not generic advice, but what YOU learned

### Avoiding Academic/Corporate Tone
- Don't: "This article explores two architectural approaches..."
- Do: "I hit an interesting architectural decision"
- Don't: "Let's examine the implications"
- Do: "Here's what I mean"
- Don't: "In conclusion, both patterns have merit"
- Do: "The lesson: Not every data access needs a service"

## Authentic Communication Style
- Avoid emojis in headings and formal content unless explicitly requested
- Use direct, factual language over marketing speak or hyperbole
- Lead with genuine value propositions, not sales tactics
- Mirror the straightforward tone of established sections when editing
- Prefer "I built this because..." over "Revolutionary new..."

## Open Source Mindset
- Emphasize user control and data ownership
- Highlight transparency benefits (audit the code, no tracking)
- Focus on direct relationships (user → provider) over middleman models
- Present honest cost comparisons with specific, real numbers
- Acknowledge limitations and trade-offs openly

## Avoiding AI-Generated Feel

### The Dead Giveaways
- **Bold formatting everywhere**: Biggest red flag. Never bold section headers in post content
- **Excessive bullet lists**: Convert to flowing paragraphs
- **Marketing language**: "game-changing", "revolutionary", "unleash", "empower"
- **Structured sections**: "Key Features:", "Benefits:", "Why This Matters:"
- **Vague superlatives**: "incredibly powerful", "seamlessly integrates", "robust solution"
- **AI adjectives**: "perfectly", "effortlessly", "beautifully", "elegantly"

### Writing Natural Prose
- **Start with a story or problem**: "I was paying $30/month..." not "Introducing..."
- **Use specific numbers**: "$0.02/hour" not "affordable pricing"
- **Personal voice**: "I built this because..." not "This was built to..."
- **Conversational flow**: Ideas connect naturally, not in rigid sections
- **Concrete examples**: "I use it 3-4 hours daily" not "heavy usage"

### Code Examples in Articles
- **Trim to essentials**: Show the pattern, not every implementation detail
- **Add inline observations**: "Notice how every operation returns a Result type"
- **Compare approaches side-by-side**: Keep code minimal but complete enough to understand
- **Comment on the experience**: "That's a lot of ceremony for localStorage"

### The OpenAI Post Pattern (What Works)
```
Personal hook → Specific problem → Real numbers → How I solved it → 
What it actually does → Technical details → Genuine question to community
```

### Paragraph Structure
- Mix short and long sentences
- One idea flows into the next
- No rigid formatting or sections
- Natural transitions like "So I built..." or "Here's the thing..."
- End with engagement, not a sales pitch

## README Structure Principles
- Start with what the tool actually does, not why it's amazing
- Use honest comparative language ("We believe X should be Y")
- Present facts and let users draw conclusions
- Include real limitations and use cases
- Make pricing transparent with actual provider costs

# Social Media Post Guidelines

## Platform-Specific Brevity
- **LinkedIn**: 3-5 lines max. State the feature, drop the link, done.
- **Twitter/X**: Each tweet should have ONE idea. Don't overexplain.
- **Reddit technical subs**: Focus on implementation details, not benefits

## What to Remove
- All hashtags except when platform culture expects them
- Section headers in post content ("## Implementation", "## Benefits")
- Bullet lists of features/benefits
- Marketing phrases ("game-changing", "seamless", "powerful")
- Call-to-action phrases ("See it in action!", "Try it today!")
- Redundant adjectives ("excellent", "really")

## What to Add
- Specific technical details that developers care about
- Actual implementation challenges and solutions
- Links to relevant libraries/APIs used
- One unique feature detail ("with your model of choice")
- Disclaimers when recommending tools ("Not affiliated, it just...")
- Personal standards/opinions ("by my standards", "slated for cleanup")
- Formal transitions with proper punctuation (semicolons, periods)
- Include disclaimers when praising external tools
- Use more precise language ("functionality" vs just "function")

## Examples: LinkedIn Posts

### Good (Actual Human Post)
```
Whispering now supports direct file uploads! 🎙️

Simply drag and drop (or click to browse) your audio files for instant transcription, with your model of choice.

Free open-source app: https://github.com/braden-w/whispering
```

### Bad (AI-Generated Feel)
```
Excited to announce that Whispering now supports direct file uploads! 🚀

This game-changing feature allows you to:
✅ Drag and drop any audio/video file
✅ Get instant, accurate transcriptions
✅ Save time and boost productivity

Built with the same philosophy of transparency and user control, you pay only actual API costs (just 2¢/hour!) with no hidden fees or subscriptions.

Ready to revolutionize your workflow? Try it now!

🔗 GitHub: https://github.com/braden-w/whispering

#OpenSource #Productivity #Innovation #DeveloperTools #Transcription
```

## Examples: Reddit Technical Posts

### Good (Focused on Implementation)
```
Hey r/sveltejs! Just shipped a file upload feature for Whispering and wanted to share how I implemented drag-and-drop files.

I used the [FileDropZone component from shadcn-svelte-extras](https://www.shadcn-svelte-extras.com/components/file-drop-zone), which provided a clean abstraction that allows users to drop and click to upload files:

```svelte
<FileDropZone
  accept="{ACCEPT_AUDIO}, {ACCEPT_VIDEO}"
  maxFiles={10}
  maxFileSize={25 * MEGABYTE}
  onUpload={(files) => {
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }}
/>
```

The component handles web drag-and-drop, but since Whispering is a Tauri desktop app, drag-and-drop functionality didn't work on the desktop (click-to-select still worked fine). So I reached for Tauri's [onDragDropEvent](https://tauri.app/reference/javascript/api/namespacewebviewwindow/#ondragdropevent) to add native support for dragging files anywhere into the application.

You can see the [full implementation here](link) (note that the code is still somewhat messy by my standards; it is slated for cleanup!).

Whispering is a large, open-source, production Svelte 5 + Tauri app: https://github.com/braden-w/whispering

Feel free to check it out for more patterns! If you're building Svelte 5 apps and need file uploads, definitely check out shadcn-svelte-extras. Not affiliated, it just saved me hours of implementation time.

Happy to answer any questions about the implementation!
```

### Bad (Marketing-Focused)
```
## The Problem
Users were asking for file upload support...

## The Solution  
I implemented a beautiful drag-and-drop interface...

## Key Benefits
- User-friendly interface
- Supports multiple file formats
- Lightning-fast processing

## Why This Matters
This transforms the user experience...
```

# Writing Style Examples

## Good Example (Natural, Human)
"I was paying $30/month for a transcription app. Then I did the math: the actual API calls cost about $0.36/hour. At my usage (3-4 hours/day), I was paying $30 for what should cost $3.

So I built Whispering to cut out the middleman. You bring your own API key, your audio goes directly to the provider, and you pay actual costs. No subscription, no data collection, no lock-in."

## Bad Example (AI-Generated Feel)
"**Introducing Whispering** - A revolutionary transcription solution that empowers users with unprecedented control.

**Key Benefits:**
- **Cost-Effective**: Save up to 90% on transcription costs
- **Privacy-First**: Your data never leaves your control
- **Flexible**: Multiple provider options available

**Why Whispering?** We believe transcription should be accessible to everyone..."

## The Difference
- Good: Tells a story, uses specific numbers, flows naturally
- Bad: Structured sections, bold headers, marketing language
- Good: "I built this because..." (personal)
- Bad: "This was built to..." (corporate)
- Good: "$0.02/hour" (specific)
- Bad: "affordable pricing" (vague)

# Git Commit and Pull Request Guidelines

## Conventional Commits Format
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Commit Types
- `feat`: New features (correlates with MINOR in semantic versioning)
- `fix`: Bug fixes (correlates with PATCH in semantic versioning)
- `docs`: Documentation only changes
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Performance improvements
- `test`: Adding or modifying tests
- `chore`: Maintenance tasks, dependency updates, etc.
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `build`: Changes to build system or dependencies
- `ci`: Changes to CI configuration files and scripts

### Scope Guidelines
- **Scope is OPTIONAL**: only add when it provides clarity
- Use lowercase, placed in parentheses after type: `feat(transcription):`
- Prefer specific component/module names over generic terms
- Your current practice is good: component names (`EditRecordingDialog`), feature areas (`transcription`, `sound`)
- Avoid overly generic scopes like `ui` or `backend` unless truly appropriate

### When to Use Scope
- When the change is localized to a specific component/module
- When it helps distinguish between similar changes
- When working in a large codebase with distinct areas

### When NOT to Use Scope
- When the change affects multiple areas equally
- When the type alone is sufficiently descriptive
- For small, obvious changes

### Description Rules
- Start with lowercase immediately after the colon and space
- Use imperative mood ("add" not "added" or "adds")
- No period at the end
- Keep under 50-72 characters on first line

### Breaking Changes
- Add `!` after type/scope, before colon: `feat(api)!: change endpoint structure`
- Include `BREAKING CHANGE:` in the footer with details
- These trigger MAJOR version bumps in semantic versioning

### Examples Following Your Style:
- `feat(transcription): add model selection for OpenAI providers`
- `fix(sound): resolve audio import paths in assets module`
- `refactor(EditRecordingDialog): implement working copy pattern`
- `docs(README): clarify cost comparison section`
- `chore: update dependencies to latest versions`
- `fix!: change default transcription API endpoint`

## Commit Messages Best Practices
- NEVER include Claude Code or opencode watermarks or attribution
- Each commit should represent a single, atomic change
- Write commits for future developers (including yourself)
- If you need more than one line to describe what you did, consider splitting the commit

## Pull Request Guidelines
- NEVER include Claude Code or opencode watermarks or attribution in PR titles/descriptions
- PR title should follow same conventional commit format as commits
- Focus on the "why" and "what" of changes, not the "how it was created"
- Include any breaking changes prominently
- Link to relevant issues

## What NOT to Include:
- `🤖 Generated with [Claude Code](https://claude.ai/code)`
- `Co-Authored-By: Claude <noreply@anthropic.com>`
- Any references to AI assistance
- `🤖 Generated with [opencode](https://opencode.ai)`
- `Co-Authored-By: opencode <noreply@opencode.ai>`
- Tool attribution or watermarks

# Punctuation Guidelines

## Avoiding AI Artifacts
The pattern " - " (space-hyphen-space) is a common AI writing artifact that should be replaced with proper punctuation.

### Replacement Priority
1. **Semicolon (;)** - Use to connect closely related independent clauses
   - Before: `The code works - the tests pass`
   - After: `The code works; the tests pass`

2. **Colon (:)** - Use when introducing an explanation, list, or example
   - Before: `**Bold text** - This explains what it means`
   - After: `**Bold text**: This explains what it means`

3. **Em dash (—)** - Use for dramatic pauses or parenthetical statements where semicolon and colon don't work
   - Before: `The app is fast - really fast`
   - After: `The app is fast—really fast`

### Common Patterns
- **Definitions/Explanations**: Use colon
  - `**Feature name**: Description of the feature`
- **Examples/Lists**: Use colon
  - `**Examples**: item1, item2, item3`
- **Dramatic emphasis**: Use em dash
  - `It's more than fast—it's instant`
- **Related statements**: Use semicolon
  - `The API is simple; the documentation is clear`

# GitHub Issue Comment Guidelines

## Opening Pattern
Always start with a personal greeting using the user's GitHub handle:
- "Hey @username, thank you for the issue"
- "Hey everyone, thanks for the notice!"
- "Hey all, thanks for the issue!"

## Core Elements

### 1. Acknowledgment
- Start by acknowledging their issue/contribution
- Express empathy for problems: "sorry to hear this!", "sorry to hear your shortcut was lost!"
- Apologize for delays: "I apologize for the delayed response"

### 2. Good News Delivery
When announcing features or fixes:
- "good news!" or "Good news!"
- Add celebration emoji sparingly: "🎉"
- Credit contributors: "Thank you for the inspiration" or "Thank you and @user1 and @user2 for the inspiration"

### 3. Debugging Offers
For complex issues, offer direct help:
- "If you have time, I would love to hop on a call with you, and we can debug this together"
- "Let's hop on a call sometime in the coming days, and I'll debug it with you"
- Always include cal.com link: "https://cal.com/epicenter/whispering"
- Add availability: "I'm free as early as tomorrow"

### 4. Discord Promotion
When appropriate, mention Discord:
- "PS: I've also recently created a Discord group, and I'd love for you to join! You can ping me directly for more features."
- Include link: "https://discord.gg/YWa5YVUSxa"

### 5. Follow-up Questions
Ask clarifying questions to understand the issue better:
- "To clarify, could you confirm that this issue persists even with the latest v7.1.0 installer?"
- "Did you ever get a popup to grant permission to access recording devices?"
- "Does this happen when you make recordings for more than 4 seconds?"

### 6. Closing
End with gratitude:
- "Thank you!"
- "Thanks again!"
- "Thank you again for your help and will be taking a look!"
- "My pleasure!" (when thanked)

## Response Examples

### Feature Implementation Response
```
Hey @username, thank you for the issue, and good news! [Whispering v7.1.0](link) now includes the [feature]! Thank you for the inspiration. 🎉

[Brief description of how it works]

PS: I've also recently created a Discord group, and I'd love for you to join! You can ping me directly for more features.

https://discord.gg/YWa5YVUSxa
```

### Debugging Response
```
Hey @username, so sorry to hear this! I apologize for the delayed response; I was finalizing [the latest release v7.1.0](link).

To clarify, could you confirm that this issue persists even with the latest v7.1.0 installer?

If you have time, I would love to hop on a call with you, and we can debug this together. You can book a meeting with me using my cal.com link right here, I'm free as early as tomorrow:

https://cal.com/epicenter/whispering

Thank you!
```

### Quick Acknowledgment
```
Hey @username, sorry to hear [problem]! Did you ever get a fix?
```

## Writing Style Notes
- Use casual, approachable language
- Be genuinely enthusiastic about user contributions
- Reference specific users and give credit
- Link to relevant issues, releases, or commits
- Keep responses personal and conversational
- Avoid corporate or overly formal language