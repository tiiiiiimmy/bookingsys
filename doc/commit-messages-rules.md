

## Commit Message Style Guide

### 1. Basic Structure

```
<emoji> <type>: <description>
- <detailed change 1>
- <detailed change 2>
- <detailed change 3>

```

### 2. Emoji Usage Rules

| Emoji | Type | Usage |
| --- | --- | --- |
| ✨ | feat | New feature development |
| 🔒 | refactor | Refactoring (involving security) |
| 📝 | docs | Documentation updates |
| 🐳 | chore | Build tools, dependency management, etc. |
| 🦄 | refactor | General refactoring/optimization |
| 🗑️ | chore | Deleting or cleaning up code |

### 3. Type Definitions

* **feat**: New feature
* **refactor**: Code refactoring
* **docs**: Documentation related
* **chore**: Changes to the build process or auxiliary tools

### 4. Description Rules

* Use English descriptions (or the team's primary language)
* Concisely and clearly summarize the main changes
* Start with a verb, e.g., "Add", "Update", "Remove", "Optimize", etc.

### 5. Detailed Explanation Format

* Use a list format starting with `-`
* Each item should explain a specific change point
* Arrange by importance or logical order
* Explain the purpose and effect of the change

### 6. Common Pattern Examples

**New Feature Development:**

```
✨ feat: Add error handling utility functions
- Add functions to get error codes, check specific error codes, etc.
- Improve intelligent error handling logic
- Enhance the comprehensiveness of error handling and user experience

```

**Refactoring/Optimization:**

```
🔒 refactor: Update auth logic to support Cookie-based authentication
- Remove logic for manually storing and clearing accessToken
- Adopt Cookie-based authentication method
- Ensure user state management is safer and more efficient

```

**Documentation Updates:**

```
📝 docs: Add frontend-backend API integration documentation
- Create detailed API specification document
- Cover core interfaces including auth, themes, and posts
- Include complete request/response examples and error handling

```

