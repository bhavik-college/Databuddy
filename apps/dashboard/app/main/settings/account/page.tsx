"use client";

import { useState } from "react";
import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useQueryState } from "nuqs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Mail, Bell, User } from "lucide-react";


export default function AccountPage() {
  const [tab, setTab] = useQueryState("tab", { defaultValue: "general" });
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveGeneral = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success("Account settings saved successfully");
    setIsLoading(false);
  };

  const handleSavePassword = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success("Password updated successfully");
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={(value) => setTab(value)}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="general" className="data-[state=active]:bg-sky-600 data-[state=active]:text-white">
            <User className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="password" className="data-[state=active]:bg-sky-600 data-[state=active]:text-white">
            <Shield className="h-4 w-4 mr-2" />
            Password
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-sky-600 data-[state=active]:text-white">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="mt-6">
          <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="text-white">General Settings</CardTitle>
              <CardDescription className="text-slate-400">
                Update your account preferences and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-300">Username</Label>
                <Input 
                  id="username" 
                  placeholder="Your username"
                  className="bg-slate-800 border-slate-700 text-white focus:border-sky-500/50 focus:ring-sky-500/20"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="Your email address"
                  className="bg-slate-800 border-slate-700 text-white focus:border-sky-500/50 focus:ring-sky-500/20"
                />
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div className="space-y-0.5">
                  <Label htmlFor="marketing" className="text-slate-300">Marketing emails</Label>
                  <p className="text-xs text-slate-400">Receive emails about new features and updates</p>
                </div>
                <Switch id="marketing" />
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div className="space-y-0.5">
                  <Label htmlFor="analytics" className="text-slate-300">Usage Analytics</Label>
                  <p className="text-xs text-slate-400">Help us improve by sharing anonymous usage data</p>
                </div>
                <Switch id="analytics" defaultChecked />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-slate-800 pt-6">
              <Button 
                className="bg-sky-600 hover:bg-sky-700 text-white"
                onClick={handleSaveGeneral}
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="password" className="mt-6">
          <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="text-white">Change Password</CardTitle>
              <CardDescription className="text-slate-400">
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password" className="text-slate-300">Current Password</Label>
                <Input 
                  id="current-password" 
                  type="password"
                  className="bg-slate-800 border-slate-700 text-white focus:border-sky-500/50 focus:ring-sky-500/20"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-slate-300">New Password</Label>
                <Input 
                  id="new-password" 
                  type="password"
                  className="bg-slate-800 border-slate-700 text-white focus:border-sky-500/50 focus:ring-sky-500/20"
                />
                <p className="text-xs text-slate-400">Password must be at least 8 characters long</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-slate-300">Confirm New Password</Label>
                <Input 
                  id="confirm-password" 
                  type="password"
                  className="bg-slate-800 border-slate-700 text-white focus:border-sky-500/50 focus:ring-sky-500/20"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-slate-800 pt-6">
              <Button 
                className="bg-sky-600 hover:bg-sky-700 text-white"
                onClick={handleSavePassword}
                disabled={isLoading}
              >
                {isLoading ? "Updating..." : "Update Password"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="mt-6">
          <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="text-white">Notification Preferences</CardTitle>
              <CardDescription className="text-slate-400">
                Manage how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between pt-2">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications" className="text-slate-300">Email Notifications</Label>
                  <p className="text-xs text-slate-400">Receive notifications via email</p>
                </div>
                <Switch id="email-notifications" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div className="space-y-0.5">
                  <Label htmlFor="website-activity" className="text-slate-300">Website Activity</Label>
                  <p className="text-xs text-slate-400">Get notified about your website performance</p>
                </div>
                <Switch id="website-activity" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div className="space-y-0.5">
                  <Label htmlFor="security-alerts" className="text-slate-300">Security Alerts</Label>
                  <p className="text-xs text-slate-400">Receive alerts about security issues</p>
                </div>
                <Switch id="security-alerts" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div className="space-y-0.5">
                  <Label htmlFor="product-updates" className="text-slate-300">Product Updates</Label>
                  <p className="text-xs text-slate-400">Get notified about new features and updates</p>
                </div>
                <Switch id="product-updates" />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-slate-800 pt-6">
              <Button className="bg-sky-600 hover:bg-sky-700 text-white">
                Save Preferences
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 