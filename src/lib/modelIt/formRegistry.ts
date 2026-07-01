export type MerchantFormField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "email" | "phone" | "date" | "number" | "select";
  required: boolean;
  validation: string;
};

export type MerchantBookingFormModel = {
  formKey: string;
  merchantKey: string;
  merchantName: string;
  requiredFields: MerchantFormField[];
  optionalFields: MerchantFormField[];
  collectionWorkflow: string;
  deliveryWorkflow: string;
  validationRules: string[];
  defaultServices: string[];
  defaultPricing: string;
  defaultWarehouse: string;
  defaultNotifications: string[];
};

export type MerchantWebFormModel = {
  formKey: string;
  merchantKey: string;
  merchantName: string;
  publicPath: string;
  status: "draft" | "published";
  requiredFields: string[];
  optionalFields: string[];
  workflowRules: string[];
  pricingRules: string[];
  notificationRules: string[];
};

export const MERCHANT_BOOKING_FORMS: MerchantBookingFormModel[] = [
  {
    formKey: "booking.blb.v1",
    merchantKey: "blb-home-group",
    merchantName: "BLB Home Group",
    requiredFields: [
      { key: "order_reference", label: "Order Reference", type: "text", required: true, validation: "Min 3 chars" },
      { key: "collection_address", label: "Collection Address", type: "textarea", required: true, validation: "Full address required" },
      { key: "delivery_address", label: "Delivery Address", type: "textarea", required: true, validation: "Full address required" },
      { key: "rtc_date", label: "RTC Date", type: "date", required: true, validation: "Must be today or later" },
      { key: "delivery_date", label: "Delivery Date", type: "date", required: true, validation: "Must be on or after RTC" },
    ],
    optionalFields: [
      { key: "contact_name", label: "Contact Name", type: "text", required: false, validation: "Optional" },
      { key: "contact_phone", label: "Contact Phone", type: "phone", required: false, validation: "UK phone format" },
      { key: "pricing", label: "Pricing", type: "text", required: false, validation: "Currency format if provided" },
      { key: "goods", label: "Goods", type: "textarea", required: false, validation: "Optional free text" },
    ],
    collectionWorkflow: "Warehouse release -> Ready to collect validation -> Route planning",
    deliveryWorkflow: "Slot validation -> Delivery allocation -> POD confirmation",
    validationRules: [
      "RTC date is required",
      "Delivery date cannot be earlier than RTC date",
      "Collection and delivery addresses must be non-empty",
    ],
    defaultServices: ["2-person home delivery", "Inside room placement"],
    defaultPricing: "BLB standard matrix v1",
    defaultWarehouse: "BLB Main DC",
    defaultNotifications: ["Merchant admin email", "Customer delivery SMS", "Ops exception alert"],
  },
  {
    formKey: "booking.doorway.v1",
    merchantKey: "doorway",
    merchantName: "Doorway",
    requiredFields: [
      { key: "delivery_note_number", label: "Delivery Note Number", type: "text", required: true, validation: "Alphanumeric" },
      { key: "customer", label: "Customer", type: "text", required: true, validation: "Min 2 chars" },
      { key: "collection_address", label: "Collection Address", type: "textarea", required: true, validation: "Full address required" },
      { key: "delivery_address", label: "Delivery Address", type: "textarea", required: true, validation: "Full address required" },
      { key: "delivery_date", label: "Delivery Date", type: "date", required: true, validation: "Must be today or later" },
    ],
    optionalFields: [
      { key: "goods", label: "Goods", type: "textarea", required: false, validation: "Optional free text" },
      { key: "contact_email", label: "Contact Email", type: "email", required: false, validation: "Email format" },
      { key: "contact_phone", label: "Contact Phone", type: "phone", required: false, validation: "UK phone format" },
    ],
    collectionWorkflow: "Depot scan-in -> Collection manifest validation",
    deliveryWorkflow: "Delivery zone check -> Driver assignment -> POD capture",
    validationRules: [
      "Delivery note number is required",
      "Delivery date is required",
      "Customer and delivery address are required",
    ],
    defaultServices: ["Standard home delivery"],
    defaultPricing: "Doorway default rate card",
    defaultWarehouse: "Doorway North Hub",
    defaultNotifications: ["Merchant dispatch email", "Customer ETA notification"],
  },
];

export const MERCHANT_WEB_FORMS: MerchantWebFormModel[] = [
  {
    formKey: "webform.blb.public.v1",
    merchantKey: "blb-home-group",
    merchantName: "BLB Home Group",
    publicPath: "/book/blb",
    status: "draft",
    requiredFields: ["Order Number", "Collection Address", "Delivery Address", "RTC Date", "Delivery Date"],
    optionalFields: ["Reference", "Goods", "Contact Details", "Pricing"],
    workflowRules: ["Require manual review when pricing is blank"],
    pricingRules: ["Use BLB standard matrix when no override is supplied"],
    notificationRules: ["Notify BLB transport team on submit"],
  },
  {
    formKey: "webform.doorway.public.v1",
    merchantKey: "doorway",
    merchantName: "Doorway",
    publicPath: "/book/doorway",
    status: "draft",
    requiredFields: ["Delivery Note Number", "Customer", "Collection Address", "Delivery Address", "Delivery Date"],
    optionalFields: ["Goods", "Telephone", "Email", "Special Instructions"],
    workflowRules: ["Auto-assign to Doorway queue"],
    pricingRules: ["Default Doorway rate card"],
    notificationRules: ["Send confirmation to customer email when provided"],
  },
  {
    formKey: "webform.nexus.public.v1",
    merchantKey: "nexus-public",
    merchantName: "NEXUS Public",
    publicPath: "/book",
    status: "published",
    requiredFields: ["Customer Name", "Collection Address", "Delivery Address", "Delivery Date"],
    optionalFields: ["Company", "Goods", "Telephone", "Email", "Notes"],
    workflowRules: ["Route to intake triage"],
    pricingRules: ["Quote required before confirmation"],
    notificationRules: ["Notify intake team and acknowledge submitter"],
  },
];