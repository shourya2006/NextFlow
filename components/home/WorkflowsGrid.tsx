"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Plus, MoreVertical, ExternalLink, Pencil, Trash } from "lucide-react";

type Workflow = {
  id: string;
  title: string;
  updatedAt: string;
};

export default function WorkflowsGrid({ workflows = [], onWorkflowDeleted }: { workflows?: Workflow[], onWorkflowDeleted?: () => void }) {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const toggleDropdown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setOpenDropdownId(openDropdownId === id ? null : id);
  };

  const handleCreate = async () => {
    if (!isSignedIn) {
      alert("Please sign in to create workflows.");
      return;
    }
    try {
      const res = await fetch("/api/workflows", { method: "POST", body: JSON.stringify({ title: "Untitled Workflow" }) });
      if (res.ok) {
        const wf = await res.json();
        router.push(`/workflow/${wf.id}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await fetch(`/api/workflows/${id}`, { method: "DELETE" });
      if (onWorkflowDeleted) onWorkflowDeleted();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRenameSubmit = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    try {
      await fetch(`/api/workflows/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle })
      });
      setEditingId(null);
      if (onWorkflowDeleted) onWorkflowDeleted();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="px-12 pb-12 w-full" onClick={() => setOpenDropdownId(null)}>
      <section className="pt-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-x-6 gap-y-10 pb-5">
          <button 
            onClick={handleCreate}
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
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(ele.id);
                          setEditTitle(ele.title);
                          setOpenDropdownId(null);
                        }}
                        className="flex items-center gap-3 px-3 py-2 text-[14px] text-zinc-200 hover:bg-[#1a1a1a] transition-colors text-left w-full mb-1"
                      >
                        <Pencil className="w-4 h-4" />
                        Rename
                      </button>
                     <div className="h-[1px] bg-[#262626] w-full" />
                     <button 
                       onClick={(e) => handleDelete(e, ele.id)}
                       className="flex items-center gap-3 px-3 py-2 mt-1 text-[14px] text-[#f87171] hover:bg-[#1a1a1a] transition-colors text-left w-full"
                     >
                       <Trash className="w-4 h-4" />
                       Delete
                     </button>
                   </div>
                 )}
               </div>
               <div className="flex flex-col gap-0.5 mt-0.5 w-full">
                 {editingId === ele.id ? (
                   <form onSubmit={(e) => handleRenameSubmit(e, ele.id)} className="w-full">
                     <input
                       autoFocus
                       type="text"
                       value={editTitle}
                       onChange={(e) => setEditTitle(e.target.value)}
                       onBlur={(e) => handleRenameSubmit(e, ele.id)}
                       onClick={(e) => e.stopPropagation()}
                       className="bg-[#1a1a1a] border border-[#333] rounded px-2 py-0.5 text-[14px] text-white w-full outline-none focus:border-[#666]"
                     />
                   </form>
                 ) : (
                   <p 
                     className="font-medium text-white text-[14px] leading-tight truncate w-full"
                     onClick={(e) => {
                       if (editingId) e.stopPropagation();
                     }}
                   >
                     {ele.title}
                   </p>
                 )}
                 <p className="text-[13px] text-zinc-500 font-book leading-tight">
                   {new Date(ele.updatedAt).toLocaleDateString()}
                 </p>
               </div>
             </div>
          ))}
        </div>
      </section>
    </div>
  );
}
