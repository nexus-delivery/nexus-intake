export type CollectionMode = "depot" | "new_address";

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

const DEPOT_FIRST_MERCHANT_NAMES = [
  "doorway",
  "homebarn",
  "blb",
  "di designs",
  "pricesavers",
];

export function supportsDepotFirstByCompanyName(companyName: string): boolean {
  const normalized = companyName.trim().toLowerCase();
  if (!normalized) return false;
  return DEPOT_FIRST_MERCHANT_NAMES.some((name) => normalized.includes(name));
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
