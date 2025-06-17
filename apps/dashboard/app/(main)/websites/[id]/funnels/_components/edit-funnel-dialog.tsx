"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    PencilIcon,
    ChartBarIcon,
    PlusIcon,
    TrashIcon
} from "@phosphor-icons/react";
import type { Funnel, FunnelStep } from "@/hooks/use-funnels";

interface EditFunnelDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (funnel: Funnel) => Promise<void>;
    funnel: Funnel | null;
    isUpdating: boolean;
}

export function EditFunnelDialog({ isOpen, onClose, onSubmit, funnel, isUpdating }: EditFunnelDialogProps) {
    const [formData, setFormData] = useState<Funnel | null>(null);

    useEffect(() => {
        if (funnel) {
            setFormData({ ...funnel });
        }
    }, [funnel]);

    const handleSubmit = async () => {
        if (!formData) return;
        await onSubmit(formData);
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

    if (!formData) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto rounded-xl animate-in fade-in-50 zoom-in-95 duration-300">
                <DialogHeader className="space-y-3 pb-6 border-b border-border/50">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                            <PencilIcon size={16} weight="duotone" className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-semibold text-foreground">Edit Funnel</DialogTitle>
                            <DialogDescription className="text-muted-foreground mt-1">
                                Update funnel configuration and steps
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name" className="text-sm font-medium text-foreground">Funnel Name</Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => prev ? ({ ...prev, name: e.target.value }) : prev)}
                                placeholder="e.g., Sign Up Flow"
                                className="rounded-lg border-border/50 focus:border-primary/50 focus:ring-primary/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-description" className="text-sm font-medium text-foreground">Description</Label>
                            <Input
                                id="edit-description"
                                value={formData.description || ''}
                                onChange={(e) => setFormData(prev => prev ? ({ ...prev, description: e.target.value }) : prev)}
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

                    <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="rounded"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={!formData.name || formData.steps.some(s => !s.name || !s.target) || isUpdating}
                            className="rounded relative"
                        >
                            {isUpdating && (
                                <div className="absolute left-3">
                                    <div className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin"></div>
                                </div>
                            )}
                            <span className={isUpdating ? 'ml-6' : ''}>
                                {isUpdating ? 'Updating...' : 'Update Funnel'}
                            </span>
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}