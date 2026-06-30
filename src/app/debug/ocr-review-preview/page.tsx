"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import UploadOcrReviewScreen from "@/components/UploadOcrReviewScreen";
import type { OcrReviewData } from "@/lib/uploadOcr";

const initialData: OcrReviewData = {
  documentType: "purchase_order",
  orderReference: "PO-240628-UK01",
  orderType: "Delivery",
  collectionDate: "2026-07-01",
  collectionDateConfidence: "high",
  deliveryDate: "2026-07-02",
  deliveryDateConfidence: "high",
  merchantShipper: "Nook Home Ltd",
  customer: "Doorway Group",
  collectionName: "Warehouse A",
  collectionAddress: "Warehouse A, 14 Riverside Road, Belfast BT3 9AA",
  deliveryAddress: "5 Shore Road, Holywood BT18 0HX",
  contactName: "Jane Smith",
  telephone: "+44 28 9000 1000",
  email: "ops@doorwaygroup.co.uk",
  goodsDescription: "Sofa x1, armchair x2",
  packages: "3",
  quantity: "3",
  weight: "280 kg",
  volume: "4.2 cbm",
  priority: "Normal",
  cashOnDelivery: "£0.00",
  netAmount: "£60.00",
  vatAmount: "£12.00",
  grossTotal: "£72.00",
  vatRate: "20%",
  notes: "Call customer 30 mins before delivery. Use rear loading bay.",
};

export default function OcrReviewPreviewPage() {
  const [data, setData] = useState<OcrReviewData>(initialData);
  const [isCreating, setIsCreating] = useState(false);
  const [created, setCreated] = useState(false);

  const handleCreateJob = () => {
    setIsCreating(true);
    setCreated(false);
    setTimeout(() => {
      setIsCreating(false);
      setCreated(true);
    }, 700);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--nexus-purple)]">
            Upload it
          </p>
          <h1 className="text-2xl font-semibold text-[var(--nexus-graphite)] sm:text-3xl">
            Review Extracted Job (Preview)
          </h1>
          <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
            Sprint 1 preview of OCR extraction review and Track-POD field mapping.
          </p>
        </header>

        {created ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Preview only: Create Job action completed and would pass into the existing workflow.
          </div>
        ) : null}

        <UploadOcrReviewScreen
          data={data}
          onChange={setData}
          onBack={() => setCreated(false)}
          onCreateJob={handleCreateJob}
          isCreating={isCreating}
          error={null}
        />
      </div>
    </AppShell>
  );
}
