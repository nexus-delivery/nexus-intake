export type MerchantCustomer = {
  id: string;
  companyId: string;
  customerName: string;
  company: string;
  contactName: string;
  email: string;
  mobile: string;
  phone: string;
  billingAddress: string;
  defaultCollectionAddress: string;
  defaultDeliveryAddress: string;
  deliveryInstructions: string;
  vatNumber: string;
  accountNumber: string;
  pricingProfile: string;
  defaultService: string;
  notes: string;
  archivedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type MerchantCustomerUpsert = Omit<
  MerchantCustomer,
  "id" | "companyId" | "archivedAt" | "createdAt" | "updatedAt"
>;

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function mapMerchantCustomerRow(row: Record<string, unknown>): MerchantCustomer {
  return {
    id: clean(row.id),
    companyId: clean(row.company_id),
    customerName: clean(row.customer_name),
    company: clean(row.company),
    contactName: clean(row.contact_name),
    email: clean(row.email),
    mobile: clean(row.mobile),
    phone: clean(row.phone),
    billingAddress: clean(row.billing_address),
    defaultCollectionAddress: clean(row.default_collection_address),
    defaultDeliveryAddress: clean(row.default_delivery_address),
    deliveryInstructions: clean(row.delivery_instructions),
    vatNumber: clean(row.vat_number),
    accountNumber: clean(row.account_number),
    pricingProfile: clean(row.pricing_profile),
    defaultService: clean(row.default_service),
    notes: clean(row.notes),
    archivedAt: clean(row.archived_at),
    createdAt: clean(row.created_at),
    updatedAt: clean(row.updated_at),
  };
}

export function toMerchantCustomerInsert(
  payload: MerchantCustomerUpsert,
  companyId: string,
  userId: string,
  archivedAt?: string | null
): Record<string, unknown> {
  return {
    company_id: companyId,
    customer_name: clean(payload.customerName),
    company: clean(payload.company),
    contact_name: clean(payload.contactName),
    email: clean(payload.email),
    mobile: clean(payload.mobile),
    phone: clean(payload.phone),
    billing_address: clean(payload.billingAddress),
    default_collection_address: clean(payload.defaultCollectionAddress),
    default_delivery_address: clean(payload.defaultDeliveryAddress),
    delivery_instructions: clean(payload.deliveryInstructions),
    vat_number: clean(payload.vatNumber),
    account_number: clean(payload.accountNumber),
    pricing_profile: clean(payload.pricingProfile),
    default_service: clean(payload.defaultService),
    notes: clean(payload.notes),
    archived_at: archivedAt ?? null,
    updated_by_user_id: userId,
    created_by_user_id: userId,
  };
}

export function parseCsv(csvText: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const char = csvText[i];
    const next = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === ",") {
      row.push(current.trim());
      current = "";
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      if (current.length > 0 || row.length > 0) {
        row.push(current.trim());
        rows.push(row);
      }
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current.trim());
    rows.push(row);
  }

  return rows;
}

function quote(value: string): string {
  const v = value.replace(/"/g, '""');
  return `"${v}"`;
}

export function toCsv(customers: MerchantCustomer[]): string {
  const headers = [
    "Customer Name",
    "Company",
    "Contact Name",
    "Email",
    "Mobile",
    "Phone",
    "Billing Address",
    "Default Collection Address",
    "Default Delivery Address",
    "Delivery Instructions",
    "VAT Number",
    "Account Number",
    "Pricing Profile",
    "Default Service",
    "Notes",
  ];

  const lines = [headers.map(quote).join(",")];

  for (const customer of customers) {
    lines.push(
      [
        customer.customerName,
        customer.company,
        customer.contactName,
        customer.email,
        customer.mobile,
        customer.phone,
        customer.billingAddress,
        customer.defaultCollectionAddress,
        customer.defaultDeliveryAddress,
        customer.deliveryInstructions,
        customer.vatNumber,
        customer.accountNumber,
        customer.pricingProfile,
        customer.defaultService,
        customer.notes,
      ]
        .map(quote)
        .join(",")
    );
  }

  return lines.join("\n");
}

export function csvRowToUpsert(
  headerMap: Record<string, number>,
  row: string[]
): MerchantCustomerUpsert {
  const pick = (name: string): string => {
    const index = headerMap[name.toLowerCase()];
    return typeof index === "number" ? row[index] ?? "" : "";
  };

  return {
    customerName: pick("customer name"),
    company: pick("company"),
    contactName: pick("contact name"),
    email: pick("email"),
    mobile: pick("mobile"),
    phone: pick("phone"),
    billingAddress: pick("billing address"),
    defaultCollectionAddress: pick("default collection address"),
    defaultDeliveryAddress: pick("default delivery address"),
    deliveryInstructions: pick("delivery instructions"),
    vatNumber: pick("vat number"),
    accountNumber: pick("account number"),
    pricingProfile: pick("pricing profile"),
    defaultService: pick("default service"),
    notes: pick("notes"),
  };
}
