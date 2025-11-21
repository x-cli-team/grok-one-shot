# 📚 Documentation Workflow SOP

## When to Update Documentation

### Trigger Events
1. **Architecture Changes**: New components, modified structure
2. **New Features**: Added functionality or tools
3. **Configuration Changes**: Settings, build process, dependencies
4. **After Major Commits**: Significant code changes
5. **Failed Operations**: Document lessons learned

### Update Process

#### 1. Before Implementation
- [ ] Read .agent/README.md for project overview
- [ ] Check .agent/system/critical-state.md for current architecture  
- [ ] Review .agent/tasks/ for related work or conflicts
- [ ] Scan .agent/sop/ for established patterns
- [ ] Check .agent/guardrails/ for constraints

#### 2. During Implementation
- [ ] Store PRDs in .agent/tasks/ before coding
- [ ] Reference architecture docs for consistency
- [ ] Follow established patterns from SOPs
- [ ] Use cross-references between .agent docs

#### 3. After Implementation
- [ ] Run `/update-agent-docs` to capture changes
- [ ] Update .agent/system/ if architecture changed
- [ ] Add new SOPs for repeatable processes
- [ ] Link related tasks and documents
- [ ] Test documentation updates for accuracy
- [ ] Create session log in .agent/sessions/ documenting learnings
- [ ] Commit changes to trigger automated sync to public docs

## Documentation Standards

### File Organization
- **system/**: Core architecture and state
- **tasks/**: PRDs and feature specifications
- **sop/**: Procedures and workflows
- **incidents/**: Failure documentation
- **guardrails/**: Prevention rules

### Writing Guidelines
- **Conciseness**: Keep sections under 300 tokens
- **Cross-linking**: Use relative links between docs
- **Consistency**: Follow established markdown patterns
- **Freshness**: Include update timestamps
- **Relevance**: Focus on actionable information

### Template Usage
- Use consistent headings and structure
- Include metadata (updated date, updated by)
- Reference related documents
- Maintain clear navigation

## Automation

### Git Integration
- **Pre-commit Hook**: `.husky/pre-commit` automatically syncs `.agent` docs to public Docusaurus docs
- **Sync Script**: `apps/site/src/scripts/sync-agent-docs.js` maps internal docs to public documentation
- **Session Logging**: `.agent/sessions/` captures learnings from agent-assisted development sessions

### Auto-update Triggers
- Auto-update triggers configured in .grok/settings.json
- Smart prompts after key file changes
- Token threshold reminders
- Integration with git commit hooks

*Updated: 2025-10-11*
