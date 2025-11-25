import React from "react";
import { Box, Text } from "ink";
import { inkColors } from "../colors.js";

// Tree node structure for complex operations
export interface TreeNode {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  icon?: string;
  details?: string;
  children?: TreeNode[];
  startTime?: number;
  endTime?: number;
  progress?: number; // 0-100 for running operations
}

interface OperationTreeProps {
  tree: TreeNode;
  showProgress?: boolean;
  compact?: boolean;
}

// Status indicators and colors
const statusConfig = {
  pending: { icon: '⏳', color: inkColors.muted, symbol: '○' },
  running: { icon: '🔄', color: inkColors.info, symbol: '●' },
  completed: { icon: '✅', color: inkColors.success, symbol: '✓' },
  failed: { icon: '❌', color: inkColors.error, symbol: '✗' },
  skipped: { icon: '⏭️', color: inkColors.muted, symbol: '○' }
};

// ASCII tree drawing characters
const treeChars = {
  branch: '├── ',
  lastBranch: '└── ',
  vertical: '│   ',
  space: '    '
};

function formatDuration(startTime?: number, endTime?: number): string {
  if (!startTime) return '';
  const end = endTime || Date.now();
  const duration = (end - startTime) / 1000;
  return duration < 10 ? `${duration.toFixed(1)}s` : `${Math.round(duration)}s`;
}

function renderProgressBar(progress: number, width: number = 12): string {
  const filled = Math.round((progress / 100) * width);
  const empty = width - filled;
  return `[${('█'.repeat(filled) + '░'.repeat(empty))}] ${progress}%`;
}

function renderTreeNode(
  node: TreeNode,
  prefix: string = '',
  isLast: boolean = true,
  showProgress: boolean = true,
  compact: boolean = false
): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  const config = statusConfig[node.status];
  const hasChildren = node.children && node.children.length > 0;
  
  // Current node prefix
  const nodePrefix = prefix + (isLast ? treeChars.lastBranch : treeChars.branch);
  
  // Main node line
  const duration = formatDuration(node.startTime, node.endTime);
  const nodeIcon = node.icon || config.icon;
  
  elements.push(
    <Box key={node.id}>
      <Text color={inkColors.muted}>{nodePrefix}</Text>
      <Text color={config.color}>
        {nodeIcon} {config.symbol} {node.label}
      </Text>
      {duration && (
        <Text color={inkColors.muted}> ({duration})</Text>
      )}
      {node.status === 'running' && node.progress !== undefined && showProgress && (
        <Text color={inkColors.info}>
          {' '}{renderProgressBar(node.progress)}
        </Text>
      )}
    </Box>
  );
  
  // Details line (if not compact)
  if (node.details && !compact) {
    const detailPrefix = prefix + (isLast ? treeChars.space : treeChars.vertical);
    elements.push(
      <Box key={`${node.id}-details`}>
        <Text color={inkColors.muted}>
          {detailPrefix}└─ {node.details}
        </Text>
      </Box>
    );
  }
  
  // Render children
  if (hasChildren) {
    const childPrefix = prefix + (isLast ? treeChars.space : treeChars.vertical);
    
    node.children!.forEach((child, index) => {
      const isLastChild = index === node.children!.length - 1;
      const childElements = renderTreeNode(
        child,
        childPrefix,
        isLastChild,
        showProgress,
        compact
      );
      elements.push(...childElements);
    });
  }
  
  return elements;
}

export function OperationTree({
  tree,
  showProgress = true,
  compact = false
}: OperationTreeProps) {
  const elements = renderTreeNode(tree, '', true, showProgress, compact);
  
  return (
    <Box flexDirection="column" marginLeft={1}>
      {elements}
    </Box>
  );
}

// Helper function to create tree nodes
export function createTreeNode(
  id: string,
  label: string,
  status: TreeNode['status'] = 'pending',
  options: Partial<Pick<TreeNode, 'icon' | 'details' | 'children' | 'progress'>> = {}
): TreeNode {
  return {
    id,
    label,
    status,
    startTime: status === 'running' ? Date.now() : undefined,
    ...options
  };
}

// Helper function to update node status in tree
export function updateNodeStatus(
  tree: TreeNode,
  nodeId: string,
  status: TreeNode['status'],
  updates: Partial<TreeNode> = {}
): TreeNode {
  if (tree.id === nodeId) {
    const updatedNode = {
      ...tree,
      status,
      ...updates
    };
    
    // Set timestamps based on status
    if (status === 'running' && !updatedNode.startTime) {
      updatedNode.startTime = Date.now();
    } else if (['completed', 'failed', 'skipped'].includes(status) && !updatedNode.endTime) {
      updatedNode.endTime = Date.now();
    }
    
    return updatedNode;
  }
  
  if (tree.children) {
    return {
      ...tree,
      children: tree.children.map(child =>
        updateNodeStatus(child, nodeId, status, updates)
      )
    };
  }
  
  return tree;
}

// Helper function to find node in tree
export function findNode(tree: TreeNode, nodeId: string): TreeNode | null {
  if (tree.id === nodeId) {
    return tree;
  }
  
  if (tree.children) {
    for (const child of tree.children) {
      const found = findNode(child, nodeId);
      if (found) return found;
    }
  }
  
  return null;
}

// Predefined operation trees for common scenarios
export const commonOperationTrees = {
  multiFileEdit: (files: string[]): TreeNode => createTreeNode(
    'multi-file-edit',
    'Multi-file Edit Operation',
    'running',
    {
      icon: '📝',
      details: `Editing ${files.length} files`,
      children: files.map((file, index) =>
        createTreeNode(
          `edit-${index}`,
          `Edit ${file}`,
          'pending',
          { icon: '✏️' }
        )
      )
    }
  ),
  
  codebaseAnalysis: (steps: string[]): TreeNode => createTreeNode(
    'codebase-analysis',
    'Codebase Analysis',
    'running',
    {
      icon: '🔬',
      details: 'Deep code understanding',
      children: steps.map((step, index) =>
        createTreeNode(
          `analysis-${index}`,
          step,
          'pending',
          { icon: '🔍' }
        )
      )
    }
  ),
  
  planMode: (planSteps: string[]): TreeNode => createTreeNode(
    'plan-mode',
    'Plan Mode Exploration',
    'running',
    {
      icon: '🗺️',
      details: 'Read-only codebase exploration',
      children: planSteps.map((step, index) =>
        createTreeNode(
          `plan-${index}`,
          step,
          'pending',
          { icon: '👁️' }
        )
      )
    }
  )
};