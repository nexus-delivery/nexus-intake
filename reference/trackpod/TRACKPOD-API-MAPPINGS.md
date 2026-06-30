# TrackPOD API Reference

Extracted from production Make blueprints (BP-06, BP-07).

---

## Authentication

All requests use an API key header:

```
X-API-KEY: 019e8317-eea1-7539-a5e8-a881b0afd97c
```

---

## Endpoints Used

### POST /Order — Create Order

**Base URL:** `https://api.track-pod.com`  
**Full URL:** `https://api.track-pod.com/Order`  
**Method:** POST  
**Content-Type:** `application/json`  
**Accept:** `application/json`

Used in BP-06 (Wodely) and BP-07 (WooCommerce) to create both Delivery and Collection orders.

#### Order Types

| Type Value | Description |
|-----------|-------------|
| `0` | Delivery |
| `1` | Pickup / Collection |

---

## Request Body Schema

```json
{
  "Number": "string",
  "Id": "string",
  "Type": 0,
  "Date": "YYYY-MM-DD",
  "Client": "string",
  "ContactName": "string",
  "Address": "string",
  "Phone": "string",
  "Email": "string",
  "Shipper": "string",
  "GoodsList": [
    {
      "GoodsName": "string",
      "GoodsUnit": "string",
      "Quantity": 1,
      "Note": "string"
    }
  ]
}
```

---

## Field Mappings — Delivery Order (Type 0)

### BP-06 (Wodely source)

| TrackPOD Field | Source Field (Airtable) | Logic |
|---------------|------------------------|-------|
| `Number` | `TrackPOD Order Ref` | Direct |
| `Id` | `TrackPOD Order Ref` | Same as Number |
| `Type` | — | Hardcoded: `0` |
| `Date` | `Requested Delivery Date` → `Expected Collection Date` | `ifempty` fallback; format `YYYY-MM-DD` |
| `Client` | `Delivery Name` → `Collection Name` | `ifempty` fallback |
| `ContactName` | `Delivery Name` → `Collection Name` | `ifempty` fallback |
| `Address` | `Delivery Address` | Direct |
| `Phone` | `Delivery Phone` | Direct |
| `Email` | `Delivery Email` | Direct |
| `Shipper` | `Shipper Name` | Direct |
| `GoodsList[0].GoodsName` | `TrackPOD Goods` | Direct |
| `GoodsList[0].GoodsUnit` | — | Hardcoded: `"pcs"` |
| `GoodsList[0].Quantity` | — | Hardcoded: `1` |
| `GoodsList[0].Note` | — | Hardcoded: `""` (empty) |

### BP-07 (WooCommerce / THDG source)

| TrackPOD Field | Source Field (Airtable) | Logic |
|---------------|------------------------|-------|
| `Number` | `TrackPOD Order Ref` | Direct |
| `Id` | `TrackPOD Order Ref` | Same as Number |
| `Type` | — | Hardcoded: `0` |
| `Date` | — | **Not included** in THDG delivery |
| `Client` | `Delivery Name` | Direct (no fallback) |
| `ContactName` | `Collection Name` | **Cross-mapped**: ContactName = Collection Name |
| `Address` | `Delivery Address` | Direct |
| `Phone` | `Delivery Phone` | Direct |
| `Email` | `Colllection Email` + `, ` + `Delivery Email` | **Both emails concatenated** |
| `Shipper` | `Shipper Name` | Direct |
| `GoodsList[0].GoodsName` | `TrackPOD Goods` | Direct |
| `GoodsList[0].GoodsUnit` | — | Hardcoded: `"pcs"` |
| `GoodsList[0].Quantity` | — | Hardcoded: `1` |
| `GoodsList[0].Note` | — | Hardcoded: `""` (empty) |

---

## Field Mappings — Collection Order (Type 1)

### BP-06 (Wodely source)

| TrackPOD Field | Source Field (Airtable) | Logic |
|---------------|------------------------|-------|
| `Number` | `TrackPOD Order Ref` | Direct |
| `Id` | `TrackPOD Order Ref` | Same as Number |
| `Type` | — | Hardcoded: `1` |
| `Client` | `Collection Name` → `Shipper Name` | `ifempty` fallback |
| `ContactName` | `Collection Name` → `Shipper Name` | `ifempty` fallback |
| `Address` | `Collection Address` | Direct |
| `Phone` | `Collection Phone` | Direct |
| `Email` | `Colllection Email` | Direct — **note triple-l typo** |
| `Shipper` | `Shipper Name` | Direct |
| `GoodsList[0].GoodsName` | `TrackPOD Goods` | Direct |
| `GoodsList[0].GoodsUnit` | — | Hardcoded: `"pcs"` |
| `GoodsList[0].Quantity` | — | Hardcoded: `1` |
| `GoodsList[0].Note` | `TRACKPOD PHOTO & NOTE` | Photo/note instruction |

### BP-07 (WooCommerce / THDG source)

| TrackPOD Field | Source Field (Airtable) | Logic |
|---------------|------------------------|-------|
| `Number` | `TrackPOD Order Ref` | Direct |
| `Id` | `TrackPOD Order Ref` | Same as Number |
| `Type` | — | Hardcoded: `1` |
| `Client` | `Collection Name` | Direct (no fallback) |
| `ContactName` | `Collection Name` | Same as Client |
| `Address` | `Collection Address` | Direct |
| `Phone` | `Collection Phone` | Direct |
| `Email` | `Colllection Email` | Direct — **note triple-l typo** |
| `Shipper` | `Shipper Name` | Direct |
| `GoodsList[0].GoodsName` | `TrackPOD Goods` | Direct |
| `GoodsList[0].GoodsUnit` | — | Hardcoded: `"pcs"` |
| `GoodsList[0].Quantity` | — | Hardcoded: `1` |
| `GoodsList[0].Note` | — | Hardcoded: `""` (empty, not photo note) |

---

## Response

### Success

- **Status:** `201 Created`
- **`Location` header:** Contains the new order URL/ID
  - Example: `https://api.track-pod.com/Order/xxxxxxxx`
  - This full URL is stored in Airtable as `TrackPOD Delivery ID` or `TrackPOD Collection ID`

### Error Handling in Blueprints

- `stopOnHttpError: true` — any non-2xx response stops the scenario run
- `parseResponse: true` — response body is parsed as JSON
- `allowRedirects: true`

---

## Webhook Received from TrackPOD (BP-08)

TrackPOD sends a POST to the configured webhook URL when order status changes.

### Trigger Condition in Make

Only processes events where:
```
Data.Status == "Delivered"
```

### Key Webhook Fields Used

| Field | Used For |
|-------|---------|
| `Data.Number` | Looks up Xero invoice by invoice number |
| `Data.Status` | Gate: must equal `"Delivered"` |
| `Data.StatusDate` | Set as Xero invoice date and due date basis |

### Full Webhook Schema

See [BP-08 documentation](../flows/BP-08-TrackPOD-Xero-Factored-Invoices.md#webhook-input-interface-trackpod-delivery-event) for the complete field list.

---

## Important Notes

1. **`Number` and `Id` are both set to `TrackPOD Order Ref`** — both fields receive the same value in all blueprints

2. **Pair order creation** — Every consignment generates exactly two TrackPOD orders: one Delivery (Type 0) and one Collection (Type 1) with the same `Number`/`Id`

3. **Duplicate prevention** — Before creating, blueprints check if `TrackPOD Collection ID` or `TrackPOD Delivery ID` already exist for the `External Order ID`. If either exists, no new orders are created

4. **`Colllection Email` typo** — The Airtable field name `Colllection Email` (triple-l) must be preserved exactly in migration — changing it would break the TrackPOD email field population

5. **GoodsList is always a single item** — Quantity is always hardcoded to `1` in production

6. **`pcs` unit** — All orders use `"pcs"` as the goods unit regardless of actual goods type
