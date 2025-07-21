# Stage Session Files

Stage all files that were modified in the current Claude session.

## Description
This command instructs Claude to identify and stage only the files that were modified during the current coding session. Claude will remember which files were edited and stage them appropriately.

## What Claude Will Do
1. Identify all files that were modified in the current session
2. Stage only those specific files using individual `git add` commands
3. Show the staged changes with `git status`
4. Optionally create a commit with a descriptive message

## Usage
Run this after making changes in a Claude session to stage only the relevant files before committing. Claude will remember the exact files that were modified and stage them precisely.