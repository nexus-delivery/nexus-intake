import DocumentStatusBadge from "./DocumentStatusBadge";

export type DocumentTableRow = {
  id: string;
  name: string;
  merchant: string;
  type: "Delivery Note" | "Manifest" | "Purchase Order";
  status: "Uploaded" | "Processing" | "Extracted" | "Needs Review" | "Confirmed" | "Failed";
  uploaded: string;
};

type DocumentsTableProps = {
  documents?: DocumentTableRow[];
};

const defaultDocuments: DocumentTableRow[] = [];

export default function DocumentsTable({ documents = defaultDocuments }: DocumentsTableProps) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white shadow-sm shadow-slate-200/40">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                Document Name
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                Customer
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                Document Type
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                Status
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                Uploaded
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr
                key={doc.id}
                className="border-b border-slate-100 hover:bg-slate-50 transition"
              >
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-slate-600">{doc.merchant}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-slate-600">{doc.type}</p>
                </td>
                <td className="px-6 py-4">
                  <DocumentStatusBadge status={doc.status} />
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-slate-600">{doc.uploaded}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button className="text-sm font-medium text-sky-600 hover:text-sky-700 transition">
                      View
                    </button>
                    <span className="text-slate-300">·</span>
                    <button className="text-sm font-medium text-sky-600 hover:text-sky-700 transition">
                      Review
                    </button>
                    <span className="text-slate-300">·</span>
                    <button className="text-sm font-medium text-sky-600 hover:text-sky-700 transition">
                      Create Order
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {documents.length === 0 && (
        <div className="flex items-center justify-center px-6 py-12">
          <p className="text-sm text-slate-500">No documents uploaded yet.</p>
        </div>
      )}
    </div>
  );
}
