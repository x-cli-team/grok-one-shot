---
title: Terminal Configuration
---

# Terminal Configuration

Optimize your terminal environment for the best Grok One-Shot experience.

## Overview

Grok One-Shot adapts to your terminal capabilities, but proper configuration ensures optimal display quality, colors, and performance.

## Terminal Emulator Selection

### Recommended Terminals

**macOS:**

- **iTerm2** (Recommended) - Best color support, performance
- Terminal.app - Built-in, adequate support
- Warp - Modern alternative with good compatibility

**Windows:**

- **Windows Terminal** (Recommended) - Excellent Unicode and color support
- PowerShell - Good compatibility
- Git Bash - Acceptable, some limitations

**Linux:**

- **Alacritty** (Recommended) - GPU-accelerated, excellent performance
- GNOME Terminal - Solid all-around choice
- Konsole - KDE's terminal, great features
- kitty - Advanced features, good performance
- tmux/screen - Terminal multiplexers (fully supported)

### Why It Matters

**Color Support:**

- Grok One-Shot uses 256-color palette for visual feedback
- Basic terminals may display incorrect colors
- Modern terminals render spinners, progress bars smoothly

**Unicode Support:**

- Spinners use Unicode characters (⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏)
- Progress bars use block characters (█░)
- Icons and symbols enhance readability

**Performance:**

- Fast rendering = smooth animations
- GPU acceleration reduces CPU usage
- Good terminals handle rapid updates efficiently

## Color Configuration

### Automatic Detection

Grok One-Shot automatically detects terminal colors using:

1. **`COLORFGBG` environment variable** (most reliable)
2. **`TERM_BACKGROUND`** (manual override)
3. **Heuristics** (terminal type, platform)

**Check detection:**

```bash
export GROK_DEBUG_COLORS=1
grok
# Shows detected background and color choices
```

### Manual Color Control

#### Set Terminal Background Type

```bash
# For dark terminals
export TERM_BACKGROUND=dark

# For light terminals
export TERM_BACKGROUND=light
```

**Add to shell profile:**

```bash
# ~/.bashrc or ~/.zshrc
export TERM_BACKGROUND=dark # or 'light'
```

#### Force Text Color

```bash
# Force white text (for dark backgrounds)
export GROK_TEXT_COLOR=white

# Force black text (for light backgrounds)
export GROK_TEXT_COLOR=black
```

**When to use:**

- Automatic detection fails
- Custom terminal themes
- Specific contrast preferences

### Color System Details

**Default Palette:**

- **Blue/Cyan** - Information, search operations
- **Green** - Success, completed operations
- **Yellow** - Warnings, in-progress operations
- **Red** - Errors, failures
- **Magenta** - Special states, highlights
- **Gray** - Secondary information, timestamps

**Adaptive Behavior:**

```
Dark Background → Bright colors (high contrast)
Light Background → Darker colors (readability)
```

## Font Configuration

### Recommended Fonts

**Monospace fonts with good Unicode support:**

- **JetBrains Mono** - Excellent for code, great ligatures
- **Fira Code** - Popular, good Unicode support
- **Cascadia Code** - Microsoft's developer font
- **Source Code Pro** - Adobe's open-source monospace
- **SF Mono** - macOS system monospace
- **Consolas** - Windows system monospace

**What to look for:**

- Full Unicode coverage (especially box drawing)
- Clear distinction between similar characters (O/0, l/1/I)
- Comfortable at typical sizes (12-14pt)
- Optional: ligature support for operators (=> != >=)

### Font Settings

**iTerm2:**

```
Preferences → Profiles → Text
Font: JetBrains Mono, 13pt
Use ligatures: Optional
Anti-aliased: Yes
```

**Windows Terminal:**

```json
{
  "profiles": {
    "defaults": {
      "font": {
        "face": "Cascadia Code",
        "size": 12
      }
    }
  }
}
```

**VS Code Terminal:**

```json
{
  "terminal.integrated.fontFamily": "JetBrains Mono",
  "terminal.integrated.fontSize": 13
}
```

## Display Settings

### Enable 256-Color Support

**Check current support:**

```bash
echo $TERM
# Should be: xterm-256color, screen-256color, etc.
```

**Enable if needed:**

```bash
# Add to ~/.bashrc or ~/.zshrc
export TERM=xterm-256color
```

**For tmux:**

```bash
# ~/.tmux.conf
set -g default-terminal "screen-256color"
```

### Unicode Support

**Ensure UTF-8 encoding:**

```bash
# Check current locale
locale

# Should show UTF-8 encoding
# Example: LANG=en_US.UTF-8
```

**Set if needed:**

```bash
# Add to shell profile
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
```

## Performance Optimization

### Disable UX Enhancements

If terminal is slow or laggy:

```bash
# Disable spinners and animations
export GROK_UX_ENHANCED=false

# Or use minimal mode
export GROK_UX_MINIMAL=true
```

**What this does:**

- No animated spinners
- No progress bars
- Simpler text-only output
- Lower CPU and rendering overhead

### Terminal-Specific Optimizations

**iTerm2:**

```
Preferences → General → Selection
Applications in terminal may access clipboard

Preferences → Profiles → Terminal
Scrollback lines: 10000 (adjust for performance)
```

**Windows Terminal:**

```json
{
  "profiles": {
    "defaults": {
      "useAcrylic": false, // Disable transparency
      "historySize": 10000
    }
  }
}
```

**Alacritty:**

```yaml
# ~/.config/alacritty/alacritty.yml
scrolling:
history: 10000

window:
decorations: full
startup_mode: Windowed
```

## Shell Integration

### Bash Configuration

```bash
# ~/.bashrc

# Grok One-Shot environment
export GROK_API_KEY="your-api-key"
export TERM_BACKGROUND=dark
export GROK_MODEL="grok-2-1212"

# Terminal setup
export TERM=xterm-256color
export LANG=en_US.UTF-8

# Optional: Aliases
alias grok-fast='GROK_MODEL=grok-4-fast-non-reasoning grok'
```

### Zsh Configuration

```bash
# ~/.zshrc

# Grok One-Shot environment
export GROK_API_KEY="your-api-key"
export TERM_BACKGROUND=dark
export GROK_MODEL="grok-2-1212"

# Terminal setup
export TERM=xterm-256color
export LANG=en_US.UTF-8

# Optional: Aliases
alias grok-fast='GROK_MODEL=grok-4-fast-non-reasoning grok'
```

### Fish Configuration

```fish
# ~/.config/fish/config.fish

# Grok One-Shot environment
set -x GROK_API_KEY "your-api-key"
set -x TERM_BACKGROUND dark
set -x GROK_MODEL "grok-2-1212"

# Terminal setup
set -x TERM xterm-256color
set -x LANG en_US.UTF-8

# Optional: Aliases
alias grok-fast='GROK_MODEL=grok-4-fast-non-reasoning grok'
```

## SSH and Remote Terminals

### SSH Configuration

**For remote Grok One-Shot sessions:**

```bash
# Connect with proper terminal forwarding
ssh -t user@host "TERM=xterm-256color bash"

# Or set in ~/.ssh/config
Host myserver
RequestTTY yes
SendEnv TERM LANG
```

**On remote server:**

```bash
# Ensure environment is set
export TERM=xterm-256color
export LANG=en_US.UTF-8
export GROK_API_KEY="your-key"
```

### tmux/screen Support

**tmux configuration:**

```bash
# ~/.tmux.conf
set -g default-terminal "screen-256color"
set -ga terminal-overrides ",xterm-256color:Tc"

# Enable mouse support (optional)
set -g mouse on
```

**Start session:**

```bash
tmux new-session -s grok
grok
# Detach: Ctrl+B, D
# Reattach: tmux attach -t grok
```

**screen configuration:**

```bash
# ~/.screenrc
term screen-256color
altscreen on
```

## Troubleshooting

### Colors Look Wrong

**Symptoms:**

- Text hard to read
- Colors appear inverted
- Random color glitches

**Solutions:**

```bash
# 1. Check detection
export GROK_DEBUG_COLORS=1
grok

# 2. Force background type
export TERM_BACKGROUND=dark # or 'light'

# 3. Force text color
export GROK_TEXT_COLOR=white # or 'black'

# 4. Verify TERM variable
echo $TERM
# Should end with "-256color"
```

### Unicode Characters Broken

**Symptoms:**

- Spinners show weird characters
- Progress bars look corrupted
- Boxes and lines broken

**Solutions:**

```bash
# 1. Check locale
locale
# Should show UTF-8

# 2. Set UTF-8 encoding
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

# 3. Or disable enhancements
export GROK_UX_ENHANCED=false
```

### Terminal is Laggy

**Symptoms:**

- Slow rendering
- Animations stutter
- High CPU usage

**Solutions:**

```bash
# 1. Use minimal mode
export GROK_UX_MINIMAL=true

# 2. Disable animations
export GROK_UX_ENHANCED=false

# 3. Reduce scrollback
# (in terminal emulator settings)

# 4. Use faster terminal
# Alacritty, iTerm2, Windows Terminal
```

### Output Overlaps or Corrupts

**Cause:** Terminal size detection issues

**Solutions:**

```bash
# 1. Check terminal size
echo $COLUMNS x $LINES

# 2. Resize window and test
# Terminal should auto-detect

# 3. Restart terminal
# Clears any corruption
```

## Best Practices

### Optimal Setup

**Recommended configuration:**

```bash
# ~/.bashrc or ~/.zshrc

# Terminal
export TERM=xterm-256color
export LANG=en_US.UTF-8

# Grok One-Shot
export GROK_API_KEY="your-key"
export TERM_BACKGROUND=dark # match your theme
export GROK_MODEL="grok-2-1212"

# Optional: Performance
# export GROK_UX_MINIMAL=true # for older systems
```

**Terminal emulator:**

- Use modern terminal (iTerm2, Windows Terminal, Alacritty)
- Enable 256-color support
- Install monospace font with Unicode support
- Adjust font size for comfort (12-14pt typical)

### Testing Your Setup

**Run these checks:**

```bash
# 1. Color support
echo $TERM
# Expected: *-256color

# 2. Unicode support
echo "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏ █░ "
# Should render cleanly

# 3. Grok One-Shot
export GROK_DEBUG_COLORS=1
grok
# Check output for correct detection

# 4. Interactive test
grok "list files in current directory"
# Watch for smooth rendering
```

## Platform-Specific Notes

### macOS

**Default Terminal.app:**

- Adequate but basic
- iTerm2 strongly recommended

**Settings:**

```
Terminal → Preferences → Profiles
Text: SF Mono, 13pt
Background: Choose theme (Dark/Light)
```

### Windows

**PowerShell:**

- Use Windows Terminal for best experience
- Legacy PowerShell has limitations

**Git Bash:**

- Works but limited Unicode support
- Windows Terminal improves this

**WSL:**

```bash
# Best option for Windows
# Full Linux terminal capabilities
# Use with Windows Terminal
```

### Linux

**Most distributions:**

- Excellent terminal support out of box
- Choose emulator based on desktop environment

**Minimal installs:**

```bash
# Install recommended terminal
sudo apt install alacritty # Debian/Ubuntu
sudo dnf install alacritty # Fedora
```

## See Also

- [Settings](./settings.md) - General configuration
- [Model Configuration](./model-configuration.md) - Model selection
- [Interactive Mode](../reference/interactive-mode.md) - Using the interface
- [Troubleshooting](../build-with-claude-code/troubleshooting.md) - Common issues

---

Proper terminal configuration ensures Grok One-Shot displays beautifully and performs optimally.
