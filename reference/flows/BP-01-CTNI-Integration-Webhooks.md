# BP-01: CTNI Integration Webhooks

**Source file:** `reference/make/blueprints/1 -CTNI Integration Webhooks.blueprint.json`  
**Make scenario name:** `1 -CTNI Integration Webhooks`

---

## Trigger

- **Type:** Custom Webhook (`gateway:CustomWebHook`)
- **Webhook Hook ID:** `3223658`
- **Label:** `CTNI WEBHOOK`
- **Max Results:** 50

The webhook is called by Wodely when task events occur for the Courier To Northern Ireland (CTNI) merchant account.

### Webhook Input Interface

All fields are sent by Wodely in the webhook POST body:

| Field | Type | Description |
|-------|------|-------------|
| `Id` | number | Wodely internal task ID |
| `Guid` | text | Wodely task GUID |
| `AccountId` | number | Wodely account ID |
| `TypeId` | number | Task type identifier |
| `TypeDesc` | text | Task type description (`Delivery`, `Pickup`) |
| `StatusId` | number | Wodely status code |
| `StatusDesc` | text | Wodely status label |
| `StatusColour` | text | UI colour code |
| `StatusIcon` | text | UI icon name |
| `TaskDesc` | text | Free-text task/goods description |
| `ExternalKey` | text | External order reference (WooCommerce order ID prefixed `wc_order_` or plain Wodely key) |
| `AssignedToTeamId` | number | Team assignment |
| `AssignedToDriverUserId` | text | Driver assignment |
| `CreatedDateTime` | text | ISO timestamp of creation |
| `ModifiedDateTime` | text | ISO timestamp of last modification |
| `AfterDateTime` | text | Delivery window start |
| `BeforeDateTime` | text | Delivery window end |
| `DispatchAddress` | text | Collection / pickup address |
| `DispatchBuilding` | text | Collection building name |
| `DispatchNotes` | text | Collection notes |
| `DispatchCoordinates` | text | Collection lat/lon |
| `RequesterName` | text | Collection contact name |
| `RequesterEmail` | text | Collection contact email |
| `RequesterPhone` | text | Collection contact phone |
| `DestinationAddress` | text | Delivery address |
| `DestinationBuilding` | text | Delivery building name |
| `DestinationCoordinates` | text | Delivery lat/lon |
| `DestinationNotes` | text | Delivery notes |
| `RecipientId` | text | Delivery contact ID |
| `RecipientName` | text | Delivery contact name |
| `RecipientEmail` | text | Delivery contact email |
| `RecipientPhone` | text | Delivery contact phone |
| `ServiceTime` | text | Estimated service duration |
| `Requirements` | text | Special requirements |
| `Priority` | number | Priority level |
| `Alert` | text | Alert message |
| `AmountDue` | number | COD / amount due |
| `DeliveryFee` | number | Delivery fee charged |
| `Tag1` | text | Custom tag 1 |
| `Tag2` | text | Custom tag 2 |
| `MerchantId` | text | Merchant identifier (used for routing) |
| `MerchantName` | text | Merchant display name |

---

## Business Rules & Flow

### Entry Filter

Module 12 (Airtable Search) has a **combined entry filter**:
```
MerchantId == "Courier To Northern Ireland"
AND TypeDesc == "Delivery"
```
Only `Delivery` type tasks for the CTNI merchant are processed. Pickup tasks are excluded.

### Step 1: Search Airtable for Existing Record (Module 12)

- **Table:** `tbl8AR7buODtDA20F` (Consignments)
- **Formula:** `{External Order ID}="{{1.ExternalKey}}"`
- **Max Records:** 50

### Step 2: Router (Module 13) — New Record vs Existing Record

#### Route A — New Record (Module 2, filter: `New Record`)

Module 2 is a sub-router with two branches:

**Branch A1 — WooCommerce Order (Module 28 + Module 3)**

- **Filter on Module 28:** `ExternalKey` contains `wc_order_`
- **Module 28** (Regex Parser): Extracts the numeric WooCommerce order ID from `{{1.ExternalKey}}`
  - Pattern strips `wc_order_` prefix → result available as `{{28.$1}}`

**Module 3 — Airtable Create Record** (WooCommerce new consignment):

| Airtable Field ID | Field Name | Value |
|-------------------|-----------|-------|
| `fld3WjgVcG3dUhgq6` | Collection Required | `true` |
| `fld4L7kMHJNVHgefK` | Collection Email | `{{1.RequesterEmail}}` |
| `fld5hdGaWa9s55Uun` | Payment Status | `PAID` |
| `fldDLeMi5ujW4crax` | External Order ID | `{{28.$1}}` (numeric WC order ID) |
| `fldH1hLzPuh5fAAji` | Delivery Address | `{{1.DestinationAddress}}` |
| `fldHKxQbHejwNuoEW` | Consignment Ref | `{{28.$1}}` (numeric WC order ID) |
| `fldIyw7wJlu9ZWBgx` | Delivery Email | `{{1.RecipientEmail}}` |
| `fldJqfOfgl6OmcfHy` | Amount Due | `{{1.AmountDue}}` |
| `fldQBiULOUiy8J1C8` | Collection Address | `{{1.DispatchAddress}}` |
| `fldSe1LMbZmiRaoVl` | Collection Phone | `{{1.RequesterPhone}}` |
| `fldTRhwWr9XULffZd` | Task Description | `{{1.TaskDesc}}` |
| `fldeG3di3uuyZpvde` | Collection Email (alt) | `{{1.RequesterEmail}}` |
| `fldfeEsEahIpD7JFR` | Sales Channel | `Courier To Northern Ireland` |
| `fldg97G2YvXyjKYsh` | Delivery Fee | `{{1.DeliveryFee}}` |
| `fldhmXx9DovPahJgF` | Payment Type | `PREPAID` |
| `fldio46Yi9YPkqWgn` | Merchant Name | `{{1.MerchantId}}` |
| `fldjyEDCSWuNIGkmw` | Source System | `WooCommerce` |
| `fldkKYFSk1mv2jcfJ` | Delivery Name | `{{1.RecipientName}}` |
| `fldls4Z4beYLEE4dO` | Notes | `{{1.TaskDesc}}` |
| `fldrF9m5gZb5XIVy7` | Collection Name | `{{1.RequesterName}}` |
| `fldt7MgFBgq3cE8Ri` | Lifecycle Status | `WAITING_FOR_WODELY_DATA` |
| `fldwxzXAHhGQGQr12` | Delivery Phone | `{{1.RecipientPhone}}` |

**Branch A2 — Wodely / Manual Order (Module 4)**

- **Filter on Module 4:** `order{{1.ExternalKey}}` does NOT contain `wc_order_` (i.e., not a WooCommerce order)

**Module 4 — Airtable Create Record** (Wodely/manual new consignment):

| Airtable Field ID | Field Name | Value |
|-------------------|-----------|-------|
| `fld5hdGaWa9s55Uun` | Payment Status | `PENDING` |
| `fldDLeMi5ujW4crax` | External Order ID | `{{1.ExternalKey}}` |
| `fldHKxQbHejwNuoEW` | Consignment Ref | `{{1.ExternalKey}}` |
| `fldTRhwWr9XULffZd` | Task Description | `{{1.TaskDesc}}` |
| `fldjyEDCSWuNIGkmw` | Source System | `Wodely` |
| `fldt7MgFBgq3cE8Ri` | Lifecycle Status | `WAITING_FOR_WODELY_DATA` |

**Sub-router Module 8 — Paid vs Unpaid for Branch A2:**

- **Module 24 (filter: Paid):** `Amount Due == 0`
  - Updates record found by Module 12:

| Field ID | Value |
|----------|-------|
| `fldDLeMi5ujW4crax` | `{{1.ExternalKey}}` |
| `fldHKxQbHejwNuoEW` | `{{1.ExternalKey}}` |
| `fldfeEsEahIpD7JFR` | `Nexus` |
| `fldjyEDCSWuNIGkmw` | `Wodely` |
| `fldt7MgFBgq3cE8Ri` | `WAITING_FOR_WODELY_DATA` |

- **Module 25 (filter: Unpaid):** `Amount Due > 0`

| Field ID | Value |
|----------|-------|
| `fldfeEsEahIpD7JFR` | `Nexus` |
| `fldt7MgFBgq3cE8Ri` | `WAITING_FOR_WODELY_DATA` |

#### Route B — Existing Record (Module 17, filter: `Existing Record`)

- **Filter:** `{{12.id}}` exists (record was found in Step 1)
- **Action:** Airtable Update Record (id: `{{12.id}}`)

| Field ID | Field Name | Value |
|----------|-----------|-------|
| `fldHKxQbHejwNuoEW` | Consignment Ref | `{{12.Consignment Ref}}` |
| `fldt7MgFBgq3cE8Ri` | Lifecycle Status | `WAITING_FOR_WODELY_DATA` |

---

## Status Changes

| From | To | Trigger |
|------|----|---------|
| (new) | `WAITING_FOR_WODELY_DATA` | New WooCommerce order received |
| (new) | `WAITING_FOR_WODELY_DATA` | New Wodely/manual order received |
| (existing) | `WAITING_FOR_WODELY_DATA` | Existing record updated by Wodely event |

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

- `stopOnHttpError: true` is not applicable (no HTTP calls)
- Airtable operations use `typecast: false` — field type mismatches will fail
- No explicit error handlers defined in this blueprint

---

## Required Supabase Tables (Migration)

| Table | Purpose |
|-------|---------|
| `consignments` | Equivalent of Airtable `tbl8AR7buODtDA20F` |

Key columns needed:
- `external_order_id` (text) — maps to `fldDLeMi5ujW4crax`
- `consignment_ref` (text) — maps to `fldHKxQbHejwNuoEW`
- `lifecycle_status` (text) — maps to `fldt7MgFBgq3cE8Ri`
- `payment_status` (text) — maps to `fld5hdGaWa9s55Uun`
- `payment_type` (text) — maps to `fldhmXx9DovPahJgF`
- `sales_channel` (text) — maps to `fldfeEsEahIpD7JFR`
- `source_system` (text) — maps to `fldjyEDCSWuNIGkmw`
- `merchant_name` (text) — maps to `fldio46Yi9YPkqWgn`
- `collection_required` (boolean) — maps to `fld3WjgVcG3dUhgq6`
- `collection_address` (text) — maps to `fldQBiULOUiy8J1C8`
- `collection_name` (text) — maps to `fldrF9m5gZb5XIVy7`
- `collection_phone` (text) — maps to `fldSe1LMbZmiRaoVl`
- `collection_email` (text) — maps to `fld4L7kMHJNVHgefK` / `fldeG3di3uuyZpvde`
- `delivery_address` (text) — maps to `fldH1hLzPuh5fAAji`
- `delivery_name` (text) — maps to `fldkKYFSk1mv2jcfJ`
- `delivery_phone` (text) — maps to `fldwxzXAHhGQGQr12`
- `delivery_email` (text) — maps to `fldIyw7wJlu9ZWBgx`
- `task_description` (text) — maps to `fldTRhwWr9XULffZd`
- `amount_due` (numeric) — maps to `fldJqfOfgl6OmcfHy`
- `delivery_fee` (numeric) — maps to `fldg97G2YvXyjKYsh`

---

## Required API Endpoints (Migration)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/webhooks/ctni` | POST | Receives Wodely webhook events for CTNI merchant |

---

## UI Required to Support This Workflow

- Consignment list view showing `WAITING_FOR_WODELY_DATA` records
- Consignment detail view showing all ingested fields
- Manual review interface for Wodely/manual orders
