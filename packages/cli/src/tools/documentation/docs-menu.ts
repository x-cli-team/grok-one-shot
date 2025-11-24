export interface DocsMenuOption {
  key: string;
  title: string;
  description: string;
  command: string;
}

export const DOCS_MENU_OPTIONS: DocsMenuOption[] = [
  {
    key: "1",
    title: "Generate README",
    description: "Create comprehensive README.md from project structure",
    command: "/readme"
  },
  {
    key: "2", 
    title: "Generate API Documentation",
    description: "Extract and document functions, classes, modules",
    command: "/api-docs"
  },
  {
    key: "3",
    title: "Add Code Comments", 
    description: "Add intelligent comments to existing code",
    command: "/comments"
  },
  {
    key: "4",
    title: "Generate Changelog",
    description: "Generate CHANGELOG.md from git history", 
    command: "/changelog"
  },
  {
    key: "5",
    title: "Initialize .agent System",
    description: "Set up AI-first documentation structure",
    command: "/init-agent"
  },
  {
    key: "6", 
    title: "Update .agent Documentation",
    description: "Sync docs with recent code changes",
    command: "/update-agent-docs"
  }
];

export function generateDocsMenuText(): string {
  return `📚 **Documentation Menu**

Choose a documentation task:

${DOCS_MENU_OPTIONS.map(option => 
  `**${option.key}.** ${option.title}
   ${option.description}
   → \`${option.command}\`
`).join('\n')}

**0.** Exit Menu

Type a number to select an option, or type any command directly.`;
}

export function findDocsMenuOption(input: string): DocsMenuOption | null {
  const trimmed = input.trim();
  return DOCS_MENU_OPTIONS.find(option => option.key === trimmed) || null;
}