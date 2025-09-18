import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { getUserTimezone } from '@/lib/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export type Granularity = 'hourly' | 'daily';

export const formatDateByGranularity = (
	dateIso: string,
	granularity: Granularity
): string => {
	if (granularity === 'hourly') {
		return dateIso;
	}
	return dateIso.slice(0, 10);
};

export interface DatedPoint {
	date: string;
	[key: string]: unknown;
}

export const filterFutureEvents = <T extends DatedPoint>(
	events: T[],
	granularity: Granularity
): T[] => {
	const userTz = getUserTimezone();
	const now = dayjs().tz(userTz);
	return events.filter((event) => {
		const eventDate = dayjs.utc(event.date).tz(userTz);
		if (granularity === 'hourly') {
			return eventDate.isBefore(now);
		}
		const endOfToday = now.endOf('day');
		return (
			eventDate.isBefore(endOfToday) || eventDate.isSame(endOfToday, 'day')
		);
	});
};
