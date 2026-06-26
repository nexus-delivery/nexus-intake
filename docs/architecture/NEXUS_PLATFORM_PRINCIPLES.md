# NEXUS Platform Principles

## 1. Platform vision

NEXUS is a Logistics Operating System.

NEXUS does not replace specialist systems by default. It connects them.

The platform is designed to be the central operating layer for logistics operations while preserving the flexibility to use best-in-class specialist tools where needed.

NEXUS should provide a single experience for customers, merchants, operators, and partners, while allowing specialist workflows to remain in their native systems where appropriate.

## 2. User roles

NEXUS serves multiple user groups through one connected operating environment:

- Customers interact with NEXUS as their primary service experience.
- Merchants operate through the merchant portal inside NEXUS.
- Planners may use Track-POD or another planning platform for operational planning.
- Drivers may use Track-POD Mobile or another driver application for execution.
- Partners and agents interact through a dedicated portal experience.

## 3. Replaceable connector rule

NEXUS owns the core operating experience, while external systems are treated as replaceable connectors.

NEXUS owns:
- Customer experience
- Merchant portal
- Operations view
- Warehouse
- Finance
- Documents
- Tracking display
- Reports
- Partner / agent portal
- Marketplace
- Subscriptions
- Cross-border support
- Customs support

External systems are replaceable connectors:
- Track-POD
- Xero
- Stripe
- WooCommerce
- Sage
- QuickBooks
- Google Maps
- WMS systems

This rule ensures that NEXUS remains the control layer and customer-facing system, while specialist tools can be swapped without breaking the core platform experience.

## 4. Track-POD integration approach

Track-POD is treated as an operational execution connector rather than the primary customer-facing platform.

The integration approach should preserve the following principles:
- Customers and merchants stay inside NEXUS.
- Planners may use Track-POD or another planning platform.
- Drivers may use Track-POD Mobile or another driver app.
- Core status, tasks, documents, visibility, and customer communication remain available inside NEXUS.
- Track-POD is integrated where it adds operational value, but NEXUS remains the system of record for the customer journey.

## 5. Partner / agent model

NEXUS should support a partner and agent operating model where partners can run parts of the customer lifecycle through a dedicated portal.

The partner / agent experience should include:
- Customer onboarding support
- Merchant and shipment oversight
- Document and status visibility
- Commission-aware workflows
- White-label or co-branded opportunities where appropriate

This model allows third parties to participate in the ecosystem without becoming the primary owner of the customer experience.

## 6. New-start customer option

For new-start customers, NEXUS should provide a simpler onboarding path that prioritizes speed and clarity.

This option should include:
- Rapid setup of customer and merchant accounts
- Guided onboarding flows
- Standard operating templates
- Flexible use of connectors without heavy implementation overhead
- A lower-friction entry into the full NEXUS platform

This option helps new operators start quickly while still benefiting from the broader platform architecture.

## 7. Established operator option

For established operators, NEXUS should support a more mature operating model that emphasizes integration depth and workflow continuity.

This option should include:
- Deeper integration with existing planning, accounting, and warehouse systems
- Advanced visibility across operations and finance
- Better connectivity to specialist tools and legacy systems
- Stronger control over operational handoffs and document flows
- A path to migrate gradually without forcing a full replacement of existing systems

## 8. Cross-border support

NEXUS should support cross-border logistics operations as a native capability rather than as an afterthought.

Cross-border support should cover:
- Shipment and document visibility across regions
- Regulatory and customs handoffs
- Multi-currency and multi-language experiences
- Partner and agent coordination across markets
- Support for country-specific requirements and documentation

## 9. Customs module

NEXUS should include a customs module that supports end-to-end customs workflow management within the platform.

The module should support:
- Commercial invoices
- Customs declarations
- HS codes
- Commodity descriptions
- Country of origin
- Item values
- Currency codes
- Item weights
- Quantities
- EORI numbers
- VAT/tax numbers
- Incoterms
- Reason for export
- Sender/exporter details
- Recipient/importer details
- Customs document storage
- Customs document generation

The customs module should be designed to work as part of the broader document and operations flow, so customs records can be created, reviewed, stored, and shared without leaving NEXUS.

## 10. Multi-language and multi-currency support

NEXUS should support global operations through multi-language and multi-currency capabilities.

The platform should be able to:
- Present the experience in multiple languages
- Handle multiple currencies and pricing views
- Support country-specific documentation and compliance expectations
- Provide consistent visibility across markets while adapting to local requirements

## 11. White-label future

NEXUS should be designed with a future white-label model in mind.

Over time, the platform may be offered as:
- A branded operating system for logistics businesses
- A co-branded partner environment
- A platform that can be presented under another brand while retaining the same core architecture

The white-label future should not change the central principle that NEXUS owns the customer experience and operational control layer, while external systems remain connectors.

## 12. Subscription and commission model

NEXUS should support a commercial model that combines platform subscription revenue with partner-driven commission opportunities.

The model may include:
- Subscription fees for platform access and core capabilities
- Charges for advanced modules such as customs, marketplace, or partner workflows
- Commission structures for partner and agent-led activity
- Flexible commercial arrangements to suit different customer and market profiles

The commercial model should reinforce the platform strategy: NEXUS remains the operating system, while specialist tools and partner channels remain connected components within the broader ecosystem.

## 13. Merchant-Branded POD and Signed Documents

NEXUS should provide a comprehensive proof of delivery (POD) and signed documents capability that allows merchants to brand and customize their delivery documentation.

### Merchant-aware POD branding

PODs must be merchant-aware, allowing each merchant to maintain their brand identity throughout the delivery experience.

Each merchant can configure:
- Logo and branding assets
- Trading name
- Contact details
- Support email and phone
- Terms and conditions
- Custom POD template
- Tracking page branding
- Email branding

### POD content and structure

Generated POD documents should include:
- Merchant logo and merchant details
- NEXUS fulfilment details
- Delivery details and delivery date/time
- Recipient information
- Driver notes
- Delivery photos
- Recipient signature
- POD reference number

### Document storage and management

- Original uploaded PDFs must remain stored against the job for audit and compliance purposes
- Generated POD PDFs should be stored against the delivery for easy retrieval and distribution
- Generated POD PDFs should be emailable to recipient, merchant, collection contact, and internal operations

### POD generation and proof of delivery approach

Track-POD signature, photos, and status data should be used to generate a NEXUS-branded POD PDF that combines operational evidence with merchant branding.

Use Track-POD POD evidence as the standard delivery proof for all merchants.

### E-signature and formal document execution

E-signature provider support (such as DocuSign) should be available as an optional future capability for merchants that require formal document execution.

Use DocuSign or other e-signature solutions only where a merchant explicitly requires formal document execution, maintaining Track-POD evidence as the default standard delivery proof.

This approach preserves operational efficiency while supporting merchants with higher formal documentation requirements.
