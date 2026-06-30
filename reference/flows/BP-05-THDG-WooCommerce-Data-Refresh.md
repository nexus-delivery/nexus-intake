# BP-05: THDG WooCommerce Data Refresh

**Source file:** `reference/make/blueprints/2a -THDG Woocommerce Data Refresh.blueprint.json`  
**Make scenario name:** `2a -THDG Woocommerce Data Refresh`

---

## Trigger

- **Type:** WooCommerce Watch Orders (`woocommerce:WatchOrders`)
- **Connection ID:** `8041998`
- **Status filter:** `processing`
- **Limit:** 100
- **Sort By:** `dateCreated`

Fires whenever a WooCommerce order enters `processing` status on The Home Delivery Guys (THDG) store.

---

## Inputs

WooCommerce order object (Module 1). Key fields used:

| WooCommerce Field | Description |
|-------------------|-------------|
| `id` | WooCommerce order ID |
| `lineItems[].name` | Product/service line item names (concatenated) |

---

## Step 1: Search Airtable for Matching Consignment (Module 3)

- **Connection:** `7774187`
- **Base:** `appWKD6dpoFTeTLUI`
- **Table:** `tbl8AR7buODtDA20F` (Consignments)
- **Formula:**
  ```
  AND(
    {Source System} = "WooCommerce",
    {External Order ID} = "{{1.id}}"
  )
  ```
- **Sort:** Created Time (Descending)
- **Max Records:** 10

> **Key difference from BP-04:** Searches by `Source System = "WooCommerce"` rather than by `Sales Channel = "Courier To Northern Ireland"`. This is less restrictive and will match any WooCommerce-sourced consignment with the matching order ID.

---

## Step 2: Router (Module 4)

### Route A — Record Found (Module 5, filter: `RECORD FOUND`)

**Module 5 — Airtable Update Record** (`id: {{3.id}}`):

| Field ID | Field Name | Value |
|----------|-----------|-------|
| `fld5hdGaWa9s55Uun` | Payment Status | `PAID` |
| `fldDLeMi5ujW4crax` | External Order ID | `{{3.External Order ID}}` |
| `fldHKxQbHejwNuoEW` | Consignment Ref | `{{3.External Order ID}}` |
| `fldTRhwWr9XULffZd` | Task Description | `{{1.lineItems[].name}}` |
| `fldfeEsEahIpD7JFR` | Sales Channel | `The Home Delivery Guys` |
| `fldhmXx9DovPahJgF` | Payment Type | `PREPAID` |
| `fldio46Yi9YPkqWgn` | Merchant Name | `The Home Delivery Guys` |
| `fldjyEDCSWuNIGkmw` | Source System | `WooCommerce` |
| `fldkKYFSk1mv2jcfJ` | Delivery Name | `{{3.Collection Name}}` |
| `fldt7MgFBgq3cE8Ri` | Lifecycle Status | `READY_FOR_TRACKPOD` |

### Route B — Record Not Found (Module 6, filter: `RECORD NOT FOUND`)

- **Module 6:** `placeholder:Placeholder` — no action taken

---

## Business Rules

1. Only processes WooCommerce orders in `processing` status
2. Matches on `Source System = "WooCommerce"` and `External Order ID` — **not** filtered by Sales Channel
3. Advances lifecycle to `READY_FOR_TRACKPOD` and confirms payment as `PAID`/`PREPAID`
4. If no matching consignment exists, does nothing

---

## Status Changes

| From | To | Trigger |
|------|----|---------|
| `WAITING_FOR_WODELY_DATA` | `READY_FOR_TRACKPOD` | WooCommerce THDG order confirmed `processing` |

---

## Airtable Tables Used

| Table ID | Table Name | Operations |
|----------|-----------|-----------|
| `tbl8AR7buODtDA20F` | Consignments | Search, Update |

---

## HTTP Endpoints

None.

---

## TrackPOD Mappings

None in this blueprint.

---

## Xero Mappings

None in this blueprint.

---

## Key Differences from BP-04 (CTNI)

| Aspect | BP-04 (CTNI) | BP-05 (THDG) |
|--------|-------------|-------------|
| WooCommerce connection | `8190921` | `8041998` |
| Search formula | `External Order ID + Sales Channel` | `Source System + External Order ID` |
| Sales Channel set | `Courier To Northern Ireland` | `The Home Delivery Guys` |
| Merchant Name set | `Courier To Northern Ireland` | `The Home Delivery Guys` |

---

## Required Supabase Tables (Migration)

Same as BP-01. See [BP-01](./BP-01-CTNI-Integration-Webhooks.md#required-supabase-tables-migration).

---

## Required API Endpoints (Migration)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/webhooks/woocommerce/thdg` | POST | Receives WooCommerce order webhook for THDG store |

The endpoint must:
1. Accept WooCommerce order payload
2. Filter to `status = "processing"` only
3. Look up `consignments` where `source_system = 'WooCommerce' AND external_order_id = order.id`
4. If found: update to `READY_FOR_TRACKPOD`, `PAID`, `PREPAID`, `Sales Channel = "The Home Delivery Guys"`
5. If not found: no-op

---

## UI Required to Support This Workflow

- Same as BP-04: `READY_FOR_TRACKPOD` queue in dashboard
