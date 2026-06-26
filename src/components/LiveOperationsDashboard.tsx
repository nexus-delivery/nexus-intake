import KPIWidget from '@/components/KPIWidget';
import OperationsMapPlaceholder from '@/components/OperationsMapPlaceholder';
import ActiveRoutesPlaceholder from '@/components/ActiveRoutesPlaceholder';
import RecentAlertsPlaceholder from '@/components/RecentAlertsPlaceholder';
import FinanceSnapshotPlaceholder from '@/components/FinanceSnapshotPlaceholder';

interface KPIData {
  deliveriesToday: number;
  collectionsToday: number;
  driversActive: number;
  vehiclesActive: number;
  warehouseStock: number;
  ordersAwaitingValidation: number;
  outstandingInvoices: string;
  cashPosition: string;
  failedDeliveries: number;
  failedCollections: number;
  customsAlerts: number;
  aiAlerts: number;
}

interface LiveOperationsDashboardProps {
  data?: Partial<KPIData>;
  loading?: boolean;
}

export default function LiveOperationsDashboard({
  data = {},
  loading = false,
}: LiveOperationsDashboardProps) {
  // Default placeholder data
  const kpiData: KPIData = {
    deliveriesToday: 184,
    collectionsToday: 62,
    driversActive: 31,
    vehiclesActive: 28,
    warehouseStock: 1842,
    ordersAwaitingValidation: 23,
    outstandingInvoices: '£84,200',
    cashPosition: '£342,100',
    failedDeliveries: 3,
    failedCollections: 2,
    customsAlerts: 1,
    aiAlerts: 4,
    ...data,
  };

  return (
    <section className="space-y-10">
      {/* Hero Section */}
      <div className="rounded-[32px] border border-slate-200 bg-white px-8 py-8 shadow-sm shadow-slate-200/30">
        <div className="max-w-4xl space-y-4">
          <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Live Operations</p>
          <h1 className="text-4xl font-semibold tracking-tight text-[var(--nexus-graphite)] sm:text-5xl">
            Operations Control Room
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Real-time visibility across deliveries, collections, fleet, warehouse, finance and compliance
          </p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Key Performance Indicators</p>
          <h2 className="text-2xl font-semibold text-[var(--nexus-graphite)]">Live Metrics</h2>
        </div>

        {/* Deliveries & Collections Row */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <KPIWidget
            title="Deliveries Today"
            value={kpiData.deliveriesToday}
            icon="truck"
            trend={{ direction: 'up', label: '+12%' }}
            status="success"
            unit="active"
          />
          <KPIWidget
            title="Collections Today"
            value={kpiData.collectionsToday}
            icon="collection"
            trend={{ direction: 'up', label: '+9%' }}
            status="success"
            unit="scheduled"
          />
          <KPIWidget
            title="Drivers Active"
            value={kpiData.driversActive}
            icon="driver"
            trend={{ direction: 'up', label: '+5%' }}
            status="info"
            unit="on-shift"
          />
          <KPIWidget
            title="Vehicles Active"
            value={kpiData.vehiclesActive}
            icon="vehicle"
            trend={{ direction: 'up', label: '+4%' }}
            status="info"
            unit="dispatched"
          />
        </div>

        {/* Warehouse & Validation Row */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <KPIWidget
            title="Warehouse Stock"
            value={kpiData.warehouseStock}
            icon="warehouse"
            trend={{ direction: 'up', label: '+8%' }}
            status="neutral"
            unit="items"
          />
          <KPIWidget
            title="Orders Awaiting Validation"
            value={kpiData.ordersAwaitingValidation}
            icon="clipboard"
            trend={{ direction: 'down', label: '-2%' }}
            status="warning"
            unit="pending"
          />
          <KPIWidget
            title="Outstanding Invoices"
            value={kpiData.outstandingInvoices}
            icon="invoice"
            trend={{ direction: 'down', label: '4%' }}
            status="warning"
            unit="due"
          />
          <KPIWidget
            title="Cash Position"
            value={kpiData.cashPosition}
            icon="cash"
            trend={{ direction: 'up', label: '+2%' }}
            status="success"
            unit="available"
          />
        </div>

        {/* Alerts Row */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <KPIWidget
            title="Failed Deliveries"
            value={kpiData.failedDeliveries}
            icon="alert"
            trend={{ direction: 'down', label: '1 today' }}
            status="issue"
            unit="needs attention"
          />
          <KPIWidget
            title="Failed Collections"
            value={kpiData.failedCollections}
            icon="package"
            trend={{ direction: 'neutral', label: 'no change' }}
            status="issue"
            unit="rescheduled"
          />
          <KPIWidget
            title="Customs Alerts"
            value={kpiData.customsAlerts}
            icon="customs"
            trend={{ direction: 'down', label: 'cleared' }}
            status="warning"
            unit="pending"
          />
          <KPIWidget
            title="AI Alerts"
            value={kpiData.aiAlerts}
            icon="brain"
            trend={{ direction: 'neutral', label: 'monitoring' }}
            status="info"
            unit="anomalies"
          />
        </div>
      </div>

      {/* Operations Sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        <OperationsMapPlaceholder />
        <ActiveRoutesPlaceholder />
      </div>

      {/* Alerts & Finance */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentAlertsPlaceholder />
        <FinanceSnapshotPlaceholder />
      </div>
    </section>
  );
}
