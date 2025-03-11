import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "Profile Settings | Databuddy",
  description: "Manage your profile information",
};

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  const user = session?.user;

  if (!user) {
    return null;
  }

  // Get user initials for avatar fallback
  const getInitials = () => {
    if (!user.name) return "U";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="text-white">Profile Information</CardTitle>
          <CardDescription className="text-slate-400">
            Update your personal information and how others see you on the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-24 w-24 border-2 border-slate-700">
                <AvatarImage src={user.image || ""} alt={user.name || "User"} />
                <AvatarFallback className="bg-slate-800 text-sky-500 text-2xl">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm" className="mt-2 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                Change Avatar
              </Button>
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-300">Full Name</Label>
                  <Input 
                    id="name" 
                    defaultValue={user.name || ""} 
                    className="bg-slate-800 border-slate-700 text-white focus:border-sky-500/50 focus:ring-sky-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    defaultValue={user.email || ""} 
                    disabled
                    className="bg-slate-800 border-slate-700 text-white focus:border-sky-500/50 focus:ring-sky-500/20"
                  />
                  <p className="text-xs text-slate-400">Your email address cannot be changed</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-slate-300">Bio</Label>
                <Textarea 
                  id="bio" 
                  placeholder="Tell us about yourself"
                  className="bg-slate-800 border-slate-700 text-white focus:border-sky-500/50 focus:ring-sky-500/20 min-h-[100px]"
                />
                <p className="text-xs text-slate-400">Brief description for your profile</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-slate-300">Company</Label>
                  <Input 
                    id="company" 
                    placeholder="Your company name"
                    className="bg-slate-800 border-slate-700 text-white focus:border-sky-500/50 focus:ring-sky-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-slate-300">Job Title</Label>
                  <Input 
                    id="role" 
                    placeholder="Your job title"
                    className="bg-slate-800 border-slate-700 text-white focus:border-sky-500/50 focus:ring-sky-500/20"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t border-slate-800 pt-6">
          <Button className="bg-sky-600 hover:bg-sky-700 text-white">
            Save Changes
          </Button>
        </CardFooter>
      </Card>
      
      <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="text-white">Social Profiles</CardTitle>
          <CardDescription className="text-slate-400">
            Connect your social media accounts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="twitter" className="text-slate-300">Twitter</Label>
              <Input 
                id="twitter" 
                placeholder="@username"
                className="bg-slate-800 border-slate-700 text-white focus:border-sky-500/50 focus:ring-sky-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin" className="text-slate-300">LinkedIn</Label>
              <Input 
                id="linkedin" 
                placeholder="linkedin.com/in/username"
                className="bg-slate-800 border-slate-700 text-white focus:border-sky-500/50 focus:ring-sky-500/20"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="github" className="text-slate-300">GitHub</Label>
              <Input 
                id="github" 
                placeholder="github.com/username"
                className="bg-slate-800 border-slate-700 text-white focus:border-sky-500/50 focus:ring-sky-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website" className="text-slate-300">Website</Label>
              <Input 
                id="website" 
                placeholder="https://example.com"
                className="bg-slate-800 border-slate-700 text-white focus:border-sky-500/50 focus:ring-sky-500/20"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t border-slate-800 pt-6">
          <Button className="bg-sky-600 hover:bg-sky-700 text-white">
            Save Social Profiles
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 