export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f6f8",
        fontFamily: "Arial, sans-serif",
        padding: "40px",
      }}
    >
      <h1
        style={{
          fontSize: "36px",
          marginBottom: "10px",
          color: "#1e293b",
        }}
      >
        NEXUS Delivery Solutions
      </h1>

      <p
        style={{
          color: "#64748b",
          marginBottom: "40px",
        }}
      >
        Logistics Operating Platform
      </p>

      <div
        style={{
          background: "white",
          borderRadius: "12px",
          padding: "30px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          maxWidth: "700px",
        }}
      >
        <h2>System Status</h2>

        <p>✅ GitHub Connected</p>
        <p>✅ Vercel Connected</p>
        <p>✅ Supabase Connected</p>

        <hr style={{ margin: "25px 0" }} />

        <h3>Coming Soon</h3>

        <ul>
          <li>Orders</li>
          <li>Consignments</li>
          <li>Merchants</li>
          <li>Customers</li>
          <li>Routes</li>
          <li>Warehouse</li>
          <li>Finance</li>
        </ul>
      </div>
    </main>
  );
}