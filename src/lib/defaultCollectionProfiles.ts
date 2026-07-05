export type CollectionMode = "depot" | "new_address";

const WORKSPACE_PREFIX = /^\[\[(.+?)\]\]\s*/;

export type DefaultCollectionProfile = {
  id: string;
  companyId: string;
  isDefault?: boolean;
  profileName: string;
  companyName: string;
  contactName: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  postcode: string;
  country: string;
  phone: string;
  email: string;
  instructions: string;
  updatedAt: string;
};

export type ParsedCollectionProfileName = {
  workspaceName: string;
  name: string;
};

export function parseCollectionProfileName(raw: string): ParsedCollectionProfileName {
  const trimmed = raw.trim();
  const match = trimmed.match(WORKSPACE_PREFIX);
  if (!match) {
    return { workspaceName: "", name: trimmed };
  }

  return {
    workspaceName: match[1]?.trim() ?? "",
    name: trimmed.replace(WORKSPACE_PREFIX, "").trim(),
  };
}

export function buildCollectionProfileName(workspaceName: string, name: string): string {
  const cleanName = name.trim();
  const cleanWorkspace = workspaceName.trim();
  if (!cleanWorkspace) return cleanName;
  return `[[${cleanWorkspace}]] ${cleanName}`;
}

export function supportsDepotFirstByCompanyName(companyName: string): boolean {
  return companyName.trim().length > 0;
}

export function toEmptyDefaultCollectionProfile(companyId: string): DefaultCollectionProfile {
  return {
    id: "",
    companyId,
    isDefault: false,
    profileName: "Default depot",
    companyName: "",
    contactName: "",
    addressLine1: "",
    addressLine2: "",
    addressLine3: "",
    postcode: "",
    country: "UK",
    phone: "",
    email: "",
    instructions: "",
    updatedAt: "",
  };
}

export function profileToStop(profile: DefaultCollectionProfile) {
  return {
    company: profile.companyName,
    contact: profile.contactName,
    addressLine1: profile.addressLine1,
    addressLine2: profile.addressLine2,
    addressLine3: profile.addressLine3,
    postcode: profile.postcode,
    country: profile.country || "UK",
    phone: profile.phone,
    email: profile.email,
    instructions: profile.instructions,
  };
}
