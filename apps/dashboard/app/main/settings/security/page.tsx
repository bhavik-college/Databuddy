"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, AlertTriangle, Key, Lock } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useEffect } from "react";
import { useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);
import { Session } from "better-auth";

export default  function SecurityPage() {
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);

  useEffect(() => {
    const fetchActiveSessions = async () => {
      const sessions = await authClient.listSessions();
      setActiveSessions(sessions.data || []);
    };
    fetchActiveSessions();
  }, []);


  const handleSaveSettings = () => {
    toast.success("Security settings saved successfully");
  };

  const handleRevokeAllSessions = async () => {
    await authClient.revokeSessions();
    toast.success("All sessions have been revoked");
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-sky-400" />
            Security Settings
          </CardTitle>
          <CardDescription className="text-slate-400">
            Manage your account security preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="two-factor" className="text-slate-300">Two-Factor Authentication</Label>
              <p className="text-xs text-slate-400">Add an extra layer of security to your account</p>
            </div>
            <Switch id="two-factor" />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="login-alerts" className="text-slate-300">Login Alerts</Label>
              <p className="text-xs text-slate-400">Receive alerts for new login attempts</p>
            </div>
            <Switch id="login-alerts" defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="suspicious-activity" className="text-slate-300">Suspicious Activity Detection</Label>
              <p className="text-xs text-slate-400">Get notified about unusual account activity</p>
            </div>
            <Switch id="suspicious-activity" defaultChecked />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t border-slate-800 pt-6">
          <Button 
            className="bg-sky-600 hover:bg-sky-700 text-white"
            onClick={handleSaveSettings}
          >
            Save Settings
          </Button>
        </CardFooter>
      </Card>
      
      <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Key className="h-5 w-5 text-amber-400" />
            Active Sessions
          </CardTitle>
          <CardDescription className="text-slate-400">
            Manage your active login sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeSessions.map((session) => (
            <div className="space-y-4 pt-2" key={session.id}>
              <div className="p-4 border border-slate-800 rounded-md bg-slate-800/50">
                <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-white">{session.userAgent?.split(" ")[0]} {session.ipAddress}</p>
                  <p className="text-xs text-slate-400 mt-1">Created {dayjs(session.createdAt).fromNow()}, expires {dayjs(session.expiresAt).fromNow()}</p>
                  <p className="text-xs text-emerald-400 mt-1">Active now</p>
                </div>
                <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                  This Device
                </Button>
              </div>
            </div>
          </div>
          ))}
        </CardContent>
        <CardFooter className="flex justify-end border-t border-slate-800 pt-6">
          <Button 
            variant="destructive" 
            className="bg-rose-600 hover:bg-rose-700 text-white"
            onClick={handleRevokeAllSessions}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Revoke All Sessions
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 