'use client';

import { FloppyDiskIcon, GearIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type Organization, useOrganizations } from '@/hooks/use-organizations';
import { OrganizationLogoUploader } from './organization-logo-uploader';

interface GeneralSettingsProps {
	organization: Organization;
}

export function GeneralSettings({ organization }: GeneralSettingsProps) {
	const [name, setName] = useState(organization.name);
	const [slug, setSlug] = useState(organization.slug);
	const [isSaving, setIsSaving] = useState(false);

	const { updateOrganizationAsync } = useOrganizations();

	const cleanSlug = (value: string) => {
		return value
			.toLowerCase()
			.replace(/[^a-z0-9-]/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-|-$/g, '');
	};

	const handleSlugChange = (value: string) => {
		setSlug(cleanSlug(value));
	};

	const handleSave = async () => {
		if (!(name.trim() && slug.trim())) {
			toast.error('Name and slug are required');
			return;
		}

		setIsSaving(true);
		try {
			await updateOrganizationAsync({
				organizationId: organization.id,
				data: {
					name: name.trim(),
					slug: slug.trim(),
				},
			});

			toast.success('Organization updated successfully');

			// If slug changed, we might need to update the URL context
			// but since we're using active organization, this should be handled automatically
		} catch (_error) {
			toast.error('Failed to update organization');
		} finally {
			setIsSaving(false);
		}
	};

	const hasChanges = name !== organization.name || slug !== organization.slug;

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<div className="rounded border p-2">
							<GearIcon
								className="h-5 w-5 not-dark:text-primary"
								size={16}
								weight="duotone"
							/>
						</div>
						<div>
							<CardTitle>Organization Details</CardTitle>
							<CardDescription>
								Update your organization's basic information and settings.
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Logo Upload Section */}
					<div className="space-y-4">
						<OrganizationLogoUploader organization={organization} />
					</div>

					{/* Name and Slug Section */}
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="name">Organization Name</Label>
							<Input
								id="name"
								onChange={(e) => setName(e.target.value)}
								placeholder="Enter organization name"
								value={name}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="slug">Organization Slug</Label>
							<Input
								id="slug"
								onChange={(e) => handleSlugChange(e.target.value)}
								placeholder="organization-slug"
								value={slug}
							/>
							<p className="text-muted-foreground text-xs">
								This will be used in your organization URL
							</p>
						</div>
					</div>

					{/* Save Button */}
					{hasChanges && (
						<div className="flex justify-end">
							<Button
								className="rounded"
								disabled={isSaving}
								onClick={handleSave}
							>
								{isSaving ? (
									<>
										<div className="mr-2 h-4 w-4 animate-spin rounded-full border border-primary-foreground/30 border-t-primary-foreground" />
										Saving...
									</>
								) : (
									<>
										<FloppyDiskIcon className="mr-2 h-4 w-4" size={16} />
										Save Changes
									</>
								)}
							</Button>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
