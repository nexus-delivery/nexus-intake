# Xero API Reference

Extracted from production Make blueprints (BP-08).

---

## Connection

| Property | Value |
|----------|-------|
| Make Connection ID | `8080196` |
| Xero Tenant ID | `7455859d-ac24-4466-9cd3-ed24b1b32d68` |
| Xero Organisation | **Nexus Delivery Team LTD** |
| Auth Method | OAuth 2.0 (via Make Xero connector) |

---

## Operations Used

### 1. Search Invoice (`xero:SearchInvoice`)

**Used in:** BP-08, Module 4

**Purpose:** Find an existing invoice in Xero by invoice number, so it can be authorised upon delivery confirmation.

#### Parameters

| Parameter | Value | Notes |
|-----------|-------|-------|
| Tenant ID | `7455859d-ac24-4466-9cd3-ed24b1b32d68` | Nexus Delivery Team LTD |
| `InvoiceNumbers` | `{{1.Data.Number}}` | TrackPOD order number used as invoice number |
| `Limit` | `30` | Max results |
| `SummaryOnly` | `false` | Full invoice data required |
| `ModifiedAfter` | `2026-06-14T23:00:00.000Z` | Limits to recently modified invoices |
| `CreatedByMyApp` | `false` | |

#### Response Fields Used

| Xero Field | Used For |
|-----------|---------|
| `InvoiceID` | Target for update; checked for existence |
| `Status` | Must be `"DRAFT"` to proceed with authorisation |
| `InvoiceNumber` | Written to factoring export |
| `Date` | Written to factoring export (formatted DD-MM-YYYY) |
| `LineItems` | Written to factoring export as amount |
| `Contact.Name` | Lookup key in Airtable Factoring Customers table |
| `BrandingThemeID` | Stored on new Factoring Customer records |

---

### 2. Update Invoice (`xero:UpdateInvoice`)

**Used in:** BP-08, Module 3

**Purpose:** Promote a DRAFT invoice to AUTHORISED status when delivery is confirmed, and set payment due date.

#### Filter (applied before update)

```
{{4.InvoiceID}} exists
AND {{4.Status}} == "DRAFT"
```

Only DRAFT invoices are updated. Already-authorised invoices are skipped (idempotent behaviour).

#### Fields Updated

| Xero Field | Value | Source |
|-----------|-------|--------|
| `InvoiceID` | `{{4.InvoiceID}}` | From search result |
| `Date` | `{{1.Data.StatusDate}}` | TrackPOD delivery date |
| `Status` | `"AUTHORISED"` | Hardcoded |
| `DueDate` | `{{addDays(1.Data.StatusDate, 28)}}` | 28-day payment terms |
| `SentToContact` | `true` | Marks invoice as sent |
| Tenant ID | `7455859d-ac24-4466-9cd3-ed24b1b32d68` | Nexus Delivery Team LTD |

---

## Invoice Lifecycle in Nexus

```
[Order dispatched]
      │
      │  (Manual/external process creates DRAFT invoice in Xero)
      │  Invoice Number = TrackPOD Order Ref
      ▼
XERO: DRAFT
      │
      │  (TrackPOD fires Delivered webhook → BP-08)
      ▼
XERO: AUTHORISED
      │  Date = StatusDate
      │  DueDate = StatusDate + 28 days
      │  SentToContact = true
      ▼
[Factoring export row appended]
```

---

## Payment Terms

**28 days net** from delivery confirmation date.

Formula: `DueDate = Data.StatusDate + 28 days`

---

## Factoring Export

After invoice authorisation, BP-08 writes a row to the factoring spreadsheet.

### Excel File

- **Path:** `/E0002 Upload copy copy.xlsx`
- **Worksheet:** `in`
- **Table:** `Table3`
- **Microsoft Connection ID:** `2`

### Row Structure

| Column Index | Column Label | Value | Source |
|-------------|-------------|-------|--------|
| `0` | PRI01 | Factoring customer prefix | Airtable `Factoring Customers.Factor Prefix` |
| `1` | Invoice Number | Xero invoice number | `3.InvoiceNumber` |
| `2` | Date | Invoice date | `formatDate(3.Date, "DD-MM-YYYY")` |
| `3` | Amount | Line items | `3.LineItems` |
| `4` | Invoice | Xero invoice number (repeat) | `3.InvoiceNumber` |

---

## Xero Invoice → Airtable Factoring Customer Mapping

When BP-08 receives a delivered webhook, the Xero invoice's `Contact.Name` is used to look up or create a Factoring Customer record in Airtable:

| Xero Field | Airtable Field | Action |
|-----------|---------------|--------|
| `Contact.Name` | `Customer Name` (`fldG9BTmOsms4tGB6`) | Lookup key; also written on create |
| `Contact.Name` | `Company` (`fldYsAG6XtqaKEG06`) | Written on create (same value) |
| `BrandingThemeID` | `Branding Theme` (`fldvt7jFoKFEyjTFT`) | Written on create |
| — | `Active` (`fldD9LMf8DoWklfPP`) | Set to `true` on create |

---

## Important Notes

1. **Pre-requisite:** A DRAFT Xero invoice must exist before TrackPOD delivers the order. This pre-creation is handled outside the blueprints (manual or a separate undocumented scenario).

2. **Invoice number = TrackPOD Order Ref** — The Xero invoice number must exactly match the `TrackPOD Order Ref` value stored in Airtable and sent to TrackPOD as the order `Number`.

3. **Idempotency** — The DRAFT status filter means re-triggering is safe; already-authorised invoices are skipped.

4. **Factoring customer auto-creation** — If no Factoring Customer record exists for the Xero contact, one is automatically created. However, the `Factor Prefix` field is not populated on creation (it defaults to empty/auto-computed), which means the factoring export row for a new customer will have an empty prefix until manually set.

5. **Xero API version** — Make's Xero connector uses the Xero Accounting API v2.

---

## Required API Endpoints (Migration)

The migration must implement equivalent Xero operations. These can use the Xero Accounting API directly:

### Search Invoice

```
GET https://api.xero.com/api.xro/2.0/Invoices
Headers:
  Authorization: Bearer {access_token}
  Xero-Tenant-Id: 7455859d-ac24-4466-9cd3-ed24b1b32d68
Query params:
  InvoiceNumbers: {trackpod_order_number}
  ModifiedAfter: {date}
```

### Update Invoice

```
POST https://api.xero.com/api.xro/2.0/Invoices/{InvoiceID}
Headers:
  Authorization: Bearer {access_token}
  Xero-Tenant-Id: 7455859d-ac24-4466-9cd3-ed24b1b32d68
Body:
{
  "Date": "{StatusDate}",
  "Status": "AUTHORISED",
  "DueDate": "{StatusDate + 28 days}",
  "SentToContact": true
}
```
