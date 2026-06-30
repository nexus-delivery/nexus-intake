# BP-08: TrackPOD → Xero Factored Invoices

**Source file:** `reference/make/blueprints/8 - NEXUS - TRACKPOD - XERO FACTORED INVOICES.blueprint.json`  
**Make scenario name:** `8 - NEXUS - TRACKPOD - XERO FACTORED INVOICES`

---

## Trigger

- **Type:** Custom Webhook (`gateway:CustomWebHook`)
- **Hook ID:** `3248426`
- **Label:** `TrackPOD Delivered`
- **Max Results:** 30

Receives a webhook from TrackPOD when an order's status changes to **Delivered**.

---

## Webhook Input Interface (TrackPOD Delivery Event)

The full TrackPOD webhook payload:

### Top-level

| Field | Type | Description |
|-------|------|-------------|
| `Event` | text | Event type (e.g., `"StatusChanged"`) |
| `Date` | text | Event date/time |

### `Data` object

| Field | Type | Description |
|-------|------|-------------|
| `Number` | text | Order reference number (matches Airtable `TrackPOD Order Ref`) |
| `Id` | text | TrackPOD internal order ID |
| `Date` | text | Order date |
| `RouteNumber` | text | Route identifier |
| `DriverLogin` | text | Driver login |
| `DriverName` | text | Driver display name |
| `ShipperId` | text | Shipper internal ID |
| `Shipper` | text | Shipper name |
| `DepotId` | text | Depot ID |
| `Depot` | text | Depot name |
| `Weight` | number | Total weight |
| `Volume` | number | Total volume |
| `Pallets` | number | Pallet count |
| `GoodsList` | array | See below |
| `Pin` | text | Delivery PIN |
| `CreateDateUtc` | text | Order creation UTC timestamp |
| `Feedback` | text | Customer feedback |
| `RouteDate` | text | Route date |
| `Type` | number | Order type (0=Delivery, 1=Pickup) |
| `ClientId` | text | Client ID |
| `Client` | text | Client name |
| `AddressId` | text | Address ID |
| `Address` | text | Delivery address |
| `AddressLat` | number | Address latitude |
| `AddressLon` | number | Address longitude |
| `AddressZone` | text | Delivery zone |
| `TimeSlotFrom` | text | Time slot start |
| `TimeSlotTo` | text | Time slot end |
| `ServiceTime` | number | Service duration (minutes) |
| `Note` | text | Delivery note |
| `ContactName` | text | Contact name |
| `Phone` | text | Contact phone |
| `Email` | text | Contact email |
| `COD` | number | Cash on delivery amount |
| `CODActual` | number | Actual COD collected |
| `StatusId` | number | Status code |
| `Status` | text | Status label (`"Delivered"`) |
| `StatusLat` | number | Status update latitude |
| `StatusLon` | number | Status update longitude |
| `DriverComment` | text | Driver comment |
| `SignatureName` | text | Signatory name |
| `HasSignaturePhoto` | boolean | Whether signature photo exists |
| `SignaturePhotos` | array | Signature photo URLs |
| `HasPhoto` | boolean | Whether delivery photo exists |
| `StatusDate` | text | Status change timestamp (used as invoice date) |
| `ArrivedDate` | text | Arrival timestamp |
| `DepartedDate` | text | Departure timestamp |
| `ReportUrl` | text | Delivery report URL |
| `Barcode` | text | Barcode |
| `Scanned` | boolean | Whether scanned |
| `FeedbackRating` | number | Feedback rating |
| `TrackKey` | text | Tracking key |
| `TrackId` | text | Tracking ID |
| `TrackLink` | text | Public tracking link |
| `ChangeDate` | text | Last change timestamp |

### `GoodsList` item

| Field | Type |
|-------|------|
| `GoodsId` | text |
| `GoodsName` | text |
| `GoodsUnit` | text |
| `Quantity` | number |
| `Cost` | number |
| `GoodsBarcode` | text |

---

## Business Rules & Flow

### Entry Filter (Module 4)

**Filter name:** `DELIVERED ORDERS ONLY`
```
{{1.Data.Status}} == "Delivered"
```

Only processes webhooks where the TrackPOD order status is exactly `"Delivered"`.

---

## Step 1: Find Xero Invoice (Module 4)

- **Xero Connection:** `8080196`
- **Tenant ID:** `7455859d-ac24-4466-9cd3-ed24b1b32d68` (Nexus Delivery Team LTD)
- **Invoice Numbers:** `{{1.Data.Number}}` (matches TrackPOD order number to Xero invoice number)
- **Limit:** 30
- **Summary Only:** false
- **Modified After:** `2026-06-14T23:00:00.000Z`
- **Created By My App:** false

Assumes a Xero DRAFT invoice was pre-created with the same reference number as the TrackPOD order.

---

## Step 2: Authorise Xero Invoice (Module 3)

**Filter:** `DRAFT INVOICE FOUND ONLY`
```
{{4.InvoiceID}} exists
AND {{4.Status}} == "DRAFT"
```

Only authorises invoices that exist AND are currently in DRAFT status.

### Xero Update Invoice

| Xero Field | Value | Notes |
|-----------|-------|-------|
| `InvoiceID` | `{{4.InvoiceID}}` | From search result |
| `Date` | `{{1.Data.StatusDate}}` | Delivery confirmed date |
| `Status` | `AUTHORISED` | Promotes from DRAFT |
| `DueDate` | `{{addDays(1.Data.StatusDate, 28)}}` | 28-day payment terms |
| `SentToContact` | `true` | Marks as sent |
| **Tenant ID** | `7455859d-ac24-4466-9cd3-ed24b1b32d68` | Nexus Delivery Team LTD |

---

## Step 3: Look Up Factoring Customer (Module 9)

- **Base:** `appWKD6dpoFTeTLUI`
- **Table:** `tbl4NbMeu9JZDN45j` (Factoring Customers)
- **Formula:** `{Customer Name} = "{{3.Contact.Name}}"`
- **Max Records:** 10

Looks up the customer from the authorised Xero invoice contact name.

**Factoring Customers table fields used:**
- `Customer Name`
- `Factor Prefix`
- `Company`
- `Branding Theme`
- `Active` (`fldD9LMf8DoWklfPP`)

---

## Step 4: Router (Module 10) — Customer Exists vs New Customer

### Route A — Customer Exists (Module 8, filter: `Customer Exists`)

**Filter:** `{{3.Contact.Name}}` exists (invoice contact name is present)

**Module 8 — Microsoft Excel: Add Table Row**

- **File:** `/E0002 Upload copy copy.xlsx`
- **Worksheet:** `in`
- **Table:** `Table3`
- **Connection:** `2` (Microsoft)

| Column | Value | Description |
|--------|-------|-------------|
| `0` (PRI01) | `{{9.Factor Prefix}}` | Factoring customer prefix |
| `1` (Invoice Number) | `{{3.InvoiceNumber}}` | Xero invoice number |
| `2` (Date) | `{{formatDate(3.Date, "DD-MM-YYYY")}}` | Invoice date formatted DD-MM-YYYY |
| `3` (Amount) | `{{3.LineItems}}` | Invoice line items |
| `4` (Invoice) | `{{3.InvoiceNumber}}` | Xero invoice number (repeated) |

### Route B — New Customer (Module 11, filter: `Customer Does Not Exist`)

**Filter:** `{{3.Contact.Name}}` does NOT exist

**Module 11 — Airtable Create Record** in `tbl4NbMeu9JZDN45j` (Factoring Customers):

| Field ID | Field Name | Value |
|----------|-----------|-------|
| `fldD9LMf8DoWklfPP` | Active | `true` |
| `fldG9BTmOsms4tGB6` | Customer Name | `{{3.Contact.Name}}` |
| `fldYsAG6XtqaKEG06` | Company | `{{3.Contact.Name}}` |
| `fldvt7jFoKFEyjTFT` | Branding Theme | `{{4.BrandingThemeID}}` |

**Module 13 — Microsoft Excel: Add Table Row** (same structure as Route A but uses new customer's Factor Prefix):

| Column | Value |
|--------|-------|
| `0` | `{{11.Factor Prefix}}` |
| `1` | `{{3.InvoiceNumber}}` |
| `2` | `{{formatDate(3.Date, "DD-MM-YYYY")}}` |
| `3` | `{{3.LineItems}}` |
| `4` | `{{3.InvoiceNumber}}` |

---

## Outputs

1. Xero DRAFT invoice promoted to **AUTHORISED** with delivery date and 28-day due date
2. Excel factoring file (`/E0002 Upload copy copy.xlsx`, sheet `in`, table `Table3`) gets a new row with invoice data
3. If customer is new: created in Airtable `Factoring Customers` table

---

## Status Changes

No Airtable Consignments status change in this blueprint. The consignment is already in `READY_FOR_ROUTE` status. This blueprint operates on Xero and the Factoring Customers table.

---

## Airtable Tables Used

| Table ID | Table Name | Operations |
|----------|-----------|-----------|
| `tbl4NbMeu9JZDN45j` | Factoring Customers | Search, Create (if new) |

---

## HTTP Endpoints

None directly (uses Make native Xero and Microsoft Excel connectors).

---

## Xero Mappings

### Search Invoice

| Xero API Parameter | Value | Source |
|-------------------|-------|--------|
| `InvoiceNumbers` | `{{1.Data.Number}}` | TrackPOD order number |
| `TenantId` | `7455859d-ac24-4466-9cd3-ed24b1b32d68` | Hardcoded (Nexus Delivery Team LTD) |
| `Limit` | `30` | |
| `SummaryOnly` | `false` | Full invoice data needed |
| `ModifiedAfter` | `2026-06-14T23:00:00.000Z` | Filters to recent invoices |

### Update Invoice

| Xero API Field | Value | Source |
|---------------|-------|--------|
| `InvoiceID` | `{{4.InvoiceID}}` | From search result |
| `Date` | `{{1.Data.StatusDate}}` | TrackPOD delivery confirmation date |
| `Status` | `"AUTHORISED"` | Hardcoded |
| `DueDate` | `StatusDate + 28 days` | 28-day payment terms |
| `SentToContact` | `true` | Hardcoded |

### Xero Data Read Back for Factoring

| Xero Field | Used For |
|-----------|---------|
| `3.Contact.Name` | Customer lookup key in Airtable Factoring Customers |
| `3.InvoiceNumber` | Factoring export row |
| `3.Date` | Factoring export row (formatted DD-MM-YYYY) |
| `3.LineItems` | Factoring export row amount |
| `4.BrandingThemeID` | New Factoring Customer record |

---

## TrackPOD Mappings

| TrackPOD Field | Used For |
|---------------|---------|
| `Data.Number` | Xero invoice search key |
| `Data.Status` | Entry gate: must be `"Delivered"` |
| `Data.StatusDate` | Xero invoice date + due date basis |

---

## Error Handling

- `DELIVERED ORDERS ONLY` filter prevents non-delivery events from being processed
- `DRAFT INVOICE FOUND ONLY` filter prevents double-authorisation of already-processed invoices
- No explicit error handler modules
- If TrackPOD fires multiple times for the same order, the second attempt will find the invoice is no longer DRAFT and will skip the update — safe idempotency

---

## Required Supabase Tables (Migration)

| Table | Purpose |
|-------|---------|
| `factoring_customers` | Equivalent of `tbl4NbMeu9JZDN45j` |

### `factoring_customers` columns

| Column | Type | Maps to |
|--------|------|--------|
| `id` | uuid | Airtable record ID |
| `customer_name` | text | `fldG9BTmOsms4tGB6` |
| `company` | text | `fldYsAG6XtqaKEG06` |
| `factor_prefix` | text | Factor Prefix field |
| `branding_theme` | text | `fldvt7jFoKFEyjTFT` |
| `active` | boolean | `fldD9LMf8DoWklfPP` |

---

## Required API Endpoints (Migration)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/webhooks/trackpod/delivered` | POST | Receives TrackPOD delivery confirmation events |

The endpoint must:
1. Validate `Data.Status == "Delivered"`
2. Search Xero for invoice matching `Data.Number`
3. If DRAFT invoice found: update to AUTHORISED, set Date=StatusDate, DueDate=StatusDate+28days
4. Look up `factoring_customers` by `customer_name = invoice.Contact.Name`
5. If not found: create new factoring customer record
6. Append row to factoring export (Excel file or equivalent export table)

### Factoring Export Table

As an alternative to Excel file append, create a `factoring_export` table:

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | |
| `factor_prefix` | text | From factoring customer |
| `invoice_number` | text | Xero invoice number |
| `invoice_date` | date | DD-MM-YYYY |
| `amount` | jsonb | Line items |
| `created_at` | timestamptz | |

---

## UI Required to Support This Workflow

- Factoring customer management list
- Factoring export view (invoice rows by customer)
- Invoice authorisation status indicator on consignment
- TrackPOD delivery event log
