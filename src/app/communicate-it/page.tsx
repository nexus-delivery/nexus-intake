import AppShell from "@/components/AppShell";
import { WorkspaceCardGrid, WorkspaceHero } from "@/components/WorkspaceDesignSystem";

const sections = [
  {
    title: "CircleLoop",
    description: "Person-to-person calling and contact history.",
    href: "#",
    status: "coming-soon",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07 19.4 19.4 0 01-6-6A19.8 19.8 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72 12.7 12.7 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.7 12.7 0 002.81.7A2 2 0 0122 16.92z" />
      </svg>
    ),
  },
  {
    title: "Email",
    description: "Human follow-up and customer service email threads.",
    href: "#",
    status: "coming-soon",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 6 9-6" />
      </svg>
    ),
  },
  {
    title: "WhatsApp",
    description: "High-speed merchant and customer messaging.",
    href: "#",
    status: "coming-soon",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M20 11.5a8.5 8.5 0 1 1-3.53-6.88L20 3l-1.62 3.93A8.43 8.43 0 0 1 20 11.5z" />
        <path d="M8.5 8.5c.3-1.1 1-1.3 1.8-.6l1 1a1 1 0 0 1 .2 1.2l-.4.8a10 10 0 0 0 3.2 3.2l.8-.4a1 1 0 0 1 1.2.2l1 1c.7.8.5 1.5-.6 1.8-2.6.8-6.3-1-8.2-3.1-2.1-1.9-4-5.6-3.1-8.2z" />
      </svg>
    ),
  },
  {
    title: "SMS",
    description: "Text follow-ups, delivery reminders and internal prompts.",
    href: "#",
    status: "coming-soon",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M21 15a2 2 0 0 1-2 2H8l-4 4V7a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    title: "Internal Notes",
    description: "Shared notes and contact timelines for the team.",
    href: "#",
    status: "coming-soon",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M9 12h6M9 16h6M9 8h6M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      </svg>
    ),
  },
  {
    title: "Follow-ups",
    description: "Action tracking for sales, service and support callbacks.",
    href: "#",
    status: "coming-soon",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M12 8v4l3 3" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  },
];

export default function CommunicateItPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <WorkspaceHero
          kicker="CRM and human comms"
          title="Communicate it"
          description="Person-to-person communication for sales, support and follow-up. Notify-it remains the automated layer."
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-8 w-8">
              <path d="M21 15a2 2 0 0 1-2 2H8l-4 4V7a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" />
            </svg>
          }
        />
        <WorkspaceCardGrid items={sections} />
      </div>
    </AppShell>
  );
}
