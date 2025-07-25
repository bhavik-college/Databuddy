'use client';

import { Settings, Table } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface TableTabsProps {
  database: string;
  table: string;
}

export function TableTabs({ database, table }: TableTabsProps) {
  const pathname = usePathname();

  const tabs = [
    {
      name: 'Data',
      href: `/table/${database}/${table}`,
      icon: Table,
      current: pathname === `/table/${database}/${table}`,
    },
    {
      name: 'Schema',
      href: `/table/${database}/${table}/schema`,
      icon: Settings,
      current: pathname === `/table/${database}/${table}/schema`,
    },
  ];

  return (
    <div className="border-border border-b bg-muted/30">
      <nav aria-label="Tabs" className="flex space-x-8 px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              className={cn(
                'flex items-center gap-2 border-b-2 px-1 py-3 font-medium text-sm transition-colors',
                tab.current
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-muted-foreground hover:text-foreground'
              )}
              href={tab.href}
              key={tab.name}
            >
              <Icon className="h-4 w-4" />
              {tab.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
