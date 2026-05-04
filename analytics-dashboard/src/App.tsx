import { useState } from "react";
import { Smartphone, BookOpen, Settings } from "lucide-react";
import { PwaPage } from "@/pages/PwaPage";
import { ManualPage } from "@/pages/ManualPage";
import { ConfigPage } from "@/pages/ConfigPage";

type Page = "pwa" | "manual" | "config";

export default function App() {
  const [page, setPage] = useState<Page>("pwa");

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0d1520] text-white">
      <div className="flex-1 overflow-hidden">
        {page === "pwa" && <PwaPage />}
        {page === "manual" && <ManualPage />}
        {page === "config" && <ConfigPage />}
      </div>

      <nav className="shrink-0 flex border-t border-white/15 bg-[#111d2e]">
        {([
          { id: "pwa", icon: Smartphone, label: "PWA â APK" },
          { id: "manual", icon: BookOpen, label: "Manual Dev" },
          { id: "config", icon: Settings, label: "Config" },
        ] as { id: Page; icon: typeof Smartphone; label: string }[]).map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setPage(id)}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all relative ${
              page === id ? "text-violet-400" : "text-white/30 hover:text-white/60"
            }`}
          >
            <Icon size={20} strokeWidth={page === id ? 2.5 : 1.5} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
