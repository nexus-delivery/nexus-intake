"use client";

import { merchantMockData, merchantStatsMockData } from "@/lib/merchantMockData";

export default function MerchantPortalPage() {
  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">Total Orders</p>
          <p className="mt-2 text-3xl font-semibold text-[var(--nexus-graphite)]">
            {merchantStatsMockData.totalOrders.toLocaleString()}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">Active Shipments</p>
          <p className="mt-2 text-3xl font-semibold text-[var(--nexus-graphite)]">
            {merchantStatsMockData.activeShipments}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">Revenue</p>
          <p className="mt-2 text-3xl font-semibold text-[var(--nexus-graphite)]">
            ${(merchantStatsMockData.revenue / 1000).toFixed(1)}K
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">Average Rating</p>
          <p className="mt-2 text-3xl font-semibold text-[var(--nexus-graphite)]">
            {merchantStatsMockData.averageRating.toFixed(1)}★
          </p>
        </div>
      </div>

      {/* Merchants Table */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-[var(--nexus-graphite)]">Partners</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {merchantMockData.map((merchant) => (
                <tr key={merchant.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-purple-100" />
                      <span className="font-medium text-[var(--nexus-graphite)]">
                        {merchant.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{merchant.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        merchant.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {merchant.status.charAt(0).toUpperCase() + merchant.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">{merchant.ordersCount}</td>
                  <td className="px-6 py-4 text-sm font-medium text-[var(--nexus-graphite)]">
                    ${merchant.revenue.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
