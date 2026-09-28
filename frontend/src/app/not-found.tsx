import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#fbfbfd] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-zinc-200 rounded-2xl p-8 shadow-xl shadow-zinc-950/5 text-center">
        <div className="h-12 w-12 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-700 flex items-center justify-center mx-auto mb-4">
          <Search className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-extrabold text-zinc-900 tracking-tight mb-2">
          Signal Record Not Found
        </h2>
        <p className="text-sm text-zinc-600 mb-6">
          The requested ledger slice or endpoint does not exist.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all shadow-sm active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Ledger</span>
        </Link>
      </div>
    </div>
  );
}
