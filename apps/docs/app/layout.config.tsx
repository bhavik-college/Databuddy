import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { Github, Home, Twitter } from 'lucide-react';

export const baseOptions: BaseLayoutProps = {
  nav: {
    enabled: false,
    title: (
      <div className="flex items-center gap-2.5">
        <img 
          src="/logo.png" 
          alt="Databuddy Logo" 
          width={32} 
          height={32} 
          className="rounded-full"
        />
        <span className="font-semibold">Databuddy</span>
      </div>
    ),
    transparentMode: 'top',
  },
  links: [
    {
      text: 'Dashboard',
      url: 'https://app.databuddy.cc',
      external: true,
      icon: <Home />,
    },
    {
      text: 'GitHub',
      url: 'https://github.com/databuddy-analytics',
      external: true,
      icon: <Github />,
      secondary: true,
    },
    {
      text: 'Discord',
      url: 'https://discord.gg/JTk7a38tCZ',
      external: true,
      // icon: <Discord />,
    },
    {
      text: 'Twitter',
      url: 'https://x.com/databuddyps',
      external: true,
      icon: <Twitter />,
    }
  ],
};
