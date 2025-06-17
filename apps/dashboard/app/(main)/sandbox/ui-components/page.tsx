"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    AlertCircle,
    CheckCircle,
    Info,
    Star,
    Heart,
    ThumbsUp,
    Palette,
    Layout,
    Zap
} from "lucide-react";

export default function UiComponentsPage() {
    const [switchValue, setSwitchValue] = useState(false);
    const [sliderValue, setSliderValue] = useState([50]);
    const [progress, setProgress] = useState(33);

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground mb-2">UI Components Testing</h1>
                <p className="text-muted-foreground">
                    Test and preview UI components and layouts
                </p>
            </div>

            <Tabs defaultValue="buttons" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="buttons">Buttons</TabsTrigger>
                    <TabsTrigger value="forms">Forms</TabsTrigger>
                    <TabsTrigger value="feedback">Feedback</TabsTrigger>
                    <TabsTrigger value="layout">Layout</TabsTrigger>
                </TabsList>

                <TabsContent value="buttons" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="h-5 w-5" />
                                Button Variants
                            </CardTitle>
                            <CardDescription>Different button styles and states</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h4 className="text-sm font-medium mb-3">Primary Buttons</h4>
                                <div className="flex flex-wrap gap-3">
                                    <Button>Default</Button>
                                    <Button size="sm">Small</Button>
                                    <Button size="lg">Large</Button>
                                    <Button disabled>Disabled</Button>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium mb-3">Secondary Buttons</h4>
                                <div className="flex flex-wrap gap-3">
                                    <Button variant="secondary">Secondary</Button>
                                    <Button variant="outline">Outline</Button>
                                    <Button variant="ghost">Ghost</Button>
                                    <Button variant="link">Link</Button>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium mb-3">Destructive Buttons</h4>
                                <div className="flex flex-wrap gap-3">
                                    <Button variant="destructive">Delete</Button>
                                    <Button variant="destructive" size="sm">Remove</Button>
                                    <Button variant="destructive" disabled>Disabled</Button>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium mb-3">Icon Buttons</h4>
                                <div className="flex flex-wrap gap-3">
                                    <Button className="flex items-center gap-2">
                                        <Star className="h-4 w-4" />
                                        Favorite
                                    </Button>
                                    <Button variant="outline" className="flex items-center gap-2">
                                        <Heart className="h-4 w-4" />
                                        Like
                                    </Button>
                                    <Button variant="ghost" className="flex items-center gap-2">
                                        <ThumbsUp className="h-4 w-4" />
                                        Approve
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="forms" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Layout className="h-5 w-5" />
                                Form Components
                            </CardTitle>
                            <CardDescription>Input fields and form controls</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="text-input">Text Input</Label>
                                    <Input id="text-input" placeholder="Enter some text..." />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email-input">Email Input</Label>
                                    <Input id="email-input" type="email" placeholder="email@example.com" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Enable Notifications</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Receive email notifications for updates
                                        </p>
                                    </div>
                                    <Switch
                                        checked={switchValue}
                                        onCheckedChange={setSwitchValue}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Volume: {sliderValue[0]}</Label>
                                    <Slider
                                        value={sliderValue}
                                        onValueChange={setSliderValue}
                                        max={100}
                                        step={1}
                                        className="w-full"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Progress: {progress}%</Label>
                                    <Progress value={progress} className="w-full" />
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setProgress(Math.max(0, progress - 10))}
                                        >
                                            -10%
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setProgress(Math.min(100, progress + 10))}
                                        >
                                            +10%
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="feedback" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5" />
                                Feedback Components
                            </CardTitle>
                            <CardDescription>Alerts, badges, and status indicators</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h4 className="text-sm font-medium mb-3">Badges</h4>
                                <div className="flex flex-wrap gap-3">
                                    <Badge>Default</Badge>
                                    <Badge variant="secondary">Secondary</Badge>
                                    <Badge variant="outline">Outline</Badge>
                                    <Badge variant="destructive">Error</Badge>
                                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Success</Badge>
                                    <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Warning</Badge>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-sm font-medium">Alerts</h4>

                                <Alert>
                                    <Info className="h-4 w-4" />
                                    <AlertTitle>Information</AlertTitle>
                                    <AlertDescription>
                                        This is an informational alert with some helpful details.
                                    </AlertDescription>
                                </Alert>

                                <Alert className="border-green-200 bg-green-50 text-green-800">
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertTitle>Success</AlertTitle>
                                    <AlertDescription>
                                        Your changes have been saved successfully.
                                    </AlertDescription>
                                </Alert>

                                <Alert className="border-yellow-200 bg-yellow-50 text-yellow-800">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Warning</AlertTitle>
                                    <AlertDescription>
                                        Please review your settings before continuing.
                                    </AlertDescription>
                                </Alert>

                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>
                                        Something went wrong. Please try again.
                                    </AlertDescription>
                                </Alert>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="layout" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Palette className="h-5 w-5" />
                                    Color Palette
                                </CardTitle>
                                <CardDescription>Theme colors and variations</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-4 gap-2">
                                    <div className="space-y-2">
                                        <div className="h-12 w-full bg-primary rounded"></div>
                                        <p className="text-xs text-center">Primary</p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-12 w-full bg-secondary rounded"></div>
                                        <p className="text-xs text-center">Secondary</p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-12 w-full bg-accent rounded"></div>
                                        <p className="text-xs text-center">Accent</p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-12 w-full bg-muted rounded"></div>
                                        <p className="text-xs text-center">Muted</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Typography</CardTitle>
                                <CardDescription>Text styles and hierarchy</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <h1 className="text-3xl font-bold">Heading 1</h1>
                                <h2 className="text-2xl font-semibold">Heading 2</h2>
                                <h3 className="text-xl font-medium">Heading 3</h3>
                                <p className="text-base">Regular text paragraph with normal styling.</p>
                                <p className="text-sm text-muted-foreground">Small muted text for descriptions.</p>
                                <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                                    Inline code
                                </code>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
} 