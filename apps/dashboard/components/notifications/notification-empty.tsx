import { BellIcon } from "@phosphor-icons/react";

export function NotificationEmpty() {
  return (
    <div className="p-8 text-center text-muted-foreground">
      <BellIcon size={32} weight="duotone" className="h-10 w-10 mx-auto mb-2 opacity-50" />
      <p>No notifications yet</p>
    </div>
  );
} 