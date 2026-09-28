import { Suspense } from "react";
import { LedgerDashboard } from "@/components/LedgerDashboard";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fbfbfd] flex items-center justify-center text-zinc-500">
          <div className="flex items-center space-x-2 text-xs font-mono font-bold tracking-wider uppercase text-zinc-700">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
            <span>Initializing Supanova Inbox Control Plane...</span>
          </div>
        </div>
      }
    >
      <LedgerDashboard />
    </Suspense>
  );
}
