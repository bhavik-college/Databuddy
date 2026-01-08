## Create a changelog

Creates a changelog entry for recent work.

### Before Writing

1. Read `apps/docs/content/changelog/` to match current style
2. Run `git log --oneline -10` to get commit hashes and authors

### File Details

- **Location**: `apps/docs/content/changelog/`
- **Filename**: `kebab-case-title.md`

### Format

```md
---
title: 'Short title'
category: 'Feature' | 'Enhancement' | 'Bug Fix'
createdAt: 'YYYY-MM-DD'
---

- What changed [`abc123`](https://github.com/user/repo/commit/abc123) @username
- Another change [`def456`](https://github.com/user/repo/commit/def456) @username
```

### Style

- Bullet points only, no paragraphs
- One line per change
- End each line with commit link and @author
- Skip fluff, just facts
- Use backticks for `code`
