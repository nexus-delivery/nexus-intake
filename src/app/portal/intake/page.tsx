"use client";

import { useState } from "react";
import DocumentUploadCard from "@/components/DocumentUploadCard";

export default function MerchantIntakePage() {
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const handleUploadComplete = (fileName: string) => {
    setUploadedFileName(fileName);
  };

  return (
    <div className="space-y-6 pb-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--nexus-purple)]">
          Merchant Portal
        </p>
        <h1 className="text-2xl font-semibold text-[var(--nexus-graphite)] sm:text-3xl">
          Upload your delivery document
        </h1>
        <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
          Upload a PDF, PNG, JPG, or JPEG document to get started. We will create a draft job linked to your document ready for booking processing.
        </p>
      </header>

      {uploadedFileName && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <svg
              className="h-4 w-4 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-900">Document Uploaded</p>
            <p className="text-xs text-emerald-700">
              Your document has been stored and a draft job has been created. Our team will process it shortly.
            </p>
          </div>
        </div>
      )}

      <DocumentUploadCard onUploadComplete={handleUploadComplete} />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-base font-semibold text-[var(--nexus-graphite)]">What happens next?</h2>
        <ol className="mt-4 space-y-3">
          {[
            { step: 1, title: "Document stored", description: "Your file is securely saved to our document store." },
            { step: 2, title: "Draft job created", description: "A draft job is linked to your document, ready for processing." },
            { step: 3, title: "Operations review", description: "Our team will review the document and prepare your booking." },
          ].map((item) => (
            <li key={item.step} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--nexus-purple)] text-xs font-bold text-white">
                {item.step}
              </span>
              <div>
                <p className="text-sm font-medium text-[var(--nexus-graphite)]">{item.title}</p>
                <p className="text-xs text-slate-500">{item.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
