'use client';

import {
	CaretDownIcon,
	CaretUpIcon,
	CopyIcon,
	FlagIcon,
	PencilIcon,
	TrashIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';

interface Flag {
	id: string;
	key: string;
	name?: string | null;
	description?: string | null;
	type: string;
	status: string;
	rolloutPercentage?: number | null;
	rules?: any;
	createdAt: Date;
}

interface FlagRowProps {
	flag: Flag;
	onEdit: () => void;
	onDelete?: (flagId: string) => void;
	isExpanded?: boolean;
	onToggle?: (flagId: string) => void;
	children?: React.ReactNode;
}

export function FlagRow({
	flag,
	onEdit,
	onDelete,
	isExpanded = false,
	onToggle,
	children,
}: FlagRowProps) {
	const [isArchiving, setIsArchiving] = useState(false);

	const utils = trpc.useUtils();
	const deleteMutation = trpc.flags.delete.useMutation();

	const handleCopyKey = () => {
		navigator.clipboard.writeText(flag.key);
		toast.success('Flag key copied to clipboard');
	};

	const handleArchive = async () => {
		setIsArchiving(true);
		try {
			await deleteMutation.mutateAsync({ id: flag.id });
			toast.success('Flag archived successfully');
			utils.flags.list.invalidate();
		} catch (error) {
			toast.error('Failed to archive flag');
		} finally {
			setIsArchiving(false);
		}
	};

	const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
		const target = e.target as HTMLElement;
		if (target.closest('button')) {
			return;
		}
		if (onToggle) {
			onToggle(flag.id);
		}
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case 'active':
				return (
					<Badge className="bg-accent text-accent-foreground">● Active</Badge>
				);
			case 'inactive':
				return <Badge variant="secondary">○ Inactive</Badge>;
			case 'archived':
				return <Badge variant="outline">Archived</Badge>;
			default:
				return <Badge variant="secondary">{status}</Badge>;
		}
	};

	const getTypeInfo = () => {
		const ruleCount = Array.isArray(flag.rules) ? flag.rules.length : 0;
		const rollout = flag.rolloutPercentage || 0;

		const typeText = flag.type;
		const details = [];

		if (rollout > 0) {
			details.push(`${rollout}% rollout`);
		}

		if (ruleCount > 0) {
			details.push(`${ruleCount} rule${ruleCount !== 1 ? 's' : ''}`);
		} else {
			details.push('No rules');
		}

		return `${typeText} • ${details.join(' • ')}`;
	};

	return (
		<Card
			className="mb-4 cursor-pointer select-none overflow-hidden rounded border bg-background transition focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
			onClick={handleCardClick}
			onKeyDown={(e) => {
				if ((e.key === 'Enter' || e.key === ' ') && onToggle) {
					onToggle(flag.id);
				}
			}}
			style={{ outline: 'none' }}
			tabIndex={0}
		>
			<div className="flex items-center justify-between gap-2 px-4 py-3 sm:px-6">
				<div className="flex flex-grow flex-col text-left">
					<div className="mb-1 flex flex-wrap items-center gap-2">
						<h3
							className="mr-2 truncate font-mono font-semibold text-base"
							style={{ color: 'var(--color-foreground)' }}
						>
							{flag.key}
						</h3>
						{getStatusBadge(flag.status)}
						<span
							className="flex items-center gap-1 rounded border px-2 py-0.5 text-xs"
							style={{
								background: 'var(--color-muted)',
								color: 'var(--color-foreground)',
								borderColor: 'var(--color-border)',
							}}
						>
							<FlagIcon
								className="mr-1 h-3 w-3"
								style={{ color: 'var(--color-primary)' }}
								weight="duotone"
							/>
							<span>{flag.type}</span>
							{flag.rolloutPercentage && flag.rolloutPercentage > 0 && (
								<span style={{ color: 'var(--color-muted-foreground)' }}>
									• {flag.rolloutPercentage}%
								</span>
							)}
						</span>
					</div>
					{flag.name && (
						<p className="mb-1 font-medium text-foreground text-sm">
							{flag.name}
						</p>
					)}
					{flag.description && (
						<p className="line-clamp-2 text-muted-foreground text-sm">
							{flag.description}
						</p>
					)}
				</div>
				<div className="flex items-center gap-2">
					<Button
						className="focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
						onClick={(e) => {
							e.stopPropagation();
							handleCopyKey();
						}}
						size="icon"
						type="button"
						variant="ghost"
					>
						<CopyIcon className="h-4 w-4" weight="duotone" />
					</Button>
					<Button
						className="focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
						onClick={(e) => {
							e.stopPropagation();
							onEdit();
						}}
						size="icon"
						type="button"
						variant="ghost"
					>
						<PencilIcon className="h-4 w-4" weight="duotone" />
					</Button>
					<Button
						className="focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
						onClick={(e) => {
							e.stopPropagation();
							handleArchive();
						}}
						size="icon"
						type="button"
						variant="ghost"
					>
						<TrashIcon className="h-4 w-4" weight="duotone" />
					</Button>
					{onToggle && (
						<Button
							className="focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
							onClick={(e) => {
								e.stopPropagation();
								onToggle(flag.id);
							}}
							size="icon"
							type="button"
							variant="ghost"
						>
							{isExpanded ? (
								<CaretUpIcon className="h-4 w-4" weight="fill" />
							) : (
								<CaretDownIcon className="h-4 w-4" weight="fill" />
							)}
						</Button>
					)}
				</div>
			</div>
			{isExpanded && (
				<div className="border-border border-t bg-muted/30">
					<div className="p-4">{children}</div>
				</div>
			)}
		</Card>
	);
}
