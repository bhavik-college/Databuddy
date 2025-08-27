'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

const BROWSER_ICONS = [
	'Chrome',
	'Firefox',
	'Safari',
	'Edge',
	'Opera',
	'OperaGX',
	'SamsungInternet',
	'UCBrowser',
	'Yandex',
	'Baidu',
	'QQ',
	'WeChat',
	'Instagram',
	'Facebook',
	'IE',
	'Chromium',
	'DuckDuckGo',
	'Avast',
	'AVG',
	'Android',
	'Huawei',
	'Miui',
	'Vivo',
	'Sogou',
	'CocCoc',
	'Whale',
	'WebKit',
	'Wolvic',
	'Sleipnir',
	'Silk',
	'Quark',
	'PaleMoon',
	'Oculus',
	'Naver',
	'Line',
	'Lenovo',
	'KAKAOTALK',
	'Iron',
	'HeyTap',
	'360',
	'Brave',
] as const;

const OS_ICONS = [
	'Windows',
	'macOS',
	'Android',
	'Ubuntu',
	'Tux',
	'Apple',
	'Chrome',
	'HarmonyOS',
	'OpenHarmony',
	'Playstation',
	'Tizen',
] as const;

export type BrowserIconName = (typeof BROWSER_ICONS)[number];
export type OSIconName = (typeof OS_ICONS)[number];
export type IconType = 'browser' | 'os';

interface PublicIconProps {
	type: IconType;
	name: string;
	size?: 'sm' | 'md' | 'lg' | number;
	className?: string;
	fallback?: React.ReactNode;
}

const sizeMap = {
	sm: 16,
	md: 20,
	lg: 24,
};

function getIconSize(size: 'sm' | 'md' | 'lg' | number): number {
	return typeof size === 'number' ? size : sizeMap[size];
}

function normalizeIconName(name: string): string {
	return name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
}

function findIconMatch(
	normalizedName: string,
	availableIcons: readonly string[]
): string | undefined {
	const exactMatch = availableIcons.find(
		(icon) => icon.toLowerCase() === normalizedName.toLowerCase()
	);
	if (exactMatch) {
		return exactMatch;
	}

	const partialMatch = availableIcons.find(
		(icon) =>
			icon.toLowerCase().includes(normalizedName.toLowerCase()) ||
			normalizedName.toLowerCase().includes(icon.toLowerCase())
	);
	return partialMatch;
}

function getOSMappedName(normalizedName: string): string {
	const osMap: Record<string, string> = {
		linux: 'Ubuntu',
		ios: 'Apple',
		darwin: 'macOS',
		mac: 'macOS',
	};
	const lowerName = normalizedName.toLowerCase();
	return osMap[lowerName] || normalizedName;
}

function getIconSrc(iconName: string, folder: string): string {
	if (iconName === 'Brave' && folder === 'browsers') {
		return `/${folder}/${iconName}.webp`;
	}
	return `/${folder}/${iconName}.svg`;
}

function createFallbackIcon(
	normalizedName: string,
	iconSize: number,
	className?: string
) {
	return (
		<div
			className={cn(
				'flex items-center justify-center rounded bg-muted font-medium text-muted-foreground text-xs',
				className
			)}
			style={{ width: iconSize, height: iconSize }}
		>
			{normalizedName.charAt(0).toUpperCase()}
		</div>
	);
}

export function PublicIcon({
	type,
	name,
	size = 'md',
	className,
	fallback,
}: PublicIconProps) {
	const iconSize = getIconSize(size);

	if (!name) {
		return fallback || createFallbackIcon('?', iconSize, className);
	}

	const normalizedName = normalizeIconName(name);
	const folder = type === 'browser' ? 'browsers' : 'operating-systems';
	const availableIcons = type === 'browser' ? BROWSER_ICONS : OS_ICONS;

	let searchName = normalizedName;
	if (type === 'os') {
		searchName = getOSMappedName(normalizedName);
	}

	const iconName = findIconMatch(searchName, availableIcons);

	if (!iconName) {
		return fallback || createFallbackIcon(normalizedName, iconSize, className);
	}

	const iconSrc = getIconSrc(iconName, folder);

	return (
		<div
			className={cn('relative flex-shrink-0', className)}
			style={{ width: iconSize, height: iconSize }}
		>
			<Image
				alt={name}
				className={cn('object-contain')}
				height={iconSize}
				key={`${iconName}`}
				onError={(e) => {
					const img = e.target as HTMLImageElement;
					img.style.display = 'none';
				}}
				src={iconSrc}
				width={iconSize}
			/>
		</div>
	);
}

export function BrowserIcon({
	name,
	size = 'md',
	className,
	fallback,
}: Omit<PublicIconProps, 'type'>) {
	return (
		<PublicIcon
			className={className}
			fallback={fallback}
			name={name}
			size={size}
			type="browser"
		/>
	);
}

export function OSIcon({
	name,
	size = 'md',
	className,
	fallback,
}: Omit<PublicIconProps, 'type'>) {
	return (
		<PublicIcon
			className={className}
			fallback={fallback}
			name={name}
			size={size}
			type="os"
		/>
	);
}

// Country code mapping for local flags
const COUNTRY_CODE_MAP: Record<string, string> = {
	// Common country names to ISO 3166-1 alpha-2 codes
	'United States': 'us',
	'United Kingdom': 'gb',
	'Great Britain': 'gb',
	'England': 'gb',
	'Canada': 'ca',
	'Australia': 'au',
	'Germany': 'de',
	'France': 'fr',
	'Italy': 'it',
	'Spain': 'es',
	'Netherlands': 'nl',
	'Belgium': 'be',
	'Switzerland': 'ch',
	'Austria': 'at',
	'Sweden': 'se',
	'Norway': 'no',
	'Denmark': 'dk',
	'Finland': 'fi',
	'Portugal': 'pt',
	'Ireland': 'ie',
	'Poland': 'pl',
	'Czech Republic': 'cz',
	'Hungary': 'hu',
	'Slovakia': 'sk',
	'Slovenia': 'si',
	'Croatia': 'hr',
	'Bosnia and Herzegovina': 'ba',
	'Serbia': 'rs',
	'Montenegro': 'me',
	'Kosovo': 'xk',
	'Albania': 'al',
	'Greece': 'gr',
	'Bulgaria': 'bg',
	'Romania': 'ro',
	'Estonia': 'ee',
	'Latvia': 'lv',
	'Lithuania': 'lt',
	'Russia': 'ru',
	'Ukraine': 'ua',
	'Belarus': 'by',
	'Moldova': 'md',
	'Turkey': 'tr',
	'Japan': 'jp',
	'China': 'cn',
	'South Korea': 'kr',
	'India': 'in',
	'Brazil': 'br',
	'Mexico': 'mx',
	'Argentina': 'ar',
	'Colombia': 'co',
	'Chile': 'cl',
	'Peru': 'pe',
	'Venezuela': 've',
	'Ecuador': 'ec',
	'Bolivia': 'bo',
	'Paraguay': 'py',
	'Uruguay': 'uy',
	'South Africa': 'za',
	'Egypt': 'eg',
	'Nigeria': 'ng',
	'Kenya': 'ke',
	'Morocco': 'ma',
	'Tunisia': 'tn',
	'Algeria': 'dz',
	'Israel': 'il',
	'Saudi Arabia': 'sa',
	'UAE': 'ae',
	'United Arab Emirates': 'ae',
	'Iran': 'ir',
	'Iraq': 'iq',
	'Jordan': 'jo',
	'Lebanon': 'lb',
	'Syria': 'sy',
	'Yemen': 'ye',
	'Oman': 'om',
	'Kuwait': 'kw',
	'Qatar': 'qa',
	'Bahrain': 'bh',
	'Thailand': 'th',
	'Vietnam': 'vn',
	'Indonesia': 'id',
	'Malaysia': 'my',
	'Singapore': 'sg',
	'Philippines': 'ph',
	'Australia': 'au',
	'New Zealand': 'nz',
};

function getCountryCode(countryName: string): string {
	// First try direct mapping
	const direct = COUNTRY_CODE_MAP[countryName];
	if (direct) return direct;

	// Try case-insensitive match
	const lowerName = countryName.toLowerCase();
	for (const [name, code] of Object.entries(COUNTRY_CODE_MAP)) {
		if (name.toLowerCase() === lowerName) {
			return code;
		}
	}

	// Try partial match
	for (const [name, code] of Object.entries(COUNTRY_CODE_MAP)) {
		if (name.toLowerCase().includes(lowerName) || lowerName.includes(name.toLowerCase())) {
			return code;
		}
	}

	// If no match found, try to use the first 2 characters as country code
	const twoCharCode = countryName.toLowerCase().slice(0, 2);
	if (twoCharCode.length === 2) {
		return twoCharCode;
	}

	return '';
}

interface CountryFlagProps {
	country: string;
	size?: 'sm' | 'md' | 'lg' | number;
	className?: string;
	fallback?: React.ReactNode;
}

export function CountryFlag({
	country,
	size = 'md',
	className,
	fallback,
}: CountryFlagProps) {
	const iconSize = getIconSize(size);

	if (!country || country === 'Unknown' || country === '') {
		return (
			fallback || (
				<div
					className={cn('flex h-4 w-6 items-center justify-center', className)}
				>
					<div className="h-4 w-4 text-muted-foreground">🌐</div>
				</div>
			)
		);
	}

	const countryCode = getCountryCode(country);

	if (!countryCode) {
		return (
			fallback || (
				<div
					className={cn('flex h-4 w-6 items-center justify-center', className)}
				>
					<div className="h-4 w-4 text-muted-foreground">?</div>
				</div>
			)
		);
	}

	return (
		<Image
			alt={`${country} flag`}
			className={cn('h-4 w-6 rounded-sm object-cover', className)}
			height={iconSize}
			onError={(e) => {
				const img = e.target as HTMLImageElement;
				img.style.display = 'none';
			}}
			src={`/flags/${countryCode}.svg`}
			width={24}
		/>
	);
}
