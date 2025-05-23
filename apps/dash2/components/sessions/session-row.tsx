import { format } from "date-fns";
import { Monitor, Smartphone, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SessionData } from "@/hooks/use-analytics";
import Image from "next/image";


interface SessionRowProps {
  session: SessionData;
  onClick: (session: SessionData) => void;
}

const getBrowserIcon = (browser: string) => {
  const browserMap: Record<string, string> = {
    'chrome': '/browsers/Chrome.svg',
    'firefox': '/browsers/Firefox.svg',
    'safari': '/browsers/Safari.svg',
    'edge': '/browsers/Edge.svg',
    'opera': '/browsers/Opera.svg',
    'ie': '/browsers/IE.svg',
    'samsung': '/browsers/SamsungInternet.svg',
  };
  return browserMap[browser?.toLowerCase() || ''] || '/browsers/Chrome.svg';
};

const getOSIcon = (os: string) => {
  const osMap: Record<string, string> = {
    'windows': '/operating-systems/Windows.svg',
    'macos': '/operating-systems/macOS.svg',
    'ios': '/operating-systems/Apple.svg',
    'android': '/operating-systems/Android.svg',
    'linux': '/operating-systems/Ubuntu.svg',
    'ubuntu': '/operating-systems/Ubuntu.svg',
  };
  return osMap[os?.toLowerCase() || ''] || '/operating-systems/Windows.svg';
};

export function SessionRow({ session, onClick }: SessionRowProps) {
  const hasValidCountry = session.country && session.country !== 'Unknown';
  
  return (
    <button 
      type="button"
      className="flex items-center justify-between p-3 border-b border-border/50 hover:bg-muted/30 transition-colors w-full text-left"
      onClick={() => onClick(session)}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-6 h-6">
          {hasValidCountry ? (
            <Image 
              src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${session.country.toUpperCase()}.svg`}
              alt={session.country}
              className="w-6 h-6 rounded-sm"
              width={24}
              height={24}
            />
          ) : (
            <Globe className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">
              {session.country || 'Unknown'}
            </span>
            <Badge variant={session.is_returning_visitor ? "default" : "secondary"} className="text-xs">
              {session.is_returning_visitor ? 'Return' : 'New'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {session.city && session.city !== 'Unknown' ? session.city : 'Unknown City'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-sm">
        <div className="text-center min-w-[70px]">
          <p className="text-xs font-medium">
            {session.first_visit ? format(new Date(session.first_visit), 'MMM d') : '-'}
          </p>
          <p className="text-xs text-muted-foreground">
            {session.first_visit ? format(new Date(session.first_visit), 'HH:mm') : '-'}
          </p>
        </div>
        
        <div className="text-center min-w-[50px]">
          <p className="text-xs font-medium">
            {session.duration ? `${Math.floor(session.duration / 60)}:${String(session.duration % 60).padStart(2, '0')}` : '0:00'}
          </p>
        </div>
        
        <div className="text-center min-w-[40px]">
          <p className="text-xs font-medium">{session.page_views || 0}</p>
        </div>
        
        <div className="flex items-center gap-1 min-w-[60px]">
          {session.device === 'desktop' ? <Monitor className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
          <span className="text-xs truncate">{session.device || 'Unknown'}</span>
        </div>
        
        <div className="flex items-center gap-1 min-w-[70px]">
          <img 
            src={getBrowserIcon(session.browser)} 
            alt={session.browser}
            className="w-3 h-3"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/browsers/Chrome.svg';
            }}
          />
          <span className="text-xs truncate">{session.browser || 'Unknown'}</span>
        </div>
        
        <div className="flex items-center gap-1 min-w-[60px]">
          <img 
            src={getOSIcon(session.os)} 
            alt={session.os}
            className="w-3 h-3"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/operating-systems/Windows.svg';
            }}
          />
          <span className="text-xs truncate">{session.os || 'Unknown'}</span>
        </div>
      </div>
    </button>
  );
} 