# Component Props as Dependency Injection

I was building a copy-to-clipboard button and hit an interesting architectural decision. Should the button handle its own clipboard logic, or should I pass in a `copyToClipboard` function?

That's when I realized I'd been thinking about component props wrong. Sometimes props aren't just event handlers or data. Sometimes they're dependencies.

## Two Archetypes of Components

Here's the thing that took me too long to realize: there are fundamentally two types of components.

The first type are UI shells. These components are purely presentational:

```svelte
<!-- Just a button that tells you when it's clicked -->
<Button onclick={handleClick}>
  Save Changes
</Button>
```

The component doesn't care what happens when you click. It's just a shell. Most design system components fall into this category. They manage visual state, handle animations, maybe some focus management. But the actual behavior? That's your problem.

The second type are components with responsibilities. These need specific capabilities to function:

```svelte
<!-- This component needs to know HOW to search -->
<SearchBar 
  search={async (query) => {
    return await searchAPI(query);
  }}
/>
```

See the difference? The SearchBar isn't just notifying you about events. It needs a search implementation to do its job.

## The Dependency Injection Pattern

Let's look at a more complex example. Say you're building a data table:

```svelte
<DataTable 
  fetchData={fetchUsers}
  deleteItem={deleteUser}
  updateItem={updateUser}
/>
```

Each prop is a capability the component needs. You're injecting the implementation. The component knows it needs to fetch, delete, and update. But it doesn't know how.

This is dependency injection. Same pattern you use in backend services, applied to components.

## Why This Matters

Take authentication. You could build separate components:

```svelte
<GoogleLoginButton />
<GitHubLoginButton />
<MicrosoftLoginButton />
```

Or you could build one component with injected behavior:

```svelte
<LoginButton authenticate={googleAuth} />
<LoginButton authenticate={githubAuth} />
<LoginButton authenticate={microsoftAuth} />
```

The second approach is more flexible. Want to add Twitter login? Just pass a different auth function. No new component needed.

## Real Example: Export Functionality

I hit this pattern recently with export buttons. Started with:

```svelte
<ExportCSVButton data={tableData} />
<ExportPDFButton data={tableData} />
<ExportExcelButton data={tableData} />
```

Three components, tons of duplicate code. Refactored to:

```svelte
<ExportButton exportData={exportToCSV} data={tableData} />
<ExportButton exportData={exportToPDF} data={tableData} />
<ExportButton exportData={exportToExcel} data={tableData} />
```

One component, three strategies. Each export function handles its own format-specific logic.

## The Test

How do you know if you're dealing with dependency injection? Simple test: can you swap the implementation without changing the component?

If your NotificationComponent can switch from Slack to email just by changing a prop, that's dependency injection:

```svelte
<!-- Same component, different notification strategies -->
<NotificationTrigger notify={slackNotifier} />
<NotificationTrigger notify={emailNotifier} />
```

## When to Use Each Pattern

Use UI shells when:
- Building design system components
- The component is purely presentational
- You want maximum flexibility for consumers

Use dependency injection when:
- The component has a specific responsibility
- The implementation might vary
- You want to avoid prop drilling through multiple layers

## The Copy Button Dilemma

Back to my original problem. The copy-to-clipboard button could go either way:

```svelte
<!-- Option 1: Built-in implementation -->
<CopyToClipboardButton textToCopy="Hello" />

<!-- Option 2: Dependency injection -->
<CopyToClipboardButton 
  textToCopy="Hello"
  copyToClipboard={customClipboardImplementation}
/>
```

I went with Option 1. Why? Because clipboard access is standard enough that varying implementations don't add value. But if I needed to support different clipboard APIs or add analytics, I'd switch to Option 2.

## The Lesson

Not every prop is data or an event handler. Sometimes props are capabilities. When you recognize this, your components become more flexible and testable.

Next time you're designing a component, ask yourself: is this a UI shell that just needs to notify about events? Or does it have responsibilities that require specific capabilities?

The answer will guide your API design.