import { useState } from "react";
import { BellIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NotificationList } from "./notification-list";
import { NotificationEmpty } from "./notification-empty";
import type { AuditNotification } from "./types";

const Notifications: AuditNotification[] = [

]


export function NotificationsPopover() {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <BellIcon size={32} weight="duotone" className="h-6 w-6" />
          {Notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-background text-[10px] font-medium text-primary-foreground flex items-center justify-center">
              {Notifications.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-card" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-medium">Notifications</h4>
          {Notifications.length > 0 && (
            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs">
              Mark all as read
            </Button>
          )}
        </div>
        {Notifications.length > 0 ? (
          <NotificationList notifications={Notifications} />
        ) : (
          <NotificationEmpty />
        )}
      </PopoverContent>
    </Popover>
  );
} 