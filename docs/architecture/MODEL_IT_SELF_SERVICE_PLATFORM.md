# Model It Self-Service Platform

## Positioning

Model It is a core platform module, not an internal developer utility.

It provides a merchant/customer self-service workspace where authorized users can define how NEXUS interprets documents, captures bookings, validates work, maps integrations and executes operational logic.

## Core objective

A merchant can onboard and evolve their own operational model without NEXUS code changes.

Execution path:

Upload -> Raw OCR -> Identify Model -> Apply Model -> Review -> Save corrections -> Update that model only

## Workspace isolation

Each merchant has an isolated Model It workspace.

Examples:

- BLB workspace configuration does not alter Doorway
- Doorway updates do not alter BLB
- Corrections are applied only to the model that processed the document

## Configurable artifacts

Model It supports the following artifact families:

- Document Templates
- OCR Mapping Rules
- Booking Forms
- Public Web Forms
- Workflow Rules
- Validation Rules
- Pricing Rules
- Collection Rules
- Delivery Rules
- Warehouse Rules
- Notification Rules
- API Mapping Rules
- Track-POD Mapping
- Xero/Accounts Mapping
- Status Mapping
- Business Rules

## Permission model

### Platform Admin

- Create global models
- Manage all merchants
- Publish templates

### Merchant Admin

- Manage own workspace models
- Create/edit templates
- Build booking forms/workflows
- Test mappings
- Publish within workspace

### Merchant User

- Use published models
- Submit and review documents
- Optionally suggest changes

## Version lifecycle

Every configurable artifact supports:

- Draft mode
- Publish
- Rollback
- Version history
- Audit log

## Current implementation status

### Delivered foundations

- `src/lib/modelIt` module with model contracts, role permissions and capability catalog.
- OCR model registry with independent BLB purchase-order model and Doorway delivery-note model.
- Upload pipeline delegates extraction through model identification and application.
- OCR debug payload includes model key, workspace, version and selection confidence.
- Supabase schema foundations for workspaces, artifacts, versions and audit logs.

### Next implementation steps

- Add authenticated CRUD APIs for workspace artifacts and versions.
- Add visual template editor (sample upload, highlight fields, save and test).
- Add drag-and-drop booking/public web form builder with validations and defaults.
- Add operator-correction writeback endpoint scoped to the active model version/workspace.
- Add publish gates and approval workflow where required.
