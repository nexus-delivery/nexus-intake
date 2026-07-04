-- Expand customer address type options for operational CRM address books.
-- Keeps existing data and indexes; broadens address_type check constraint.

ALTER TABLE IF EXISTS merchant_customer_addresses
  DROP CONSTRAINT IF EXISTS merchant_customer_addresses_address_type_check;

ALTER TABLE IF EXISTS merchant_customer_addresses
  ADD CONSTRAINT merchant_customer_addresses_address_type_check
  CHECK (address_type IN ('collection', 'delivery', 'billing', 'warehouse', 'branch'));

NOTIFY pgrst, 'reload schema';
