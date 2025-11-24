export { ASTParserTool } from "./ast-parser.js";
export { SymbolSearchTool } from "./symbol-search.js";
export { DependencyAnalyzerTool } from "./dependency-analyzer.js";
export { CodeContextTool } from "./code-context.js";
export { RefactoringAssistantTool } from "./refactoring-assistant.js";
export { VectorSearchTool } from "./vector-search-tool.js";
export { AutonomousTaskTool } from "./autonomous-task-tool.js";

// Export types
export type {
  ASTNode,
  ParseResult,
  SymbolInfo,
  ParameterInfo,
  ImportInfo,
  ExportInfo,
  ParseError
} from "./ast-parser.js";

export type {
  SymbolReference,
  SymbolUsage,
  CrossReference
} from "./symbol-search.js";

export type {
  DependencyNode,
  DependencyGraph,
  CircularDependency,
  DependencyStatistics,
  ModuleAnalysis
} from "./dependency-analyzer.js";

export type {
  CodeContext,
  ContextualSymbol,
  ContextualDependency,
  CodeRelationship,
  SemanticContext,
  DesignPattern,
  UsagePattern,
  CodeMetrics,
  ComplexityMetrics,
  QualityMetrics,
  ProjectContext,
  ArchitectureInfo
} from "./code-context.js";

export type {
  RefactoringOperation,
  RefactoringFileChange,
  TextChange,
  SafetyAnalysis,
  RenameRequest,
  ExtractFunctionRequest,
  ExtractedParameter,
  MoveRequest,
  InlineRequest
} from "./refactoring-assistant.js";

export type {
  VectorSearchConfig,
  CodeSymbol,
  SearchResult,
  IndexStats
} from "../../services/vector-search-engine.js";

export type {
  TaskStep,
  TaskPlan,
  ExecutionContext,
  AutonomousTaskConfig
} from "../../services/autonomous-executor.js";