import { ArrowUpRight } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="px-12 w-full pb-12">
      <section className="pt-8">
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-6 p-6 text-center text-balance md:p-12">
          <div className="flex max-w-xs flex-col items-center gap-2 text-center">
            <div className="mb-2 flex shrink-0 items-center justify-center bg-transparent">
              <img 
                alt="Workflows icon" 
                className="w-[48px] h-[48px] shadow-sm rounded-lg" 
                draggable="false" 
                src="https://optim-images.krea.ai/https---s-krea-ai-icons-NodeEditor-png-256.webp" 
              />
            </div>
            <div className="text-[18px] font-medium tracking-tight text-white mb-1">
              No Workflows Yet
            </div>
            <div className="text-zinc-500 text-[14px] leading-relaxed">
              You haven't created any workflows yet. Get started by creating your first one.
            </div>
          </div>

          <div className="flex w-full max-w-sm min-w-0 flex-col items-center gap-4 text-sm text-balance">
            <div className="flex gap-2">
              <button 
                type="button"
                className="inline-flex shrink-0 items-center justify-center gap-2 text-[14px] font-medium transition-all outline-none bg-white text-black hover:bg-zinc-200 h-10 px-10 rounded-full" 
              >
                New Workflow
              </button>
            </div>
          </div>

          <button 
            type="button"
            className="inline-flex shrink-0 items-center justify-center text-[13px] font-medium whitespace-nowrap transition-all outline-none underline-offset-4 hover:underline hover:text-white h-8 gap-1.5 px-3 rounded-full text-zinc-500"
          >
            <a href="https://x.com/krea_ai/status/1986459811462926574" target="_blank" className="flex items-center gap-1">
              Learn More <ArrowUpRight className="inline w-3.5 h-3.5" />
            </a>
          </button>
        </div>
      </section>
    </div>
  );
}
