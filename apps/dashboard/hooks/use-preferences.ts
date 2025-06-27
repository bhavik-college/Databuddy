"use client";

import { convertToTimezone, formatDate, getBrowserTimezone } from "@databuddy/shared";
import { useEffect, useState } from "react";
import { getUserPreferences } from "@/app/actions/preferences";

interface UserPreferences {
  timezone: string;
  dateFormat: string;
  timeFormat: string;
}

const defaultPreferences: UserPreferences = {
  timezone: "auto",
  dateFormat: "MMM D, YYYY",
  timeFormat: "h:mm a",
};

export function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch preferences on hook mount
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setLoading(true);
        const result = await getUserPreferences();

        if (result.data) {
          setPreferences({
            timezone: result.data.timezone || "auto",
            dateFormat: result.data.dateFormat || "MMM D, YYYY",
            timeFormat: result.data.timeFormat || "h:mm a",
          });
        } else {
          // Use defaults if there's an issue
          setPreferences(defaultPreferences);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch preferences"));
        // Use defaults on error
        setPreferences(defaultPreferences);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  // Get effective timezone (browser timezone if 'auto')
  const getEffectiveTimezone = () => {
    if (!preferences) return getBrowserTimezone();
    return preferences.timezone === "auto" ? getBrowserTimezone() : preferences.timezone;
  };

  // Format a date according to user preferences
  const formatWithPreferences = (
    date: Date | string | number,
    options?: {
      showTime?: boolean;
      customFormat?: string;
    }
  ) => {
    if (!date) return "";

    const timezone = getEffectiveTimezone();

    return formatDate(date, {
      timezone,
      dateFormat: preferences?.dateFormat || defaultPreferences.dateFormat,
      timeFormat: preferences?.timeFormat || defaultPreferences.timeFormat,
      showTime: options?.showTime,
      customFormat: options?.customFormat,
    });
  };

  // Convert a date to the user's timezone
  const convertToUserTimezone = (date: Date | string | number) => {
    const timezone = getEffectiveTimezone();
    return convertToTimezone(date, timezone);
  };

  return {
    preferences,
    loading,
    error,
    formatDate: formatWithPreferences,
    convertToTimezone: convertToUserTimezone,
    getEffectiveTimezone,
  };
}
