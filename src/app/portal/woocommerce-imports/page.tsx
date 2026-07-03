const commonSnippet = `/**
 * NEXUS checkout fields + order meta persistence.
 * Required fields:
 * Collection Name, Collection Company, Collection Address,
 * Collection Contact, Collection Phone, Collection Email, Collection Notes.
 */
add_action('woocommerce_after_order_notes', function ($checkout) {
  echo '<div id="nexus_collection_fields"><h3>NEXUS Collection Details</h3>';

  woocommerce_form_field('nexus_collection_name', [
    'type' => 'text',
    'required' => true,
    'label' => 'Collection Name',
  ], $checkout->get_value('nexus_collection_name'));

  woocommerce_form_field('nexus_collection_company', [
    'type' => 'text',
    'required' => false,
    'label' => 'Collection Company',
  ], $checkout->get_value('nexus_collection_company'));

  woocommerce_form_field('nexus_collection_address', [
    'type' => 'textarea',
    'required' => true,
    'label' => 'Collection Address',
  ], $checkout->get_value('nexus_collection_address'));

  woocommerce_form_field('nexus_collection_contact', [
    'type' => 'text',
    'required' => true,
    'label' => 'Collection Contact',
  ], $checkout->get_value('nexus_collection_contact'));

  woocommerce_form_field('nexus_collection_phone', [
    'type' => 'text',
    'required' => true,
    'label' => 'Collection Phone',
  ], $checkout->get_value('nexus_collection_phone'));

  woocommerce_form_field('nexus_collection_email', [
    'type' => 'email',
    'required' => true,
    'label' => 'Collection Email',
  ], $checkout->get_value('nexus_collection_email'));

  woocommerce_form_field('nexus_collection_notes', [
    'type' => 'textarea',
    'required' => false,
    'label' => 'Collection Notes',
  ], $checkout->get_value('nexus_collection_notes'));

  echo '</div>';
});

add_action('woocommerce_checkout_create_order', function ($order, $data) {
  $keys = [
    'nexus_collection_name',
    'nexus_collection_company',
    'nexus_collection_address',
    'nexus_collection_contact',
    'nexus_collection_phone',
    'nexus_collection_email',
    'nexus_collection_notes',
    'nexus_company_id',
    'nexus_courier_profile',
  ];

  foreach ($keys as $key) {
    if (isset($_POST[$key])) {
      $order->update_meta_data($key, sanitize_textarea_field(wp_unslash($_POST[$key])));
    }
  }
}, 20, 2);

/**
 * Replace values below per merchant:
 * - YOUR_NEXUS_COMPANY_ID
 * - YOUR_WEBHOOK_SECRET
 */
add_action('woocommerce_checkout_create_order', function ($order) {
  if (!$order->get_meta('nexus_company_id')) {
    $order->update_meta_data('nexus_company_id', 'YOUR_NEXUS_COMPANY_ID');
  }
}, 30, 1);

add_action('woocommerce_order_status_processing', 'nexus_push_order_to_nexus', 10, 1);
add_action('woocommerce_order_status_completed', 'nexus_push_order_to_nexus', 10, 1);

function nexus_push_order_to_nexus($order_id) {
  $order = wc_get_order($order_id);
  if (!$order) {
    return;
  }

  $endpoint = 'https://YOUR_NEXUS_DOMAIN/api/woocommerce/orders';
  $company_id = $order->get_meta('nexus_company_id');

  $payload = [
    'id' => $order->get_id(),
    'number' => $order->get_order_number(),
    'status' => $order->get_status(),
    'customer_note' => $order->get_customer_note(),
    'payment_method_title' => $order->get_payment_method_title(),
    'billing' => [
      'first_name' => $order->get_billing_first_name(),
      'last_name' => $order->get_billing_last_name(),
      'company' => $order->get_billing_company(),
      'address_1' => $order->get_billing_address_1(),
      'address_2' => $order->get_billing_address_2(),
      'city' => $order->get_billing_city(),
      'postcode' => $order->get_billing_postcode(),
      'state' => $order->get_billing_state(),
      'country' => $order->get_billing_country(),
      'phone' => $order->get_billing_phone(),
      'email' => $order->get_billing_email(),
    ],
    'shipping' => [
      'first_name' => $order->get_shipping_first_name(),
      'last_name' => $order->get_shipping_last_name(),
      'company' => $order->get_shipping_company(),
      'address_1' => $order->get_shipping_address_1(),
      'address_2' => $order->get_shipping_address_2(),
      'city' => $order->get_shipping_city(),
      'postcode' => $order->get_shipping_postcode(),
      'state' => $order->get_shipping_state(),
      'country' => $order->get_shipping_country(),
    ],
    'line_items' => array_map(function ($item) {
      return [
        'name' => $item->get_name(),
        'sku' => $item->get_product() ? $item->get_product()->get_sku() : '',
        'quantity' => $item->get_quantity(),
        'total' => (string) $item->get_total(),
      ];
    }, $order->get_items()),
    'meta_data' => array_map(function ($meta) {
      return ['key' => $meta->key, 'value' => $meta->value];
    }, $order->get_meta_data()),
  ];

  wp_remote_post(add_query_arg(['company_id' => $company_id], $endpoint), [
    'headers' => [
      'Content-Type' => 'application/json',
      'x-nexus-webhook-secret' => 'YOUR_WEBHOOK_SECRET',
    ],
    'body' => wp_json_encode($payload),
    'timeout' => 20,
  ]);
}
`;

const niSnippet = `add_action('woocommerce_checkout_create_order', function ($order) {
  $order->update_meta_data('nexus_courier_profile', 'courier_to_northern_ireland');
}, 40, 1);
`;

const thdgSnippet = `add_action('woocommerce_checkout_create_order', function ($order) {
  $order->update_meta_data('nexus_courier_profile', 'the_home_delivery_guys');
}, 40, 1);
`;

function CodeBlock(props: { title: string; code: string }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-600">{props.title}</h2>
      <pre className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
        <code>{props.code}</code>
      </pre>
    </section>
  );
}

export default function PortalWooCommerceImportsPage() {
  return (
    <div className="space-y-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">WooCommerce Next Phase</p>
        <h1 className="text-2xl font-semibold text-slate-950">WooCommerce Direct Import (Deferred)</h1>
        <p className="text-sm text-slate-600">
          This integration is staged for the next phase. Current delivery focus remains the Wodely replacement and Track-POD handoff stability.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Endpoint</p>
          <p className="mt-1 font-mono text-xs">POST /api/woocommerce/orders?company_id=COMPANY_UUID</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Security</p>
          <p className="mt-1 text-xs">Set WooCommerce integration configuration with webhook_secret and send it in x-nexus-webhook-secret.</p>
        </div>
      </section>

      <CodeBlock title="Shared Checkout + Push Snippet" code={commonSnippet} />
      <CodeBlock title="Courier to Northern Ireland Snippet" code={niSnippet} />
      <CodeBlock title="The Home Delivery Guys Snippet" code={thdgSnippet} />
    </div>
  );
}
