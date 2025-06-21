"use client";

import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    PencilIcon,
    ChartBarIcon,
    PlusIcon,
    TrashIcon,
    FunnelIcon
} from "@phosphor-icons/react";
import type { Funnel, FunnelStep, FunnelFilter, AutocompleteData, CreateFunnelData } from "@/hooks/use-funnels";

// Simple Autocomplete Component
const AutocompleteInput = ({ value, onValueChange, suggestions, placeholder, className }: {
    value: string;
    onValueChange: (value: string) => void;
    suggestions: string[];
    placeholder?: string;
    className?: string;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    const handleInputChange = (newValue: string) => {
        onValueChange(newValue);

        if (newValue.trim()) {
            const filtered = suggestions.filter(s =>
                s.toLowerCase().includes(newValue.toLowerCase())
            ).slice(0, 8);
            setFilteredSuggestions(filtered);
            setIsOpen(filtered.length > 0);
        } else {
            setFilteredSuggestions(suggestions.slice(0, 8));
            setIsOpen(suggestions.length > 0);
        }
    };

    const handleFocus = () => {
        if (value.trim()) {
            const filtered = suggestions.filter(s =>
                s.toLowerCase().includes(value.toLowerCase())
            ).slice(0, 8);
            setFilteredSuggestions(filtered);
            setIsOpen(filtered.length > 0);
        } else {
            setFilteredSuggestions(suggestions.slice(0, 8));
            setIsOpen(suggestions.length > 0);
        }
    };

    const handleSelect = (suggestion: string) => {
        onValueChange(suggestion);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={containerRef}>
            <Input
                value={value || ''}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={handleFocus}
                placeholder={placeholder}
                className={className}
            />
            {isOpen && filteredSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredSuggestions.map((suggestion, index) => (
                        <div
                            key={index}
                            className="px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground border-b last:border-b-0"
                            onClick={() => handleSelect(suggestion)}
                        >
                            {suggestion}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

interface EditFunnelDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (funnel: Funnel) => Promise<void>;
    onCreate?: (data: CreateFunnelData) => Promise<void>;
    funnel: Funnel | null;
    isUpdating: boolean;
    isCreating?: boolean;
    autocompleteData?: AutocompleteData;
}

export function EditFunnelDialog({ isOpen, onClose, onSubmit, onCreate, funnel, isUpdating, isCreating = false, autocompleteData }: EditFunnelDialogProps) {
    const [formData, setFormData] = useState<Funnel | null>(null);
    const isCreateMode = !funnel;

    useEffect(() => {
        if (funnel) {
            setFormData({
                ...funnel,
                filters: funnel.filters || []
            });
        } else {
            // Initialize for create mode
            setFormData({
                id: '',
                name: '',
                description: '',
                steps: [
                    { type: 'PAGE_VIEW' as const, target: '/', name: 'Landing Page' },
                    { type: 'PAGE_VIEW' as const, target: '/signup', name: 'Sign Up Page' }
                ],
                filters: [],
                isActive: true,
                createdAt: '',
                updatedAt: ''
            });
        }
    }, [funnel]);

    const handleSubmit = async () => {
        if (!formData) return;

        if (isCreateMode && onCreate) {
            const createData: CreateFunnelData = {
                name: formData.name,
                description: formData.description,
                steps: formData.steps,
                filters: formData.filters || []
            };
            await onCreate(createData);
            resetForm();
        } else {
            await onSubmit(formData);
        }
    };

    const resetForm = () => {
        if (isCreateMode) {
            setFormData({
                id: '',
                name: '',
                description: '',
                steps: [
                    { type: 'PAGE_VIEW' as const, target: '/', name: 'Landing Page' },
                    { type: 'PAGE_VIEW' as const, target: '/signup', name: 'Sign Up Page' }
                ],
                filters: [],
                isActive: true,
                createdAt: '',
                updatedAt: ''
            });
        }
    };

    const addStep = () => {
        if (!formData) return;
        setFormData(prev => prev ? ({
            ...prev,
            steps: [...prev.steps, { type: 'PAGE_VIEW' as const, target: '', name: '' }]
        }) : prev);
    };

    const removeStep = (index: number) => {
        if (!formData || formData.steps.length <= 2) return;
        setFormData(prev => prev ? ({
            ...prev,
            steps: prev.steps.filter((_, i) => i !== index)
        }) : prev);
    };

    const updateStep = (index: number, field: keyof FunnelStep, value: string) => {
        if (!formData) return;
        setFormData(prev => prev ? ({
            ...prev,
            steps: prev.steps.map((step, i) =>
                i === index ? { ...step, [field]: value } : step
            )
        }) : prev);
    };

    const addFilter = () => {
        if (!formData) return;
        setFormData(prev => prev ? ({
            ...prev,
            filters: [...(prev.filters || []), { field: 'browser_name', operator: 'equals' as const, value: '' }]
        }) : prev);
    };

    const removeFilter = (index: number) => {
        if (!formData) return;
        setFormData(prev => prev ? ({
            ...prev,
            filters: (prev.filters || []).filter((_, i) => i !== index)
        }) : prev);
    };

    const updateFilter = (index: number, field: keyof FunnelFilter, value: string) => {
        if (!formData) return;
        setFormData(prev => prev ? ({
            ...prev,
            filters: (prev.filters || []).map((filter, i) =>
                i === index ? { ...filter, [field]: value } : filter
            )
        }) : prev);
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

    const getSuggestions = (field: string): string[] => {
        if (!autocompleteData) return [];

        switch (field) {
            case 'browser_name':
                return autocompleteData.browsers || [];
            case 'os_name':
                return autocompleteData.operatingSystems || [];
            case 'country':
                return autocompleteData.countries || [];
            case 'device_type':
                return autocompleteData.deviceTypes || [];
            case 'utm_source':
                return autocompleteData.utmSources || [];
            case 'utm_medium':
                return autocompleteData.utmMediums || [];
            case 'utm_campaign':
                return autocompleteData.utmCampaigns || [];
            default:
                return [];
        }
    };

    const getStepSuggestions = (stepType: string): string[] => {
        if (!autocompleteData) return [];

        if (stepType === 'PAGE_VIEW') {
            return autocompleteData.pagePaths || [];
        } else if (stepType === 'EVENT') {
            return autocompleteData.customEvents || [];
        }

        return [];
    };

    const handleClose = () => {
        onClose();
        if (isCreateMode) {
            resetForm();
        }
    };

    if (!formData) return null;

    return (
        <Sheet open={isOpen} onOpenChange={handleClose}>
            <SheetContent side="right" className="w-[60vw] overflow-y-auto"
                style={{ width: '40vw', padding: '1rem', maxWidth: '1200px' }}
            >
                <SheetHeader className="space-y-3 pb-6 border-b border-border/50">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                            {isCreateMode ? (
                                <FunnelIcon size={16} weight="duotone" className="h-6 w-6 text-primary" />
                            ) : (
                                <PencilIcon size={16} weight="duotone" className="h-6 w-6 text-primary" />
                            )}
                        </div>
                        <div>
                            <SheetTitle className="text-xl font-semibold text-foreground">
                                {isCreateMode ? 'Create New Funnel' : 'Edit Funnel'}
                            </SheetTitle>
                            <SheetDescription className="text-muted-foreground mt-1">
                                {isCreateMode
                                    ? 'Set up a new conversion funnel to track user journeys'
                                    : 'Update funnel configuration and steps'
                                }
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="space-y-6 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name" className="text-sm font-medium text-foreground">Funnel Name</Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => prev ? ({ ...prev, name: e.target.value }) : prev)}
                                placeholder="e.g., Sign Up Flow"
                                className="rounded border-border/50 focus:border-primary/50 focus:ring-primary/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-description" className="text-sm font-medium text-foreground">Description</Label>
                            <Input
                                id="edit-description"
                                value={formData.description || ''}
                                onChange={(e) => setFormData(prev => prev ? ({ ...prev, description: e.target.value }) : prev)}
                                placeholder="Optional description"
                                className="rounded border-border/50 focus:border-primary/50 focus:ring-primary/20"
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
                                <div key={index} className="flex items-center gap-4 p-4 border rounded hover:shadow-sm transition-all duration-200">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-2 border-primary/20 flex items-center justify-center text-sm font-semibold shadow-sm">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <Select
                                            value={step.type}
                                            onValueChange={(value) => updateStep(index, 'type', value)}
                                        >
                                            <SelectTrigger className="rounded border-border/50 focus:border-primary/50">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded">
                                                <SelectItem value="PAGE_VIEW">Page View</SelectItem>
                                                <SelectItem value="EVENT">Event</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <AutocompleteInput
                                            value={step.target || ''}
                                            onValueChange={(value) => updateStep(index, 'target', value)}
                                            suggestions={getStepSuggestions(step.type)}
                                            placeholder={step.type === 'PAGE_VIEW' ? '/path' : 'event_name'}
                                            className="rounded-lg border-border/50 focus:border-primary/50 focus:ring-primary/20"
                                        />
                                        <Input
                                            value={step.name}
                                            onChange={(e) => updateStep(index, 'name', e.target.value)}
                                            placeholder="Step name"
                                            className="rounded border-border/50 focus:border-primary/50 focus:ring-primary/20"
                                        />
                                    </div>
                                    {formData.steps.length > 2 && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => removeStep(index)}
                                            className="rounded h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
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
                            className="rounded border-dashed border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group"
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
                                    <div key={index} className="flex items-center gap-3 p-3 border rounded bg-muted/30">
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

                                        <AutocompleteInput
                                            value={filter.value as string || ''}
                                            onValueChange={(value) => updateFilter(index, 'value', value)}
                                            suggestions={getSuggestions(filter.field)}
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
                                (isCreateMode ? isCreating : isUpdating)
                            }
                            className="rounded relative"
                        >
                            {(isCreateMode ? isCreating : isUpdating) && (
                                <div className="absolute left-3">
                                    <div className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin"></div>
                                </div>
                            )}
                            <span className={(isCreateMode ? isCreating : isUpdating) ? 'ml-6' : ''}>
                                {isCreateMode
                                    ? (isCreating ? 'Creating...' : 'Create Funnel')
                                    : (isUpdating ? 'Updating...' : 'Update Funnel')
                                }
                            </span>
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}