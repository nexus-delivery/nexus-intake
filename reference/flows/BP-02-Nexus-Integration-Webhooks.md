# BP-02: Nexus Integration Webhooks

**Source file:** `reference/make/blueprints/1 -Nexus Integration Webhooks.blueprint.json`  
**Make scenario name:** `1 -Nexus Integration Webhooks`

---

## Trigger

- **Type:** Custom Webhook (`gateway:CustomWebHook`)
- **Webhook Hook ID:** `3123705`
- **Label:** `Nexus Order Intake`
- **Max Results:** 50

The webhook is called by Wodely for all merchants **except** Courier To Northern Ireland (CTNI handles separately in BP-01).

### Webhook Input Interface

| Field | Type | Description |
|-------|------|-------------|
| `order_id` | text | Order identifier (legacy field) |
| `customer_email` | text | Customer email (legacy field) |
| `Content-Type` | text | HTTP content type header |

> **Note:** The actual payload contains the full Wodely task structure (same fields as BP-01: Id, Guid, TypeDesc, ExternalKey, RequesterName, etc.). The interface declaration above is the minimal declared interface; the full Wodely payload is processed using the same field names as BP-01.

---

## Business Rules & Flow

### Entry Filter (Module 29)

**Filter name:** `NEXUS FILTER`

```
MerchantId != "Courier To Northern Ireland"
```

Routes all non-CTNI merchants into this scenario.

### Step 1: Search Airtable for Existing Record (Module 12)

- **Connection:** `7774187` (My Airtable OAuth)
- **Base:** `appWKD6dpoFTeTLUI`
- **Table:** `tbl8AR7buODtDA20F` (Consignments)
- **Formula:** `{External Order ID}='{{1.ExternalKey}}'`
- **Max Records:** 50

### Step 2: Router (Module 13)

#### Route A — New Record (Module 2, filter: `New Record`)

No record found in Step 1.

**Sub-branch A1 — WooCommerce Order (Module 28 + Module 3)**

- **Filter on Module 28:** `ExternalKey` contains `wc_order_`
- **Module 28** (Regex Parser): Extracts numeric WooCommerce order ID from `{{1.ExternalKey}}`

**Module 3 — Airtable Create Record** (WooCommerce new consignment):

| Airtable Field ID | Field Name | Value |
|-------------------|-----------|-------|
| `fld3WjgVcG3dUhgq6` | Collection Required | `true` |
| `fld4L7kMHJNVHgefK` | Collection Email | `{{1.RequesterEmail}}` |
| `fld5hdGaWa9s55Uun` | Payment Status | `PAID` |
| `fldDLeMi5ujW4crax` | External Order ID | `{{28.$1}}` (numeric WC order ID) |
| `fldH1hLzPuh5fAAji` | Delivery Address | `{{1.DestinationAddress}}` |
| `fldHKxQbHejwNuoEW` | Consignment Ref | `{{28.$1}}` |
| `fldIyw7wJlu9ZWBgx` | Delivery Email | `{{1.RecipientEmail}}` |
| `fldJqfOfgl6OmcfHy` | Amount Due | `{{1.AmountDue}}` |
| `fldQBiULOUiy8J1C8` | Collection Address | `{{1.DispatchAddress}}` |
| `fldSe1LMbZmiRaoVl` | Collection Phone | `{{1.RequesterPhone}}` |
| `fldTRhwWr9XULffZd` | Task Description | `{{1.TaskDesc}}` |
| `fldeG3di3uuyZpvde` | Collection Email (alt) | `{{1.RequesterEmail}}` |
| `fldfeEsEahIpD7JFR` | Sales Channel | `The Home Delivery Guys` |
| `fldg97G2YvXyjKYsh` | Delivery Fee | `{{1.DeliveryFee}}` |
| `fldhmXx9DovPahJgF` | Payment Type | `PREPAID` |
| `fldio46Yi9YPkqWgn` | Merchant Name | `{{1.MerchantName}}` |
| `fldjyEDCSWuNIGkmw` | Source System | `WooCommerce` |
| `fldkKYFSk1mv2jcfJ` | Delivery Name | `{{1.RecipientName}}` |
| `fldrF9m5gZb5XIVy7` | Collection Name | `{{1.RequesterName}}` |
| `fldt7MgFBgq3cE8Ri` | Lifecycle Status | `WAITING_FOR_WODELY_DATA` |
| `fldwxzXAHhGQGQr12` | Delivery Phone | `{{1.RecipientPhone}}` |

**Sub-branch A2 — Wodely / Manual Order (Module 4)**

- **Filter:** `order{{1.ExternalKey}}` does NOT contain `wc_order_`

**Module 4 — Airtable Create Record** (Wodely/manual new consignment):

| Airtable Field ID | Field Name | Value |
|-------------------|-----------|-------|
| `fld48twcKqfsO0cTF` | Delivery Window End | `{{1.BeforeDateTime}}` |
| `fld5hdGaWa9s55Uun` | Payment Status | `PENDING` |
| `fldDLeMi5ujW4crax` | External Order ID | `{{1.ExternalKey}}` |
| `fldHKxQbHejwNuoEW` | Consignment Ref | `{{1.ExternalKey}}` |
| `fldIJ5pHt7qCQAmof` | Delivery Window Start | `{{1.AfterDateTime}}` |
| `fldTRhwWr9XULffZd` | Task Description | `{{1.TaskDesc}}` |
| `fldjyEDCSWuNIGkmw` | Source System | `Wodely` |
| `fldt7MgFBgq3cE8Ri` | Lifecycle Status | `WAITING_FOR_WODELY_DATA` |

**Sub-router Module 8 — Paid vs Unpaid:**

- **Module 24 (filter: Paid):** `{{12.Amount Due}} == 0`

| Field ID | Field Name | Value |
|----------|-----------|-------|
| `fld1k9RR1yvLacomO` | Notes / Description | `{{1.TaskDesc}}` |
| `fldDLeMi5ujW4crax` | External Order ID | `{{1.ExternalKey}}` |
| `fldHKxQbHejwNuoEW` | Consignment Ref | `{{1.ExternalKey}}` |
| `fldTRhwWr9XULffZd` | Task Description | `{{1.TaskDesc}}` |
| `fldfeEsEahIpD7JFR` | Sales Channel | `Nexus` |
| `fldio46Yi9YPkqWgn` | Merchant Name | `{{1.MerchantName}}` |
| `fldjyEDCSWuNIGkmw` | Source System | `Wodely` |
| `fldt7MgFBgq3cE8Ri` | Lifecycle Status | `WAITING_FOR_WODELY_DATA` |

- **Module 25 (filter: Unpaid):** `{{12.Amount Due}} > 0`

| Field ID | Field Name | Value |
|----------|-----------|-------|
| `fldfeEsEahIpD7JFR` | Sales Channel | `Nexus` |
| `fldio46Yi9YPkqWgn` | Merchant Name | `{{1.MerchantName}}` |
| `fldt7MgFBgq3cE8Ri` | Lifecycle Status | `WAITING_FOR_WODELY_DATA` |

#### Route B — Existing Record (Module 17, filter: `Existing Record`)

- **Filter:** `{{12.id}}` exists
- **Action:** Update record `{{12.id}}`

| Field ID | Field Name | Value |
|----------|-----------|-------|
| `fldHKxQbHejwNuoEW` | Consignment Ref | `{{12.Consignment Ref}}` |
| `fldt7MgFBgq3cE8Ri` | Lifecycle Status | `WAITING_FOR_WODELY_DATA` |

#### Route C — HomeBarn Account Order (Modules 37 + 38)

**Filter on Module 37:** `HOMEBARN ORDER PRESENT`
```
TaskDesc contains "HOME BARN HOME DELIVERY SERVICE"
AND TypeDesc == "Pickup"
```

**Module 37 — Search Airtable:**
- **Formula:** `{External Order ID}='{{1.ExternalKey}}'`
- **Max Records:** 50

**Module 38 — Airtable Create Record** (HomeBarn account consignment):

| Airtable Field ID | Field Name | Value |
|-------------------|-----------|-------|
| `fld1k9RR1yvLacomO` | Notes / Description | `{{1.TaskDesc}}` |
| `fld5hdGaWa9s55Uun` | Payment Status | `ACCOUNT` |
| `fldDLeMi5ujW4crax` | External Order ID | `{{1.ExternalKey}}` |
| `fldHKxQbHejwNuoEW` | Consignment Ref | `{{1.ExternalKey}}` |
| `fldTRhwWr9XULffZd` | Task Description | `{{1.TaskDesc}}` |
| `fldcN1B02cmiMXcr2` | Account Customer Flag | `Yes` |
| `fldfeEsEahIpD7JFR` | Sales Channel | `Account Customer` |
| `fldhmXx9DovPahJgF` | Payment Type | `ACCOUNT` |
| `fldio46Yi9YPkqWgn` | Merchant Name | `{{1.MerchantName}}` |
| `fldjyEDCSWuNIGkmw` | Source System | `Wodely` |
| `fldt7MgFBgq3cE8Ri` | Lifecycle Status | `WAITING_FOR_WODELY_DATA` |

---

## Status Changes

| From | To | Trigger |
|------|----|---------|
| (new) | `WAITING_FOR_WODELY_DATA` | New WooCommerce order (PAID, PREPAID) |
| (new) | `WAITING_FOR_WODELY_DATA` | New Wodely/manual order (PENDING) |
| (new) | `WAITING_FOR_WODELY_DATA` | HomeBarn account order (ACCOUNT) |
| (existing) | `WAITING_FOR_WODELY_DATA` | Existing record touched by Wodely event |

---

## Airtable Tables Used

| Table ID | Table Name | Operations |
|----------|-----------|-----------|
| `tbl8AR7buODtDA20F` | Consignments | Search, Create, Update |

---

## HTTP Endpoints

None. This blueprint only receives webhooks and writes to Airtable.

---

## TrackPOD Mappings

None in this blueprint.

---

## Xero Mappings

None in this blueprint.

---

## Error Handling

- No explicit error handlers defined
- `typecast: false` on all Airtable writes — field type mismatches will fail the scenario run

---

## Key Differences from BP-01 (CTNI)

| Aspect | BP-01 (CTNI) | BP-02 (Nexus) |
|--------|-------------|--------------|
| Entry filter | `MerchantId == "Courier To Northern Ireland"` | `MerchantId != "Courier To Northern Ireland"` |
| Default Sales Channel | `Courier To Northern Ireland` | `The Home Delivery Guys` |
| HomeBarn account route | No | Yes (Route C) |
| Delivery window fields | Not captured | `fld48twcKqfsO0cTF`, `fldIJ5pHt7qCQAmof` |

---

## Required Supabase Tables (Migration)

Same as BP-01. See [BP-01](./BP-01-CTNI-Integration-Webhooks.md#required-supabase-tables-migration).

Additional columns needed:
- `delivery_window_start` (timestamptz) — maps to `fldIJ5pHt7qCQAmof`
- `delivery_window_end` (timestamptz) — maps to `fld48twcKqfsO0cTF`
- `account_customer` (boolean) — maps to `fldcN1B02cmiMXcr2`

---

## Required API Endpoints (Migration)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/webhooks/nexus` | POST | Receives Wodely webhook events for all non-CTNI merchants |

---

## UI Required to Support This Workflow

- Consignment list view filtered to `WAITING_FOR_WODELY_DATA`
- HomeBarn account order badge/indicator
- Manual review queue distinguishing PAID / PENDING / ACCOUNT orders
