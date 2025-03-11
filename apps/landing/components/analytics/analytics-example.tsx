'use client';

import { useState } from 'react';
import { useAnalytics } from '@/lib/analytics/use-analytics';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

/**
 * Example component demonstrating various ways to use the analytics system
 */
export function AnalyticsExample() {
  const { trackEvent, trackPageView, trackClick, trackFormSubmit, trackPurchase, optOut, optIn, isAvailable } = useAnalytics();
  const [isOptedOut, setIsOptedOut] = useState(false);
  const [formData, setFormData] = useState({ email: '' });
  
  // Handle custom event tracking
  const handleCustomEvent = () => {
    trackEvent('demo_button_click', {
      category: 'engagement',
      source: 'analytics_example',
      timestamp: new Date().toISOString()
    });
  };
  
  // Handle manual page view tracking
  const handleVirtualPageView = () => {
    trackPageView('/virtual/demo-page', {
      title: 'Virtual Demo Page',
      referrer: '/analytics-example'
    });
  };
  
  // Handle click tracking with element reference
  const handleClickTracking = (e: React.MouseEvent<HTMLButtonElement>) => {
    trackClick(e.currentTarget, {
      category: 'navigation',
      destination: 'demo_section'
    });
  };
  
  // Handle form submission
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const isValid = formData.email.includes('@');
    
    trackFormSubmit(
      e.currentTarget,
      isValid,
      isValid ? null : 'invalid_email',
      {
        formType: 'demo_form',
        emailProvided: !!formData.email
      }
    );
    
    if (isValid) {
      alert('Form submitted successfully!');
      setFormData({ email: '' });
    } else {
      alert('Please enter a valid email address');
    }
  };
  
  // Handle opt-out toggle
  const handleOptOutToggle = (checked: boolean) => {
    if (checked) {
      optOut();
    } else {
      optIn();
    }
    setIsOptedOut(checked);
  };
  
  // Handle purchase tracking
  const handlePurchaseTracking = () => {
    trackPurchase(
      'premium-plan',
      99.99,
      'USD',
      {
        category: 'subscription',
        paymentMethod: 'credit_card'
      }
    );
    
    alert('Purchase tracked!');
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Analytics Demo</CardTitle>
        <CardDescription>
          Try out different analytics tracking methods
          {!isAvailable && (
            <p className="text-yellow-600 mt-2">
              Analytics not yet loaded. Actions will be queued.
            </p>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Custom Event Tracking</h3>
          <Button 
            onClick={handleCustomEvent}
            variant="outline"
            className="w-full"
          >
            Track Custom Event
          </Button>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Virtual Page View</h3>
          <Button 
            onClick={handleVirtualPageView}
            variant="outline"
            className="w-full"
          >
            Track Virtual Page View
          </Button>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Element Click Tracking</h3>
          <Button 
            onClick={handleClickTracking}
            variant="outline"
            className="w-full"
            data-section="demo-section"
          >
            Track This Element Click
          </Button>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Form Submission Tracking</h3>
          <form onSubmit={handleFormSubmit} className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full">Submit Form</Button>
          </form>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Purchase Tracking</h3>
          <Button 
            onClick={handlePurchaseTracking}
            variant="outline"
            className="w-full"
          >
            Track Purchase
          </Button>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Declarative Tracking</h3>
          <Button 
            data-track="declarative_click"
            data-category="demo"
            data-method="declarative"
            variant="outline"
            className="w-full"
          >
            Declarative Tracking Button
          </Button>
          <p className="text-xs text-gray-500">
            This button uses data-* attributes for tracking
          </p>
        </div>
      </CardContent>
      
      <CardFooter>
        <div className="flex items-center space-x-2">
          <Switch 
            id="opt-out" 
            checked={isOptedOut}
            onCheckedChange={handleOptOutToggle}
          />
          <Label htmlFor="opt-out">Opt out of analytics</Label>
        </div>
      </CardFooter>
    </Card>
  );
} 