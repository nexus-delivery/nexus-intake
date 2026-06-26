// Mock/static data for the NEXUS Product Hub internal page.
// No backend connections. All data is hardcoded.

export type FeatureStatus = "Active" | "Planned" | "Backlog" | "Future";
export type RevenueModel = "Subscription" | "Transaction" | "Commission" | "Enterprise";

export interface Feature {
  name: string;
  purpose: string;
  status: FeatureStatus;
  revenueModel: RevenueModel;
}

export const features: Feature[] = [
  { name: "NEXUS Booking", purpose: "Customer acquisition, core revenue", status: "Active", revenueModel: "Transaction" },
  { name: "NEXUS Transport", purpose: "Route optimisation, premium service", status: "Active", revenueModel: "Transaction" },
  { name: "NEXUS Documents", purpose: "Digital archive, compliance", status: "Planned", revenueModel: "Subscription" },
  { name: "NEXUS Finance", purpose: "Billing and payments, revenue", status: "Planned", revenueModel: "Subscription" },
  { name: "NEXUS Warehouse", purpose: "Inventory management, enterprise", status: "Backlog", revenueModel: "Enterprise" },
  { name: "NEXUS Intelligence", purpose: "Analytics, premium add-on", status: "Backlog", revenueModel: "Subscription" },
  { name: "NEXUS Network", purpose: "Multi-merchant platform, commission", status: "Future", revenueModel: "Commission" },
  { name: "NEXUS Instant", purpose: "Same-day delivery, premium service", status: "Future", revenueModel: "Transaction" },
  { name: "NEXUS Marketplace", purpose: "Service integrations, commission", status: "Future", revenueModel: "Commission" },
  { name: "NEXUS Analytics", purpose: "Business intelligence, subscription", status: "Backlog", revenueModel: "Subscription" },
  { name: "NEXUS Workspace", purpose: "Team management, subscription", status: "Backlog", revenueModel: "Subscription" },
  { name: "NEXUS International", purpose: "Cross-border, enterprise", status: "Future", revenueModel: "Enterprise" },
];

export type CardType = "Feature" | "Bug" | "Refactor";
export type SprintColumn = "Backlog" | "Ready" | "In Progress" | "In Review" | "Blocked" | "Done";

export interface SprintCard {
  id: string;
  title: string;
  type: CardType;
  column: SprintColumn;
}

export const sprintCards: SprintCard[] = [
  { id: "S-001", title: "Document upload UI", type: "Feature", column: "In Progress" },
  { id: "S-002", title: "PDF parsing pipeline", type: "Feature", column: "In Progress" },
  { id: "S-003", title: "Booking review screen", type: "Feature", column: "Ready" },
  { id: "S-004", title: "Track-POD job sync", type: "Feature", column: "Backlog" },
  { id: "S-005", title: "Branded POD template", type: "Feature", column: "Backlog" },
  { id: "S-006", title: "Product Hub page", type: "Feature", column: "In Review" },
  { id: "S-007", title: "Fix sidebar active state", type: "Bug", column: "Done" },
  { id: "S-008", title: "Merchant portal navigation", type: "Refactor", column: "Done" },
  { id: "S-009", title: "Submit booking endpoint", type: "Feature", column: "Backlog" },
  { id: "S-010", title: "Transport planning UI", type: "Feature", column: "Ready" },
];

export const workflowSteps: string[] = [
  "Document Upload",
  "Document Processing",
  "Review Booking",
  "Submit Booking",
  "Transport Planning",
  "Track-POD Sync",
  "POD",
  "Branded Documents",
];

export type AgentStatus = "In Progress" | "Ready" | "Blocked";

export interface Agent {
  role: string;
  task: string;
  status: AgentStatus;
  output: string;
}

export const agents: Agent[] = [
  { role: "Product Architect", task: "Define Phase 2 roadmap", status: "In Progress", output: "Roadmap doc" },
  { role: "Engineering Agent", task: "Build document upload", status: "In Progress", output: "PR" },
  { role: "Design Agent", task: "POD template design", status: "Ready", output: "Figma file" },
  { role: "Commercial Agent", task: "Pricing models", status: "In Progress", output: "Pricing doc" },
  { role: "Documentation Agent", task: "Booking workflow docs", status: "Ready", output: "Wiki" },
];

export const approvedRules: string[] = [
  "Agents do not invent architecture",
  "One task = one GitHub issue/card",
  "Build by business capability, not technology",
  "Track-POD is part of NEXUS Transport, not a separate later feature",
  "Every feature must have product, technical and marketing value",
];

export const innovationBacklog: string[] = [
  "NEXUS Network",
  "NEXUS Instant",
  "Journey Intelligence",
  "Ferry recommendations",
  "Hotel recommendations",
  "Flight/porter planning",
  "Marketplace commissions",
  "White label reseller platform",
];

export const nextActions: string[] = [
  "Finish Product Hub",
  "Finalise Booking + Transport workflow",
  "Build real document upload",
  "Build document processing",
  "Build Track-POD sync",
  "Build branded POD",
];
