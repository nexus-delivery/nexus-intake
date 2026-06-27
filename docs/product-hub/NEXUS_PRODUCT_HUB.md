# NEXUS Product Hub

Central reference for managing roadmap, features, backlog, agent rules and commercial ideas across the NEXUS platform.

> **Note:** This is an internal planning document. Do not modify app code based on content here without an approved GitHub Issue.

---

## 1. Current Priority

**NEXUS Booking + NEXUS Transport**

### Active Workflow

```
Document Upload
→ Document Stored
→ Draft Job Created
→ Document Processing
→ Review Job
→ Confirm Job
→ Transport Planning
→ Track-POD Route / Job Sync
→ POD
→ Branded Documents
```

All current build effort is focused on completing this workflow end-to-end before expanding to other modules.

---

## 2. Feature Catalogue

### NEXUS Booking

| Field | Detail |
|-------|--------|
| **Purpose** | Merchant submission and booking workflow |
| **USP** | Multi-format document upload, draft job creation, merchant review |
| **Revenue model** | Transaction |
| **Status** | Active |
| **Dependencies** | Document Upload (in progress), Track-POD sync (planned) |
| **Current priority** | 1 — Core launch dependency |

---

### NEXUS Transport

| Field | Detail |
|-------|--------|
| **Purpose** | Route planning and carrier integration |
| **USP** | Track-POD integration, route optimisation, carrier dispatch |
| **Revenue model** | Transaction |
| **Status** | Planned |
| **Dependencies** | NEXUS Booking, Track-POD API sync (planned) |
| **Current priority** | 2 — Dependent on Booking |

---

### NEXUS Documents

| Field | Detail |
|-------|--------|
| **Purpose** | Digital archive and compliance |
| **USP** | POD storage, merchant-branded documents, audit trail |
| **Revenue model** | Subscription |
| **Status** | Planned |
| **Dependencies** | Document Upload (in progress), POD generation (future) |
| **Current priority** | 3 — Dependent on Transport |

---

### NEXUS Finance

| Field | Detail |
|-------|--------|
| **Purpose** | Billing and payments |
| **USP** | Automated invoicing linked to booking transactions |
| **Revenue model** | Subscription |
| **Status** | Planned |
| **Dependencies** | NEXUS Booking, transaction data |
| **Current priority** | Low |

---

### NEXUS Warehouse

| Field | Detail |
|-------|--------|
| **Purpose** | Inventory management |
| **USP** | Real-time stock visibility across locations |
| **Revenue model** | Enterprise |
| **Status** | Backlog |
| **Dependencies** | Multiple modules |
| **Current priority** | Low |

---

### NEXUS Intelligence

| Field | Detail |
|-------|--------|
| **Purpose** | Analytics and reporting |
| **USP** | Operational insights across bookings, transport and documents |
| **Revenue model** | Subscription |
| **Status** | Backlog |
| **Dependencies** | Transaction data, operational data |
| **Current priority** | Low |

---

### NEXUS Network

| Field | Detail |
|-------|--------|
| **Purpose** | Multi-merchant platform and partner ecosystem |
| **USP** | Shared carrier and partner access across merchant accounts |
| **Revenue model** | Commission |
| **Status** | Future |
| **Dependencies** | All core modules |
| **Current priority** | Low |

---

### NEXUS Instant

| Field | Detail |
|-------|--------|
| **Purpose** | Same-day delivery service |
| **USP** | On-demand booking with real-time carrier matching |
| **Revenue model** | Transaction |
| **Status** | Future |
| **Dependencies** | Transport optimisation, carrier network |
| **Current priority** | Low |

---

### NEXUS Marketplace

| Field | Detail |
|-------|--------|
| **Purpose** | Service integrations and carrier network |
| **USP** | Open marketplace for carrier bids and service listings |
| **Revenue model** | Commission |
| **Status** | Future |
| **Dependencies** | NEXUS Network, carrier API integration |
| **Current priority** | Low |

---

### NEXUS Analytics

| Field | Detail |
|-------|--------|
| **Purpose** | Business intelligence |
| **USP** | Cross-module reporting and trend analysis |
| **Revenue model** | Subscription |
| **Status** | Backlog |
| **Dependencies** | Transaction data, operational events |
| **Current priority** | Low |

---

### NEXUS Workspace

| Field | Detail |
|-------|--------|
| **Purpose** | Team management and collaboration |
| **USP** | Role-based access, task assignment, team visibility |
| **Revenue model** | Subscription |
| **Status** | Backlog |
| **Dependencies** | Multi-user auth, role-based access |
| **Current priority** | Low |

---

### NEXUS International

| Field | Detail |
|-------|--------|
| **Purpose** | Cross-border logistics |
| **USP** | Customs documentation, multi-currency, international carrier support |
| **Revenue model** | Enterprise |
| **Status** | Future |
| **Dependencies** | Customs module, multi-currency support |
| **Current priority** | Low |

---

## 3. Innovation Backlog

Future ideas to capture and explore — not current build priorities. Store here to avoid disrupting the active workflow.

| Idea | Notes |
|------|-------|
| Ferries & maritime logistics | Scheduled ferry routes for island/coastal deliveries |
| Hotels & accommodation logistics | Last-mile delivery tied to hospitality sector |
| Flights & air freight | Air freight booking and tracking integration |
| Porter travel planning network | Concierge-style luggage and parcel planning |
| Preferred carriers programme | Verified carrier tiers with priority access |
| Open-to-market jobs | Carriers bid on unallocated jobs |
| Instant booking flow | Zero-friction same-day booking UX |
| Carrier network management | Tools to manage and score carrier relationships |
| Marketplace commission structure | Revenue sharing model across carrier marketplace |
| White-label platform option | Resell NEXUS infrastructure under partner branding |

---

## 4. Agent Rules

Rules that govern all development agents working on the NEXUS platform.

### Architecture
- ❌ **Agents do not invent architecture** — implement only from approved problem statements
- ✅ **One task = one GitHub issue/card** — no scope creep across issues
- ✅ **Build by business capability, not technology** — align work to features, not stack layers

### Platform Boundaries
- ✅ **Track-POD is part of NEXUS Transport** — it is not a separate product
- ✅ **Document Upload and Track-POD are core launch dependencies** — they must be complete before NEXUS Booking ships
- ❌ **Do not begin new work without approval** — all new issues require sign-off before build starts

### Code & Quality
- ✅ **Must run `npm run lint`** before committing
- ✅ **Must run `npm run build`** before final commit
- ✅ **Show changed files before applying** — user must confirm changes
- ❌ **Do not modify Supabase schema** without explicit approval
- ❌ **Do not modify `package.json` or `package-lock.json`** without approval

---

## 5. Today's Build Focus

Current priority stack for active development.

### Priority 1: Real Document Upload ✅ (PR #8 — in draft)

- Multi-format file upload (PDF, PNG, JPG, JPEG)
- Store file in Supabase Storage (`merchant-documents` bucket)
- Create `uploaded_documents` record with metadata
- **Status:** COMPLETE — awaiting Supabase table creation and merge

### Priority 2: Draft Job Creation ✅ (included in PR #8)

- Create `draft_jobs` record linked to `uploaded_documents`
- Store metadata and document references
- **Status:** COMPLETE — awaiting merge

### Priority 3: Track-POD Planning Architecture

- Design Track-POD integration points within NEXUS Transport
- Plan API sync flow for job creation and route assignment
- **Status:** NOT STARTED — next after Document Upload merges

### Priority 4: Track-POD API Sync

- Implement Track-POD job creation from confirmed bookings
- Sync booking data to Track-POD in real time
- **Status:** NOT STARTED — dependent on Priority 3

---

## 6. Launch Dependencies

Required before NEXUS Booking is production-ready:

| Dependency | Status |
|------------|--------|
| Document Upload Foundation | ✅ In progress (PR #8) |
| Draft Job Creation | ✅ In progress (PR #8) |
| Track-POD Integration | ⏳ Planned |
| Merchant Portal Navigation | ⏳ Planned |
| Document Processing Framework | ⏳ Planned |
| Booking Review Workflow | ⏳ Planned |

---

**Last Updated:** 2026-06-27  
**Owner:** nexus-delivery/nexus-intake maintainers
