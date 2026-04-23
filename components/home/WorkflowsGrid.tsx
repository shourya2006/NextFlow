"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, MoreVertical, ExternalLink, Pencil, Trash } from "lucide-react";

type Workflow = {
  id: number;
  title: string;
  date: string;
};

export default function WorkflowsGrid({ workflows = [] }: { workflows?: Workflow[] }) {
  const router = useRouter();
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  const toggleDropdown = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setOpenDropdownId(openDropdownId === id ? null : id);
  };

  return (
    <div className="px-12 pb-12 w-full" onClick={() => setOpenDropdownId(null)}>
      <section className="pt-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-x-6 gap-y-10 pb-5">
          <button 
            onClick={() => router.push(`/workflow/${Date.now()}`)}
            className="group flex w-full flex-col items-start gap-3 text-left"
          >
            <div className="border border-[#262626] bg-[#1a1a1a] flex aspect-[2/1.33] w-full items-center justify-center rounded-md transition-all duration-200 group-hover:scale-[0.98] group-active:scale-[0.95]">
              <div className="border border-[#333] flex w-8 h-8 items-center justify-center rounded-full bg-white transition-transform duration-200 ease-out group-hover:scale-110">
                <Plus className="w-4 h-4 text-black" strokeWidth={2.5} />
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="font-medium text-white text-[14px]">New Workflow</p>
            </div>
          </button>

          {/* Workflows */}
          {workflows.map((ele) => (
             <div key={ele.id} className="group flex w-full flex-col items-start gap-3 text-left cursor-pointer relative">
               <div 
                 onClick={() => router.push(`/workflow/${ele.id}`)}
                 className="relative border border-[#262626] bg-[#141414] flex aspect-[2/1.33] w-full items-center justify-center rounded-md transition-all duration-200 hover:border-[#404040]"
               >
                 <button 
                   onClick={(e) => toggleDropdown(e, ele.id)}
                   className={`absolute top-2 right-2 p-1.5 rounded-md transition-opacity focus:outline-none ${openDropdownId === ele.id ? 'opacity-100 bg-[#333]' : 'opacity-0 group-hover:opacity-100 hover:bg-[#333]'}`}
                 >
                   <MoreVertical className="w-4 h-4 text-white" />
                 </button>

                 {/* Dropdown Menu */}
                 {openDropdownId === ele.id && (
                   <div 
                     className="absolute top-10 right-2 w-40 bg-[#0a0a0a] border border-[#262626] rounded-xl shadow-2xl py-1 z-50 flex flex-col overflow-hidden"
                     onClick={(e) => e.stopPropagation()}
                   >
                     <button 
                       onClick={() => router.push(`/workflow/${ele.id}`)}
                       className="flex items-center gap-3 px-3 py-2 text-[14px] text-zinc-200 hover:bg-[#1a1a1a] transition-colors text-left w-full"
                     >
                       <ExternalLink className="w-4 h-4" />
                       Open
                     </button>
                     <button className="flex items-center gap-3 px-3 py-2 text-[14px] text-zinc-200 hover:bg-[#1a1a1a] transition-colors text-left w-full mb-1">
                       <Pencil className="w-4 h-4" />
                       Rename
                     </button>
                     <div className="h-[1px] bg-[#262626] w-full" />
                     <button className="flex items-center gap-3 px-3 py-2 mt-1 text-[14px] text-[#f87171] hover:bg-[#1a1a1a] transition-colors text-left w-full">
                       <Trash className="w-4 h-4" />
                       Delete
                     </button>
                   </div>
                 )}
               </div>
               <div className="flex flex-col gap-0.5 mt-0.5">
                 <p className="font-medium text-white text-[14px] leading-tight">{ele.title}</p>
                 <p className="text-[13px] text-zinc-500 font-book leading-tight">{ele.date}</p>
               </div>
             </div>
          ))}
        </div>
      </section>
    </div>
  );
}
