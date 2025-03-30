"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { DialogProps } from "@radix-ui/react-dialog"
import { Search } from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

// Search items organized by category
const searchItems = [
  {
    category: "Pages",
    items: [
      { name: "Dashboard", path: "/dashboard" },
      { name: "Analytics", path: "/analytics" },
      { name: "Reports", path: "/reports" },
      { name: "My Websites", path: "/websites" },
      { name: "Funnels", path: "/funnels" },
      { name: "Goals", path: "/goals" },
      { name: "Settings", path: "/settings" },
    ],
  },
  {
    category: "Actions",
    items: [
      { name: "Add New Website", path: "/websites/new" },
      { name: "Create Report", path: "/reports/new" },
      { name: "View All Funnels", path: "/funnels" },
    ],
  },
  {
    category: "Help",
    items: [
      { name: "Documentation", path: "/docs" },
      { name: "Support", path: "/support" },
    ],
  },
]

interface CommandSearchProps extends DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CommandSearch({ 
  open: controlledOpen, 
  onOpenChange: setControlledOpen,
  ...props 
}: CommandSearchProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const router = useRouter()
  
  // Determine if component is controlled or uncontrolled
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = React.useCallback((value: boolean | ((prevState: boolean) => boolean)) => {
    if (isControlled) {
      const newValue = typeof value === "function" ? value(controlledOpen) : value;
      setControlledOpen?.(newValue);
    } else {
      setInternalOpen(value);
    }
  }, [isControlled, controlledOpen, setControlledOpen]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [setOpen])

  return (
    <CommandDialog open={open} onOpenChange={setOpen} {...props}>
      <CommandInput placeholder="Search across dashboard..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {searchItems.map((group) => (
          <CommandGroup key={group.category} heading={group.category}>
            {group.items.map((item) => (
              <CommandItem
                key={item.path}
                onSelect={() => {
                  setOpen(false)
                  router.push(item.path)
                }}
              >
                <Search className="mr-2 h-4 w-4" />
                {item.name}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  )
} 