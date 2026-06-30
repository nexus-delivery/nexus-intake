# Nexus Field Mapping Matrix

Complete cross-reference of all field IDs, field names, source systems, and Supabase column mappings.

Derived from production Make blueprints. This is the authoritative reference for migration parity.

---

## Consignments Table (`tbl8AR7buODtDA20F`)

### Core Identification

| Airtable Field ID | Airtable Field Name | Supabase Column | Type | Notes |
|-------------------|--------------------|-----------------|----- |-------|
| *(record ID)* | *(Airtable ID)* | `id` | uuid | Auto-generated |
| `fldDLeMi5ujW4crax` | External Order ID | `external_order_id` | text | WooCommerce order ID (numeric) or Wodely ExternalKey |
| `fldHKxQbHejwNuoEW` | Consignment Ref | `consignment_ref` | text | Internal Nexus reference; starts as External Order ID |
| `fldt7MgFBgq3cE8Ri` | Lifecycle Status | `lifecycle_status` | text | WAITING_FOR_WODELY_DATA → MANUAL REVIEW → READY_FOR_TRACKPOD → READY_FOR_ROUTE |

### Source & Channel

| Airtable Field ID | Airtable Field Name | Supabase Column | Type | Allowed Values |
|-------------------|--------------------|-----------------|----- |----------------|
| `fldjyEDCSWuNIGkmw` | Source System | `source_system` | text | `WooCommerce`, `Wodely` |
| `fldfeEsEahIpD7JFR` | Sales Channel | `sales_channel` | text | `Courier To Northern Ireland`, `The Home Delivery Guys`, `Nexus`, `Account Customer` |
| `fldio46Yi9YPkqWgn` | Merchant Name | `merchant_name` | text | Free text merchant display name |

### Payment

| Airtable Field ID | Airtable Field Name | Supabase Column | Type | Allowed Values |
|-------------------|--------------------|-----------------|----- |----------------|
| `fld5hdGaWa9s55Uun` | Payment Status | `payment_status` | text | `PAID`, `PENDING`, `ACCOUNT` |
| `fldhmXx9DovPahJgF` | Payment Type | `payment_type` | text | `PREPAID`, `ACCOUNT` |
| `fldJqfOfgl6OmcfHy` | Amount Due | `amount_due` | numeric | COD or outstanding balance |
| `fldg97G2YvXyjKYsh` | Delivery Fee | `delivery_fee` | numeric | Fee charged to merchant |
| `fldGkwgQBiap97tnY` | Order Status | `order_status` | text | e.g., `Wodely Processed` |

### Collection Contact

| Airtable Field ID | Airtable Field Name | Supabase Column | Type | Source |
|-------------------|--------------------|-----------------|----- |--------|
| `fld3WjgVcG3dUhgq6` | Collection Required | `collection_required` | boolean | Set true for all consignments |
| `fldrF9m5gZb5XIVy7` | Collection Name | `collection_name` | text | Wodely: `requesterName`; WC: `RequesterName` |
| `fld4L7kMHJNVHgefK` | Collection Email | `collection_email` | text | Wodely: `requesterEmail`; WC: `RequesterEmail` |
| `fldeG3di3uuyZpvde` | Collection Email (alt) | `collection_email_alt` | text | Duplicate field — same value as collection_email |
| `fldSe1LMbZmiRaoVl` | Collection Phone | `collection_phone` | text | Wodely: `requesterPhone`; WC: `RequesterPhone` |
| `fldQBiULOUiy8J1C8` | Collection Address | `collection_address` | text | Wodely: `dispatchAddress`; WC: `DispatchAddress` |

### Delivery Contact

| Airtable Field ID | Airtable Field Name | Supabase Column | Type | Source |
|-------------------|--------------------|-----------------|----- |--------|
| `fldkKYFSk1mv2jcfJ` | Delivery Name | `delivery_name` | text | Wodely: `recipientName`; WC: `RecipientName` |
| `fldIyw7wJlu9ZWBgx` | Delivery Email | `delivery_email` | text | Wodely: `recipientEmail`; WC: `RecipientEmail` |
| `fldwxzXAHhGQGQr12` | Delivery Phone | `delivery_phone` | text | Wodely: `recipientPhone`; WC: `RecipientPhone` |
| `fldH1hLzPuh5fAAji` | Delivery Address | `delivery_address` | text | Wodely: `destinationAddress`; WC: `DestinationAddress` |

### Order Details

| Airtable Field ID | Airtable Field Name | Supabase Column | Type | Notes |
|-------------------|--------------------|-----------------|----- |-------|
| `fldTRhwWr9XULffZd` | Task Description | `task_description` | text | Goods/service description; used in TrackPOD GoodsName |
| `fld1k9RR1yvLacomO` | Notes / Description | `notes` | text | Secondary description field (Nexus Webhooks) |
| `fldls4Z4beYLEE4dO` | Notes (alt) | `notes_alt` | text | Third description field (CTNI WooCommerce) |
| `fldIJ5pHt7qCQAmof` | Delivery Window Start | `delivery_window_start` | timestamptz | Wodely `AfterDateTime` |
| `fld48twcKqfsO0cTF` | Delivery Window End | `delivery_window_end` | timestamptz | Wodely `BeforeDateTime` |
| `fldcN1B02cmiMXcr2` | Account Customer | `account_customer` | text | `Yes` for HomeBarn account orders |

### TrackPOD Integration

| Airtable Field ID | Airtable Field Name | Supabase Column | Type | Notes |
|-------------------|--------------------|-----------------|----- |-------|
| *(no field ID — formula/text field)* | TrackPOD Order Ref | `trackpod_order_ref` | text | Sent as TrackPOD `Number` and `Id` |
| `fldFLwCFNOwaQaFxy` | TrackPOD Delivery ID | `trackpod_delivery_id` | text | `Location` header from TrackPOD delivery POST |
| `fldZos9QwXEL0WLZW` | TrackPOD Collection ID | `trackpod_collection_id` | text | `Location` header from TrackPOD collection POST |
| *(no field ID)* | TrackPOD Goods | `trackpod_goods` | text | GoodsName for both TrackPOD orders |
| *(no field ID)* | Shipper Name | `shipper_name` | text | TrackPOD `Shipper` field |
| *(no field ID)* | Requested Delivery Date | `requested_delivery_date` | date | TrackPOD delivery `Date` (primary) |
| *(no field ID)* | Expected Collection Date | `expected_collection_date` | date | TrackPOD delivery `Date` (fallback) |
| *(no field ID)* | Colllection Email | `colllection_email` | text | **Triple-l typo is intentional** — TrackPOD collection `Email` |
| *(no field ID)* | TRACKPOD PHOTO & NOTE | `trackpod_photo_note` | text | TrackPOD collection GoodsList[0].Note (Wodely only) |

### Wodely Integration

| Airtable Field ID | Airtable Field Name | Supabase Column | Type | Notes |
|-------------------|--------------------|-----------------|----- |-------|
| `fldvpbEd7fk3C8rpP` | Wodely Collection GUID | `wodely_collection_guid` | text | Wodely task GUID for pickup task |
| `fldxPhpkMGJVcdmgF` | Wodely GUID | `wodely_guid` | text | Wodely task GUID for delivery task |
| `fldiO2q07QKMioACb` | Wodely File GUID | `wodely_file_guid` | text | File attachment GUID from Wodely taskFiles API |

---

## Factoring Customers Table (`tbl4NbMeu9JZDN45j`)

| Airtable Field ID | Airtable Field Name | Supabase Column | Type | Notes |
|-------------------|--------------------|-----------------|----- |-------|
| `fldD9LMf8DoWklfPP` | Active | `active` | boolean | |
| `fldG9BTmOsms4tGB6` | Customer Name | `customer_name` | text | Xero contact name — lookup key |
| `fldYsAG6XtqaKEG06` | Company | `company` | text | Same as Customer Name on create |
| `fldvt7jFoKFEyjTFT` | Branding Theme | `branding_theme` | text | Xero Branding Theme ID |
| *(computed)* | Factor Prefix | `factor_prefix` | text | Used in factoring export Column 0 |

---

## Wodely API → Airtable Field Mapping

Fields received from Wodely `/v2/tasks/search` response:

| Wodely Field | Airtable Field | Supabase Column |
|-------------|---------------|-----------------|
| `typeDesc` | *(routing only)* | — |
| `statusDesc` | *(routing only)* | — |
| `guid` (pickup) | Wodely Collection GUID | `wodely_collection_guid` |
| `guid` (delivery) | Wodely GUID | `wodely_guid` |
| `dispatchAddress` | Collection Address | `collection_address` |
| `requesterName` | Collection Name | `collection_name` |
| `requesterEmail` | Collection Email + alt | `collection_email` |
| `requesterPhone` | Collection Phone | `collection_phone` |
| `destinationAddress` | Delivery Address | `delivery_address` |
| `recipientName` | Delivery Name | `delivery_name` |
| `recipientEmail` | Delivery Email | `delivery_email` |
| `recipientPhone` | Delivery Phone | `delivery_phone` |
| `taskDesc` | Task Description | `task_description` |
| `deliveryFee` | Delivery Fee | `delivery_fee` |
| `merchantName` | Merchant Name | `merchant_name` |
| `amountDue` | Amount Due | `amount_due` |

---

## Wodely Webhook → Airtable Field Mapping

Fields received from Wodely webhook (BP-01, BP-02):

| Wodely Webhook Field | Airtable Field | Supabase Column |
|---------------------|---------------|-----------------|
| `ExternalKey` | External Order ID | `external_order_id` |
| `ExternalKey` (stripped) | Consignment Ref | `consignment_ref` |
| `DispatchAddress` | Collection Address | `collection_address` |
| `RequesterName` | Collection Name | `collection_name` |
| `RequesterEmail` | Collection Email | `collection_email` |
| `RequesterPhone` | Collection Phone | `collection_phone` |
| `DestinationAddress` | Delivery Address | `delivery_address` |
| `RecipientName` | Delivery Name | `delivery_name` |
| `RecipientEmail` | Delivery Email | `delivery_email` |
| `RecipientPhone` | Delivery Phone | `delivery_phone` |
| `TaskDesc` | Task Description | `task_description` |
| `AmountDue` | Amount Due | `amount_due` |
| `DeliveryFee` | Delivery Fee | `delivery_fee` |
| `MerchantName` | Merchant Name | `merchant_name` |
| `MerchantId` | *(routing only)* | — |
| `AfterDateTime` | Delivery Window Start | `delivery_window_start` |
| `BeforeDateTime` | Delivery Window End | `delivery_window_end` |

---

## WooCommerce → Airtable Field Mapping

| WooCommerce Field | Airtable Field | Supabase Column |
|------------------|---------------|-----------------|
| `id` | External Order ID | `external_order_id` |
| `lineItems[].name` | Task Description | `task_description` |

---

## TrackPOD Response → Airtable Field Mapping

| TrackPOD Response | Airtable Field ID | Airtable Field Name | Supabase Column |
|-------------------|-------------------|--------------------|-----------------| 
| `headers.location` (delivery POST) | `fldFLwCFNOwaQaFxy` | TrackPOD Delivery ID | `trackpod_delivery_id` |
| `headers.location` (collection POST) | `fldZos9QwXEL0WLZW` | TrackPOD Collection ID | `trackpod_collection_id` |

---

## Lifecycle Status Transition Reference

| Status Value | Airtable Field ID | Supabase Column | Set By Blueprint |
|-------------|-------------------|-----------------|-----------------|
| `WAITING_FOR_WODELY_DATA` | `fldt7MgFBgq3cE8Ri` | `lifecycle_status` | BP-01, BP-02 |
| `MANUAL REVIEW` | `fldt7MgFBgq3cE8Ri` | `lifecycle_status` | BP-03 |
| `PAYMENT_PENDING` | `fldt7MgFBgq3cE8Ri` | `lifecycle_status` | BP-03 |
| `READY_FOR_TRACKPOD` | `fldt7MgFBgq3cE8Ri` | `lifecycle_status` | BP-04, BP-05 |
| `READY_FOR_ROUTE` | `fldt7MgFBgq3cE8Ri` | `lifecycle_status` | BP-06, BP-07 |
