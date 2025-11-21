---
title: Error Handling and Recovery
---

# Error Handling and Recovery

How Grok One-Shot handles errors and recovers from failures.

## Overview

Grok One-Shot is designed with robust error handling and automatic recovery. The AI can detect errors, diagnose causes, and attempt corrections autonomously.

## Error Categories

### 1. API Errors

**X.AI API failures:**

```
Common errors:
- 401 Unauthorized (invalid API key)
- 429 Too Many Requests (rate limit)
- 500 Internal Server Error (API issue)
- Network timeout
- Connection refused
```

**Handling:**

```
Automatic retry for transient errors (3 attempts)
Exponential backoff (2s, 4s, 8s)
Clear error messages to user
Graceful degradation
```

**Example:**

```
User: "Analyze the codebase"

API Error: 429 Too Many Requests

AI Response:
" Rate limit exceeded. Retrying in 2 seconds..."
[Waits 2s]
"Retrying request..."
[Success]
```

### 2. File Operation Errors

**Read errors:**

```
Common errors:
- File not found
- Permission denied
- File too large
- Invalid encoding
```

**AI recovery:**

```
User: "Read auth.ts"

Error: File not found

AI Recovery:
1. Glob("**/*auth*.ts")
→ Finds: src/auth/middleware.ts
2. Read(src/auth/middleware.ts)
→ Success
3. "Found the file at src/auth/middleware.ts"
```

**Write/Edit errors:**

```
Common errors:
- Permission denied
- Disk full
- File already exists (Write)
- old_string not found (Edit)
```

**AI recovery:**

```
Error: old_string not unique in Edit

AI Recovery:
1. Read file to see content
2. Find unique surrounding context
3. Retry Edit with larger old_string
4. Success
```

### 3. Command Execution Errors

**Bash tool failures:**

```
Common errors:
- Command not found
- Exit code non-zero
- Timeout
- Permission denied
```

**AI recovery:**

```
User: "Run the tests"

Error: npm: command not found

AI Recovery:
1. Check for yarn: which yarn
2. Try: yarn test
3. Or: bun test
4. Or: node ./test.js
5. Report findings to user
```

### 4. Tool Limit Errors

**MAX_TOOL_ROUNDS exceeded:**

```
Error: Reached maximum tool calls (400)

AI Response:
"I've reached the tool limit. Here's what I've completed:
- Analyzed 47 files
- Found 12 issues
- Fixed 8 of them

Remaining tasks:
- 4 issues need review
- Would you like me to continue in a new session?"
```

## Error Handling Strategies

### Implemented

**Automatic retry:**

- API calls retry on transient errors
- Exponential backoff
- Max 3-4 retry attempts
- Clear error reporting

**Graceful degradation:**

- Continue on non-critical failures
- Report partial results
- Suggest manual alternatives

**Error recovery:**

- AI adapts to errors automatically
- Tries alternative approaches
- Corrects file paths, commands
- Adjusts strategy based on failures

**Error reporting:**

- Clear, actionable error messages
- Context about what went wrong
- Suggestions for fixes
- Logs available for debugging

### Partially Implemented

**Transaction rollback:**

- No atomic multi-file operations
- No automatic undo on failure
- Manual recovery needed

**Error prevention:**

- No pre-flight validation
- No dry-run mode
- No change preview

**Advanced recovery:**

- No checkpoint/resume
- No partial state save
- Limited context recovery

### Planned Features

**Atomic operations:**

- Multi-file transactions
- Automatic rollback on failure
- Checkpoint and resume
- Change preview before apply

**Enhanced validation:**

- Pre-flight checks
- Dry-run mode
- Impact analysis
- Confirmation with preview

**Smart recovery:**

- Learn from previous errors
- Suggest preventive measures
- Auto-fix common issues
- Recovery strategies library

## Error Recovery Examples

### Example 1: File Not Found

**Scenario:**

```
User: "Fix the bug in user-service.ts"

AI:
1. Edit(user-service.ts)
Error: File not found

Recovery:
2. Glob("**/*user-service*")
→ Found: src/services/user-service.ts

3. Edit(src/services/user-service.ts)
Success: Bug fixed

Response: "Fixed the bug in src/services/user-service.ts"
```

### Example 2: Command Not Found

**Scenario:**

```
User: "Run the linter"

AI:
1. Bash("eslint .")
Error: eslint: command not found

Recovery:
2. Bash("npm run lint")
Success: Linter runs via npm script

Response: "Ran linter via npm run lint. Found 5 issues..."
```

### Example 3: Edit String Not Found

**Scenario:**

```
User: "Change the timeout to 5000"

AI:
1. Edit(config.ts, old_string="timeout: 3000", new_string="timeout: 5000")
Error: old_string not unique (found 3 times)

Recovery:
2. Read(config.ts)
3. Find unique context around each occurrence
4. Ask user which one to change
OR auto-select based on context

Response: "Found 3 timeout values. Changed the API timeout to 5000."
```

### Example 4: API Rate Limit

**Scenario:**

```
User: "Analyze all files in src/"

AI:
1. Processing files...
2. API Error: 429 Too Many Requests

Recovery:
3. Wait 2 seconds
4. Retry request
5. Continue processing

Response: "Analyzed 47 files (with brief rate limit pause)..."
```

### Example 5: Permission Denied

**Scenario:**

```
User: "Create a log file"

AI:
1. Write(/var/log/app.log)
Error: Permission denied

Recovery:
2. Write(./logs/app.log)
Check: ./logs/ exists?
3. Bash("mkdir -p ./logs")
4. Write(./logs/app.log)
Success

Response: "Created log file at ./logs/app.log"
```

## Error Prevention

### Best Practices

**DO:**

- Use confirmations for risky operations
- Review changes before approving
- Test in safe environment first
- Keep backups (git commit often)
- Monitor error logs

**DON'T:**

- Disable confirmations for untrusted code
- Ignore repeated errors
- Run with elevated privileges unnecessarily
- Modify production without testing

### Pre-Execution Checks

**Manual checks:**

```
Before major changes:
1. > What files will this modify?
2. > Show me a summary of planned changes
3. Review and approve
4. > Proceed with changes

After changes:
1. > Run tests to verify
2. > Show me what changed (git diff)
3. > Any issues found?
```

### Safe Practices

**Use version control:**

```bash
# Before AI makes changes
git commit -m "Before AI refactoring"

# AI makes changes
[Changes applied]

# If something goes wrong
git diff # Review changes
git restore . # Undo if needed
```

**Test in isolation:**

```bash
# Create test branch
git checkout -b test/ai-changes

# Let AI make changes
grok "refactor authentication"

# Review and test
npm test
git diff

# If good: merge
git checkout main
git merge test/ai-changes

# If bad: discard
git checkout main
git branch -D test/ai-changes
```

## Debugging Errors

### Enable Debug Mode

**See detailed error information:**

```bash
export GROK_DEBUG=true
grok
```

**Debug output includes:**

- API request/response details
- Tool call parameters
- Error stack traces
- Retry attempts
- Internal state

### Check Logs

**Startup log:**

```bash
cat xcli-startup.log
```

**Contains:**

- Environment configuration
- Loaded settings
- MCP server status
- Startup errors

**Session files:**

```bash
# View errors in session
cat ~/.grok/sessions/latest-session.json | jq '.messages[] | select(.error)'
```

### Common Error Patterns

**API key issues:**

```
Error: 401 Unauthorized

Check:
1. Is GROK_API_KEY set?
echo $GROK_API_KEY
2. Is key valid?
Try in X.AI console
3. Is key in settings.json correct?
cat ~/.grok/settings.json
```

**File operation issues:**

```
Error: Permission denied

Check:
1. File permissions
ls -la <file>
2. Directory permissions
ls -la <directory>
3. Ownership
ls -la <file>
```

**Network issues:**

```
Error: ECONNREFUSED

Check:
1. Internet connection
ping api.x.ai
2. Proxy settings
echo $HTTP_PROXY
3. Firewall rules
```

## Error Recovery Workflows

### Workflow 1: Investigate and Fix

```
1. Error occurs
2. Enable debug mode
export GROK_DEBUG=true
3. Reproduce error
4. Review debug output
5. Identify root cause
6. Apply fix
7. Verify success
```

### Workflow 2: Retry with Different Approach

```
1. Error: Initial approach fails
2. AI tries alternative
- Different file path
- Different command
- Different tool
3. Success or escalate to user
```

### Workflow 3: Partial Success

```
1. Task: "Fix 10 bugs"
2. AI fixes 7 successfully
3. Error on 8th bug
4. AI reports:
"Fixed 7 of 10 bugs. Encountered error on bug #8.
Here's what was fixed: [...list...]
Remaining: Bug #8 needs manual review due to [reason]"
```

## Error Messages

### User-Friendly Messages

**Good error messages:**

```
"API key not found. Set GROK_API_KEY environment variable or use -k flag."
"Rate limit exceeded. Waiting 5 seconds before retry..."
"File not found: user-service.ts. Did you mean src/services/user-service.ts?"
```

**Poor error messages:**

```
"Error 401"
"Request failed"
"Unknown error"
```

### Error Context

**Grok One-Shot provides context:**

```
Error: Edit failed

Context provided:
- What was being edited
- What change was attempted
- Why it failed
- What to try instead

Example:
"Failed to edit src/auth/middleware.ts:
Could not find exact match for 'const timeout = 3000'
Found similar: 'const apiTimeout = 3000'
Should I try editing that instead?"
```

## Troubleshooting Guide

### Error: "No API key found"

**Cause:** GROK_API_KEY not set

**Solution:**

```bash
export GROK_API_KEY="your-key"
# or
grok -k "your-key"
```

### Error: "Rate limit exceeded"

**Cause:** Too many API requests

**Solution:**

- Wait a few minutes
- Reduce request frequency
- Upgrade API plan

### Error: "Too many tool rounds"

**Cause:** Hit MAX_TOOL_ROUNDS limit

**Solution:**

```bash
export MAX_TOOL_ROUNDS=500
```

### Error: "File not found"

**Cause:** Incorrect file path

**Solution:**

- AI will search for correct path
- Or provide full path to AI

### Error: "Permission denied"

**Cause:** No write permission

**Solution:**

```bash
# Fix permissions
chmod +w <file>

# Or use different location
```

## See Also

- [Troubleshooting](../build-with-claude-code/troubleshooting.md) - Common issues
- [Tool System](./tool-system.md) - Tool error handling
- [Interactive Mode](../reference/interactive-mode.md) - Session errors
- [Configuration](../configuration/settings.md) - Setup issues

---

**Status:** Core error handling and recovery implemented, Advanced features in development, Transaction rollback and prevention planned

Robust error handling ensures Grok One-Shot can adapt to failures and recover automatically whenever possible.
