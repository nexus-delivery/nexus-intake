# BP-07: THDG WooCommerce → AirTable → TrackPOD

**Source file:** `reference/make/blueprints/3a -THDG - Woocommerce - AirTable - TrackPOD.blueprint.json`  
**Make scenario name:** `3a -THDG - Woocommerce - AirTable - TrackPOD`

---

## Trigger

- **Type:** Airtable Search (`airtable:ActionSearchRecords`) — scheduled polling
- **Connection:** `7829322` (Nexus OAuth)
- **Base:** `appWKD6dpoFTeTLUI`
- **Table:** `tbl8AR7buODtDA20F` (Consignments)

### Poll Formula

```
AND(
  {Source System}="WooCommerce",
  {Lifecycle Status}="READY_FOR_TRACKPOD",
  {TrackPOD Delivery ID}=""
)
```

- **Sort:** Created Time (Ascending) — FIFO
- **Max Records:** 50

Processes WooCommerce-sourced consignments ready for TrackPOD push that don't yet have a delivery ID.

> **Key difference from BP-06:** No payment status filter — WooCommerce orders are already confirmed paid by the time they reach `READY_FOR_TRACKPOD`. Also does not check Collection Address/Name/etc. in the query filter (checked implicitly via the duplicate-check step).

---

## Step 1: Check for Existing TrackPOD IDs (Module 6)

**Filter on Module 6:** `{{1.id}}` exists

- **Formula:**
  ```
  AND(
    {External Order ID} = "{{1.External Order ID}}",
    OR(
      {TrackPOD Collection ID} != "",
      {TrackPOD Delivery ID} != ""
    )
  )
  ```
- **Max Records:** 10

---

## Step 2: Create TrackPOD Delivery Order (Module 2)

**Filter on Module 2:** `TRACKPOD IS EMPTY`
```
{{6.TrackPOD Delivery ID}} does NOT exist
AND {{6.TrackPOD Collection ID}} does NOT exist
```

Both must be absent to proceed (prevents duplicates).

### HTTP Request

| Property | Value |
|----------|-------|
| URL | `https://api.track-pod.com/Order` |
| Method | `POST` |
| X-API-KEY | `019e8317-eea1-7539-a5e8-a881b0afd97c` |
| Content-Type | `application/json` |
| Accept | `application/json` |

### Request Body

```json
{
  "Number": "{{1.TrackPOD Order Ref}}",
  "Id": "{{1.TrackPOD Order Ref}}",
  "Type": 0,
  "Client": "{{1.Delivery Name}}",
  "ContactName": "{{1.Collection Name}}",
  "Address": "{{1.Delivery Address}}",
  "Phone": "{{1.Delivery Phone}}",
  "Email": "{{1.Colllection Email}}, {{1.Delivery Email}}",
  "Shipper": "{{1.Shipper Name}}",
  "GoodsList": [
    {
      "GoodsName": "{{1.TrackPOD Goods}}",
      "GoodsUnit": "pcs",
      "Quantity": 1,
      "Note": ""
    }
  ]
}
```

> **Key difference from BP-06 Delivery:** `ContactName` is set to `Collection Name` (not Delivery Name). Email combines both collection and delivery emails: `"{{1.Colllection Email}}, {{1.Delivery Email}}"`. No date field included. No `ifempty` fallbacks.

---

## Step 3: Create TrackPOD Collection Order (Module 3)

No filter — runs after Module 2 always.

### Request Body

```json
{
  "Number": "{{1.TrackPOD Order Ref}}",
  "Id": "{{1.TrackPOD Order Ref}}",
  "Type": 1,
  "Client": "{{1.Collection Name}}",
  "ContactName": "{{1.Collection Name}}",
  "Address": "{{1.Collection Address}}",
  "Phone": "{{1.Collection Phone}}",
  "Email": "{{1.Colllection Email}}",
  "Shipper": "{{1.Shipper Name}}",
  "GoodsList": [
    {
      "GoodsName": "{{1.TrackPOD Goods}}",
      "GoodsUnit": "pcs",
      "Quantity": 1,
      "Note": ""
    }
  ]
}
```

> **Key difference from BP-06 Collection:** No `ifempty` on Client/ContactName. No `TRACKPOD PHOTO & NOTE` in GoodsList Note (hardcoded empty string).

---

## Step 4: Update Airtable (Module 4)

| Field ID | Field Name | Value |
|----------|-----------|-------|
| `fldFLwCFNOwaQaFxy` | TrackPOD Delivery ID | `{{2.headers.location}}` |
| `fldZos9QwXEL0WLZW` | TrackPOD Collection ID | `{{3.headers.location}}` |
| `fldt7MgFBgq3cE8Ri` | Lifecycle Status | `READY_FOR_ROUTE` |

---

## Status Changes

| From | To | Trigger |
|------|----|---------|
| `READY_FOR_TRACKPOD` | `READY_FOR_ROUTE` | Both TrackPOD orders created successfully |

---

## Airtable Tables Used

| Table ID | Table Name | Operations |
|----------|-----------|-----------|
| `tbl8AR7buODtDA20F` | Consignments | Search (×2), Update |

---

## HTTP Endpoints

| URL | Method | Auth | Purpose |
|-----|--------|------|---------|
| `https://api.track-pod.com/Order` | POST | `X-API-KEY: 019e8317-eea1-7539-a5e8-a881b0afd97c` | Create Delivery order (Type 0) |
| `https://api.track-pod.com/Order` | POST | `X-API-KEY: 019e8317-eea1-7539-a5e8-a881b0afd97c` | Create Collection order (Type 1) |

---

## TrackPOD Field Mappings

### Delivery Order (Type 0) — THDG-specific behaviour

| TrackPOD Field | Source | Notes |
|---------------|--------|-------|
| `Number` | `TrackPOD Order Ref` | |
| `Id` | `TrackPOD Order Ref` | |
| `Type` | `0` | Delivery |
| `Client` | `Delivery Name` | No fallback (unlike BP-06) |
| `ContactName` | `Collection Name` | Cross-mapped: ContactName = Collection Name |
| `Address` | `Delivery Address` | |
| `Phone` | `Delivery Phone` | |
| `Email` | `Colllection Email` + `, ` + `Delivery Email` | Both emails combined |
| `Shipper` | `Shipper Name` | |
| `GoodsList[0].GoodsName` | `TrackPOD Goods` | |
| `GoodsList[0].Note` | `""` | Empty (no photo note for delivery) |

### Collection Order (Type 1)

| TrackPOD Field | Source | Notes |
|---------------|--------|-------|
| `Number` | `TrackPOD Order Ref` | |
| `Id` | `TrackPOD Order Ref` | |
| `Type` | `1` | Collection |
| `Client` | `Collection Name` | No fallback |
| `ContactName` | `Collection Name` | Same as Client |
| `Address` | `Collection Address` | |
| `Phone` | `Collection Phone` | |
| `Email` | `Colllection Email` | Note: triple-l typo |
| `Shipper` | `Shipper Name` | |
| `GoodsList[0].GoodsName` | `TrackPOD Goods` | |
| `GoodsList[0].Note` | `""` | Empty (no photo note for THDG) |

---

## Key Differences from BP-06 (Wodely → TrackPOD)

| Aspect | BP-06 (Wodely) | BP-07 (THDG) |
|--------|---------------|-------------|
| Source System filter | `"Wodely"` | `"WooCommerce"` |
| Payment filter | `PAID OR ACCOUNT` | None |
| Address/name in poll | Required (formula) | Not checked in poll |
| Delivery ContactName | Delivery Name (w/ fallback) | Collection Name (cross-mapped) |
| Delivery Email | Delivery Email only | Both emails concatenated |
| Delivery Date field | Yes (with fallback) | No date field |
| Collection Note | `TRACKPOD PHOTO & NOTE` | Empty string |
| ifempty fallbacks | Yes (both orders) | No |

---

## Required Supabase Tables (Migration)

Same columns as BP-06. See [BP-06](./BP-06-Wodely-AirTable-TrackPOD.md#required-supabase-tables-migration).

---

## Required API Endpoints (Migration)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/jobs/trackpod-push-woocommerce` | POST/GET | Scheduled: find READY_FOR_TRACKPOD WooCommerce consignments and create TrackPOD orders |

---

## UI Required to Support This Workflow

- Same as BP-06
- Display distinguishing badge for WooCommerce source vs Wodely source
