"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, authClient } from "@databuddy/auth/client";
import { toast } from "sonner";
import { Loader2, LogOut, Monitor, Smartphone, Globe, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

interface Session {
  id: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
  expiresAt: Date;
  isCurrent?: boolean;
}

export function SessionsForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revokeLoading, setRevokeLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const response = await authClient.listSessions();
      
      // Mark current session
      const currentSessionId = session?.session?.id;
      const formattedSessions = response.data?.map((s: any) => ({
        ...s,
        isCurrent: s.id === currentSessionId
      }));
      
      setSessions(formattedSessions || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load sessions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async (sessionId: string) => {
    setRevokeLoading(sessionId);
    try {
      const response = await authClient.revokeSession({ token: sessionId });
      if (response.error) {
        toast.error(response.error.message || "Failed to revoke session");
      } else {
        toast.success("Session revoked successfully");
        
      // If current session was revoked, redirect to login
      if (sessionId === session?.session?.id) {
        router.push("/login");
        return;
      }
      
      // Refresh the list
        fetchSessions();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to revoke session");
    } finally {
      setRevokeLoading(null);
    }
  };

  const handleRevokeAll = async () => {
    if (!confirm("Are you sure you want to revoke all other sessions? You'll remain logged in on this device only.")) {
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await authClient.revokeOtherSessions();
      if (response.error) {
        toast.error(response.error.message || "Failed to revoke sessions");
      } else {
        toast.success("All other sessions revoked successfully");
        fetchSessions();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to revoke sessions");
    } finally {
      setIsLoading(false);
    }
  };

  const getDeviceIcon = (userAgent?: string | null) => {
    if (!userAgent) return <Globe className="h-4 w-4" />;
    
    const ua = userAgent.toLowerCase();
    if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone") || ua.includes("ipad")) {
      return <Smartphone className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  const formatUserAgent = (userAgent?: string | null) => {
    if (!userAgent) return "Unknown Device";
    
    // Extract browser and OS information
    let browser = "Unknown Browser";
    let os = "Unknown OS";
    
    if (userAgent.includes("Firefox")) {
      browser = "Firefox";
    } else if (userAgent.includes("Chrome")) {
      browser = "Chrome";
    } else if (userAgent.includes("Safari")) {
      browser = "Safari";
    } else if (userAgent.includes("Edge")) {
      browser = "Edge";
    }
    
    if (userAgent.includes("Windows")) {
      os = "Windows";
    } else if (userAgent.includes("Mac OS")) {
      os = "macOS";
    } else if (userAgent.includes("Linux")) {
      os = "Linux";
    } else if (userAgent.includes("Android")) {
      os = "Android";
    } else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
      os = "iOS";
    }
    
    return `${browser} on ${os}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Active Sessions</h3>
        {sessions.length > 1 && (
          <Button 
            variant="outline" 
            onClick={handleRevokeAll} 
            disabled={isLoading}
            size="sm"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Revoke All Other Sessions
          </Button>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : sessions.length === 0 ? (
        <Alert>
          <AlertTitle>No active sessions</AlertTitle>
          <AlertDescription>
            There are no active sessions for your account.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div 
              key={s.id} 
              className={`p-4 border rounded-md flex items-start justify-between ${
                s.isCurrent ? 'bg-primary/5 border-primary/20' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-muted rounded-md">
                  {getDeviceIcon(s.userAgent)}
                </div>
                <div>
                  <p className="font-medium">
                    {formatUserAgent(s.userAgent)}
                    {s.isCurrent && (
                      <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </p>
                  <div className="text-sm text-muted-foreground mt-1">
                    <div className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5" />
                      <span>{s.ipAddress || "Unknown IP"}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        Created {dayjs(s.createdAt).fromNow()},
                        expires {dayjs(s.expiresAt).fromNow()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleRevoke(s.id)}
                disabled={revokeLoading === s.id}
              >
                {revokeLoading === s.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Revoke"
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 