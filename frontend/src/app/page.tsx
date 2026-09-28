import { Suspense } from "react";
import { LedgerDashboard } from "@/components/LedgerDashboard";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#06080d] flex items-center justify-center text-slate-400">
          <div className="flex items-center space-x-2 text-xs font-mono font-bold tracking-wider uppercase text-slate-300">
            <Loader2 className="h-5 w-5 animate-spin text-[#00ff87]" />
            <span>Initializing Supanova Inbox Control Plane...</span>
          </div>
        </div>
      }
    >
      <LedgerDashboard />
    </Suspense>
  );
}
