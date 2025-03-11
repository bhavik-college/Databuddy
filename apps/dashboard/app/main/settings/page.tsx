import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export const metadata: Metadata = {
  title: "Settings | Databuddy",
  description: "Manage your account settings",
};

export default async function SettingsPage() {
  
  const activeSessions = await authClient.listSessions();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account preferences</p>
      </div>
      
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications" className="font-medium">Email Notifications</Label>
                <p className="text-sm text-gray-500">Receive email updates about your account activity</p>
              </div>
              <Switch id="email-notifications" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="marketing-emails" className="font-medium">Marketing Emails</Label>
                <p className="text-sm text-gray-500">Receive emails about new features and offers</p>
              </div>
              <Switch id="marketing-emails" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="font-medium">Password</Label>
              <p className="text-sm text-gray-500 mb-2">Update your password to keep your account secure</p>
              <Button variant="outline">Change Password</Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="two-factor" className="font-medium">Two-Factor Authentication</Label>
                <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
              </div>
              <Switch id="two-factor" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label className="font-medium text-red-600">Delete Account</Label>
              <p className="text-sm text-gray-500 mb-2">Permanently delete your account and all associated data</p>
              <Button variant="destructive">Delete Account</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 