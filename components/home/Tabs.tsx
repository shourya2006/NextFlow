import { Search, ChevronDown } from "lucide-react";

export default function Tabs({
  hideControls = false,
}: {
  hideControls?: boolean;
}) {
  const tabs = ["Projects", "Apps", "Examples", "Templates"];

  return (
    <div className="w-full px-12 pt-14">
      <div className="flex w-full flex-wrap items-center justify-between gap-2 border-b border-[#262626] pb-3">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab, idx) => (
            <button
              key={tab}
              className={`inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-[14px] font-medium transition-colors focus-visible:outline-none disabled:opacity-50 ${
                idx === 0
                  ? "bg-[#262626] text-white"
                  : "text-zinc-400 hover:text-zinc-300 hover:bg-[#1a1a1a]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Action Controls */}
        {!hideControls && (
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative hidden w-full max-w-[200px] md:flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-zinc-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search projects..."
                className="bg-[#121212] border border-[#262626] flex h-9 w-full rounded-md py-1 pl-9 pr-3 text-[13px] text-zinc-200 placeholder:text-zinc-600 transition-colors focus:outline-none focus:border-zinc-500"
              />
            </div>

            {/* Sort Dropdown */}
            <button className="flex h-9 items-center justify-between gap-2 rounded-md border border-[#262626] bg-transparent px-3 py-2 text-[13px] text-white hover:bg-[#1a1a1a] transition-colors focus:outline-none">
              <span>Last viewed</span>
              <ChevronDown className="w-4 h-4 text-zinc-500" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
