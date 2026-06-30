# Nexus Make Blueprint Index

> Source of truth: `reference/make/blueprints/`
> All implementation must achieve 100% operational parity with these blueprints.

## Blueprint Inventory

| File | Blueprint Name | Purpose | Trigger |
|------|---------------|---------|---------|
| `1 -CTNI Integration Webhooks.blueprint.json` | CTNI Integration Webhooks | Ingests Wodely webhook events for Courier To Northern Ireland merchant | Webhook (CTNI WEBHOOK, hook: 3223658) |
| `1 -Nexus Integration Webhooks.blueprint.json` | Nexus Integration Webhooks | Ingests Wodely webhook events for all non-CTNI merchants (Nexus/THDG/HomeBarn) | Webhook (Nexus Order Intake, hook: 3123705) |
| `2 -Wodely Data Refresh.blueprint.json` | Wodely Data Refresh | Polls Wodely API to enrich consignments in WAITING_FOR_WODELY_DATA state | Airtable search (scheduled) |
| `2a -CTNI Woocommerce Data Refresh.blueprint.json` | CTNI WooCommerce Data Refresh | Watches CTNI WooCommerce for new orders and updates matching Airtable records | WooCommerce Watch Orders |
| `2a -THDG Woocommerce Data Refresh.blueprint.json` | THDG WooCommerce Data Refresh | Watches THDG WooCommerce for new orders and updates matching Airtable records | WooCommerce Watch Orders |
| `3 -Wod - Wodely - AirTable - TrackPOD.blueprint.json` | Wodely → AirTable → TrackPOD | Pushes Wodely consignments that are READY_FOR_TRACKPOD into TrackPOD as delivery+collection order pairs | Airtable search (scheduled) |
| `3a -THDG - Woocommerce - AirTable - TrackPOD.blueprint.json` | THDG WooCommerce → AirTable → TrackPOD | Pushes WooCommerce consignments that are READY_FOR_TRACKPOD into TrackPOD | Airtable search (scheduled) |
| `8 - NEXUS - TRACKPOD - XERO FACTORED INVOICES.blueprint.json` | Nexus TrackPOD → Xero Factored Invoices | Receives TrackPOD delivery webhooks, authorises Xero invoices, and appends factoring export rows | Webhook (TrackPOD Delivered, hook: 3248426) |

## Lifecycle Status Flow

```
[Webhook received]
       │
       ▼
WAITING_FOR_WODELY_DATA  ← New Wodely/WooCommerce orders land here
       │
       │  (Blueprint 2: Wodely Data Refresh enriches record)
       ▼
MANUAL REVIEW             ← Requires human review before proceeding
       │
       │  (Human approves / corrects)
       ▼
PAYMENT_PENDING           ← AmountDue > 0, not yet paid
       │
       │  (Payment confirmed)
       ▼
READY_FOR_TRACKPOD        ← All data validated, ready for dispatch creation
       │
       │  (Blueprint 3 / 3a: Creates TrackPOD orders)
       ▼
READY_FOR_ROUTE           ← TrackPOD IDs stored, awaiting route assignment
       │
       │  (TrackPOD route delivered → Blueprint 8 webhook)
       ▼
[Xero invoice authorised + factoring export row appended]
```

## Airtable Base

- **Base ID:** `appWKD6dpoFTeTLUI`
- **Base Name:** Nexus Delivery Control Tower
- **Primary Table:** `tbl8AR7buODtDA20F` (Consignments)
- **Secondary Table:** `tbl4NbMeu9JZDN45j` (Factoring Customers)
- **Primary View:** `viwIgQbZOIg51OZuW`

## External Systems

| System | Purpose | Auth Method |
|--------|---------|------------|
| Wodely API | Source platform for courier task data | Basic Auth (API Key) |
| TrackPOD API | Delivery management / route optimisation | X-API-KEY header |
| WooCommerce | E-commerce order source (CTNI + THDG stores) | WooCommerce connection |
| Xero | Invoicing and accounts receivable | OAuth (Tenant: 7455859d-ac24-4466-9cd3-ed24b1b32d68) |
| Microsoft Excel (OneDrive) | Factoring export file | Microsoft connection |

## Detailed Blueprint Documentation

- [BP-01: CTNI Integration Webhooks](./BP-01-CTNI-Integration-Webhooks.md)
- [BP-02: Nexus Integration Webhooks](./BP-02-Nexus-Integration-Webhooks.md)
- [BP-03: Wodely Data Refresh](./BP-03-Wodely-Data-Refresh.md)
- [BP-04: CTNI WooCommerce Data Refresh](./BP-04-CTNI-WooCommerce-Data-Refresh.md)
- [BP-05: THDG WooCommerce Data Refresh](./BP-05-THDG-WooCommerce-Data-Refresh.md)
- [BP-06: Wodely → AirTable → TrackPOD](./BP-06-Wodely-AirTable-TrackPOD.md)
- [BP-07: THDG WooCommerce → AirTable → TrackPOD](./BP-07-THDG-WooCommerce-AirTable-TrackPOD.md)
- [BP-08: TrackPOD → Xero Factored Invoices](./BP-08-TrackPOD-Xero-Factored-Invoices.md)
