import { useThemeStore } from "@/store/themeStore";

/** Shared theme classes for all node components */
export function useNodeTheme() {
  const theme = useThemeStore((s) => s.theme);
  const d = theme === "dark";

  return {
    theme,
    card: d ? "bg-[#1c1c1c] border-[#262626]" : "bg-white border-zinc-300",

    header: d ? "bg-[#181818] border-[#262626]" : "bg-zinc-50 border-zinc-200",

    input: d ? "bg-[#121212] border-[#262626] text-zinc-200" : "bg-zinc-100 border-zinc-300 text-zinc-800",
    inputDisabled: d ? "text-zinc-500" : "text-zinc-400",

    handleBorder: d ? "border-[#1c1c1c]" : "border-white",

    label: d ? "text-zinc-400" : "text-zinc-500",
    labelBold: d ? "text-zinc-500" : "text-zinc-400",
    labelMuted: d ? "text-zinc-600" : "text-zinc-400",

    textValue: d ? "text-zinc-300" : "text-zinc-700",
    textPrimary: d ? "text-zinc-200" : "text-zinc-800",
    textMuted: d ? "text-zinc-500" : "text-zinc-400",

    output: d ? "bg-[#101010] border-[#262626] hover:bg-[#151515]" : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100",
    outputAlt: d ? "bg-[#161616] hover:bg-[#1a1a1a]" : "bg-zinc-50 hover:bg-zinc-100",

    params: d ? "bg-[#161616]" : "bg-zinc-50",
    action: d ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-600",
  };
}
