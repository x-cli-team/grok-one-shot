# Sprint: Enhanced Installation UX with Smart Setup

## 📋 Sprint Overview

**Sprint Goal**: Implement three-stage setup strategy to dramatically improve installation success rate and reduce user support requests.

**Duration**: 1-2 weeks  
**Priority**: High (User Experience)  
**Complexity**: Medium

## 🎯 Problem Statement

### Current Pain Points
- **Silent failures**: Users install but can't run `grok` (PATH issues)
- **API key confusion**: Users don't know how to set up persistent API keys
- **Support overhead**: Repetitive troubleshooting for basic setup issues
- **Abandonment**: Users give up when CLI doesn't work immediately

### Success Metrics
- **Reduced "command not found" issues** by 80%
- **Increased successful first-run rate** from ~60% to 90%
- **Decreased setup-related support requests** by 70%
- **Improved user onboarding satisfaction** (qualitative feedback)

## 🚀 Implementation Strategy

### Stage 1: Enhanced Installer (`install.sh`)

#### Current State
```bash
echo "💡 Set your API key:"
echo "   export GROK_API_KEY=your_api_key_here"
```

#### Enhanced Implementation
```bash
# After successful package installation
echo "✅ Grok CLI installed successfully!"

# Test if grok command works
if ! command -v grok >/dev/null 2>&1; then
    echo ""
    echo "🛠️ PATH Setup Required"
    echo "The 'grok' command is not in your PATH."
    echo ""
    echo "Options:"
    echo "  [y] Add to shell profile automatically ($SHELL)"
    echo "  [m] Show manual instructions"  
    echo "  [s] Skip for now (help shown at startup)"
    echo ""
    read -p "Choose [y/m/s]: " choice
    
    case $choice in
        y|Y) auto_setup_path ;;
        m|M) show_manual_path_instructions ;;
        s|S) echo "⏭️ Skipped - help will be shown when you run 'grok'" ;;
        *) show_manual_path_instructions ;;
    esac
fi

# API Key Setup
echo ""
echo "🔑 API Key Setup"
if [[ -z "$GROK_API_KEY" ]]; then
    echo "No GROK_API_KEY found in environment."
    echo ""
    echo "Options:"
    echo "  [e] Enter API key now (saved to shell profile)"
    echo "  [l] Show me where to get an API key"
    echo "  [s] Skip for now (set up later)"
    echo ""
    read -p "Choose [e/l/s]: " api_choice
    
    case $api_choice in
        e|E) prompt_and_save_api_key ;;
        l|L) show_api_key_instructions ;;
        s|S) echo "⏭️ Skipped - you'll be prompted when you run 'grok'" ;;
        *) show_api_key_instructions ;;
    esac
else
    echo "✅ GROK_API_KEY already set"
fi
```

#### Helper Functions
```bash
auto_setup_path() {
    SHELL_FILE=""
    case "$SHELL" in
        */zsh) SHELL_FILE="$HOME/.zshrc" ;;
        */bash) SHELL_FILE="$HOME/.bashrc" ;;
        */fish) SHELL_FILE="$HOME/.config/fish/config.fish" ;;
        *) echo "⚠️ Unsupported shell, showing manual instructions"
           show_manual_path_instructions
           return ;;
    esac
    
    PATH_CMD='export PATH="$(npm config get prefix)/bin:$PATH"'
    
    if ! grep -q "npm config get prefix" "$SHELL_FILE" 2>/dev/null; then
        echo "📝 Adding PATH to $SHELL_FILE"
        echo "" >> "$SHELL_FILE"
        echo "# Added by Grok CLI installer" >> "$SHELL_FILE"
        echo "$PATH_CMD" >> "$SHELL_FILE"
        echo "✅ PATH updated! Restart terminal or run: source $SHELL_FILE"
    else
        echo "✅ PATH already configured in $SHELL_FILE"
    fi
}

prompt_and_save_api_key() {
    echo ""
    read -p "Enter your Grok API key: " api_key
    if [[ -n "$api_key" ]]; then
        save_api_key_to_profile "$api_key"
    else
        echo "⚠️ No API key entered"
    fi
}

save_api_key_to_profile() {
    local api_key="$1"
    SHELL_FILE=""
    case "$SHELL" in
        */zsh) SHELL_FILE="$HOME/.zshrc" ;;
        */bash) SHELL_FILE="$HOME/.bashrc" ;;
        */fish) SHELL_FILE="$HOME/.config/fish/config.fish" ;;
    esac
    
    if [[ -n "$SHELL_FILE" ]]; then
        if ! grep -q "GROK_API_KEY" "$SHELL_FILE" 2>/dev/null; then
            echo "" >> "$SHELL_FILE"
            echo "# Grok CLI API key" >> "$SHELL_FILE"
            echo "export GROK_API_KEY=\"$api_key\"" >> "$SHELL_FILE"
            echo "✅ API key saved to $SHELL_FILE"
        else
            echo "⚠️ GROK_API_KEY already exists in $SHELL_FILE"
            echo "Please update it manually if needed"
        fi
    fi
}
```

### Stage 2: Welcome Message Enhancement

#### Enhanced Welcome (`src/ui/components/chat-interface.tsx`)

Add conditional setup reminders:

```typescript
// Check setup status
const isSetupIncomplete = () => {
  const hasApiKey = !!process.env.GROK_API_KEY;
  const hasGrokInPath = checkCommandExists('grok');
  return !hasApiKey || !hasGrokInPath;
};

// Enhanced welcome with setup status
{chatHistory.length === 0 && !confirmationOptions && (
  <Box flexDirection="column" marginBottom={2}>
    {/* ASCII Art */}
    <Text color="cyan" bold>{/* ... existing ASCII ... */}</Text>
    
    {/* Setup Status Check */}
    {isSetupIncomplete() && (
      <Box flexDirection="column" marginTop={1} paddingX={2} borderStyle="round" borderColor="yellow">
        <Text color="yellow" bold>⚠️ Setup Incomplete</Text>
        {!process.env.GROK_API_KEY && (
          <Text color="gray">
            • Missing API key: <Text color="yellow">export GROK_API_KEY=your_key</Text>
          </Text>
        )}
        <Text color="gray">
          💡 Run setup commands above, then restart terminal
        </Text>
      </Box>
    )}
    
    {/* Welcome Message */}
    <Text color="green" bold marginTop={1}>
      🚀 Welcome to Grok CLI - Claude Code-level intelligence!
    </Text>
    
    {/* Rest of existing welcome... */}
  </Box>
)}
```

#### Helper Functions
```typescript
const checkCommandExists = (command: string): boolean => {
  try {
    execSync(`command -v ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};
```

### Stage 3: Runtime Error Enhancement

#### Enhanced Error Handling (`src/agent/grok-agent.ts`)

```typescript
// In API call error handling
if (error.message.includes('API key') || error.message.includes('unauthorized')) {
  const helpMessage = `
❌ API Key Error

🔧 Quick fix:
   export GROK_API_KEY=your_api_key_here

📖 Save permanently:
   echo 'export GROK_API_KEY=your_key' >> ~/.zshrc
   source ~/.zshrc

🔑 Get your API key: https://x.ai

💡 Need help? Run: grok --help
  `;
  
  // Show in terminal
  console.error(helpMessage);
  
  // Also add to chat history for visibility
  return {
    role: 'assistant' as const,
    content: helpMessage,
    timestamp: Date.now()
  };
}
```

#### Enhanced CLI Argument Handling

Add `--setup` command for post-install configuration:

```typescript
// In main CLI entry point
program
  .command('setup')
  .description('Run interactive setup for PATH and API key')
  .action(async () => {
    await runInteractiveSetup();
  });

const runInteractiveSetup = async () => {
  console.log('🛠️ Grok CLI Setup\n');
  
  // Check PATH
  if (!checkCommandExists('grok')) {
    console.log('⚠️ grok command not in PATH');
    // Show PATH setup instructions
  }
  
  // Check API key
  if (!process.env.GROK_API_KEY) {
    console.log('⚠️ GROK_API_KEY not set');
    // Prompt for API key setup
  }
  
  console.log('✅ Setup complete!');
};
```

## 🔧 Technical Implementation Details

### Files to Modify

#### 1. `install.sh` (Major Enhancement)
- Add interactive PATH setup
- Add API key configuration
- Add helper functions for shell detection
- Add proper error handling and fallbacks

#### 2. `src/ui/components/chat-interface.tsx` (Moderate)
- Add setup status detection
- Add conditional warning messages
- Maintain existing welcome structure

#### 3. `src/agent/grok-agent.ts` (Minor)
- Enhance API error messages
- Add helpful troubleshooting guidance

#### 4. `src/index.ts` (Minor)
- Add `--setup` command
- Add interactive setup function

#### 5. `package.json` (Minor)
- Potentially add setup script

### Dependencies

No new dependencies required - using existing:
- Shell scripting (bash)
- Node.js built-ins (execSync)
- Existing UI components (Ink/React)

### Testing Strategy

#### Installer Testing
```bash
# Test different shells
SHELL=/bin/zsh ./install.sh
SHELL=/bin/bash ./install.sh

# Test different scenarios
unset GROK_API_KEY && ./install.sh  # No API key
export GROK_API_KEY=test && ./install.sh  # Has API key

# Test PATH scenarios
# Remove grok from PATH, then test
```

#### CLI Testing
```bash
# Test setup detection
unset GROK_API_KEY && grok  # Should show setup warning
export GROK_API_KEY=invalid && grok "test"  # Should show API error

# Test setup command
grok --setup  # Should run interactive setup
```

## 📅 Implementation Timeline

### Week 1: Core Implementation
- **Day 1-2**: Enhanced installer script with PATH detection
- **Day 3-4**: Interactive API key setup in installer
- **Day 5**: Welcome message setup status integration

### Week 2: Polish & Testing
- **Day 1-2**: Runtime error enhancement and --setup command
- **Day 3-4**: Cross-platform testing (macOS, Linux, Windows)
- **Day 5**: Documentation updates and edge case handling

### Testing & Validation
- **Internal testing**: All major shell combinations
- **User testing**: Beta test with 5-10 new users
- **Documentation**: Update README and troubleshooting guides

## 🎯 Success Criteria

### Technical Metrics
- [ ] Installer successfully detects and offers PATH setup
- [ ] API key can be saved persistently to shell profiles
- [ ] Welcome message shows relevant setup warnings
- [ ] Error messages provide actionable solutions
- [ ] `--setup` command handles post-install configuration

### User Experience Metrics
- [ ] New users can install and run successfully in <2 minutes
- [ ] Setup completion rate >90% (PATH + API key)
- [ ] "Command not found" support requests drop significantly
- [ ] Positive feedback on installation experience

### Edge Cases Handled
- [ ] Unsupported shells (fish, custom shells)
- [ ] Permission issues with shell profile modification
- [ ] Existing configurations (don't duplicate entries)
- [ ] Network issues during API key validation
- [ ] Multiple package managers (npm, yarn, pnpm, bun)

## 🔗 Related Documentation

### Implementation References
- **Current installer**: `install.sh`
- **Welcome component**: `src/ui/components/chat-interface.tsx`
- **Error handling**: `src/agent/grok-agent.ts`
- **CLI entry**: `src/index.ts`

### User Documentation
- **Installation guide**: `README.md` installation section
- **Troubleshooting**: `README.md` troubleshooting section
- **Agent docs**: `.agent/system/installation.md`

### Testing Documentation
- **Installation testing**: Need to create test matrix
- **Cross-platform validation**: macOS, Linux, Windows (WSL)
- **Shell compatibility**: zsh, bash, fish

---

**Sprint Status**: Ready for implementation  
**Estimated Effort**: 5-8 days  
**Risk Level**: Low-Medium (shell scripting complexity)  
**User Impact**: High (addresses #1 user pain point)