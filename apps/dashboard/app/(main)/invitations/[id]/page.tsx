'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { authClient } from '@databuddy/auth/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    CircleNotch,
    CheckCircle,
    XCircle,
    Buildings,
    UserPlus,
    Sparkle,
    ArrowRight,
    Clock,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

type InvitationData = {
    organizationName: string;
    organizationSlug: string;
    inviterEmail: string;
    id: string;
    email: string;
    status: "pending" | "accepted" | "rejected" | "canceled";
    expiresAt: Date;
    organizationId: string;
    role: string;
    inviterId: string;
    teamId?: string | undefined;
}

export default function AcceptInvitationPage() {
    const router = useRouter();
    const params = useParams();
    const invitationId = params.id as string;

    const [status, setStatus] = useState<'loading' | 'ready' | 'accepting' | 'success' | 'error' | 'expired' | 'already-accepted'>('loading');
    const [invitation, setInvitation] = useState<InvitationData | null>(null);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const fetchInvitation = async () => {
            try {
                if (!invitationId) {
                    setStatus('error');
                    setError('Invalid invitation link');
                    return;
                }

                const { data: invitationData, error: invitationError } = await authClient.organization.getInvitation({
                    query: { id: invitationId }
                });

                if (invitationError || !invitationData) {
                    if (invitationError?.message?.includes('expired') || invitationError?.message?.includes('not found')) {
                        setStatus('expired');
                    } else {
                        setStatus('error');
                        setError(invitationError?.message || 'Failed to load invitation');
                    }
                    return;
                }

                setInvitation(invitationData);

                if (invitationData.status === 'accepted') {
                    setStatus('already-accepted');
                } else if (invitationData.status === 'canceled' || invitationData.status === 'rejected' || new Date(invitationData.expiresAt) < new Date()) {
                    setStatus('expired');
                } else {
                    setStatus('ready');
                }
            } catch (err: any) {
                console.error('Error fetching invitation:', err);
                setStatus('error');
                setError(err.message || 'An unexpected error occurred');
            }
        };

        fetchInvitation();
    }, [invitationId]);

    const handleAcceptInvitation = async () => {
        if (!invitation) return;

        setStatus('accepting');
        try {
            const result = await authClient.organization.acceptInvitation({
                invitationId,
            });

            if (result.data) {
                setStatus('success');
                setTimeout(() => {
                    router.push('/websites');
                }, 3000);
            } else {
                setStatus('error');
                setError('Failed to accept invitation');
            }
        } catch (err: any) {
            console.error('Error accepting invitation:', err);
            setStatus('error');
            setError(err.message || 'Failed to accept invitation');
        }
    };

    const handleDecline = () => {
        router.push('/websites');
    };

    const formatRole = (role: string) => {
        return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    };

    const formatExpiryDate = (expiresAt: string) => {
        const date = new Date(expiresAt);
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderContent = () => {
        switch (status) {
            case 'loading':
                return (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <div className="relative mb-8">
                            <div className="rounded-full bg-muted/50 p-8 border">
                                <CircleNotch className="h-16 w-16 text-primary animate-spin" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold mb-4">Loading Invitation</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            Fetching invitation details...
                        </p>
                    </div>
                );

            case 'ready':
                return (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                            <div className="relative rounded-full bg-gradient-to-br from-primary/10 to-primary/5 p-6 border border-primary/20">
                                <UserPlus weight="duotone" className="h-12 w-12 text-primary" />
                            </div>
                            <Sparkle weight="duotone" className="absolute -top-2 -right-2 h-6 w-6 text-primary/60 animate-pulse" />
                            <Sparkle weight="duotone" className="absolute -bottom-1 -left-3 h-4 w-4 text-primary/40 animate-pulse" style={{ animationDelay: '1s' }} />
                        </div>

                        <div className="space-y-4 mb-8">
                            <h3 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                You're Invited!
                            </h3>
                            <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
                                <span className="font-semibold text-foreground">{invitation?.inviterEmail}</span> has invited you to join{' '}
                                <span className="font-semibold text-foreground">{invitation?.organizationName}</span> as a{' '}
                                <span className="font-semibold text-primary">{formatRole(invitation?.role || '')}</span>.
                            </p>
                        </div>

                        <div className="bg-muted/50 rounded-xl p-6 mb-8 border border-border/50 max-w-md w-full">
                            <div className="flex items-start gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Buildings weight="duotone" className="h-5 w-5 text-primary" />
                                </div>
                                <div className="text-left flex-1">
                                    <p className="font-semibold text-sm mb-1">Organization Details</p>
                                    <p className="text-sm text-muted-foreground">
                                        {invitation?.organizationName}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Role: {formatRole(invitation?.role || '')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                                    <Clock weight="duotone" className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div className="text-left flex-1">
                                    <p className="font-semibold text-sm mb-1">Expires</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatExpiryDate(invitation?.expiresAt.toString() || '')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                            <Button
                                onClick={handleAcceptInvitation}
                                size="lg"
                                className="gap-3 px-8 py-6 text-lg font-medium flex-1 group relative overflow-hidden rounded"
                            >
                                <UserPlus weight="duotone" className="h-5 w-5 group-hover:scale-110 transition-transform duration-300 relative z-10" />
                                <span className="relative z-10">Join Organization</span>
                                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300 relative z-10" />
                            </Button>

                            <Button
                                onClick={handleDecline}
                                variant="outline"
                                size="lg"
                                className="px-8 py-6 text-lg font-medium flex-1 sm:flex-initial rounded"
                            >
                                Maybe Later
                            </Button>
                        </div>
                    </div>
                );

            case 'accepting':
                return (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <div className="relative mb-8">
                            <div className="rounded-full bg-primary/10 p-8 border border-primary/20">
                                <CircleNotch className="h-16 w-16 text-primary animate-spin" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold mb-4">Joining Organization</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            Adding you to <span className="font-semibold text-foreground">{invitation?.organizationName}</span>...
                        </p>
                    </div>
                );

            case 'success':
                return (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
                            <div className="relative rounded-full bg-gradient-to-br from-green-500/10 to-green-500/5 p-6 border border-green-500/20">
                                <CheckCircle weight="duotone" className="h-12 w-12 text-green-600" />
                            </div>
                            <Sparkle weight="duotone" className="absolute -top-2 -right-2 h-6 w-6 text-green-500/60 animate-pulse" />
                        </div>

                        <div className="space-y-4 mb-8">
                            <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
                                Welcome Aboard!
                            </h3>
                            <p className="text-muted-foreground text-lg leading-relaxed">
                                You've successfully joined <span className="font-semibold text-foreground">{invitation?.organizationName}</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Redirecting you to your dashboard...
                            </p>
                        </div>

                        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800 max-w-md">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/40">
                                    <Sparkle weight="duotone" className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-sm mb-2 text-green-800 dark:text-green-200">🎉 You're all set!</p>
                                    <p className="text-sm text-green-700 dark:text-green-300 leading-relaxed">
                                        You can now access all projects and resources in {invitation?.organizationName}.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'already-accepted':
                return (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <div className="relative mb-8">
                            <div className="rounded-full bg-blue-500/10 p-8 border border-blue-500/20">
                                <CheckCircle weight="duotone" className="h-16 w-16 text-blue-600" />
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <h3 className="text-2xl font-bold">Already a Member</h3>
                            <p className="text-muted-foreground text-lg leading-relaxed">
                                You're already a member of <span className="font-semibold text-foreground">{invitation?.organizationName}</span>
                            </p>
                        </div>

                        <Button
                            onClick={() => router.push('/websites')}
                            size="lg"
                            className="gap-3 px-8 py-6 text-lg font-medium rounded"
                        >
                            <Buildings weight="duotone" className="h-5 w-5" />
                            Go to Dashboard
                            <ArrowRight weight="duotone" className="h-5 w-5" />
                        </Button>
                    </div>
                );

            case 'expired':
                return (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <div className="relative mb-8">
                            <div className="rounded-full bg-red-500/10 p-8 border border-red-500/20">
                                <XCircle weight="duotone" className="h-16 w-16 text-red-600" />
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <h3 className="text-2xl font-bold">Invitation Expired</h3>
                            <p className="text-muted-foreground text-lg leading-relaxed">
                                This invitation link has expired or is no longer valid.
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Please contact the organization admin for a new invitation.
                            </p>
                        </div>

                        <Button
                            onClick={() => router.push('/')}
                            size="lg"
                            className="gap-3 px-8 py-6 text-lg font-medium rounded"
                        >
                            <Buildings weight="duotone" className="h-5 w-5" />
                            Back to Home
                            <ArrowRight weight="duotone" className="h-5 w-5" />
                        </Button>
                    </div>
                );

            case 'error':
                return (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <div className="relative mb-8">
                            <div className="rounded-full bg-red-500/10 p-8 border border-red-500/20">
                                <XCircle weight="duotone" className="h-16 w-16 text-red-600" />
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <h3 className="text-2xl font-bold">Something went wrong</h3>
                            <p className="text-muted-foreground text-lg leading-relaxed">{error}</p>
                        </div>

                        <Button
                            onClick={() => router.push('/')}
                            size="lg"
                            className="gap-3 px-8 py-6 text-lg font-medium rounded"
                        >
                            <Buildings weight="duotone" className="h-5 w-5" />
                            Back to Home
                            <ArrowRight weight="duotone" className="h-5 w-5" />
                        </Button>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="border-b bg-muted/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 sm:py-4 gap-3 sm:gap-0">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                                <UserPlus weight="duotone" className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                                    Organization Invitation
                                </h1>
                                <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                                    {status === 'ready' && invitation ? `Join ${invitation.organizationName}` : 'Processing invitation'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <Card className="border-0 shadow-none bg-transparent w-full">
                    <CardContent className="p-0">
                        {renderContent()}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 