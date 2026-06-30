# NEXUS Operating System Specification v1.0

## 1. Scope and Decision Lock

This document is the operational source of truth for Phase 1 migration from Make.com + Airtable into NEXUS.

Principles:
- No business logic redesign during parity phase.
- No workflow simplification during parity phase.
- No guessed rules.
- Airtable behavior must be replicated in Supabase.
- Make scenario behavior must be replicated in NEXUS server routes/actions.

## 2. Source Artifacts Audit (As of 2026-06-30)

Detected files in reference source-of-truth locations:
- reference/airtable/.gitkeep
- reference/make/.gitkeep
- reference/trackpod/.gitkeep
- reference/xero/.gitkeep
- reference/flows/.gitkeep
- reference/field-mapping/.gitkeep

Result:
- No Airtable schema export currently present.
- No Make blueprint export currently present.
- No Track-POD production payload export currently present.
- No Xero production workflow export currently present.

Because no production blueprints are currently in the repository, all parity fields below are marked Awaiting Source Artifact.

## 3. NOS Product Modules (Locked)

The NOS operating console modules are:
- Book it
- Check it
- Process it
- Move it
- Track it
- Invoice it
- See it
- Tell it

Each module is a subscription capability and must support enable/disable per tenant.

## 4. Master Order Number Policy (Locked)

- Customer Order Number is the permanent Master Order Number.
- If supplied by customer: use unchanged everywhere.
- If missing: generate once and reuse everywhere.
- Never append/prepend suffixes or prefixes.
- Track-POD differentiates collection and delivery by Type field, not by changing the number.

## 5. Master Lifecycle (Locked)

1. Book it
2. Check it
3. Process it
4. Move it / Route it
5. Track it
6. Invoice it
7. See it

## 6. Operational Definition by Stage (Locked)

### Book it
- Customer or merchant booking creation.

### Check it
- OCR
- Validation
- Date checks
- Address checks
- Payment checks
- Commercial review
- Customer confirmation

### Process it
- Transition to operational state.
- Create Track-POD collection order.
- Create Track-POD delivery order.
- Store Track-POD IDs.
- Store tracking URLs.
- Store document URLs.
- Attach document URLs in Track-POD note.
- Mark ready for planning/routing.

### Move it / Route it
- Planning
- Route allocation
- Driver allocation
- Collection execution
- Delivery execution
- Warehouse execution activity where applicable

### Track it
- Visibility for customer/merchant/ops/accounts/admin.
- Live progress
- Tracking links
- Exceptions
- POD
- Delivery status

### Invoice it
- Create Xero draft invoice.
- Store invoice ID.
- Reference equals Master Order Number.
- Authorise invoice post-delivery confirmation.
- Send invoice.
- Continue finance/factoring flow.

### See it
- Dashboards
- Reporting
- KPIs
- Audit trail

## 7. Integration Behavior (Parity Required)

### Track-POD
Required parity target:
- Reuse production Make payload shape.
- Replace Make variables with NEXUS variables only.
- Preserve Client, Shipper, Depot/Ship From semantics.
- Preserve collection/delivery Type handling.

Status:
- Awaiting Source Artifact: Make Track-POD blueprint export.

### Xero
Required parity target:
- Replicate production draft creation flow.
- Replicate post-delivery authorisation flow.
- Replicate invoice send and finance/factoring transitions.

Status:
- Awaiting Source Artifact: Make Xero blueprint export.

### Documents
Required parity target:
- Store document URL, filename, storage path, type.
- Include public document URLs inside Track-POD notes.

Status:
- Awaiting Source Artifact: Airtable/Make document handling exports.

### Notifications/Webhooks
Required parity target:
- Replicate production notifications, webhook triggers, retries, and side effects.

Status:
- Awaiting Source Artifact: Make webhook/notification scenario exports.

## 8. Multi-Tenancy and Domain (Locked)

Primary domain direction:
- Migrate from it.nexus.delivery to nexusit.today.

Tenant model:
- Subdomain-routed tenant portals (examples: blb.nexusit.today, thdg.nexusit.today, ctni.nexusit.today).
- Tenant resolution from subdomain.

Status:
- Implementation details pending blueprint and tenancy mapping evidence.

## 9. Migration Rules (Execution Constraint)

For every migrated feature:
1. Identify Airtable source fields.
2. Identify Make scenario behavior.
3. Replicate workflow behavior exactly.
4. Implement equivalent in Supabase and NEXUS APIs.
5. Record field-by-field and payload-by-payload parity evidence.

No feature is complete until parity is evidenced.

## 10. Required Production Blueprint Inputs (Blocking List)

To complete this v1.0 specification with full behavioral detail, add exports into:
- reference/airtable/
- reference/make/
- reference/trackpod/
- reference/xero/

Minimum required artifacts:
- Airtable base schema export (all relevant tables/fields/views/automations references).
- Make blueprint exports for each operational scenario.
- Track-POD payload samples and response samples from production.
- Xero payload samples and response samples from production.
- Notification/webhook scenario exports.

## 11. Migration Parity Matrix (Master Tracker)

| Production Scenario | Existing System | Target NEXUS Service | Required Inputs | Current Status | Parity Achieved |
|---|---|---|---|---|---|
| Nexus Intake | Make + Airtable | Book it + Check it services | Make blueprint + Airtable fields | Awaiting Source Artifact | No |
| CTNI Intake | Make + Airtable | Book it intake variant | Make blueprint + Airtable fields | Awaiting Source Artifact | No |
| WooCommerce Refresh | Make + Airtable | Intake sync route/service | Make blueprint + webhook config | Awaiting Source Artifact | No |
| Wodely Refresh | Make + Airtable | Intake refresh route/service | Make blueprint + field map | Awaiting Source Artifact | No |
| Track-POD Creation | Make + Airtable | Process it Track-POD service | Make blueprint + payload/response samples | Awaiting Source Artifact | No |
| Route Planning | Make + Airtable | Move it / Route it service | Scenario export + status transitions | Awaiting Source Artifact | No |
| Status Feedback | Make + Airtable | Track it sync/status service | Webhook exports + mapping table | Awaiting Source Artifact | No |
| Xero Draft Invoice | Make + Airtable | Invoice it draft service | Xero Make blueprint + field map | Awaiting Source Artifact | No |
| Invoice Authorisation | Make + Airtable | Invoice it authorisation service | Make blueprint + transition rules | Awaiting Source Artifact | No |
| Factoring Export | Make + Airtable | Finance export service | Make blueprint + payload samples | Awaiting Source Artifact | No |
| Finance | Make + Airtable | Invoice it + See it finance services | Scenario exports + field maps | Awaiting Source Artifact | No |

## 12. Field Mapping Register (Placeholder)

Field-level parity mapping is blocked pending Airtable schema and Make blueprint exports.

Status:
- Awaiting Source Artifact.

## 13. Change Control

Until source artifacts are provided and mapped:
- No additional workflow logic changes should be made.
- UI wording-only changes are allowed only if they do not alter behavior.
- All future implementation PRs must reference rows from Section 11.
