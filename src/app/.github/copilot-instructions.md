# NEXUS Platform — Copilot Instructions

We are building NEXUS Platform, a multi-tenant logistics SaaS.

The repository is currently named `nexus-intake` because Phase 1 replaces Wodely, but the long-term product is a full logistics operating system.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase
- Vercel
- GitHub Codespaces

## Phase 1 Goal

Replace Wodely as the intake layer.

Wodely currently handles:
- WooCommerce order intake
- Web booking forms
- Merchant-specific forms
- Custom pickup/delivery fields
- Price templates
- Task creation
- Sending work into Track-POD

## Core Architecture

- NEXUS owns intake, merchants, customers, booking forms, pricing, orders and consignments.
- Track-POD remains the execution layer for now.
- Track-POD handles routes, vans, drivers, PODs, tracking links and delivery execution.
- Every record must belong to a company using `company_id`.
- `merchant_id` is optional.
- `customer_id` is optional.
- Public bookings must be allowed without requiring a merchant account.
- One order creates one consignment.
- One consignment can have many items.
- All pages must be built multi-tenant first.

## Current Supabase Tables

- companies
- profiles
- sales_channels
- merchants
- customers
- addresses
- orders
- consignments
- consignment_items
- consignment_events

## Product Modules

Build in this order:

1. App shell and navigation
2. Merchant management
3. Customer management
4. Order intake
5. Consignment lifecycle
6. Booking forms
7. Merchant-specific pricing
8. WooCommerce import
9. Track-POD integration
10. Payments
11. Driver/carrier marketplace later
12. Warehouse later
13. Finance later

Do not build driver marketplace, warehouse, inventory, finance or full route optimisation yet.

## UI Principles

- Professional logistics control room style
- Clean, modern SaaS dashboard
- Left sidebar navigation
- Responsive for iPad and mobile
- Large touch-friendly buttons
- Clear status badges
- Use cards, tables and simple forms
- Avoid clutter
- Do not copy Wodely’s UI directly
- Use Wodely as a functionality checklist only

## Branding Rules

- Do not hard-code one company or merchant.
- Companies and merchants may have their own logos, colours and booking forms.
- Design should support future white-label portals.
- NEXUS should feel like the central operating platform.

## Development Rules

- Use reusable components.
- Keep files clean and simple.
- Prefer small components over large files.
- Do not add unnecessary dependencies without asking.
- Do not connect to Supabase unless specifically requested.
- Do not invent database fields that do not exist.
- If a new field/table is required, explain it first.
- Keep changes bite-sized and easy to review.

## Current Sprint

Build the visual app shell first:

- Sidebar
- Header
- Dashboard cards
- Navigation links
- Placeholder pages for:
  - Dashboard
  - Orders
  - Consignments
  - Merchants
  - Customers
  - Booking Forms
  - Settings

Do not build real forms or database logic in this sprint.