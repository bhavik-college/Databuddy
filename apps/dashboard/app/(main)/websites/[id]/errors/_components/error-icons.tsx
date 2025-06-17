import {
    BugIcon,
    MonitorIcon,
    PhoneIcon,
    CodeIcon,
    NetworkIcon,
    FileCodeIcon,
    TerminalIcon,
    LaptopIcon,
    TableIcon,
} from "@phosphor-icons/react";

// Get icon for error type
export const getErrorTypeIcon = (type: string) => {
    if (!type) return <BugIcon size={16} weight="duotone" className="h-4 w-4" />;

    const lowerType = type.toLowerCase();
    if (lowerType.includes('react')) return <CodeIcon size={16} weight="duotone" className="h-4 w-4" />;
    if (lowerType.includes('network')) return <NetworkIcon size={16} weight="duotone" className="h-4 w-4" />;
    if (lowerType.includes('script')) return <FileCodeIcon size={16} weight="duotone" className="h-4 w-4" />;
    if (lowerType.includes('syntax')) return <TerminalIcon size={16} weight="duotone" className="h-4 w-4" />;
    return <BugIcon size={16} weight="duotone" className="h-4 w-4" />;
};

// Get device icon
export const getDeviceIcon = (deviceType: string) => {
    if (!deviceType) return <MonitorIcon size={16} weight="duotone" className="h-4 w-4" />;

    switch (deviceType.toLowerCase()) {
        case 'mobile': return <PhoneIcon size={16} weight="duotone" className="h-4 w-4" />;
        case 'tablet': return <TableIcon size={16} weight="duotone" className="h-4 w-4" />;
        case 'desktop': return <LaptopIcon size={16} weight="duotone" className="h-4 w-4" />;
        default: return <MonitorIcon size={16} weight="duotone" className="h-4 w-4" />;
    }
}; 