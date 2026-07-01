export type CatalogueItemType = "product" | "service" | "surcharge" | "labour" | "storage";

export type CatalogueItem = {
  id: string;
  merchant_id: string;
  item_type: CatalogueItemType;
  sku: string | null;
  name: string;
  description: string;
  default_price: number;
  vat_rate: number;
  xero_account_code: string | null;
  xero_tax_code: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type CatalogueItemInput = {
  merchant_id: string;
  item_type: CatalogueItemType;
  sku?: string | null;
  name: string;
  description?: string;
  default_price?: number;
  vat_rate?: number;
  xero_account_code?: string | null;
  xero_tax_code?: string | null;
  active?: boolean;
};

export function normalizeCatalogueQuery(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeCatalogueKey(value: string): string {
  return normalizeCatalogueQuery(value).toLowerCase();
}

export function buildCatalogueLabel(item: Pick<CatalogueItem, "name" | "sku" | "description">): string {
  const parts = [item.sku?.trim() ?? "", item.name.trim(), item.description.trim()].filter(Boolean);
  return parts.join(" - ");
}
