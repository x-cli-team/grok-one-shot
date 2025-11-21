import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  "tutorialSidebar": [
    "overview",
    {
      "type": "category",
      "label": "Getting Started",
      "items": [
        "getting-started/overview",
        "getting-started/installation",
        "getting-started/quickstart",
        "getting-started/common-workflows",
        "getting-started/hooks",
        "getting-started/hooks-guide",
        "getting-started/skills"
      ]
    },
    {
      "type": "category",
      "label": "Configuration",
      "items": [
        "configuration/settings",
        "configuration/terminal-configuration",
        "configuration/model-configuration",
        "configuration/profiles"
      ]
    },
    {
      "type": "category",
      "label": "Features",
      "items": [
        "features/context-management",
        "features/tool-system",
        "features/session-management",
        "features/git-integration",
        "features/workflow-automation",
        "features/research-mode",
        "features/error-handling",
        "features/plan-mode",
        "features/ide-integration",
        "features/multi-file-operations",
        "features/codebase-intelligence",
        "features/performance-monitoring",
        "features/code-templates",
        "features/custom-tools",
        "features/session-restore",
        "features/export-import",
        "features/analytics",
        "features/notifications",
        "features/plugin-system",
        "features/skills",
        "features/cloud-sync"
      ]
    },
    {
      "type": "category",
      "label": "Reference",
      "items": [
        "reference/cli-reference",
        "reference/interactive-mode",
        "reference/slash-commands",
        "reference/advanced-slash-commands",
        "reference/output-styles"
      ]
    },
    {
      "type": "category",
      "label": "Build with Grok One-Shot",
      "items": [
        "build-with-claude-code/subagents",
        "build-with-claude-code/mcp",
        "build-with-claude-code/hooks",
        "build-with-claude-code/hooks-guide",
        "build-with-claude-code/troubleshooting"
      ]
    },
    {
      "type": "category",
      "label": "Administration",
      "items": [
        "administration/advanced-installation",
        "administration/data-usage"
      ]
    },
    {
      "type": "category",
      "label": "Architecture",
      "items": [
        "architecture/overview"
      ]
    },
    {
      "type": "category",
      "label": "Community",
      "items": [
        "community/index",
        "community/contributing",
        "community/support"
      ]
    },
    {
      "type": "category",
      "label": "Developers",
      "items": [
        "developers/index",
        "developers/setup"
      ]
    },
    {
      "type": "category",
      "label": "Deployment",
      "items": [
        "deployment/overview",
        "deployment/github-actions",
        "deployment/claude-code-on-the-web"
      ]
    },
    "roadmap",
    "resources/legal-and-compliance"
  ]
};

export default sidebars;