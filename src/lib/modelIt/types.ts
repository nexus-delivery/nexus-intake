export type ModelItArtifactKind =
  | "document_template"
  | "ocr_mapping_rule"
  | "booking_form"
  | "public_web_form"
  | "workflow_rule"
  | "validation_rule"
  | "pricing_rule"
  | "collection_rule"
  | "delivery_rule"
  | "warehouse_rule"
  | "notification_rule"
  | "api_mapping_rule"
  | "trackpod_mapping"
  | "xero_mapping"
  | "status_mapping"
  | "business_rule";

export type ModelItRole =
  | "platform_admin"
  | "merchant_admin"
  | "merchant_user";

export type ModelItVersionState = "draft" | "published" | "archived";

export type ModelItWorkspace = {
  workspaceId: string;
  merchantId: string | null;
  customerId: string | null;
  workspaceName: string;
};

export type ModelItPermissionMatrix = {
  canCreateGlobalModels: boolean;
  canManageAllMerchants: boolean;
  canPublishTemplates: boolean;
  canManageWorkspaceModels: boolean;
  canSubmitModelSuggestions: boolean;
};

export type ModelItArtifactVersion = {
  id: string;
  artifactId: string;
  version: number;
  state: ModelItVersionState;
  schemaVersion: string;
  definition: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  publishedAt: string | null;
  rollbackFromVersion: number | null;
};

export type ModelItArtifact = {
  id: string;
  workspaceId: string;
  kind: ModelItArtifactKind;
  key: string;
  name: string;
  activeVersion: number | null;
  versions: ModelItArtifactVersion[];
};

export type ModelItAuditEvent = {
  id: string;
  workspaceId: string;
  artifactId: string | null;
  action:
    | "create"
    | "edit"
    | "publish"
    | "rollback"
    | "test"
    | "submit_suggestion";
  actorId: string;
  actorRole: ModelItRole;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export function getModelItPermissions(role: ModelItRole): ModelItPermissionMatrix {
  if (role === "platform_admin") {
    return {
      canCreateGlobalModels: true,
      canManageAllMerchants: true,
      canPublishTemplates: true,
      canManageWorkspaceModels: true,
      canSubmitModelSuggestions: false,
    };
  }

  if (role === "merchant_admin") {
    return {
      canCreateGlobalModels: false,
      canManageAllMerchants: false,
      canPublishTemplates: true,
      canManageWorkspaceModels: true,
      canSubmitModelSuggestions: false,
    };
  }

  return {
    canCreateGlobalModels: false,
    canManageAllMerchants: false,
    canPublishTemplates: false,
    canManageWorkspaceModels: false,
    canSubmitModelSuggestions: true,
  };
}