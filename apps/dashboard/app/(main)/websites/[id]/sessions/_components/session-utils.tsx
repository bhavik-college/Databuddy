import { GlobeIcon, AlertTriangleIcon, FileTextIcon, MousePointerClickIcon, ZapIcon, SparklesIcon } from "lucide-react";
import { getBrowserIcon, getOSIcon, getDeviceTypeIcon } from "../../_components/utils/technology-helpers";
import Image from "next/image";

// Default date range for testing
export const getDefaultDateRange = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    return {
        start_date: thirtyDaysAgo.toISOString().split("T")[0],
        end_date: today.toISOString().split("T")[0],
        granularity: 'daily' as 'hourly' | 'daily',
    };
};

// Helper function to get device icon
export const getDeviceIcon = (device: string) => {
    return getDeviceTypeIcon(device, 'md');
};

export const getBrowserIconComponent = (browser: string) => {
    const iconPath = getBrowserIcon(browser);
    return (
        <img
            src={iconPath}
            alt={browser}
            className="w-4 h-4 object-contain"
            onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
            }}
        />
    );
};

export const getOSIconComponent = (os: string) => {
    const iconPath = getOSIcon(os);
    return (
        <img
            src={iconPath}
            alt={os}
            className="w-4 h-4 object-contain"
            onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
            }}
        />
    );
};

export const getCountryFlag = (country: string) => {
    if (!country || country === 'Unknown') {
        return <GlobeIcon className="w-4 h-4 text-muted-foreground" />;
    }

    return (
        <img
            src={`https://flagcdn.com/w40/${country.toLowerCase()}.png`}
            alt={`${country} flag`}
            className="w-5 h-4 object-cover rounded-sm"
            width={20}
            height={20}
        />
    );
};

// Helper function to get event icon and color
export const getEventIconAndColor = (eventName: string, hasError: boolean, hasProperties: boolean) => {
    if (hasError) {
        return {
            icon: <AlertTriangleIcon className="w-4 h-4" />,
            color: 'text-destructive',
            bgColor: 'bg-destructive/10',
            borderColor: 'border-destructive/20',
            badgeColor: 'bg-destructive/10 text-destructive border-destructive/20'
        };
    }

    if (hasProperties) {
        return {
            icon: <SparklesIcon className="w-4 h-4" />,
            color: 'text-accent-foreground',
            bgColor: 'bg-accent/20',
            borderColor: 'border-accent',
            badgeColor: 'bg-accent text-accent-foreground border-accent'
        };
    }

    switch (eventName) {
        case 'screen_view':
        case 'page_view':
            return {
                icon: <FileTextIcon className="w-4 h-4" />,
                color: 'text-primary',
                bgColor: 'bg-primary/10',
                borderColor: 'border-primary/20',
                badgeColor: 'bg-primary/10 text-primary border-primary/20'
            };
        case 'click':
        case 'player-page-tab':
            return {
                icon: <MousePointerClickIcon className="w-4 h-4" />,
                color: 'text-secondary-foreground',
                bgColor: 'bg-secondary/50',
                borderColor: 'border-secondary',
                badgeColor: 'bg-secondary text-secondary-foreground border-secondary'
            };
        default:
            return {
                icon: <ZapIcon className="w-4 h-4" />,
                color: 'text-muted-foreground',
                bgColor: 'bg-muted/30',
                borderColor: 'border-muted',
                badgeColor: 'bg-muted text-muted-foreground border-muted'
            };
    }
};

// Helper function to clean up URLs and make them more readable
export const cleanUrl = (url: string) => {
    if (!url) return '';
    try {
        const urlObj = new URL(url);
        let path = urlObj.pathname;

        // Remove trailing slash unless it's the root
        if (path.length > 1 && path.endsWith('/')) {
            path = path.slice(0, -1);
        }

        // Add query params if they exist
        const search = urlObj.search;
        return path + search;
    } catch {
        // If it's not a full URL, clean it up
        let cleanPath = url.startsWith('/') ? url : `/${url}`;

        // Remove trailing slash unless it's the root
        if (cleanPath.length > 1 && cleanPath.endsWith('/')) {
            cleanPath = cleanPath.slice(0, -1);
        }

        return cleanPath;
    }
};

// Helper function to get a shorter display version of the path
export const getDisplayPath = (path: string) => {
    if (!path || path === '/') return '/';

    const cleanPath = cleanUrl(path);

    // If path is too long, show first part + ... + last part
    if (cleanPath.length > 40) {
        const parts = cleanPath.split('/').filter(Boolean);
        if (parts.length > 2) {
            return `/${parts[0]}/.../${parts[parts.length - 1]}`;
        }
    }

    return cleanPath;
};

export const formatPropertyValue = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'boolean') return value.toString();
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
}; 