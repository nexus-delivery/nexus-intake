type DocumentStatus = 
  | "Uploaded" 
  | "Processing" 
  | "Processed" 
  | "Needs Review" 
  | "Confirmed" 
  | "Failed";

type DocumentStatusBadgeProps = {
  status: DocumentStatus;
};

const statusClasses: Record<DocumentStatus, string> = {
  "Uploaded": "bg-slate-200 text-slate-700",
  "Processing": "bg-sky-200 text-sky-700",
  "Processed": "bg-emerald-200 text-emerald-700",
  "Needs Review": "bg-amber-200 text-amber-700",
  "Confirmed": "bg-purple-200 text-purple-700",
  "Failed": "bg-red-200 text-red-700",
};

export default function DocumentStatusBadge({ status }: DocumentStatusBadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[status]}`}>
      {status}
    </span>
  );
}
