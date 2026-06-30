# BP-06: Wodely → AirTable → TrackPOD

**Source file:** `reference/make/blueprints/3 -Wod - Wodely - AirTable - TrackPOD.blueprint.json`  
**Make scenario name:** `3 -Wod - Wodely - AirTable - TrackPOD`

---

## Trigger

- **Type:** Airtable Search (`airtable:ActionSearchRecords`) — scheduled polling
- **Connection:** `7829322` (Nexus OAuth)
- **Base:** `appWKD6dpoFTeTLUI`
- **Table:** `tbl8AR7buODtDA20F` (Consignments)
- **View:** `viwIgQbZOIg51OZuW`

### Poll Formula

```
AND(
  {Source System}="Wodely",
  {Lifecycle Status}="READY_FOR_TRACKPOD",
  OR(
    {Payment Status}="PAID",
    {Payment Status}="ACCOUNT",
    {Payment Type}="ACCOUNT"
  ),
  OR(
    {TrackPOD Collection ID}="",
    {TrackPOD Delivery ID}=""
  ),
  {Collection Address}!="",
  {Delivery Address}!="",
  {Collection Name}!="",
  {Delivery Name}!=""
)
```

- **Sort:** Created Time (Ascending) — FIFO order
- **Max Records:** 50

Only processes Wodely-sourced consignments that are ready for dispatch AND have all required address/name fields populated AND have not already been sent to TrackPOD.

---

## Step 1: Check for Existing TrackPOD IDs (Module 5)

**Filter on Module 5:** `{{1.__IMTLENGTH__}} > 0` (at least one result returned from Step 1 search)

Searches Airtable to prevent duplicate TrackPOD order creation:

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

If any matching record already has a TrackPOD ID, duplicate creation is blocked.

---

## Step 2: Create TrackPOD Delivery Order (Module 2)

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
  "Date": "{{ifempty(
    formatDate(1.Requested Delivery Date, \"YYYY-MM-DD\"),
    formatDate(1.Expected Collection Date, \"YYYY-MM-DD\")
  )}}",
  "Client": "{{ifempty(1.Delivery Name, 1.Collection Name)}}",
  "ContactName": "{{ifempty(1.Delivery Name, 1.Collection Name)}}",
  "Address": "{{1.Delivery Address}}",
  "Phone": "{{1.Delivery Phone}}",
  "Email": "{{1.Delivery Email}}",
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

**TrackPOD Order Type 0 = Delivery**

### Response

- `headers.location` — URL containing the new TrackPOD order ID
  - Stored in Airtable as `TrackPOD Delivery ID` (`fldFLwCFNOwaQaFxy`)

---

## Step 3: Create TrackPOD Collection Order (Module 3)

### HTTP Request

Same endpoint and auth as Module 2.

### Request Body

```json
{
  "Number": "{{1.TrackPOD Order Ref}}",
  "Id": "{{1.TrackPOD Order Ref}}",
  "Type": 1,
  "Client": "{{ifempty(1.Collection Name, 1.Shipper Name)}}",
  "ContactName": "{{ifempty(1.Collection Name, 1.Shipper Name)}}",
  "Address": "{{1.Collection Address}}",
  "Phone": "{{1.Collection Phone}}",
  "Email": "{{1.Colllection Email}}",
  "Shipper": "{{1.Shipper Name}}",
  "GoodsList": [
    {
      "GoodsName": "{{1.TrackPOD Goods}}",
      "GoodsUnit": "pcs",
      "Quantity": 1,
      "Note": "{{1.TRACKPOD PHOTO & NOTE}}"
    }
  ]
}
```

> **Note:** `Colllection Email` has a triple-l typo in the Airtable field name — this is intentional and must be preserved in migration.

**TrackPOD Order Type 1 = Pickup/Collection**

### Response

- `headers.location` — URL containing the new TrackPOD order ID
  - Stored in Airtable as `TrackPOD Collection ID` (`fldZos9QwXEL0WLZW`)

---

## Step 4: Update Airtable with TrackPOD IDs (Module 4)

**Module 4 — Airtable Update Record** (`id: {{1.id}}`):

| Field ID | Field Name | Value |
|----------|-----------|-------|
| `fldFLwCFNOwaQaFxy` | TrackPOD Delivery ID | `{{2.headers.location}}` |
| `fldZos9QwXEL0WLZW` | TrackPOD Collection ID | `{{3.headers.location}}` |
| `fldt7MgFBgq3cE8Ri` | Lifecycle Status | `READY_FOR_ROUTE` |

---

## Outputs

- TrackPOD Delivery order created (Type 0)
- TrackPOD Collection/Pickup order created (Type 1)
- Airtable record updated with both TrackPOD IDs
- Lifecycle advanced to `READY_FOR_ROUTE`

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

## Airtable Fields Read (from Consignments record)

| Field Name | Used In |
|-----------|--------|
| `TrackPOD Order Ref` | TrackPOD `Number` and `Id` |
| `Requested Delivery Date` | TrackPOD delivery `Date` (primary) |
| `Expected Collection Date` | TrackPOD delivery `Date` (fallback) |
| `Delivery Name` | TrackPOD delivery `Client` + `ContactName` |
| `Collection Name` | TrackPOD delivery fallback, collection `Client` + `ContactName` |
| `Delivery Address` | TrackPOD delivery `Address` |
| `Delivery Phone` | TrackPOD delivery `Phone` |
| `Delivery Email` | TrackPOD delivery `Email` |
| `Shipper Name` | TrackPOD `Shipper` (both orders) |
| `TrackPOD Goods` | TrackPOD `GoodsList[0].GoodsName` |
| `Collection Address` | TrackPOD collection `Address` |
| `Collection Phone` | TrackPOD collection `Phone` |
| `Colllection Email` | TrackPOD collection `Email` (note: triple-l typo) |
| `TRACKPOD PHOTO & NOTE` | TrackPOD collection `GoodsList[0].Note` |

---

## HTTP Endpoints

| URL | Method | Auth | Purpose |
|-----|--------|------|---------|
| `https://api.track-pod.com/Order` | POST | `X-API-KEY: 019e8317-eea1-7539-a5e8-a881b0afd97c` | Create Delivery order (Type 0) |
| `https://api.track-pod.com/Order` | POST | `X-API-KEY: 019e8317-eea1-7539-a5e8-a881b0afd97c` | Create Collection order (Type 1) |

---

## TrackPOD Field Mappings

### Delivery Order (Type 0)

| TrackPOD Field | Source (Airtable) | Notes |
|---------------|-------------------|-------|
| `Number` | `TrackPOD Order Ref` | Must be unique identifier |
| `Id` | `TrackPOD Order Ref` | Same as Number |
| `Type` | Hardcoded: `0` | Delivery |
| `Date` | `Requested Delivery Date` fallback `Expected Collection Date` | YYYY-MM-DD format |
| `Client` | `Delivery Name` fallback `Collection Name` | |
| `ContactName` | `Delivery Name` fallback `Collection Name` | |
| `Address` | `Delivery Address` | |
| `Phone` | `Delivery Phone` | |
| `Email` | `Delivery Email` | |
| `Shipper` | `Shipper Name` | |
| `GoodsList[0].GoodsName` | `TrackPOD Goods` | |
| `GoodsList[0].GoodsUnit` | Hardcoded: `"pcs"` | |
| `GoodsList[0].Quantity` | Hardcoded: `1` | |
| `GoodsList[0].Note` | Hardcoded: `""` | Empty for delivery |

### Collection Order (Type 1)

| TrackPOD Field | Source (Airtable) | Notes |
|---------------|-------------------|-------|
| `Number` | `TrackPOD Order Ref` | Same as delivery |
| `Id` | `TrackPOD Order Ref` | Same as delivery |
| `Type` | Hardcoded: `1` | Pickup/Collection |
| `Client` | `Collection Name` fallback `Shipper Name` | |
| `ContactName` | `Collection Name` fallback `Shipper Name` | |
| `Address` | `Collection Address` | |
| `Phone` | `Collection Phone` | |
| `Email` | `Colllection Email` | Note: triple-l typo in field name |
| `Shipper` | `Shipper Name` | |
| `GoodsList[0].GoodsName` | `TrackPOD Goods` | |
| `GoodsList[0].GoodsUnit` | Hardcoded: `"pcs"` | |
| `GoodsList[0].Quantity` | Hardcoded: `1` | |
| `GoodsList[0].Note` | `TRACKPOD PHOTO & NOTE` | Included on collection only |

### TrackPOD Response → Airtable

| TrackPOD Response | Airtable Field ID | Field Name |
|-------------------|-------------------|-----------|
| `headers.location` (delivery POST) | `fldFLwCFNOwaQaFxy` | TrackPOD Delivery ID |
| `headers.location` (collection POST) | `fldZos9QwXEL0WLZW` | TrackPOD Collection ID |

---

## Xero Mappings

None in this blueprint.

---

## Error Handling

- `stopOnHttpError: true` on both TrackPOD HTTP calls
- `parseResponse: true`
- `allowRedirects: true`
- Duplicate prevention: if `TrackPOD Collection ID` or `TrackPOD Delivery ID` already exists for the External Order ID, the scenario skips that record

---

## Required Supabase Tables (Migration)

Additional columns beyond previous blueprints:

| Column | Type | Maps to |
|--------|------|--------|
| `trackpod_order_ref` | text | `TrackPOD Order Ref` Airtable field |
| `trackpod_delivery_id` | text | `fldFLwCFNOwaQaFxy` |
| `trackpod_collection_id` | text | `fldZos9QwXEL0WLZW` |
| `requested_delivery_date` | date | `Requested Delivery Date` |
| `expected_collection_date` | date | `Expected Collection Date` |
| `shipper_name` | text | `Shipper Name` |
| `trackpod_goods` | text | `TrackPOD Goods` |
| `trackpod_photo_note` | text | `TRACKPOD PHOTO & NOTE` |
| `colllection_email` | text | `Colllection Email` (preserve triple-l for parity) |

---

## Required API Endpoints (Migration)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/jobs/trackpod-push-wodely` | POST/GET | Scheduled: find READY_FOR_TRACKPOD Wodely consignments and create TrackPOD orders |

---

## UI Required to Support This Workflow

- `READY_FOR_TRACKPOD` queue display
- `READY_FOR_ROUTE` status indicator after TrackPOD push
- TrackPOD order ID links (delivery + collection)
- Validation warnings if required fields (addresses, names) are missing before TrackPOD push
