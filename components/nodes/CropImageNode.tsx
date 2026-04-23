import { Handle, Position, useReactFlow } from "@xyflow/react";
import { Crop, Upload } from "lucide-react";
import RunWorkflowButton from "./RunWorkflowButton";

export default function CropImageNode({ id, data, selected }: { id: string, data: any, selected?: boolean }) {
  const { setNodes } = useReactFlow();

  const handleParamChange = (param: string, value: string) => {
    setNodes((ele) => 
      ele.map((n) => (n.id === id ? { ...n, data: { ...n.data, [param]: parseFloat(value) || 0 } } : n))
    );
  };

  return (
    <div className="relative font-sans mt-8 group">
      <RunWorkflowButton nodeId={id} selected={selected} />
      
      <div className="absolute -top-7 left-1 flex items-center gap-2">
        <div className="text-[#14b8a6]">
          <Crop size={16} strokeWidth={2.5} />
        </div>
        <span className="text-[14px] font-medium text-zinc-400">Crop Image</span>
      </div>

      <div className={`bg-[#1c1c1c] w-[260px] rounded-2xl shadow-xl overflow-hidden border border-[#262626] flex flex-col transition-all ${selected ? 'ring-2 ring-[#14b8a6]' : ''}`}>

        <div className="h-[120px] relative flex items-center justify-center border-b border-[#262626]">
          
          <Handle
            type="target"
            position={Position.Left}
            className="w-4 h-4 bg-[#14b8a6] border-4 border-[#1c1c1c] rounded-full left-[-8px] top-1/2 transform-none z-10"
            style={{ transform: "translateY(-50%)" }}
          />

          <button className="flex flex-col items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors">
            <Upload size={20} strokeWidth={2} />
            <span className="text-[13px] font-medium">Upload</span>
          </button>

          <Handle
            type="source"
            position={Position.Right}
            className="w-4 h-4 bg-[#14b8a6] border-4 border-[#1c1c1c] rounded-full right-[-8px] top-1/2 transform-none z-10"
            style={{ transform: "translateY(-50%)" }}
          />
        </div>

        <div className="p-3 bg-[#161616]">
          <div className="grid grid-cols-2 gap-2">

            <div className="flex items-center justify-between bg-[#121212] border border-[#262626] rounded-lg px-2.5 py-1.5 focus-within:border-[#14b8a6] transition-colors">
              <span className="text-zinc-500 text-[11px] font-bold w-4">X</span>
              <div className="flex items-center">
                <input 
                  type="number" 
                  value={data.x ?? 0} 
                  onChange={(e) => handleParamChange('x', e.target.value)}
                  className="w-10 bg-transparent text-zinc-300 text-[12px] text-right outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none m-0 [-moz-appearance:textfield]" 
                />
                <span className="text-zinc-600 text-[12px] ml-1">%</span>
              </div>
            </div>

            <div className="flex items-center justify-between bg-[#121212] border border-[#262626] rounded-lg px-2.5 py-1.5 focus-within:border-[#14b8a6] transition-colors">
              <span className="text-zinc-500 text-[11px] font-bold w-4">Y</span>
              <div className="flex items-center">
                <input 
                  type="number" 
                  value={data.y ?? 0} 
                  onChange={(e) => handleParamChange('y', e.target.value)}
                  className="w-10 bg-transparent text-zinc-300 text-[12px] text-right outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none m-0 [-moz-appearance:textfield]" 
                />
                <span className="text-zinc-600 text-[12px] ml-1">%</span>
              </div>
            </div>

            <div className="flex items-center justify-between bg-[#121212] border border-[#262626] rounded-lg px-2.5 py-1.5 focus-within:border-[#14b8a6] transition-colors">
              <span className="text-zinc-500 text-[11px] font-bold w-4">W</span>
              <div className="flex items-center">
                <input 
                  type="number" 
                  value={data.w ?? 100} 
                  onChange={(e) => handleParamChange('w', e.target.value)}
                  className="w-10 bg-transparent text-zinc-300 text-[12px] text-right outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none m-0 [-moz-appearance:textfield]" 
                />
                <span className="text-zinc-600 text-[12px] ml-1">%</span>
              </div>
            </div>

            <div className="flex items-center justify-between bg-[#121212] border border-[#262626] rounded-lg px-2.5 py-1.5 focus-within:border-[#14b8a6] transition-colors">
              <span className="text-zinc-500 text-[11px] font-bold w-4">H</span>
              <div className="flex items-center">
                <input 
                  type="number" 
                  value={data.h ?? 100} 
                  onChange={(e) => handleParamChange('h', e.target.value)}
                  className="w-10 bg-transparent text-zinc-300 text-[12px] text-right outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none m-0 [-moz-appearance:textfield]" 
                />
                <span className="text-zinc-600 text-[12px] ml-1">%</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
