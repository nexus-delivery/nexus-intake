import type { StandardOrder } from "@/lib/intake/standardOrder";
import type { MerchantCustomer } from "@/lib/merchantCustomers";

function splitAddress(address: string): {
  line1: string;
  line2: string;
  line3: string;
  postcode: string;
} {
  const rawParts = address
    .split(/\n|,/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (rawParts.length === 0) {
    return { line1: "", line2: "", line3: "", postcode: "" };
  }

  if (rawParts.length === 1) {
    return { line1: rawParts[0], line2: "", line3: "", postcode: "" };
  }

  if (rawParts.length === 2) {
    return { line1: rawParts[0], line2: "", line3: "", postcode: rawParts[1] };
  }

  return {
    line1: rawParts[0],
    line2: rawParts[1] ?? "",
    line3: rawParts.slice(2, Math.max(2, rawParts.length - 1)).join(", "),
    postcode: rawParts[rawParts.length - 1] ?? "",
  };
}

export function applyCustomerDefaults(
  order: StandardOrder,
  customer: MerchantCustomer
): StandardOrder {
  const collection = splitAddress(customer.defaultCollectionAddress);
  const delivery = splitAddress(customer.defaultDeliveryAddress);

  return {
    ...order,
    customer: customer.contactName || customer.customerName,
    notes: customer.notes || order.notes,
    collection: {
      ...order.collection,
      company: customer.company || order.collection.company,
      contact: customer.contactName || order.collection.contact,
      addressLine1: collection.line1 || order.collection.addressLine1,
      addressLine2: collection.line2 || order.collection.addressLine2,
      addressLine3: collection.line3 || order.collection.addressLine3,
      postcode: collection.postcode || order.collection.postcode,
      email: customer.email || order.collection.email,
      phone: customer.mobile || customer.phone || order.collection.phone,
      instructions: customer.deliveryInstructions || order.collection.instructions,
    },
    delivery: {
      ...order.delivery,
      company: customer.company || order.delivery.company,
      contact: customer.contactName || order.delivery.contact,
      addressLine1: delivery.line1 || order.delivery.addressLine1,
      addressLine2: delivery.line2 || order.delivery.addressLine2,
      addressLine3: delivery.line3 || order.delivery.addressLine3,
      postcode: delivery.postcode || order.delivery.postcode,
      email: customer.email || order.delivery.email,
      phone: customer.mobile || customer.phone || order.delivery.phone,
      instructions: customer.deliveryInstructions || order.delivery.instructions,
    },
    commercial: {
      ...order.commercial,
      purchaseOrder: customer.accountNumber || order.commercial.purchaseOrder,
    },
    operations: {
      ...order.operations,
      serviceType: customer.defaultService || order.operations.serviceType,
    },
  };
}
