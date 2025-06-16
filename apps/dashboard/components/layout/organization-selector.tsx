// "use client";

// import * as React from "react";
// import { ChevronDown, Plus, Building2, Users } from "lucide-react";
// import { useOrganizationSelector } from "@databuddy/auth/client";
// import { cn } from "@/lib/utils";
// import { useRouter } from "next/navigation";

// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { Button } from "@/components/ui/button";
// import { Skeleton } from "@/components/ui/skeleton";

// export function OrganizationSelector() {
//   const { organizations, activeOrganization, isLoading, selectOrganization } = useOrganizationSelector();
//   const router = useRouter();
  
//   if (isLoading) {
//     return (
//       <div className="flex items-center space-x-2 px-2 py-1.5">
//         <Skeleton className="h-8 w-8 rounded-md" />
//         <div className="space-y-1.5">
//           <Skeleton className="h-4 w-20" />
//           <Skeleton className="h-3 w-14" />
//         </div>
//       </div>
//     );
//   }
  
//   const handleSelectOrganization = async (id: string) => {
//     await selectOrganization(id);
//   };
  
//   const handleCreateOrganization = () => {
//     router.push("/organizations/new");
//   };
  
//   return (
//     <DropdownMenu>
//       <DropdownMenuTrigger asChild>
//         <Button 
//           variant="ghost" 
//           className="flex items-center justify-between w-full px-2 py-1.5 h-auto text-left hover:bg-slate-800/50"
//         >
//           <div className="flex items-center gap-2">
//             <div className="flex items-center justify-center w-8 h-8 rounded-md bg-slate-800 text-slate-200">
//               {activeOrganization?.logo ? (
//                 <img 
//                   src={activeOrganization.logo} 
//                   alt={activeOrganization.name} 
//                   className="w-full h-full object-cover rounded-md" 
//                 />
//               ) : (
//                 <Building2 className="h-4 w-4" />
//               )}
//             </div>
//             <div className="flex flex-col">
//               <span className="text-sm font-medium truncate max-w-[140px]">
//                 {activeOrganization?.name || "Personal"}
//               </span>
//               <span className="text-xs text-slate-400 truncate max-w-[140px]">
//                 {activeOrganization?.slug || "Select organization"}
//               </span>
//             </div>
//           </div>
//           <ChevronDown className="h-4 w-4 text-slate-400" />
//         </Button>
//       </DropdownMenuTrigger>
//       <DropdownMenuContent className="w-56" align="start">
//         {organizations && organizations.length > 0 ? (
//           <>
//             <div className="text-xs font-medium px-2 py-1.5 text-slate-400">
//               Your organizations
//             </div>
//             {organizations.map((org) => (
//               <DropdownMenuItem
//                 key={org.id}
//                 onClick={() => handleSelectOrganization(org.id)}
//                 className={cn(
//                   "flex items-center gap-2 cursor-pointer",
//                   activeOrganization?.id === org.id && "bg-slate-800"
//                 )}
//               >
//                 <div className="flex items-center justify-center w-6 h-6 rounded bg-slate-800 text-slate-200">
//                   {org.logo ? (
//                     <img
//                       src={org.logo}
//                       alt={org.name}
//                       className="w-full h-full object-cover rounded"
//                     />
//                   ) : (
//                     <Building2 className="h-3 w-3" />
//                   )}
//                 </div>
//                 <span className="text-sm truncate">{org.name}</span>
//               </DropdownMenuItem>
//             ))}
//             <DropdownMenuSeparator />
//           </>
//         ) : (
//           <div className="text-xs text-center py-2 px-2 text-slate-400">
//             No organizations yet
//           </div>
//         )}
//         <DropdownMenuItem
//           onClick={handleCreateOrganization}
//           className="flex items-center gap-2 cursor-pointer"
//         >
//           <Plus className="h-4 w-4" />
//           <span className="text-sm">Create Organization</span>
//         </DropdownMenuItem>
//         <DropdownMenuItem
//           onClick={() => router.push("/organizations/settings")}
//           className="flex items-center gap-2 cursor-pointer"
//         >
//           <Users className="h-4 w-4" />
//           <span className="text-sm">Manage Organizations</span>
//         </DropdownMenuItem>
//       </DropdownMenuContent>
//     </DropdownMenu>
//   );
// } 