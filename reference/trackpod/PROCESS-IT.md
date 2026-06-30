# PROCESS-IT: Track-POD Order Creation — Operational Process

**Module:** Process it  
**NOS Source:** NEXUS Operating System Specification v1.0, Section 6 (Process it)  
**Blueprint sources:**  
- `reference/make/blueprints/3 -Wod - Wodely - AirTable - TrackPOD.blueprint.json`  
- `reference/make/blueprints/3a -THDG - Woocommerce - AirTable - TrackPOD.blueprint.json`  
**Track-POD API:** `https://api.track-pod.com` (v2.0)  
**Track-POD API spec:** `https://api.track-pod.com/swagger/v1/swagger.json`

---

## Purpose

Process-it takes a consignment from `READY_FOR_TRACKPOD` to `READY_FOR_ROUTE` by:

1. Creating a Track-POD **Delivery** order (Type 0)
2. Creating a Track-POD **Collection** order (Type 1)
3. Storing the Track-POD order IDs
4. Fetching and storing tracking URLs for customer and ops visibility
5. Fetching and storing document URLs (POD PDF, shipping label)
6. Advancing lifecycle status to `READY_FOR_ROUTE`

Every consignment processed generates exactly **two** Track-POD orders: one delivery and one collection. They share the same `Number` and `Id` value (`TrackPOD Order Ref`). Track-POD differentiates collection from delivery by `Type`, never by number.

---

## Pre-conditions (Entry Gate)

A consignment must meet **all** of the following before Process-it runs:

| Field | Required Value |
|-------|---------------|
| `lifecycle_status` | `READY_FOR_TRACKPOD` |
| `source_system` | `Wodely` (BP-06) **or** `WooCommerce` (BP-07) |
| `payment_status` | `PAID` or `ACCOUNT` (Wodely only; WooCommerce has no payment gate) |
| `payment_type` | `ACCOUNT` also accepted (Wodely only) |
| `collection_address` | Not empty |
| `delivery_address` | Not empty |
| `collection_name` | Not empty |
| `delivery_name` | Not empty |
| `trackpod_delivery_id` | Empty (not already sent) |
| `trackpod_collection_id` | Empty (not already sent) |

**WooCommerce consignments** (`source_system = 'WooCommerce'`) only require:

| Field | Required Value |
|-------|---------------|
| `lifecycle_status` | `READY_FOR_TRACKPOD` |
| `trackpod_delivery_id` | Empty |

Address and name fields are not validated in the WooCommerce poll formula (validation occurs at time of API call; errors surface as 400 responses).

---

## Duplicate Prevention

Before creating any Track-POD orders, check whether this `external_order_id` already has Track-POD IDs stored in **any** consignment record:

```sql
SELECT trackpod_collection_id, trackpod_delivery_id
FROM consignments
WHERE external_order_id = :external_order_id
  AND (
    trackpod_collection_id IS NOT NULL
    OR trackpod_delivery_id IS NOT NULL
  )
LIMIT 1
```

**If a match is found:** Skip this consignment. Do not call the Track-POD API. Do not update any status. Log the skip.

**For WooCommerce:** The duplicate check additionally filters on both `TrackPOD Delivery ID` and `TrackPOD Collection ID` being absent from the looked-up record:

```
{{6.TrackPOD Delivery ID}} does NOT exist
AND {{6.TrackPOD Collection ID}} does NOT exist
```

Both must be absent. If either is present, the consignment is skipped.

---

## Status Transitions

```
READY_FOR_TRACKPOD
      │
      │  [Duplicate check passes]
      │
      ├─ [Track-POD delivery order created: 201]
      │         │
      │         ├─ [Track-POD collection order created: 201]
      │         │         │
      │         │         └─ [IDs + tracking URLs stored]
      │         │                     │
      │         │                     └──► READY_FOR_ROUTE
      │         │
      │         └─ [Collection order fails: 4xx/5xx]
      │                     │
      │                     └──► TRACKPOD_ERROR (delivery ID stored; collection failed)
      │
      └─ [Delivery order fails: 4xx/5xx]
                  │
                  └──► TRACKPOD_ERROR (nothing stored)
```

| From Status | To Status | Trigger |
|-------------|-----------|---------|
| `READY_FOR_TRACKPOD` | `READY_FOR_ROUTE` | Both Track-POD orders created and IDs stored |
| `READY_FOR_TRACKPOD` | `TRACKPOD_ERROR` | Delivery or collection API call fails |
| `TRACKPOD_ERROR` | `READY_FOR_TRACKPOD` | Manual operator retry action |

> `TRACKPOD_ERROR` is not in the current Make blueprint (Make uses `maxErrors: 3` at scenario level and stops the run on `stopOnHttpError: true`). This status is the required equivalent for the Nexus implementation to surface failed records to the operator queue.

---

## Step 1 — Find Eligible Consignments

**Production behaviour (Make):** Airtable scheduled search, max 50 records, sorted by Created Time ascending (FIFO).

**Nexus equivalent:** Scheduled job or manual trigger.

### Query — Wodely source

```sql
SELECT *
FROM consignments
WHERE source_system = 'Wodely'
  AND lifecycle_status = 'READY_FOR_TRACKPOD'
  AND (payment_status IN ('PAID', 'ACCOUNT') OR payment_type = 'ACCOUNT')
  AND (trackpod_collection_id IS NULL OR trackpod_delivery_id IS NULL)
  AND collection_address IS NOT NULL AND collection_address != ''
  AND delivery_address IS NOT NULL AND delivery_address != ''
  AND collection_name IS NOT NULL AND collection_name != ''
  AND delivery_name IS NOT NULL AND delivery_name != ''
ORDER BY created_at ASC
LIMIT 50
```

### Query — WooCommerce source

```sql
SELECT *
FROM consignments
WHERE source_system = 'WooCommerce'
  AND lifecycle_status = 'READY_FOR_TRACKPOD'
  AND (trackpod_delivery_id IS NULL OR trackpod_delivery_id = '')
ORDER BY created_at ASC
LIMIT 50
```

---

## Step 2 — Create Track-POD Delivery Order (Type 0)

### API Call

```
POST https://api.track-pod.com/Order
X-API-KEY: {TRACKPOD_API_KEY}
Content-Type: application/json
Accept: application/json
```

### Request Body — Wodely source

```json
{
  "Number": "{trackpod_order_ref}",
  "Id": "{trackpod_order_ref}",
  "Type": 0,
  "Date": "{requested_delivery_date ?? expected_collection_date formatted YYYY-MM-DD}",
  "Client": "{delivery_name ?? collection_name}",
  "ContactName": "{delivery_name ?? collection_name}",
  "Address": "{delivery_address}",
  "Phone": "{delivery_phone}",
  "Email": "{delivery_email}",
  "Shipper": "{shipper_name}",
  "GoodsList": [
    {
      "GoodsName": "{trackpod_goods}",
      "GoodsUnit": "pcs",
      "Quantity": 1,
      "Note": ""
    }
  ]
}
```

**Field resolution rules:**
- `Date`: Use `requested_delivery_date` if populated; fall back to `expected_collection_date`. If both empty, omit the field.
- `Client` and `ContactName`: Use `delivery_name` if populated; fall back to `collection_name`.
- `GoodsList[0].Note`: Always empty string for delivery orders.

### Request Body — WooCommerce (THDG) source

```json
{
  "Number": "{trackpod_order_ref}",
  "Id": "{trackpod_order_ref}",
  "Type": 0,
  "Client": "{delivery_name}",
  "ContactName": "{collection_name}",
  "Address": "{delivery_address}",
  "Phone": "{delivery_phone}",
  "Email": "{colllection_email}, {delivery_email}",
  "Shipper": "{shipper_name}",
  "GoodsList": [
    {
      "GoodsName": "{trackpod_goods}",
      "GoodsUnit": "pcs",
      "Quantity": 1,
      "Note": ""
    }
  ]
}
```

**Differences from Wodely:**
- `Date` field is **not included**.
- `ContactName` is set to `collection_name` (not `delivery_name`).
- `Email` concatenates both collection and delivery email addresses separated by `, `.
- No `ifempty` fallbacks — fields are used directly.

### Success Response

```
HTTP 201 Created
Location: https://api.track-pod.com/Order/Id/{trackpod_internal_id}
```

The `Location` header value is stored as `trackpod_delivery_id`.

### Database Update (on delivery order success)

```sql
UPDATE consignments
SET trackpod_delivery_id = '{location_header_value}'
WHERE id = :consignment_id
```

Do not advance `lifecycle_status` yet — collection order must also succeed.

### Error Responses

| HTTP Status | Meaning | Action |
|-------------|---------|--------|
| `400` | Validation error (missing required field, bad date format, etc.) | Set `lifecycle_status = 'TRACKPOD_ERROR'`, store error detail, notify ops queue |
| `401` | Invalid API key | Alert on-call; halt batch |
| `415` | Wrong Content-Type header | Code error; halt batch; alert dev |
| `429` | Rate limit exceeded (20 req/sec, 400 req/min) | Pause, retry after 60 seconds |
| `500` | Track-POD internal error | Set `lifecycle_status = 'TRACKPOD_ERROR'`; retry up to 3 times with exponential backoff |

---

## Step 3 — Create Track-POD Collection Order (Type 1)

Run immediately after Step 2 succeeds. Uses the same `trackpod_order_ref` as the delivery order.

### API Call

Same endpoint, auth, and headers as Step 2.

### Request Body — Wodely source

```json
{
  "Number": "{trackpod_order_ref}",
  "Id": "{trackpod_order_ref}",
  "Type": 1,
  "Client": "{collection_name ?? shipper_name}",
  "ContactName": "{collection_name ?? shipper_name}",
  "Address": "{collection_address}",
  "Phone": "{collection_phone}",
  "Email": "{colllection_email}",
  "Shipper": "{shipper_name}",
  "GoodsList": [
    {
      "GoodsName": "{trackpod_goods}",
      "GoodsUnit": "pcs",
      "Quantity": 1,
      "Note": "{trackpod_photo_note}"
    }
  ]
}
```

**Field resolution rules:**
- `Client` and `ContactName`: Use `collection_name` if populated; fall back to `shipper_name`.
- `Email`: Use `colllection_email` field (triple-l spelling — this is the production field name and must be preserved exactly).
- `GoodsList[0].Note`: Use `trackpod_photo_note` field. This is the photo/inspection instruction text for the driver at collection.

### Request Body — WooCommerce (THDG) source

```json
{
  "Number": "{trackpod_order_ref}",
  "Id": "{trackpod_order_ref}",
  "Type": 1,
  "Client": "{collection_name}",
  "ContactName": "{collection_name}",
  "Address": "{collection_address}",
  "Phone": "{collection_phone}",
  "Email": "{colllection_email}",
  "Shipper": "{shipper_name}",
  "GoodsList": [
    {
      "GoodsName": "{trackpod_goods}",
      "GoodsUnit": "pcs",
      "Quantity": 1,
      "Note": ""
    }
  ]
}
```

**Differences from Wodely:**
- `Client` and `ContactName` use `collection_name` directly with no fallback.
- `GoodsList[0].Note` is always an empty string — `trackpod_photo_note` is not included for WooCommerce orders.

### Success Response

```
HTTP 201 Created
Location: https://api.track-pod.com/Order/Id/{trackpod_internal_id}
```

The `Location` header value is stored as `trackpod_collection_id`.

### Error Responses

Same table as Step 2. If collection creation fails after delivery has already been created:

1. Set `lifecycle_status = 'TRACKPOD_ERROR'`
2. Store error detail
3. Retain the `trackpod_delivery_id` already stored
4. Notify ops queue with details of which order was created and which failed
5. Operator must resolve manually (delete the stale delivery order in Track-POD or retry collection)

---

## Step 4 — Store Track-POD IDs

After both orders are created successfully, store both `Location` header values and advance status in a single atomic database update.

### Database Update

```sql
UPDATE consignments
SET
  trackpod_delivery_id   = '{delivery_location_header}',
  trackpod_collection_id = '{collection_location_header}',
  lifecycle_status       = 'READY_FOR_ROUTE'
WHERE id = :consignment_id
```

**Production field mappings:**

| Track-POD Response | Airtable Field ID | Airtable Field Name | Supabase Column |
|-------------------|-------------------|--------------------|-----------------| 
| `Location` header (delivery POST) | `fldFLwCFNOwaQaFxy` | TrackPOD Delivery ID | `trackpod_delivery_id` |
| `Location` header (collection POST) | `fldZos9QwXEL0WLZW` | TrackPOD Collection ID | `trackpod_collection_id` |
| Hardcoded: `READY_FOR_ROUTE` | `fldt7MgFBgq3cE8Ri` | Lifecycle Status | `lifecycle_status` |

---

## Step 5 — Generate Tracking URLs

**NOS Specification requirement:** "Store tracking URLs."

The Track-POD API returns tracking information in the `Order` response body when the order is fetched:

| API Field | Description |
|-----------|-------------|
| `TrackKey` | Key for constructing tracking URL |
| `TrackId` | Internal tracking identifier |
| `TrackLink` | Full public tracking URL for customer |

### How to retrieve

After the delivery order is created (Step 2), call:

```
GET https://api.track-pod.com/Order/Id/{id}
X-API-KEY: {TRACKPOD_API_KEY}
```

Where `{id}` is extracted from the stored `Location` header URL.

The response includes `TrackLink` — a public-facing URL the customer can use to track their order in real time. This URL is permanent (not time-limited, unlike `ReportUrl`).

### Database Update

```sql
UPDATE consignments
SET
  trackpod_track_key     = '{response.TrackKey}',
  trackpod_track_id      = '{response.TrackId}',
  trackpod_track_link    = '{response.TrackLink}'
WHERE id = :consignment_id
```

> **Current production state:** The Make blueprints (BP-06, BP-07) do not perform this GET after creation. They only store the `Location` header. Generating and storing `TrackLink` is a **new requirement** specified by the NOS spec and must be implemented in Nexus.

---

## Step 6 — Store Document URLs

**NOS Specification requirement:** "Store document URLs. Attach document URLs in Track-POD note."

Two document types are available from Track-POD:

### 6a. Shipping Label

```
GET https://api.track-pod.com/Order/Number/{number}/Shipping-label
X-API-KEY: {TRACKPOD_API_KEY}
```

- Returns a PDF shipping label
- Rate limit: 10 requests/sec
- Response: binary PDF

Store the URL (or download and store in object storage) as `trackpod_shipping_label_url`.

### 6b. Proof of Delivery (POD) PDF

```
GET https://api.track-pod.com/Order/Number/{number}/Pdf
X-API-KEY: {TRACKPOD_API_KEY}
```

- Returns the POD PDF
- Rate limit: 2 requests/sec
- **Important:** The `ReportUrl` field on the `Order` object is only available for **1 hour** from the API call
- POD is only meaningful after delivery; at order-creation time, this will return an empty or pre-delivery document

### Timing

Document URL storage happens in two phases:

| Phase | Timing | Documents |
|-------|--------|-----------|
| On order creation | Immediately after Step 4 | Shipping label URL |
| On delivery confirmation | After Track-POD fires Delivered webhook (BP-08) | POD PDF URL |

### Attach Document URL in Track-POD Note

**NOS Specification requirement:** "Attach document URLs in Track-POD note."

Once document URLs are stored, update the Track-POD order note field to include the document URL:

```
PUT https://api.track-pod.com/Order
X-API-KEY: {TRACKPOD_API_KEY}
Content-Type: application/json

{
  "Number": "{trackpod_order_ref}",
  "Note": "{existing_note}\nDocument: {document_url}"
}
```

This makes the document accessible directly from the Track-POD driver app and web interface.

> **Current production state:** The Make blueprints do not implement this step. It is specified by the NOS and must be implemented in Nexus.

### Database Update

```sql
UPDATE consignments
SET
  trackpod_shipping_label_url = '{shipping_label_url}',
  trackpod_pod_url            = '{pod_url}'   -- set after delivery
WHERE id = :consignment_id
```

---

## Step 7 — Ready for Planning (READY_FOR_ROUTE)

The lifecycle status `READY_FOR_ROUTE` (set in Step 4) signals that:

- Both Track-POD orders exist
- Track-POD IDs are stored
- Consignment is ready for route allocation and planning

This status is the handoff point to the **Move-it / Route-it** module.

### Database state at READY_FOR_ROUTE

| Column | State |
|--------|-------|
| `lifecycle_status` | `READY_FOR_ROUTE` |
| `trackpod_delivery_id` | Populated (Location URL) |
| `trackpod_collection_id` | Populated (Location URL) |
| `trackpod_track_link` | Populated (from GET after creation) |
| `trackpod_shipping_label_url` | Populated |
| `trackpod_pod_url` | NULL (set after delivery) |

---

## Step 8 — Ready for Routing

Routing is handled by the Move-it module. Process-it's responsibility ends at `READY_FOR_ROUTE`. However, for completeness the downstream Track-POD route assignment API is:

```
PUT https://api.track-pod.com/Route/{code}/Order
```

or

```
PUT https://api.track-pod.com/Route/{id}/Order/Number/{number}
```

Assigns the Track-POD order to a named route for driver dispatch.

See `reference/flows/NEXUS Operating System Specification v1.0.md` Section 6 (Move it / Route it) for full routing process.

---

## Rate Limits

All limits are per API key:

| Endpoint category | Limit |
|-------------------|-------|
| `POST /Order`, `PUT /Order`, `GET /Order` | 20 requests/sec, 400 requests/min |
| `GET /Order/.../Pdf` | 2 requests/sec |
| `GET /Order/.../Shipping-label` | 10 requests/sec |

When a `429 Too Many Requests` response is received:
1. Pause the batch for 60 seconds
2. Retry the failed request
3. Resume batch processing

---

## Error Conditions

### Validation Errors (400)

Track-POD returns `400` when required fields are missing or malformed.

**Required fields for delivery order (Type 0):** `Client`, `Address`  
**Required fields for collection order (Type 1):** `Client`, `Address`

| Missing data | Prevention |
|-------------|-----------|
| `delivery_name` empty | Blocked by poll formula (Wodely) or surfaces as 400 (WooCommerce) |
| `delivery_address` empty | Blocked by poll formula (Wodely) or surfaces as 400 (WooCommerce) |
| `collection_name` empty | Blocked by poll formula (Wodely) |
| `collection_address` empty | Blocked by poll formula (Wodely) |
| Invalid date format | Ensure YYYY-MM-DD formatting before send |
| `trackpod_order_ref` duplicate in Track-POD | Track-POD returns 400; set `TRACKPOD_ERROR`; notify ops |

### Partial Completion

If delivery order succeeds but collection order fails:

1. `trackpod_delivery_id` is stored
2. `trackpod_collection_id` is null
3. `lifecycle_status` remains `READY_FOR_TRACKPOD` (not advanced to `READY_FOR_ROUTE`)
4. `lifecycle_status` set to `TRACKPOD_ERROR` with error detail stored
5. Operator must resolve: either delete the Track-POD delivery order and retry from scratch, or create the collection order manually and store the ID

### Stale / Orphaned Track-POD Orders

If a consignment reaches `TRACKPOD_ERROR` with a partial Track-POD ID stored, on retry the duplicate-prevention check will find the stored ID and skip creation of that order type. The retry process must:

1. Detect which order type is missing (`trackpod_delivery_id` or `trackpod_collection_id`)
2. Create only the missing order type
3. Store the new ID
4. Advance to `READY_FOR_ROUTE`

---

## Retry Conditions

| Error | Retry | Strategy |
|-------|-------|----------|
| `429 Too Many Requests` | Yes | Wait 60 seconds, retry same request |
| `500 Internal Server Error` | Yes | Exponential backoff: 10s, 30s, 90s; max 3 attempts |
| `400 Validation Error` | No | Requires operator action to fix the data |
| `401 Unauthorized` | No | Requires API key rotation; halt batch |
| Network timeout | Yes | Retry up to 3 times with 30s delay |
| Partial completion (delivery OK, collection failed) | Yes (collection only) | Retry collection order after `TRACKPOD_ERROR` resolution |

**Make production behaviour:** `maxErrors: 3` at scenario level. After 3 errors across the batch run, the scenario stops.

---

## User Actions

### Operator Queue — READY_FOR_TRACKPOD

Operators can see all consignments in `READY_FOR_TRACKPOD` status. Actions available:

| Action | Description |
|--------|-------------|
| View consignment | See all fields before Track-POD push |
| Edit fields | Correct address, name, or goods description before push |
| Manual push | Trigger Process-it for a single consignment |
| Batch push | Trigger Process-it for all eligible consignments |
| Skip | Mark consignment as excluded from Track-POD push (sets a flag, does not change lifecycle) |

### Operator Queue — TRACKPOD_ERROR

Operators can see all consignments that failed Track-POD creation. Actions available:

| Action | Description |
|--------|-------------|
| View error | See the full error response from Track-POD |
| Edit fields | Fix the data that caused the validation error |
| Retry | Re-run Process-it for this consignment (clears error status, sets back to `READY_FOR_TRACKPOD`, re-queues) |
| Cancel | Mark consignment as cancelled (separate lifecycle state) |
| View Track-POD | If partial, opens Track-POD console for the existing order |

---

## Notifications

### Internal (Ops)

| Event | Recipient | Channel | Content |
|-------|-----------|---------|---------|
| Consignment enters `READY_FOR_TRACKPOD` | Operations team | Dashboard badge / count | Queue depth increase |
| Track-POD orders created successfully | None (silent) | — | — |
| `TRACKPOD_ERROR` | Operations team | Alert / notification | Consignment ref, error detail, action required |
| Batch completed | Operations team | Dashboard | Count processed, count errored |

### External (Customer / Merchant)

| Event | Recipient | Channel | Content |
|-------|-----------|---------|---------|
| `READY_FOR_ROUTE` | Merchant portal | Status update | Order is confirmed and being dispatched |
| Tracking URL generated | Customer (if email captured) | Email / SMS | `TrackLink` for live tracking |

> **Current production state:** The Make blueprints do not include any notification steps. Notifications are a Nexus-side requirement from the NOS spec.

---

## Required Database Columns

The following columns must exist on the `consignments` table to support the full Process-it flow:

| Column | Type | Source | Notes |
|--------|------|--------|-------|
| `trackpod_order_ref` | text | Set before Process-it | Sent as `Number` and `Id` to Track-POD |
| `trackpod_delivery_id` | text | Track-POD POST Location header | Delivery order URL |
| `trackpod_collection_id` | text | Track-POD POST Location header | Collection order URL |
| `trackpod_track_key` | text | Track-POD GET response | From `TrackKey` field |
| `trackpod_track_id` | text | Track-POD GET response | From `TrackId` field |
| `trackpod_track_link` | text | Track-POD GET response | From `TrackLink` field (public URL) |
| `trackpod_shipping_label_url` | text | Track-POD GET Shipping-label | URL or storage path |
| `trackpod_pod_url` | text | Track-POD GET Pdf (post-delivery) | URL or storage path |
| `trackpod_error_detail` | jsonb | Track-POD error response | Stored when `TRACKPOD_ERROR` |
| `trackpod_push_attempted_at` | timestamptz | Job execution | Timestamp of last push attempt |
| `trackpod_push_completed_at` | timestamptz | Job execution | Timestamp of successful completion |
| `lifecycle_status` | text | State machine | `READY_FOR_TRACKPOD` → `READY_FOR_ROUTE` |

Existing columns used by this step (set in earlier stages):

| Column | Required Value |
|--------|---------------|
| `trackpod_goods` | Goods description |
| `shipper_name` | Shipper/depot name |
| `collection_name` | Collection contact name |
| `collection_address` | Collection address string |
| `collection_phone` | Collection contact phone |
| `colllection_email` | Collection email (**triple-l**) |
| `delivery_name` | Delivery contact name |
| `delivery_address` | Delivery address string |
| `delivery_phone` | Delivery contact phone |
| `delivery_email` | Delivery email |
| `requested_delivery_date` | Preferred delivery date (Wodely) |
| `expected_collection_date` | Fallback delivery date (Wodely) |
| `trackpod_photo_note` | Photo/note instruction (Wodely collection only) |

---

## Required API Endpoints (Nexus)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/jobs/process-it` | POST | Batch: find eligible consignments and push to Track-POD |
| `/api/consignments/:id/process` | POST | Single: push one consignment to Track-POD |
| `/api/consignments/:id/retry-trackpod` | POST | Retry after TRACKPOD_ERROR |
| `/api/webhooks/trackpod/delivered` | POST | Receive Track-POD delivery status webhook (BP-08) |

---

## Required Track-POD API Calls (Summary)

| Step | Call | Purpose |
|------|------|---------|
| 2 | `POST /Order` (Type 0) | Create delivery order |
| 3 | `POST /Order` (Type 1) | Create collection order |
| 5 | `GET /Order/Id/{id}` | Retrieve TrackLink, TrackKey, TrackId |
| 6a | `GET /Order/Number/{number}/Shipping-label` | Fetch shipping label PDF |
| 6b | `GET /Order/Number/{number}/Pdf` | Fetch POD PDF (post-delivery) |
| 6c | `PUT /Order` (update Note) | Attach document URL to order note |
| Route | `PUT /Route/{code}/Order/Number/{number}` | Assign to route (Move-it module) |

---

## Source Divergence: Wodely vs WooCommerce

The two production blueprints use the same Track-POD API but differ in these fields:

| Field | Wodely (BP-06) | WooCommerce/THDG (BP-07) |
|-------|---------------|--------------------------|
| Poll gate — payment | `PAID` or `ACCOUNT` required | None |
| Poll gate — addresses | All four required in query | Only `TrackPOD Delivery ID` empty |
| Delivery `Date` | `requested_delivery_date` → `expected_collection_date` | Not sent |
| Delivery `Client` | `delivery_name ?? collection_name` | `delivery_name` only |
| Delivery `ContactName` | `delivery_name ?? collection_name` | `collection_name` (cross-mapped) |
| Delivery `Email` | `delivery_email` | `colllection_email, delivery_email` |
| Collection `Client` | `collection_name ?? shipper_name` | `collection_name` only |
| Collection `Note` | `trackpod_photo_note` | Empty string |
| Duplicate check | `__IMTLENGTH__ > 0` → secondary search | `record.id exists` → secondary search |

These differences must be preserved exactly. Do not normalise or unify them.

---

## Make Scenario Settings (Production Reference)

Both BP-06 and BP-07 run with these scenario-level settings:

| Setting | Value |
|---------|-------|
| `instant` | `false` (scheduled, not webhook-triggered) |
| `maxErrors` | `3` (stops batch after 3 errors) |
| `autoCommit` | `true` |
| `autoCommitTriggerLast` | `true` |
| `sequential` | `false` (parallel processing allowed) |
| `zone` | `eu1.make.com` |

The Nexus equivalent must handle the `maxErrors: 3` concept — after 3 consecutive failures in a batch run, halt the batch and notify ops rather than continuing to hammer a system that may be down.
