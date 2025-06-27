import { useState } from 'react';
import { useAutumn, useCustomer } from 'autumn-js/react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { CustomerProduct, Customer } from '../data/billing-data';
import { useBillingData } from "../data/billing-data";
import AttachDialog from '@/components/autumn/attach-dialog';

export function useBilling(refetch?: () => void) {
    const { attach, cancel, check, track, openBillingPortal } = useAutumn();
    const [isLoading, setIsLoading] = useState(false);
    const [showNoPaymentDialog, setShowNoPaymentDialog] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [cancellingPlan, setCancellingPlan] = useState<{ id: string, name: string, currentPeriodEnd?: number } | null>(null);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const { subscriptionData } = useBillingData();

    const handleUpgrade = async (planId: string) => {
        setIsActionLoading(true);

        try {
            const result = await attach({ 
                productId: planId,
                dialog: AttachDialog,
                successUrl: `${window.location.origin}/payment/success?plan_id=${planId}`
            });
        } catch (error: any) {
            toast.error(error.message || 'An unexpected error occurred.');
        } finally {                    
            setIsActionLoading(false);
        }
    };

    const handleCancel = async (planId: string, immediate = false) => {
        setIsLoading(true);
        try {
            await cancel({
                productId: planId,
                ...(immediate && { cancelImmediately: true })
            });
            toast.success(immediate ? 'Subscription cancelled immediately.' : 'Subscription cancelled.');
            if (refetch) {
                setTimeout(() => refetch(), 500);
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to cancel subscription.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelClick = (planId: string, planName: string, currentPeriodEnd?: number) => {
        setCancellingPlan({ id: planId, name: planName, currentPeriodEnd });
        setShowCancelDialog(true);
    };

    const handleCancelConfirm = async (immediate: boolean) => {
        if (!cancellingPlan) return;
        await handleCancel(cancellingPlan.id, immediate);
        setCancellingPlan(null);
    };

    const handleManageBilling = async () => {
        await openBillingPortal({
            returnUrl: `${window.location.origin}/billing`,
        });
    };

    const getSubscriptionStatus = (product: CustomerProduct) => {
        if (product.status === 'canceled') return 'Cancelled';
        if (product.status === 'scheduled') return 'Scheduled';
        if (product.canceled_at) return 'Cancelling';
        return 'Active';
    };

    const getSubscriptionStatusDetails = (product: CustomerProduct) => {
        if (product.canceled_at && product.current_period_end) {
            return `Access until ${dayjs(product.current_period_end).format('MMM D, YYYY')}`;
        }
        if (product.status === 'scheduled') {
            return `Starts on ${dayjs(product.started_at).format('MMM D, YYYY')}`;
        }
        if (product.current_period_end) {
            return `Renews on ${dayjs(product.current_period_end).format('MMM D, YYYY')}`;
        }
        return '';
    };

    const getFeatureUsage = (featureId: string, customer?: Customer) => {
        if (!customer || !customer.features) return null;

        const feature = customer.features[featureId];
        if (!feature) return null;

        return {
            id: feature.id,
            name: feature.name,
            used: feature.usage,
            limit: feature.unlimited ? Infinity : feature.included_usage,
            unlimited: feature.unlimited || false,
            nextReset: feature.next_reset_at ? dayjs(feature.next_reset_at).format('MMM D, YYYY') : null,
            interval: feature.interval || null
        };
    };

    return {
        isLoading,
        onUpgrade: handleUpgrade,
        onCancel: handleCancel,
        onCancelClick: handleCancelClick,
        onCancelConfirm: handleCancelConfirm,
        onManageBilling: handleManageBilling,
        check,
        track,
        showNoPaymentDialog,
        setShowNoPaymentDialog,
        showCancelDialog,
        setShowCancelDialog,
        cancellingPlan,
        getSubscriptionStatus,
        getSubscriptionStatusDetails,
        getFeatureUsage
    };
} 