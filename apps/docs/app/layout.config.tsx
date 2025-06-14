import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { Github, Home, Twitter } from 'lucide-react';
import { Logo } from '@/components/logo';

export const baseOptions: BaseLayoutProps = {
  nav: {
    enabled: false,
    title: <Logo />,
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
