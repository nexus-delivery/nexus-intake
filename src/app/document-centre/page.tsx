"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import DocumentUploadCard from "@/components/DocumentUploadCard";
import DocumentsTable, { DocumentTableRow } from "@/components/DocumentsTable";
import { useRuntimeCompanyId } from "@/lib/useRuntimeCompanyId";

function buildMockDocuments(companyId: string): DocumentTableRow[] {
  return [
    {
      id: "1",
      name: "January delivery note.pdf",
      merchant: companyId,
      type: "Delivery Note",
      status: "Uploaded",
      uploaded: "Jun 24, 2026, 09:45",
    },
    {
      id: "2",
      name: "Merchant manifest.pdf",
      merchant: companyId,
      type: "Manifest",
      status: "Processing",
      uploaded: "Jun 23, 2026, 14:18",
    },
  ];
}

export default function DocumentCentre() {
  const companyId = useRuntimeCompanyId();
  const [documents, setDocuments] = useState<DocumentTableRow[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setDocuments(buildMockDocuments(companyId));
  }, [companyId]);

  const handleUploadComplete = (fileName: string) => {
    setDocuments((current) => [
      {
        id: String(Date.now()),
        name: fileName,
        merchant: companyId,
        type: "Delivery Note",
        status: "Uploaded",
        uploaded: new Date().toLocaleString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
      ...current,
    ]);
    setFetchError(null);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Upload Documents</h1>
          <p className="mt-1 text-sm text-slate-500">
            Drag and drop PDF delivery notes, manifests, and purchase orders
          </p>
        </div>

        <DocumentUploadCard companyId={companyId} onUploadComplete={handleUploadComplete} />


        <div>
          <h2 className="text-lg font-semibold text-slate-900">Recent Documents</h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage and review uploaded documents
          </p>
        </div>

        {fetchError ? (
          <div className="rounded-[24px] border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {fetchError}
          </div>
        ) : (
          <DocumentsTable documents={documents} />
        )}

        {isLoading && (
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 text-sm text-slate-500">
            Loading documents...
          </div>
        )}
      </div>
    </AppShell>
  );
}
