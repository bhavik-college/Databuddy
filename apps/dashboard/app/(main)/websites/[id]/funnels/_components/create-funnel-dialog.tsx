"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    TargetIcon,
    ChartBarIcon,
    PlusIcon,
    TrashIcon,
    FunnelIcon
} from "@phosphor-icons/react";
import type { CreateFunnelData, FunnelStep, FunnelFilter } from "@/hooks/use-funnels";

interface CreateFunnelDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateFunnelData) => Promise<void>;
    isCreating: boolean;
}

export function CreateFunnelDialog({ isOpen, onClose, onSubmit, isCreating }: CreateFunnelDialogProps) {
    const [formData, setFormData] = useState<CreateFunnelData>({
        name: '',
        description: '',
        steps: [
            { type: 'PAGE_VIEW' as const, target: '/', name: 'Landing Page' },
            { type: 'PAGE_VIEW' as const, target: '/signup', name: 'Sign Up Page' }
        ],
        filters: []
    });

    const handleSubmit = async () => {
        await onSubmit(formData);
        resetForm();
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            steps: [
                { type: 'PAGE_VIEW' as const, target: '/', name: 'Landing Page' },
                { type: 'PAGE_VIEW' as const, target: '/signup', name: 'Sign Up Page' }
            ],
            filters: []
        });
    };

    const addStep = () => {
        setFormData(prev => ({
            ...prev,
            steps: [...prev.steps, { type: 'PAGE_VIEW' as const, target: '', name: '' }]
        }));
    };

    const removeStep = (index: number) => {
        if (formData.steps.length > 2) {
            setFormData(prev => ({
                ...prev,
                steps: prev.steps.filter((_, i) => i !== index)
            }));
        }
    };

    const updateStep = (index: number, field: keyof FunnelStep, value: string) => {
        setFormData(prev => ({
            ...prev,
            steps: prev.steps.map((step, i) =>
                i === index ? { ...step, [field]: value } : step
            )
        }));
    };

    const addFilter = () => {
        setFormData(prev => ({
            ...prev,
            filters: [...(prev.filters || []), { field: 'browser_name', operator: 'equals' as const, value: '' }]
        }));
    };

    const removeFilter = (index: number) => {
        setFormData(prev => ({
            ...prev,
            filters: (prev.filters || []).filter((_, i) => i !== index)
        }));
    };

    const updateFilter = (index: number, field: keyof FunnelFilter, value: string) => {
        setFormData(prev => ({
            ...prev,
            filters: (prev.filters || []).map((filter, i) =>
                i === index ? { ...filter, [field]: value } : filter
            )
        }));
    };

    const filterOptions = [
        { value: 'browser_name', label: 'Browser' },
        { value: 'os_name', label: 'Operating System' },
        { value: 'country', label: 'Country' },
        { value: 'device_type', label: 'Device Type' },
        { value: 'utm_source', label: 'UTM Source' },
        { value: 'utm_medium', label: 'UTM Medium' },
        { value: 'utm_campaign', label: 'UTM Campaign' },
    ];

    const operatorOptions = [
        { value: 'equals', label: 'equals' },
        { value: 'contains', label: 'contains' },
        { value: 'not_equals', label: 'does not equal' },
    ];

    const handleClose = () => {
        onClose();
        resetForm();
    };

    return (
        <Sheet open={isOpen} onOpenChange={handleClose}>
            <SheetContent side="right" className="w-[60vw] overflow-y-auto"
                style={{ width: '40vw', padding: '1rem', maxWidth: '1200px' }}
            >
                <SheetHeader className="space-y-3 pb-6 border-b border-border/50">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                            <TargetIcon size={16} weight="duotone" className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <SheetTitle className="text-xl font-semibold text-foreground">Create New Funnel</SheetTitle>
                            <SheetDescription className="text-muted-foreground mt-1">
                                Set up a new conversion funnel to track user journeys
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="space-y-6 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium text-foreground">Funnel Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g., Sign Up Flow"
                                className="rounded-lg border-border/50 focus:border-primary/50 focus:ring-primary/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-sm font-medium text-foreground">Description</Label>
                            <Input
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Optional description"
                                className="rounded-lg border-border/50 focus:border-primary/50 focus:ring-primary/20"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <ChartBarIcon size={16} weight="duotone" className="h-5 w-5 text-primary" />
                            <Label className="text-base font-semibold text-foreground">Funnel Steps</Label>
                        </div>
                        <div className="space-y-4">
                            {formData.steps.map((step, index) => (
                                <div key={index} className="flex items-center gap-4 p-4 border rounded-xl hover:shadow-sm transition-all duration-200">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-2 border-primary/20 flex items-center justify-center text-sm font-semibold shadow-sm">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <Select
                                            value={step.type}
                                            onValueChange={(value) => updateStep(index, 'type', value)}
                                        >
                                            <SelectTrigger className="rounded-lg border-border/50 focus:border-primary/50">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-lg">
                                                <SelectItem value="PAGE_VIEW">Page View</SelectItem>
                                                <SelectItem value="EVENT">Event</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Input
                                            value={step.target}
                                            onChange={(e) => updateStep(index, 'target', e.target.value)}
                                            placeholder={step.type === 'PAGE_VIEW' ? '/path' : 'event_name'}
                                            className="rounded-lg border-border/50 focus:border-primary/50 focus:ring-primary/20"
                                        />
                                        <Input
                                            value={step.name}
                                            onChange={(e) => updateStep(index, 'name', e.target.value)}
                                            placeholder="Step name"
                                            className="rounded-lg border-border/50 focus:border-primary/50 focus:ring-primary/20"
                                        />
                                    </div>
                                    {formData.steps.length > 2 && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => removeStep(index)}
                                            className="rounded-lg h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
                                        >
                                            <TrashIcon size={16} weight="duotone" className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="default"
                            className="rounded-lg border-dashed border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group"
                            onClick={addStep}
                            disabled={formData.steps.length >= 10}
                        >
                            <PlusIcon size={16} className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                            Add Step
                        </Button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <FunnelIcon size={16} weight="duotone" className="h-5 w-5 text-primary" />
                            <Label className="text-base font-semibold text-foreground">Filters</Label>
                            <span className="text-xs text-muted-foreground">(optional)</span>
                        </div>

                        {formData.filters && formData.filters.length > 0 && (
                            <div className="space-y-3">
                                {formData.filters.map((filter, index) => (
                                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                                        <Select
                                            value={filter.field}
                                            onValueChange={(value) => updateFilter(index, 'field', value)}
                                        >
                                            <SelectTrigger className="w-40 rounded border-border/50">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded">
                                                {filterOptions.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Select
                                            value={filter.operator}
                                            onValueChange={(value) => updateFilter(index, 'operator', value)}
                                        >
                                            <SelectTrigger className="w-32 rounded border-border/50">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded">
                                                {operatorOptions.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Input
                                            value={filter.value as string}
                                            onChange={(e) => updateFilter(index, 'value', e.target.value)}
                                            placeholder="Filter value"
                                            className="flex-1 rounded border-border/50 focus:border-primary/50 focus:ring-primary/20"
                                        />

                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => removeFilter(index)}
                                            className="rounded h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                                        >
                                            <TrashIcon size={16} className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded border-dashed border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/5"
                            onClick={addFilter}
                        >
                            <PlusIcon size={16} className="h-4 w-4 mr-2" />
                            Add Filter
                        </Button>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            className="rounded"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={
                                !formData.name ||
                                formData.steps.some(s => !s.name || !s.target) ||
                                (formData.filters || []).some(f => !f.value || f.value === '') ||
                                isCreating
                            }
                            className="rounded relative"
                        >
                            {isCreating && (
                                <div className="absolute left-3">
                                    <div className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin"></div>
                                </div>
                            )}
                            <span className={isCreating ? 'ml-6' : ''}>
                                {isCreating ? 'Creating...' : 'Create Funnel'}
                            </span>
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
} 