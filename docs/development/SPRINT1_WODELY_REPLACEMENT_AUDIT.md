# Sprint 1 Audit: Replace Wodely With NEXUS Intake

Date: 2026-07-01

## Definitive Module List

### Public
- Landing (`/`)
- Public Booking Form (`/booking-forms/public`)
- Embedded Booking Form (`/booking-forms/embedded`)
- Sign in / Sign up (`/signin`, `/signup`)

### Merchant
- Create it (`/create-it`)
- Booking Forms Index (`/booking-forms`)
- Internal Order Entry (`/order-input`)
- Portal Intake (`/portal/intake`)
- Process it (`/process-it`)
- Track it (`/track-it`)
- Account it (`/account-it`)
- Report it (`/report-it`)
- Tell it (`/tell-it`)

### Customer
- Customer pages under `/customers/*`
- Document centre portal pages

### Admin
- Manage it (`/manage-it`)
- Manage it submodules (`/manage-it/document-it`, `/manage-it/search-it`)
- Product hub (`/admin/product-hub`)

### Future
- Sell it (currently marked coming soon)
- Run it (currently marked coming soon)
- Xero invoice draft lifecycle integration execution

### Training
- Product/development/docs hubs in `docs/`
- No dedicated in-app training academy module yet

## Existing vs Missing

### Existing and usable now
- Unified intake API endpoint (`/api/intake/orders`)
- Merchant booking form with full operational schema (`/create-it`)
- Public and embedded booking forms using same schema
- WooCommerce and Shopify compatibility intake pages using same schema
- Internal order entry using same schema
- Track-POD-ready mapping persisted into `draft_jobs.integration_metadata.trackPodMapping`

### Missing / Next build items
- Webhook receivers and authenticated adapters for live WooCommerce/Shopify push
- Customer-facing embedded tokenization and anti-abuse controls
- In-app Review queue for non-ready orders (`REVIEW_REQUIRED`) from intake endpoint
- Xero draft invoice creation job from `standardOrder.commercial`
- Public pricing/subscription/onboarding conversion flow pages

## Navigation Review

### Working routes that naturally connect
- Booking forms index links all intake channels.
- Create it, Order Input, and Booking Forms all converge to one order object.
- Process it remains downstream from created orders.

### Current weak spots / dead-end risk
- Some legacy pages still describe OCR-first workflow language.
- Build-it pages still represent integrations conceptually rather than active pipelines.
- No explicit merchant “Next step” CTA from successful intake to Process it queue yet.

## Duplicate Functionality Risks
- `portal/intake` document-centric flow overlaps with new schema-first intake pages.
- Legacy `JobDetailsForm` remains present but no longer primary intake path.

## Recommended Sprint Sequence
1. Add success CTA routing from intake submit -> Process it queue filtered by created job.
2. Add authenticated WooCommerce and Shopify POST adapters to `/api/intake/orders`.
3. Add Review queue page for `REVIEW_REQUIRED` orders.
4. Add Xero invoice draft transformer (framework-complete, execution disabled by feature flag).
5. Consolidate legacy forms and remove duplicate entry points after migration.

## Sales Framework (Framework Only)
- Pricing: add plan metadata model (Starter, Growth, Enterprise).
- Subscriptions: add tenant subscription state + trial fields.
- Merchant onboarding: checklist states persisted per company.
- Free trial: trial start/end and conversion status fields.
- CRM: lead capture endpoint and pipeline stages.
- Marketing: UTM capture and source attribution on public intake.
- Referral programme: referral code association per merchant.
- Partner programme: partner account and merchant mapping model.
