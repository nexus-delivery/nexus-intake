# BP-04: CTNI WooCommerce Data Refresh

**Source file:** `reference/make/blueprints/2a -CTNI Woocommerce Data Refresh.blueprint.json`  
**Make scenario name:** `2a -CTNI Woocommerce Data Refresh`

---

## Trigger

- **Type:** WooCommerce Watch Orders (`woocommerce:WatchOrders`)
- **Connection ID:** `8190921`
- **Status filter:** `processing`
- **Limit:** 100
- **Sort By:** `dateCreated`

Fires whenever a WooCommerce order enters `processing` status on the Courier To Northern Ireland store.

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
    {External Order ID}="{{1.id}}",
    {Sales Channel}="Courier To Northern Ireland"
  )
  ```
- **Sort:** Created Time (Descending) — most recent first
- **Max Records:** 10

Looks up the consignment that was created in BP-01 when the Wodely webhook fired.

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
| `fldfeEsEahIpD7JFR` | Sales Channel | `Courier To Northern Ireland` |
| `fldhmXx9DovPahJgF` | Payment Type | `PREPAID` |
| `fldio46Yi9YPkqWgn` | Merchant Name | `Courier To Northern Ireland` |
| `fldjyEDCSWuNIGkmw` | Source System | `WooCommerce` |
| `fldkKYFSk1mv2jcfJ` | Delivery Name | `{{3.Collection Name}}` |
| `fldt7MgFBgq3cE8Ri` | Lifecycle Status | `READY_FOR_TRACKPOD` |

### Route B — Record Not Found (Module 6, filter: `RECORD NOT FOUND`)

- **Module 6:** `placeholder:Placeholder` — no action taken
- WooCommerce orders without a matching Airtable consignment are silently ignored

---

## Business Rules

1. Only processes WooCommerce orders in `processing` status
2. Matches on both `External Order ID` AND `Sales Channel = "Courier To Northern Ireland"` to prevent cross-merchant conflicts
3. Advances lifecycle to `READY_FOR_TRACKPOD` on record found — this is the key gate-opening step
4. Sets Payment Status to `PAID` and Payment Type to `PREPAID` unconditionally when WooCommerce confirms the order
5. If no matching consignment exists, does nothing (Placeholder)

---

## Status Changes

| From | To | Trigger |
|------|----|---------|
| `WAITING_FOR_WODELY_DATA` | `READY_FOR_TRACKPOD` | WooCommerce order found in `processing` status |

---

## Airtable Tables Used

| Table ID | Table Name | Operations |
|----------|-----------|-----------|
| `tbl8AR7buODtDA20F` | Consignments | Search, Update |

---

## HTTP Endpoints

None. This blueprint reads from WooCommerce (native connector) and writes to Airtable.

---

## TrackPOD Mappings

None in this blueprint.

---

## Xero Mappings

None in this blueprint.

---

## Error Handling

- No explicit error handlers
- `typecast: false` on Airtable update
- If WooCommerce webhook fires before Wodely creates the consignment, the Placeholder route fires and no error is raised (order will be processed when WooCommerce fires again or manual intervention)

---

## Required Supabase Tables (Migration)

Same as BP-01. See [BP-01](./BP-01-CTNI-Integration-Webhooks.md#required-supabase-tables-migration).

---

## Required API Endpoints (Migration)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/webhooks/woocommerce/ctni` | POST | Receives WooCommerce `order.updated` / `order.created` webhook for CTNI store |

The endpoint must:
1. Accept WooCommerce order payload
2. Filter to `status = "processing"` only
3. Look up `consignments` where `external_order_id = order.id AND sales_channel = "Courier To Northern Ireland"`
4. If found: update to `READY_FOR_TRACKPOD`, `PAID`, `PREPAID`
5. If not found: no-op (return 200)

---

## UI Required to Support This Workflow

- `READY_FOR_TRACKPOD` queue in consignment dashboard
- Visual indicator when WooCommerce payment confirmed
