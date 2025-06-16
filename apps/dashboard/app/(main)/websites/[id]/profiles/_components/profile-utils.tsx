import { GlobeIcon } from "lucide-react";
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

// Helper function to format duration
export const formatDuration = (seconds: number): string => {
    if (!seconds || seconds < 60) {
        return `${Math.round(seconds || 0)}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);

    if (minutes < 60) {
        return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}; 