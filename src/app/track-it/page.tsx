import AppShell from "@/components/AppShell";
import { WorkspaceCardGrid, WorkspaceHero, WorkspaceInfoStrip } from "@/components/WorkspaceDesignSystem";

const sections = [
  {
    title: "Routed",
    description: "Jobs accepted by Track-POD and queued against planned route runs.",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
        <line x1="9" y1="3" x2="9" y2="18" />
        <line x1="15" y1="6" x2="15" y2="21" />
      </svg>
    ),
  },
  {
    title: "Driver assigned",
    description: "Track assignment from planning through driver acknowledgement.",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M3 7l9-4 9 4v10l-9 4-9-4V7z" />
        <path d="M12 3v18M3 7l9 4 9-4" />
      </svg>
    ),
  },
  {
    title: "Collected",
    description: "Collection events confirmed in Track-POD and synced into Track it.",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M9 12l2 2 4-4" />
        <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
      </svg>
    ),
  },
  {
    title: "In transit",
    description: "Transit milestones and ETA movement after collection completion.",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M12 8v4l3 3" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  },
  {
    title: "Delivered",
    description: "Delivery completion and final stop confirmation from Track-POD.",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
  },
  {
    title: "Failed / exception / POD",
    description: "Capture failed outcomes, exception reason, and POD asset availability.",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
];

export default function TrackItPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <WorkspaceHero
          kicker="Control centre"
          title="Track it"
          description="Track it begins after Move it / Route it and gives customer, merchant and ops visibility."
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-8 w-8">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
          }
        />

        <WorkspaceInfoStrip
          title="Operations telemetry active"
          description="Live progress, tracking links, exceptions, POD and delivery-status visibility after movement begins."
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <path d="M12 8v4l3 3" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          }
        />

        <WorkspaceCardGrid items={sections} />
      </div>
    </AppShell>
  );
}
