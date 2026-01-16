"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	CircleNotchIcon,
	CopyIcon,
	LinkIcon,
	QrCodeIcon,
} from "@phosphor-icons/react";
import { useCallback } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useOrganizationsContext } from "@/components/providers/organizations-provider";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Sheet,
	SheetBody,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type Link, useCreateLink, useUpdateLink } from "@/hooks/use-links";
import { LinkQrCode } from "./link-qr-code";

const LINKS_BASE_URL = "dby.sh";

const slugRegex = /^[a-zA-Z0-9_-]+$/;

const formSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Name is required")
		.max(255, "Name must be less than 255 characters"),
	targetUrl: z
		.string()
		.min(1, "Target URL is required")
		.refine(
			(val) => {
				const urlToTest =
					val.startsWith("http://") || val.startsWith("https://")
						? val
						: `https://${val}`;
				try {
					const url = new URL(urlToTest);
					return url.protocol === "http:" || url.protocol === "https:";
				} catch {
					return false;
				}
			},
			{ message: "Please enter a valid URL" }
		),
	slug: z
		.string()
		.trim()
		.max(50, "Slug must be less than 50 characters")
		.refine((val) => val === "" || val.length >= 3, {
			message: "Slug must be at least 3 characters",
		})
		.refine((val) => val === "" || slugRegex.test(val), {
			message: "Only letters, numbers, hyphens, and underscores",
		})
		.optional()
		.or(z.literal("")),
});

type FormData = z.infer<typeof formSchema>;

interface LinkSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	link?: Link | null;
	onSave?: (link: Link) => void;
}

export function LinkSheet({
	open,
	onOpenChange,
	link,
	onSave,
}: LinkSheetProps) {
	const isEditing = !!link;
	const { activeOrganization } = useOrganizationsContext();

	const createLinkMutation = useCreateLink();
	const updateLinkMutation = useUpdateLink();

	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		mode: "onChange",
		defaultValues: {
			name: "",
			targetUrl: "",
			slug: "",
		},
	});

	const resetForm = useCallback(
		(linkData: Link | null | undefined) => {
			if (linkData) {
				let targetUrl = linkData.targetUrl;
				if (targetUrl.startsWith("https://")) {
					targetUrl = targetUrl.slice(8);
				} else if (targetUrl.startsWith("http://")) {
					targetUrl = targetUrl.slice(7);
				}
				form.reset({
					name: linkData.name,
					targetUrl,
					slug: linkData.slug,
				});
			} else {
				form.reset({ name: "", targetUrl: "", slug: "" });
			}
		},
		[form]
	);

	const handleOpenChange = useCallback(
		(isOpen: boolean) => {
			if (isOpen) {
				resetForm(link);
			}
			onOpenChange(isOpen);
		},
		[link, onOpenChange, resetForm]
	);

	const slugValue = form.watch("slug");

	const getErrorMessage = (error: unknown, isEditingMode: boolean): string => {
		const defaultMessage = `Failed to ${isEditingMode ? "update" : "create"} link.`;

		const rpcError = error as {
			data?: { code?: string };
			message?: string;
		};

		if (rpcError?.data?.code) {
			switch (rpcError.data.code) {
				case "CONFLICT":
					return "A link with this slug already exists.";
				case "FORBIDDEN":
					return (
						rpcError.message ||
						"You do not have permission to perform this action."
					);
				case "UNAUTHORIZED":
					return "You must be logged in to perform this action.";
				case "BAD_REQUEST":
					return (
						rpcError.message || "Invalid request. Please check your input."
					);
				default:
					return rpcError.message || defaultMessage;
			}
		}

		return rpcError?.message || defaultMessage;
	};

	const handleSubmit: SubmitHandler<FormData> = async (formData) => {
		if (!activeOrganization?.id) {
			toast.error("No organization selected");
			return;
		}

		let targetUrl = formData.targetUrl.trim();
		const hasProtocol =
			targetUrl.startsWith("http://") || targetUrl.startsWith("https://");
		if (!hasProtocol) {
			targetUrl = `https://${targetUrl}`;
		}

		const slug = formData.slug?.trim() || undefined;

		try {
			if (link?.id) {
				const result = await updateLinkMutation.mutateAsync({
					id: link.id,
					name: formData.name,
					targetUrl,
					slug,
				});
				if (onSave) {
					onSave(result);
				}
				toast.success("Link updated successfully!");
			} else {
				const result = await createLinkMutation.mutateAsync({
					organizationId: activeOrganization.id,
					name: formData.name,
					targetUrl,
					slug,
				});
				if (onSave) {
					onSave(result);
				}
				toast.success("Link created successfully!");
			}
			onOpenChange(false);
		} catch (error: unknown) {
			const message = getErrorMessage(error, !!link?.id);
			toast.error(message);
		}
	};

	const handleCopyLink = useCallback(async () => {
		if (!link?.slug) {
			return;
		}
		try {
			await navigator.clipboard.writeText(
				`https://${LINKS_BASE_URL}/${link.slug}`
			);
			toast.success("Link copied to clipboard");
		} catch {
			toast.error("Failed to copy link");
		}
	}, [link?.slug]);

	const isPending =
		createLinkMutation.isPending || updateLinkMutation.isPending;

	const { isValid, isDirty } = form.formState;
	const isSubmitDisabled = !(isValid && isDirty);

	const renderFormFields = (isEditMode: boolean) => (
		<div className="space-y-4">
			<FormField
				control={form.control}
				name="name"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Name</FormLabel>
						<FormControl>
							<Input placeholder="Marketing Campaign…" {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name="targetUrl"
				render={({ field }) => (
					<FormItem>
						<FormLabel>
							Destination URL
							{!isEditMode && <span className="ml-1 text-destructive">*</span>}
						</FormLabel>
						<FormControl>
							<Input
								placeholder="example.com/landing-page"
								prefix="https://"
								{...field}
								onChange={(e) => {
									let url = e.target.value.trim();
									if (url.startsWith("http://") || url.startsWith("https://")) {
										try {
											const parsed = new URL(url);
											url =
												parsed.host +
												parsed.pathname +
												parsed.search +
												parsed.hash;
										} catch {
											// Keep as is
										}
									}
									field.onChange(url);
								}}
							/>
						</FormControl>
						{!isEditMode && (
							<FormDescription>
								Where users will be redirected when clicking your link
							</FormDescription>
						)}
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name="slug"
				render={({ field }) => (
					<FormItem>
						<FormLabel>
							Custom Slug
							<span className="ml-1 text-muted-foreground">(optional)</span>
						</FormLabel>
						<FormControl>
							<Input
								placeholder="my-campaign"
								prefix={`${LINKS_BASE_URL}/`}
								{...field}
								onChange={(e) => {
									const value = e.target.value.replace(/\s/g, "-");
									field.onChange(value);
								}}
							/>
						</FormControl>
						<FormDescription>
							{slugValue && slugValue.length >= 3 ? (
								<span className="font-mono">
									{LINKS_BASE_URL}/{slugValue}
								</span>
							) : isEditMode ? (
								"Leave empty to keep the current slug"
							) : (
								"Leave empty to generate a random short slug"
							)}
						</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
		</div>
	);

	return (
		<Sheet onOpenChange={handleOpenChange} open={open}>
			<SheetContent className="sm:max-w-xl" side="right">
				<SheetHeader>
					<div className="flex items-center gap-4">
						<div className="flex size-11 items-center justify-center rounded border bg-secondary">
							<LinkIcon className="text-primary" size={20} weight="duotone" />
						</div>
						<div>
							<SheetTitle className="text-lg">
								{isEditing ? "Edit Link" : "Create Link"}
							</SheetTitle>
							<SheetDescription>
								{isEditing
									? `Editing ${link?.name || link?.slug}`
									: "Create a short link to track clicks and analytics"}
							</SheetDescription>
						</div>
					</div>
				</SheetHeader>

				<Form {...form}>
					<form
						className="flex flex-1 flex-col overflow-hidden"
						onSubmit={form.handleSubmit(handleSubmit)}
					>
						{isEditing && link ? (
							<Tabs
								className="flex flex-1 flex-col overflow-hidden"
								defaultValue="details"
								variant="underline"
							>
								<TabsList className="shrink-0 px-5">
									<TabsTrigger value="details">
										<LinkIcon size={16} weight="duotone" />
										Details
									</TabsTrigger>
									<TabsTrigger value="qr-code">
										<QrCodeIcon size={16} weight="duotone" />
										QR Code
									</TabsTrigger>
								</TabsList>

								<TabsContent
									className="mt-0 flex-1 overflow-y-auto"
									value="details"
								>
									<SheetBody className="space-y-6">
										{/* Short URL Preview */}
										<div className="space-y-2">
											<span className="font-medium text-foreground text-sm">
												Short URL
											</span>
											<div className="flex items-center gap-2 rounded border bg-muted/50 px-3 py-2.5">
												<span className="flex-1 truncate font-mono text-sm">
													{LINKS_BASE_URL}/{link.slug}
												</span>
												<Button
													onClick={handleCopyLink}
													size="sm"
													type="button"
													variant="ghost"
												>
													<CopyIcon size={16} />
													Copy
												</Button>
											</div>
										</div>

										<div className="h-px bg-border" />

										{renderFormFields(true)}
									</SheetBody>
								</TabsContent>

								<TabsContent
									className="mt-0 flex-1 overflow-y-auto"
									value="qr-code"
								>
									<SheetBody>
										<LinkQrCode name={link.name} slug={link.slug} />
									</SheetBody>
								</TabsContent>

								<SheetFooter>
									<Button
										onClick={() => onOpenChange(false)}
										type="button"
										variant="ghost"
									>
										Cancel
									</Button>
									<Button
										className="min-w-28"
										disabled={isPending || isSubmitDisabled}
										type="submit"
									>
										{isPending ? (
											<>
												<CircleNotchIcon className="animate-spin" size={16} />
												Saving…
											</>
										) : (
											"Save Changes"
										)}
									</Button>
								</SheetFooter>
							</Tabs>
						) : (
							<>
								<SheetBody className="space-y-6">
									{renderFormFields(false)}
								</SheetBody>

								<SheetFooter>
									<Button
										onClick={() => onOpenChange(false)}
										type="button"
										variant="ghost"
									>
										Cancel
									</Button>
									<Button
										className="min-w-28"
										disabled={isPending || isSubmitDisabled}
										type="submit"
									>
										{isPending ? (
											<>
												<CircleNotchIcon className="animate-spin" size={16} />
												Creating…
											</>
										) : (
											"Create Link"
										)}
									</Button>
								</SheetFooter>
							</>
						)}
					</form>
				</Form>
			</SheetContent>
		</Sheet>
	);
}
