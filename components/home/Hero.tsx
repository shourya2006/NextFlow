"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Hero() {
  const router = useRouter();

  return (
    <div className="relative w-full text-white bg-[#121212] overflow-hidden min-h-[380px] flex items-center">
      {/* Background Layer */}
      <img
        src="https://s.krea.ai/nodesHeaderBannerBlurGradient.webp"
        alt="Hero Background"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover object-center"
      />
      <img
        src="https://s.krea.ai/nodesHeaderBannerBlurGradient.webp"
        alt="Hero Halo"
        className="pointer-events-none absolute inset-0 z-0 hidden h-full w-full scale-125 object-cover object-center opacity-30 blur-3xl md:block"
      />

      {/* Gradient Masks for Seamless Edge and Text Legibility */}
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#121212] via-[#121212]/80 to-transparent" />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent" />

      {/* Content Layer */}
      <div className="relative z-10 flex w-full flex-col justify-between gap-10 px-12 pt-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <img
              src="https://optim-images.krea.ai/https---s-krea-ai-icons-NodeEditor-png-256.webp"
              alt="Node Editor icon"
              className="w-10 h-10 object-contain shadow-md rounded-lg"
            />
            <h1 className="font-medium text-[36px] tracking-normal text-white">
              Node Editor
            </h1>
          </div>
          <p className="max-w-[400px] text-[16px] text-zinc-300 leading-relaxed font-light">
            Nodes is the most powerful way to operate NextFlow. Connect every
            tool and model into complex automated pipelines.
          </p>
        </div>

        <div className="flex flex-col gap-4 xl:flex-row pb-6">
          <button
            type="button"
            onClick={() => router.push(`/workflow/${Date.now()}`)}
            className="inline-flex shrink-0 items-center justify-center gap-2 text-[14px] font-medium transition-all outline-none bg-white text-black hover:bg-zinc-200 h-10 px-8 rounded-full group/btn active:scale-95 w-max"
          >
            New Workflow
            <ArrowRight
              className="w-4 h-4 transition-transform duration-150 ease-out group-hover/btn:translate-x-1"
              strokeWidth={2.5}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
