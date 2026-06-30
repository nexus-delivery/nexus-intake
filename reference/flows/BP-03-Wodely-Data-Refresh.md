# BP-03: Wodely Data Refresh

**Source file:** `reference/make/blueprints/2 -Wodely Data Refresh.blueprint.json`  
**Make scenario name:** `2 -Wodely Data Refresh`

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
  {Lifecycle Status}="WAITING_FOR_WODELY_DATA",
  {External Order ID}!=""
)
```

- **Sort:** Created Time (Ascending) — oldest first
- **Max Records:** 50

Picks up any consignment from Wodely that has been created but not yet enriched with full task data.

---

## Inputs

From the Airtable Consignments record (Module 1):

- `id` — Airtable record ID
- `External Order ID` — Used as `ExternalKey` in Wodely search
- `Delivery Postcode` — Included in Accept header (cosmetic note in blueprint)
- `Wodely Collection GUID` — Used to fetch file attachments

---

## Step 1: Wodely API Search (Module 2)

**Filter on Module 2:** `{{1.id}}` exists (record was found)

### HTTP Request

| Property | Value |
|----------|-------|
| URL | `https://api.wodely.com/v2/tasks/search` |
| Method | `POST` |
| Content-Type | `application/json` |
| Authorization | `Basic pk-96ec2ff8-6-593808c8-5b99-47a8-b652-a36780a8456a` |
| Accept | `application/json` |

### Request Body

```json
{
  "StartDateTime": "{{formatDate(addDays(now, -30), \"YYYY-MM-DDTHH:mm:ss\")}}",
  "EndDateTime": "{{formatDate(addDays(now, 90), \"YYYY-MM-DDTHH:mm:ss\")}}",
  "ExternalKey": "{{1.External Order ID}}"
}
```

- Searches ±30 days back and 90 days forward from current date
- Matches on `ExternalKey` (the order reference stored in Airtable)

### Response

```
data.data[]  — array of Wodely task objects
```

Each task object contains:
- `typeDesc` — `"Pickup"` or `"Delivery"`
- `statusDesc` — e.g., `"Processed"`, `"Unassigned"`
- `amountDue` — numeric
- `guid` — Wodely task GUID
- `dispatchAddress`
- `requesterName`
- `requesterEmail`
- `requesterPhone`
- `destinationAddress`
- `recipientName`
- `recipientEmail`
- `recipientPhone`
- `taskDesc`
- `deliveryFee`
- `merchantName`

---

## Step 2: Basic Feeder (Module 9)

Iterates over `{{2.data.data}}` — each task from the Wodely response.

---

## Step 3: Router (Module 8) — Pickup vs Delivery

### Route A — Pickup (Module 4, filter: `PICKUP`)

**Filter:** `{{9.typeDesc}} == "Pickup"`

**Module 4 — Airtable Update Record** (`id: {{1.id}}`):

| Field ID | Field Name | Value |
|----------|-----------|-------|
| `fld3WjgVcG3dUhgq6` | Collection Required | `true` |
| `fldQBiULOUiy8J1C8` | Collection Address | `{{9.dispatchAddress}}` |
| `fldSe1LMbZmiRaoVl` | Collection Phone | `{{9.requesterPhone}}` |
| `fldTRhwWr9XULffZd` | Task Description | `{{9.taskDesc}}` |
| `fldeG3di3uuyZpvde` | Collection Email | `{{9.requesterEmail}}` |
| `fldrF9m5gZb5XIVy7` | Collection Name | `{{9.requesterName}}` |
| `fldt7MgFBgq3cE8Ri` | Lifecycle Status | `MANUAL REVIEW` |
| `fldvpbEd7fk3C8rpP` | Wodely Collection GUID | `{{9.guid}}` |

#### Sub-step: Fetch Wodely Task Files (Module 15)

After updating the pickup record, fetches file attachments:

| Property | Value |
|----------|-------|
| URL | `https://api.wodely.com/v2/taskFiles/{{4.Wodely Collection GUID}}` |
| Method | `GET` |
| Authorization | `Basic pk-96ec2ff8-6-d74bbfe1-05c6-442d-a572-4e6254a523f4` |
| Accept | `application/json` |
| Content-Type | `application/json` |

> **Note:** Two different Wodely API keys are used — one for task search (Module 2) and a different one for file retrieval (Module 15).

Response: `data.data[].fileGuid`

**Module 16 — Airtable Update Record** (`id: {{1.id}}`):

| Field ID | Field Name | Value |
|----------|-----------|-------|
| `fldiO2q07QKMioACb` | Wodely File GUID | `{{15.data.data[].fileGuid}}` |

### Route B — Delivery (Module 10, filter: `DELIVERY`)

**Filter:** `{{9.typeDesc}} == "Delivery"`

**Module 10 — Airtable Update Record** (`id: {{1.id}}`):

| Field ID | Field Name | Value |
|----------|-----------|-------|
| `fldDLeMi5ujW4crax` | External Order ID | `{{1.External Order ID}}` |
| `fldH1hLzPuh5fAAji` | Delivery Address | `{{9.destinationAddress}}` |
| `fldHKxQbHejwNuoEW` | Consignment Ref | `{{1.External Order ID}}` |
| `fldIyw7wJlu9ZWBgx` | Delivery Email | `{{9.recipientEmail}}` |
| `fldJqfOfgl6OmcfHy` | Amount Due | `{{9.amountDue}}` |
| `fldQBiULOUiy8J1C8` | Collection Address | `{{9.dispatchAddress}}` |
| `fldSe1LMbZmiRaoVl` | Collection Phone | `{{9.requesterPhone}}` |
| `fldTRhwWr9XULffZd` | Task Description | `{{9.taskDesc}}` |
| `fldeG3di3uuyZpvde` | Collection Email | `{{9.requesterEmail}}` |
| `fldg97G2YvXyjKYsh` | Delivery Fee | `{{9.deliveryFee}}` |
| `fldio46Yi9YPkqWgn` | Merchant Name | `{{9.merchantName}}` |
| `fldjyEDCSWuNIGkmw` | Source System | `Wodely` |
| `fldkKYFSk1mv2jcfJ` | Delivery Name | `{{9.recipientName}}` |
| `fldrF9m5gZb5XIVy7` | Collection Name | `{{9.requesterName}}` |
| `fldt7MgFBgq3cE8Ri` | Lifecycle Status | `MANUAL REVIEW` |
| `fldwxzXAHhGQGQr12` | Delivery Phone | `{{9.recipientPhone}}` |
| `fldxPhpkMGJVcdmgF` | Wodely GUID | `{{9.guid}}` |

#### Sub-router Module 11 — Payment Classification

**Route B1 — PAID (Module 12)**

Filter:
```
{{9.statusDesc}} == "Processed"
AND {{9.amountDue}} == 0
```

Updates record `{{10.id}}`:

| Field ID | Field Name | Value |
|----------|-----------|-------|
| `fld5hdGaWa9s55Uun` | Payment Status | `PAID` |
| `fldGkwgQBiap97tnY` | Order Status | `Wodely Processed` |
| `fldhmXx9DovPahJgF` | Payment Type | `PREPAID` |
| `fldt7MgFBgq3cE8Ri` | Lifecycle Status | `MANUAL REVIEW` |

**Route B2 — UNPAID (Module 13)**

Filter:
```
{{9.statusDesc}} == "Unassigned"
AND {{9.amountDue}} > 0
```

Updates record `{{10.id}}`:

| Field ID | Field Name | Value |
|----------|-----------|-------|
| `fld5hdGaWa9s55Uun` | Payment Status | `PENDING` |
| `fldt7MgFBgq3cE8Ri` | Lifecycle Status | `PAYMENT_PENDING` |

---

## Outputs

- Airtable `Consignments` record enriched with full Wodely task data
- Lifecycle status advanced to `MANUAL REVIEW` or `PAYMENT_PENDING`
- Wodely file GUIDs stored for Pickup tasks

---

## Status Changes

| From | To | Condition |
|------|----|-----------|
| `WAITING_FOR_WODELY_DATA` | `MANUAL REVIEW` | Pickup task found in Wodely |
| `WAITING_FOR_WODELY_DATA` | `MANUAL REVIEW` | Delivery task found, `statusDesc="Processed"`, `amountDue=0` |
| `WAITING_FOR_WODELY_DATA` | `PAYMENT_PENDING` | Delivery task found, `statusDesc="Unassigned"`, `amountDue>0` |

---

## Airtable Tables Used

| Table ID | Table Name | Operations |
|----------|-----------|-----------|
| `tbl8AR7buODtDA20F` | Consignments | Search, Update (multiple times per record) |

---

## HTTP Endpoints

| URL | Method | Auth | Purpose |
|-----|--------|------|---------|
| `https://api.wodely.com/v2/tasks/search` | POST | Basic `pk-96ec2ff8-6-593808c8-5b99-47a8-b652-a36780a8456a` | Search Wodely tasks by ExternalKey |
| `https://api.wodely.com/v2/taskFiles/{guid}` | GET | Basic `pk-96ec2ff8-6-d74bbfe1-05c6-442d-a572-4e6254a523f4` | Retrieve file attachments for a Wodely task |

---

## TrackPOD Mappings

None in this blueprint.

---

## Xero Mappings

None in this blueprint.

---

## Error Handling

- `stopOnHttpError: true` on both HTTP modules — if Wodely returns an error, the run stops
- `parseResponse: true` — expects valid JSON from Wodely
- `allowRedirects: true`
- No explicit fallback/error handler routes

---

## Required Supabase Tables (Migration)

| Table | Purpose |
|-------|---------|
| `consignments` | Central consignment record |

Additional columns needed (beyond BP-01/02 columns):
- `wodely_guid` (text) — maps to `fldxPhpkMGJVcdmgF`
- `wodely_collection_guid` (text) — maps to `fldvpbEd7fk3C8rpP`
- `wodely_file_guid` (text) — maps to `fldiO2q07QKMioACb`
- `order_status` (text) — maps to `fldGkwgQBiap97tnY`

---

## Required API Endpoints (Migration)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/jobs/wodely-refresh` | POST/GET | Scheduled job: poll Airtable → fetch Wodely data → update records |

The job must:
1. Query `consignments` where `source_system = 'Wodely'` AND `lifecycle_status = 'WAITING_FOR_WODELY_DATA'` AND `external_order_id IS NOT NULL`
2. For each, call Wodely `/v2/tasks/search` with date window of -30/+90 days
3. Iterate tasks; route on `typeDesc`
4. For Pickup: store collection fields + GUID, set status = `MANUAL REVIEW`
5. For Delivery Processed (amountDue=0): set PAID/PREPAID + status = `MANUAL REVIEW`
6. For Delivery Unassigned (amountDue>0): set PENDING + status = `PAYMENT_PENDING`
7. For Pickup: additionally fetch `/v2/taskFiles/{guid}` and store file GUIDs

---

## UI Required to Support This Workflow

- Scheduled job management interface (trigger/view status)
- Consignment view showing `MANUAL REVIEW` and `PAYMENT_PENDING` queues
- Payment capture flow for `PAYMENT_PENDING` records
- File attachment display for Wodely task files
