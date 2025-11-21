# Plan to Continue Tool Reliability Fixes

## Current Situation
The sprint to fix faulty tools (view_file, str_replace_editor, code_context) has implemented architect-recommended changes but is blocked by syntax errors from bulk edit operations. Build fails with "unexpected }" errors in 13 tool files.

## Goal
Successfully fix the three faulty tools and achieve 100% tool reliability by completing the FsPort implementation and resolving all build issues.

## Detailed Plan

### Phase 1: Syntax Error Resolution (1-2 days)
**Objective**: Fix all syntax errors to enable successful builds

#### Tasks:
1. **Manual File Inspection** (4 hours)
   - Review each failing file (text-editor.ts, morph-editor.ts, search.ts, intelligence/*.ts, advanced/*.ts)
   - Identify malformed code blocks from sed operations
   - Document specific syntax issues

2. **Syntax Corrections** (4 hours)
   - Remove stray braces, duplicate declarations, and malformed blocks
   - Ensure proper import/export statements
   - Verify TypeScript syntax compliance

3. **Incremental Testing** (2 hours)
   - Test individual files with `tsc --noEmit` for syntax
   - Fix errors one file at a time
   - Commit working versions

### Phase 2: FsPort Completion (2-3 days)
**Objective**: Fully implement FsPort abstraction across all tools

#### Tasks:
4. **Core Tools Update** (1 day)
   - Complete FsPort integration in view_file, str_replace_editor
   - Update remaining methods in text-editor.ts
   - Test core functionality

5. **Advanced Tools Integration** (1 day)
   - Implement FsPort in all advanced tools (multi-file-editor, operation-history, file-tree-operations, etc.)
   - Replace direct fs calls with fsPort methods
   - Add readdir and other missing methods to FsPort if needed

6. **Intelligence Tools Update** (1 day)
   - Complete FsPort in ast-parser, symbol-search, dependency-analyzer, code-context, refactoring-assistant
   - Resolve code_context parsing issues with proper error handling
   - Test semantic analysis capabilities

### Phase 3: Build and Test Validation (1-2 days)
**Objective**: Ensure all tools build and function correctly

#### Tasks:
7. **Build Verification** (4 hours)
   - Confirm successful build with updated tsup.config.ts
   - Verify external dependencies are handled correctly
   - Test in different environments if needed

8. **Tool Functionality Testing** (1 day)
   - Re-run inventory tests on fixed tools
   - Test edge cases and error scenarios
   - Validate tool integration with main CLI

9. **Performance and Compatibility** (4 hours)
   - Test with large files and complex operations
   - Verify backward compatibility
   - Check memory usage and performance

### Phase 4: Documentation and Retrospective (0.5 days)
**Objective**: Complete sprint deliverables

#### Tasks:
10. **Documentation Updates** (2 hours)
    - Update PRD with final fix details
    - Document FsPort interface and usage
    - Update sprint retrospective

11. **Sprint Closure** (2 hours)
    - Conduct sprint retrospective
    - Document lessons learned
    - Archive sprint materials

## Risk Mitigation
- **Syntax Error Backup**: Keep git commits of working states for easy rollback
- **Incremental Commits**: Commit fixes frequently to avoid losing progress
- **Testing Strategy**: Test each tool individually before integration
- **Architect Consultation**: Escalate any complex bundler issues immediately

## Success Criteria
- All tools build successfully without errors
- view_file, str_replace_editor, and code_context pass functionality tests
- FsPort abstraction provides clean file system interface
- Documentation is complete and accurate
- No regressions in existing functionality

## Timeline
- **Phase 1**: Days 1-2
- **Phase 2**: Days 3-5
- **Phase 3**: Days 6-7
- **Phase 4**: Day 8

## Resources Needed
- Manual code review time (8-12 hours)
- Testing environment access
- Architect availability for complex issues
- Git version control for safe experimentation

## Contingency Plans
- If syntax errors prove too complex, revert bulk changes and apply fixes incrementally
- If FsPort approach doesn't work, consider alternative abstraction strategies
- If bundler issues persist, switch to transpile-only mode temporarily

## Related Documents
- `.agent/tasks/sprint-fix-faulty-tools.md` - Current sprint status
- `.agent/incidents/tool-reliability-fix-issue.md` - Problem report
- `src/tools/_adapters/fs-port.ts` - FsPort implementation
## Updated Plan Based on Architect Guidance

### Root Cause Clarification
The fs7 errors are caused by bundler renaming of Node built-ins during minification/treeshake. The "unexpected }" syntax errors from bulk edits are blocking proper diagnosis.

### Revised Approach
1. **Immediate Priority**: Fix syntax errors in tool files (the "unexpected }" errors are red herrings masking the real bundler issues)
2. **Import Normalization**: Standardize all file system imports to ESM promises API
3. **Bundler Configuration**: Ensure Node built-ins are properly externalized
4. **FsPort Completion**: Implement clean abstraction to prevent future issues

### Updated Phase 1 (Syntax Fixes)
- Focus on manual correction of sed-induced syntax errors
- Verify each file compiles individually with tsc --noEmit
- Once syntax is clean, the bundler issues will surface clearly

### Import Standardization Pattern
Use consistent ESM imports:
```
import { readFile, writeFile, stat, access, mkdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
```

### Bun Usage Clarification
Bun will not solve the bundling/import shape issues. Stick with Node-targeted builds and use Bun only for faster test execution if needed.

### Success Path
1. Fix syntax errors → 2. Verify bundler externals → 3. Normalize imports → 4. Complete FsPort → 5. Test thoroughly

## Phase 2 Completion Status
FsPort implementation completed across all tool categories:
- Core tools: text-editor, morph-editor, search
- Intelligence tools: ast-parser, symbol-search, dependency-analyzer, code-context, refactoring-assistant
- Advanced tools: multi-file-editor, operation-history, file-tree-operations, code-aware-editor, advanced-search

All tools now use the FsPort abstraction for file system operations, providing consistent and testable interfaces.
