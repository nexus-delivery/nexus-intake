# Airtable Schema Reference

**Base ID:** `appWKD6dpoFTeTLUI`  
**Base Name:** Nexus Delivery Control Tower

Extracted from production Make blueprints. These are the canonical field definitions for migration.

---

## Connections Used in Blueprints

| Connection ID | Label | Used In |
|--------------|-------|---------|
| `7829322` | Nexus OAuth | BP-03, BP-06, BP-07 (trigger search) |
| `7774187` | My Airtable OAuth | BP-01, BP-02, BP-04, BP-05 (operations) |

---

## Table: Consignments

**Table ID:** `tbl8AR7buODtDA20F`  
**Primary View:** `viwIgQbZOIg51OZuW`

### Field Reference

All field IDs confirmed from blueprint mapper objects. Field names confirmed from formula references `{Field Name}` in the same blueprints.

| Field ID | Field Name | Type | Allowed Values / Notes |
|----------|-----------|------|----------------------|
| `fld1k9RR1yvLacomO` | Notes / Description | text | Free text. Used in Nexus Webhooks for `TaskDesc` |
| `fld3WjgVcG3dUhgq6` | Collection Required | boolean | `true` / `false` |
| `fld48twcKqfsO0cTF` | Delivery Window End | text/datetime | Mapped from Wodely `BeforeDateTime` |
| `fld4L7kMHJNVHgefK` | Collection Email | text | Requester/collection contact email |
| `fld5hdGaWa9s55Uun` | Payment Status | text | `PAID`, `PENDING`, `ACCOUNT` |
| `fldDLeMi5ujW4crax` | External Order ID | text | WooCommerce numeric order ID or Wodely ExternalKey |
| `fldFLwCFNOwaQaFxy` | TrackPOD Delivery ID | text | Location URL from TrackPOD POST response header |
| `fldGkwgQBiap97tnY` | Order Status | text | e.g., `Wodely Processed` |
| `fldH1hLzPuh5fAAji` | Delivery Address | text | Full delivery address string |
| `fldHKxQbHejwNuoEW` | Consignment Ref | text | Internal reference; initially same as External Order ID |
| `fldIJ5pHt7qCQAmof` | Delivery Window Start | text/datetime | Mapped from Wodely `AfterDateTime` |
| `fldIyw7wJlu9ZWBgx` | Delivery Email | text | Recipient/delivery contact email |
| `fldJqfOfgl6OmcfHy` | Amount Due | number | COD or outstanding balance |
| `fldQBiULOUiy8J1C8` | Collection Address | text | Full collection address string |
| `fldSe1LMbZmiRaoVl` | Collection Phone | text | Collection contact phone |
| `fldTRhwWr9XULffZd` | Task Description | text | Goods/service description for TrackPOD |
| `fldZos9QwXEL0WLZW` | TrackPOD Collection ID | text | Location URL from TrackPOD POST response header |
| `fldcN1B02cmiMXcr2` | Account Customer | text | `Yes` when HomeBarn account order |
| `fldeG3di3uuyZpvde` | Collection Email (alt) | text | Duplicate/alternate collection email field |
| `fldfeEsEahIpD7JFR` | Sales Channel | text | `Courier To Northern Ireland`, `The Home Delivery Guys`, `Nexus`, `Account Customer` |
| `fldg97G2YvXyjKYsh` | Delivery Fee | number | Fee charged to merchant |
| `fldhmXx9DovPahJgF` | Payment Type | text | `PREPAID`, `ACCOUNT` |
| `fldiO2q07QKMioACb` | Wodely File GUID | text | File attachment GUID from Wodely taskFiles API |
| `fldio46Yi9YPkqWgn` | Merchant Name | text | Merchant/channel display name |
| `fldjyEDCSWuNIGkmw` | Source System | text | `WooCommerce`, `Wodely` |
| `fldkKYFSk1mv2jcfJ` | Delivery Name | text | Recipient name (delivery contact) |
| `fldls4Z4beYLEE4dO` | Notes (alt) | text | Secondary task description field (CTNI WooCommerce) |
| `fldrF9m5gZb5XIVy7` | Collection Name | text | Requester/collection contact name |
| `fldt7MgFBgq3cE8Ri` | Lifecycle Status | text | See status values below |
| `fldvpbEd7fk3C8rpP` | Wodely Collection GUID | text | Wodely task GUID for collection/pickup task |
| `fldwxzXAHhGQGQr12` | Delivery Phone | text | Recipient/delivery contact phone |
| `fldxPhpkMGJVcdmgF` | Wodely GUID | text | Wodely task GUID for delivery task |

### Additional Fields (referenced in HTTP bodies, not mapper records)

These field names are referenced as `{{1.`Field Name`}}` in TrackPOD HTTP request bodies, confirming their existence in the Consignments table:

| Field Name | Used In | Notes |
|-----------|--------|-------|
| `TrackPOD Order Ref` | BP-06, BP-07 | Unique order reference sent to TrackPOD as `Number` and `Id` |
| `Requested Delivery Date` | BP-06 | Preferred delivery date (date field) |
| `Expected Collection Date` | BP-06 | Fallback delivery date if no requested date |
| `Shipper Name` | BP-06, BP-07 | Shipper name field on TrackPOD order |
| `TrackPOD Goods` | BP-06, BP-07 | Goods description for TrackPOD `GoodsName` |
| `Colllection Email` | BP-06, BP-07 | **Note: triple-l typo** — production field name is `Colllection Email` |
| `TRACKPOD PHOTO & NOTE` | BP-06 | Photo/note instruction for TrackPOD collection GoodsList Note |
| `Collection Phone` | BP-06, BP-07 | Used in TrackPOD collection body |
| `Delivery Phone` | BP-06, BP-07 | Used in TrackPOD delivery body |

### Lifecycle Status Values

| Value | Description | Set By |
|-------|-------------|--------|
| `WAITING_FOR_WODELY_DATA` | Order received, awaiting Wodely enrichment | BP-01, BP-02 |
| `MANUAL REVIEW` | Wodely data fetched, requires human review | BP-03 |
| `PAYMENT_PENDING` | Delivery found, amount due > 0 | BP-03 |
| `READY_FOR_TRACKPOD` | Approved and payment confirmed | BP-04, BP-05 |
| `READY_FOR_ROUTE` | TrackPOD orders created | BP-06, BP-07 |

### Payment Status Values

| Value | Description |
|-------|-------------|
| `PAID` | Payment confirmed |
| `PENDING` | Payment not yet confirmed |
| `ACCOUNT` | Account customer (no upfront payment) |

### Payment Type Values

| Value | Description |
|-------|-------------|
| `PREPAID` | Pre-paid by customer |
| `ACCOUNT` | Billed to account |

### Source System Values

| Value | Description |
|-------|-------------|
| `WooCommerce` | Order originated from WooCommerce store |
| `Wodely` | Order originated from Wodely platform |

### Sales Channel Values

| Value | Description |
|-------|-------------|
| `Courier To Northern Ireland` | CTNI merchant |
| `The Home Delivery Guys` | THDG merchant |
| `Nexus` | Direct Nexus orders |
| `Account Customer` | Account billing customer (HomeBarn) |

---

## Table: Factoring Customers

**Table ID:** `tbl4NbMeu9JZDN45j`  
**Used In:** BP-08

| Field ID | Field Name | Type | Notes |
|----------|-----------|------|-------|
| `fldD9LMf8DoWklfPP` | Active | boolean | `true` when customer is active |
| `fldG9BTmOsms4tGB6` | Customer Name | text | Xero contact name — lookup key |
| `fldYsAG6XtqaKEG06` | Company | text | Company name (initially same as Customer Name) |
| `fldvt7jFoKFEyjTFT` | Branding Theme | text | Xero Branding Theme ID |
| *(auto-computed)* | Factor Prefix | text | Used in factoring export rows (Column 0) |

Search formula: `{Customer Name} = "{{Xero Contact Name}}"`

---

## Views Used

| View ID | Table | Used In | Purpose |
|---------|-------|---------|---------|
| `viwIgQbZOIg51OZuW` | Consignments | BP-03, BP-06 | Filtered view scoping scheduled runs |

---

## Formula Index

All Airtable search formulas used across blueprints:

### Consignments table

```
# BP-01 CTNI / BP-02 Nexus — find by ExternalKey
{External Order ID}="{{ExternalKey}}"
{External Order ID}='{{ExternalKey}}'

# BP-03 — Wodely records needing enrichment
AND(
  {Source System}="Wodely",
  {Lifecycle Status}="WAITING_FOR_WODELY_DATA",
  {External Order ID}!=""
)

# BP-04 — CTNI WooCommerce match
AND(
  {External Order ID}="{{order.id}}",
  {Sales Channel}="Courier To Northern Ireland"
)

# BP-05 — THDG WooCommerce match
AND(
  {Source System} = "WooCommerce",
  {External Order ID} = "{{order.id}}"
)

# BP-06 — Wodely records ready for TrackPOD
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

# BP-06/07 — duplicate-check: already has TrackPOD IDs
AND(
  {External Order ID} = "{{External Order ID}}",
  OR(
    {TrackPOD Collection ID} != "",
    {TrackPOD Delivery ID} != ""
  )
)

# BP-07 — WooCommerce records ready for TrackPOD
AND(
  {Source System}="WooCommerce",
  {Lifecycle Status}="READY_FOR_TRACKPOD",
  {TrackPOD Delivery ID}=""
)
```

### Factoring Customers table

```
# BP-08 — find customer by Xero contact name
{Customer Name} = "{{Xero Contact Name}}"
```
