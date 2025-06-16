"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Clock, Globe, CalendarIcon, Loader2, CheckCircle, Sparkles, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// Mock functions - replace with actual API calls
async function getUserPreferences(): Promise<{ data: { timezone?: string; dateFormat?: string; timeFormat?: string } | null }> {
  return { data: null };
}

async function updateUserPreferences(formData: FormData) {
  return { success: true };
}

function getBrowserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function formatDate(date: Date, options: { timezone?: string; dateFormat?: string; timeFormat?: string }) {
  const { timezone = getBrowserTimezone(), dateFormat = 'MMM D, YYYY', timeFormat = 'h:mm a' } = options;

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: timeFormat?.includes('H') ? '2-digit' : 'numeric',
      minute: '2-digit',
      hour12: !timeFormat?.includes('H'),
    });

    return formatter.format(date);
  } catch {
    return date.toLocaleString();
  }
}

// Timezone data
const TIMEZONES = [
  { region: 'America/New_York', label: 'New York (EST/EDT)', offset: 'UTC-5/-4' },
  { region: 'America/Chicago', label: 'Chicago (CST/CDT)', offset: 'UTC-6/-5' },
  { region: 'America/Denver', label: 'Denver (MST/MDT)', offset: 'UTC-7/-6' },
  { region: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)', offset: 'UTC-8/-7' },
  { region: 'Europe/London', label: 'London (GMT/BST)', offset: 'UTC+0/+1' },
  { region: 'Europe/Paris', label: 'Paris (CET/CEST)', offset: 'UTC+1/+2' },
  { region: 'Europe/Berlin', label: 'Berlin (CET/CEST)', offset: 'UTC+1/+2' },
  { region: 'Asia/Tokyo', label: 'Tokyo (JST)', offset: 'UTC+9' },
  { region: 'Asia/Shanghai', label: 'Shanghai (CST)', offset: 'UTC+8' },
  { region: 'Asia/Kolkata', label: 'Mumbai (IST)', offset: 'UTC+5:30' },
  { region: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)', offset: 'UTC+10/+11' },
  { region: 'Pacific/Auckland', label: 'Auckland (NZST/NZDT)', offset: 'UTC+12/+13' },
];

const DATE_FORMATS = [
  { value: 'MMM D, YYYY', label: 'Jan 15, 2024' },
  { value: 'DD/MM/YYYY', label: '15/01/2024' },
  { value: 'MM/DD/YYYY', label: '01/15/2024' },
  { value: 'YYYY-MM-DD', label: '2024-01-15' },
  { value: 'D MMM YYYY', label: '15 Jan 2024' },
  { value: 'MMMM D, YYYY', label: 'January 15, 2024' },
];

const TIME_FORMATS = [
  { value: 'h:mm a', label: '1:30 PM' },
  { value: 'HH:mm', label: '13:30' },
];

export function TimezonePreferences() {
  const [preferences, setPreferences] = useState({
    timezone: 'auto',
    dateFormat: 'MMM D, YYYY',
    timeFormat: 'h:mm a'
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timezone');
  const [hasChanges, setHasChanges] = useState(false);
  const [originalPreferences, setOriginalPreferences] = useState(preferences);

  // Fetch user preferences on mount
  useEffect(() => {
    getUserPreferences().then(result => {
      const prefs = {
        timezone: result.data?.timezone || 'auto',
        dateFormat: result.data?.dateFormat || 'MMM D, YYYY',
        timeFormat: result.data?.timeFormat || 'h:mm a'
      };
      setPreferences(prefs);
      setOriginalPreferences(prefs);
      setLoading(false);
    }).catch(() => {
      toast.error('Failed to load preferences');
      setLoading(false);
    });
  }, []);

  // Check for changes
  useEffect(() => {
    setHasChanges(JSON.stringify(preferences) !== JSON.stringify(originalPreferences));
  }, [preferences, originalPreferences]);

  // Save preferences
  const handleSave = async () => {
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('timezone', preferences.timezone);
      formData.append('dateFormat', preferences.dateFormat);
      formData.append('timeFormat', preferences.timeFormat);

      const result = await updateUserPreferences(formData);

      if (result.success) {
        toast.success('Preferences saved successfully');
        setOriginalPreferences(preferences);
        setHasChanges(false);
      } else {
        toast.error('Failed to save preferences');
      }
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPreferences(originalPreferences);
    setHasChanges(false);
  };

  // Current date/time for examples
  const now = new Date();
  const currentTimezone = preferences.timezone === 'auto' ? getBrowserTimezone() : preferences.timezone;
  const dateExample = formatDate(now, {
    timezone: currentTimezone,
    dateFormat: preferences.dateFormat,
    timeFormat: undefined
  });

  const timeExample = formatDate(now, {
    timezone: currentTimezone,
    dateFormat: undefined,
    timeFormat: preferences.timeFormat
  });

  // Group timezones by offset for better organization
  const timezonesByOffset = Object.entries(
    TIMEZONES.reduce((acc, tz) => {
      (acc[tz.offset] = acc[tz.offset] || []).push(tz);
      return acc;
    }, {} as Record<string, typeof TIMEZONES>)
  ).sort((a, b) => {
    return parseFloat(a[0].replace('UTC', '').replace('+', '')) -
      parseFloat(b[0].replace('UTC', '').replace('+', ''));
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading preferences...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Current Settings Preview */}
      <Card className="border-muted/50 bg-gradient-to-br from-muted/20 to-muted/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-blue-500/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Current Format</p>
                <p className="text-sm text-muted-foreground">
                  {dateExample} • {timeExample}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                <MapPin className="h-3 w-3 mr-1" />
                {currentTimezone.split('/').pop()?.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full mb-6">
          <TabsTrigger value="timezone" className="flex gap-2 items-center">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Timezone</span>
          </TabsTrigger>
          <TabsTrigger value="date" className="flex gap-2 items-center">
            <CalendarIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Date</span>
          </TabsTrigger>
          <TabsTrigger value="time" className="flex gap-2 items-center">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Time</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timezone" className="space-y-4">
          <div className="space-y-3">
            <h3 className="font-medium text-base">Select Timezone</h3>

            {/* Auto Detection */}
            <div className="p-3 border border-muted/50 rounded-lg bg-muted/20">
              <Button
                size="sm"
                variant={preferences.timezone === 'auto' ? 'default' : 'outline'}
                onClick={() => setPreferences({ ...preferences, timezone: 'auto' })}
                className="w-full justify-start gap-2"
              >
                <Globe className="h-4 w-4" />
                Auto-detect ({getBrowserTimezone()})
                {preferences.timezone === 'auto' && <CheckCircle className="h-4 w-4 ml-auto" />}
              </Button>
            </div>

            {/* Manual Selection */}
            <div className="border border-muted/50 rounded-lg overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                {timezonesByOffset.map(([offset, zones]) => (
                  <div key={offset} className="border-b border-muted/30 last:border-0">
                    <div className="font-medium px-4 py-2 bg-muted/40 text-sm">{offset}</div>
                    <div className="p-1">
                      {zones.map(tz => (
                        <div
                          key={tz.region}
                          className={cn(
                            "px-3 py-2 cursor-pointer rounded-md mx-1 my-0.5 text-sm transition-all duration-200",
                            "hover:bg-accent hover:text-accent-foreground",
                            preferences.timezone === tz.region && "bg-primary text-primary-foreground"
                          )}
                          onClick={() => setPreferences({ ...preferences, timezone: tz.region })}
                        >
                          <div className="flex items-center justify-between">
                            <span>{tz.label}</span>
                            {preferences.timezone === tz.region && (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="date" className="space-y-4">
          <div className="space-y-3">
            <h3 className="font-medium text-base">Date Format</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DATE_FORMATS.map(option => (
                <div
                  key={option.value}
                  className={cn(
                    "border border-muted/50 rounded-lg p-3 cursor-pointer transition-all duration-200",
                    "hover:bg-accent hover:border-accent-foreground/20",
                    preferences.dateFormat === option.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : ""
                  )}
                  onClick={() => setPreferences({ ...preferences, dateFormat: option.value })}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">{option.value}</div>
                    </div>
                    {preferences.dateFormat === option.value && (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="time" className="space-y-4">
          <div className="space-y-3">
            <h3 className="font-medium text-base">Time Format</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TIME_FORMATS.map(option => (
                <div
                  key={option.value}
                  className={cn(
                    "border border-muted/50 rounded-lg p-3 cursor-pointer transition-all duration-200",
                    "hover:bg-accent hover:border-accent-foreground/20",
                    preferences.timeFormat === option.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : ""
                  )}
                  onClick={() => setPreferences({ ...preferences, timeFormat: option.value })}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">{option.value}</div>
                    </div>
                    {preferences.timeFormat === option.value && (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      {hasChanges && (
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-muted/50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 sm:flex-none sm:min-w-32"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-muted/30 rounded-lg p-4 border border-muted/50">
        <div className="flex items-start gap-3">
          <div className="p-1 rounded-md bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="text-sm">
            <p className="font-medium mb-1">🌍 Timezone & Format Tips</p>
            <ul className="text-muted-foreground leading-relaxed space-y-1">
              <li>• Auto-detect uses your browser's timezone setting</li>
              <li>• Changes apply to all dates and times across the platform</li>
              <li>• Your team members will see times in their own timezone</li>
              <li>• Data exports will use your selected format</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 