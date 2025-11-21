---
title: Roadmap
sidebar_position: 1
---

# X CLI Roadmap

This roadmap is automatically generated from our internal task tracking system.

## 🎯 Current Priority: Advanced Context Management Parity

**Status**: Phase 1 Complete ✅ | **Next**: Full Implementation

### ✅ Phase 1: Context Visibility (COMPLETED)

- **Context Status Component** - Real-time indicator below input ✅
- **Token Counter Display** - Current/max with percentage ✅
- **Memory Pressure Warnings** - Color-coded alerts ✅
- **Enhanced Context Info** - Integrated with existing useContextInfo hook ✅

### 🚧 Phase 2: File Chunking System (P0 - Next Sprint)

- **Smart File Loader** - 25k token limit with offset/limit
- **Semantic Chunking** - Break at function/class boundaries
- **Chunk Selection** - Relevance-based chunk inclusion
- **Tool Integration** - Update all file tools to use chunking

### 📋 Phase 3: Context Management (P1)

- **Automatic Compaction** - Summarize old context when approaching limits
- **Context Prioritization** - Keep relevant messages, summarize old ones
- **Smart File Loading** - Proactive loading of related files
- **Performance Optimization** - Efficient context operations

**Goal**: Match Claude Code's context management capabilities with 25k token file limits, strategic chunking, and automatic context compaction.

## Sprint: Enhanced Installation UX with Smart Setup

## Sprint: Documentation Website with Vercel Deployment

Create a comprehensive public documentation + landing site for X CLI using Docusaurus, with automated synchronization from the `.agent` documentation system.

## Sprint: Auto-Compact Mode for Long Conversations

## Mini-Sprint to stop screen glitch + CPU spikes (KISS, no code pasted)

## Sprint: Fix Faulty Tools

## Sprint: Automate Version Sync and Git Hooks
