"use client";

import { useState, useEffect, useCallback } from "react";
import { authClient } from "@databuddy/auth/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, LogIn, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Session {
  sessionToken: string;
  userId: string;
  provider: string;
  isCurrent: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  lastActive: string;
  createdAt: string;
  expiresAt: string;
  email?: string; 
}

interface DeviceSessionDetails {
  sessionToken: string;
  userId: string;
  provider: string;
  isCurrent: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  lastActive: string;
  createdAt: string;
  expiresAt: string;
}

interface DeviceSessionEntry {
  session: DeviceSessionDetails;
  user?: {
    email?: string;
    name?: string;
    // other user properties from auth
  };
  sessionToken: string;
  isCurrent: boolean;
  provider: string;
  userId: string;
}

export function SessionSwitcher() {
  const [sessions, setSessions] = useState<DeviceSessionEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [operatingSession, setOperatingSession] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await authClient.multiSession.listDeviceSessions();
      if (result.error) {
        throw new Error(result.error.message);
      }
      const processedSessions: DeviceSessionEntry[] = result.data?.map((item: any) => ({
        session: item.session || {
          sessionToken: item.sessionToken,
          userId: item.userId,
          provider: item.provider,
          isCurrent: item.isCurrent,
          ipAddress: item.ipAddress,
          userAgent: item.userAgent,
          lastActive: item.lastActive,
          createdAt: item.createdAt,
          expiresAt: item.expiresAt,
        },
        user: item.user || { email: item.email || "Unknown User", name: item.name },
        sessionToken: item.sessionToken || item.session?.sessionToken,
        isCurrent: typeof item.isCurrent === 'boolean' ? item.isCurrent : (item.session?.isCurrent || false),
        provider: item.provider || item.session?.provider || 'N/A',
        userId: item.userId || item.session?.userId,
      })) || [];
      setSessions(processedSessions);
    } catch (err: any) {
      setError(err.message || "Failed to fetch sessions.");
      toast.error(err.message || "Failed to fetch sessions.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleSetActive = async (sessionToken: string) => {
    setOperatingSession(sessionToken);
    try {
      const result = await authClient.multiSession.setActive({ sessionToken });
      if (result.error) {
        throw new Error(result.error.message);
      }
      toast.success("Session switched successfully. Reloading...");
      window.location.reload(); 
    } catch (err: any) {
      toast.error(err.message || "Failed to switch session.");
    } finally {
      setOperatingSession(null);
    }
  };

  const handleRevoke = async (sessionToken: string) => {
    setOperatingSession(sessionToken);
    try {
      const result = await authClient.multiSession.revoke({ sessionToken });
      if (result.error) {
        throw new Error(result.error.message);
      }
      toast.success("Session revoked successfully.");
      fetchSessions();
    } catch (err: any) {
      toast.error(err.message || "Failed to revoke session.");
    } finally {
      setOperatingSession(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading sessions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button onClick={fetchSessions} variant="link" className="mt-2 p-0 h-auto">
          Try again
        </Button>
      </Alert>
    );
  }

  if (sessions.length === 0) {
    return (
      <Alert className="my-4">
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>No Other Active Sessions</AlertTitle>
        <AlertDescription>
          You currently have no other active sessions on this device.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        You can switch between your active accounts or revoke sessions you no longer need.
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Account</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((entry) => (
            <TableRow key={entry.sessionToken}>
              <TableCell className="font-medium">
                {entry.user?.email || entry.userId}
                {entry.user?.name && <span className="block text-xs text-muted-foreground">{entry.user.name}</span>}
              </TableCell>
              <TableCell className="capitalize">{entry.provider}</TableCell>
              <TableCell className="text-center">
                {entry.isCurrent ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Current
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                    Inactive
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSetActive(entry.sessionToken)}
                  disabled={entry.isCurrent || operatingSession === entry.sessionToken}
                  className="h-8 px-2"
                >
                  {operatingSession === entry.sessionToken && !entry.isCurrent ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <LogIn className="mr-1.5 h-3.5 w-3.5" />}
                  Switch
                </Button>
                {!entry.isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevoke(entry.sessionToken)}
                    disabled={operatingSession === entry.sessionToken}
                    className="h-8 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    {operatingSession === entry.sessionToken ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Trash2 className="mr-1.5 h-3.5 w-3.5" />}
                    Revoke
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 