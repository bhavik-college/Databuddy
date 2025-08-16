'use client';

import { DownloadIcon } from '@phosphor-icons/react';
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface DataExportProps {
	websiteId: string;
}

export function DataExport({ websiteId }: DataExportProps) {
	const [isExporting, setIsExporting] = useState(false);
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');
	const [format, setFormat] = useState<'csv' | 'json' | 'txt' | 'proto'>('csv');

	const handleExport = async () => {
		if (!websiteId) {
			toast.error('Website ID is required');
			return;
		}

		setIsExporting(true);

		try {
			const exportData = {
				website_id: websiteId,
				...(startDate && { start_date: startDate }),
				...(endDate && { end_date: endDate }),
				format,
			};

			const response = await fetch(`${API_BASE_URL}/v1/export/data`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify(exportData),
			});

			if (!response.ok) {
				let errorMessage = `Export failed with status ${response.status}`;

				try {
					const errorData = await response.json();
					errorMessage = errorData.error || errorData.message || errorMessage;
				} catch {
					errorMessage = response.statusText || errorMessage;
				}

				if (response.status === 404) {
					errorMessage =
						'Export endpoint not found. Please check if the API server is running.';
				} else if (response.status === 401) {
					errorMessage = 'Authentication failed. Please log in again.';
				} else if (response.status === 403) {
					errorMessage =
						'Access denied. You may not have permission to export data for this website.';
				} else if (response.status === 500) {
					errorMessage =
						'Server error occurred during export. Please try again later.';
				}

				throw new Error(errorMessage);
			}

			const contentDisposition = response.headers.get('Content-Disposition');
			const filename = contentDisposition
				? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
				: `databuddy_export_${websiteId}_${new Date().toISOString().slice(0, 10)}.zip`;

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);

			toast.success(`Your data has been exported as ${filename}`);
		} catch (error) {
			console.error('Export error:', error);
			console.error('Export request details:', {
				url: `${API_BASE_URL}/v1/export/data`,
				websiteId,
				startDate,
				endDate,
				format,
			});

			let errorMessage = 'Unknown error occurred';

			if (error instanceof TypeError && error.message.includes('fetch')) {
				errorMessage = `Network error: Cannot connect to API server at ${API_BASE_URL}. Please check if the server is running.`;
			} else if (error instanceof Error) {
				errorMessage = error.message;
			}

			toast.error(errorMessage);
		} finally {
			setIsExporting(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<DownloadIcon className="h-5 w-5" weight="duotone" />
					Data Export
				</CardTitle>
				<CardDescription>
					Export your website's analytics data including events, errors, and web
					vitals. Data is exported as a ZIP file with separate CSV/JSON files
					for each data type.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="grid gap-4 sm:grid-cols-2">
					<div className="space-y-2">
						<Label htmlFor="start-date">Start Date (Optional)</Label>
						<Input
							id="start-date"
							onChange={(e) => setStartDate(e.target.value)}
							placeholder="Leave empty for all data"
							type="date"
							value={startDate}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="end-date">End Date (Optional)</Label>
						<Input
							id="end-date"
							onChange={(e) => setEndDate(e.target.value)}
							placeholder="Leave empty for all data"
							type="date"
							value={endDate}
						/>
					</div>
				</div>

				<div className="space-y-2">
					<Label htmlFor="format">Export Format</Label>
					<Select
						onValueChange={(value: 'csv' | 'json' | 'txt' | 'proto') =>
							setFormat(value)
						}
						value={format}
					>
						<SelectTrigger>
							<SelectValue placeholder="Select format" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="csv">CSV (Comma Separated Values)</SelectItem>
							<SelectItem value="json">
								JSON (JavaScript Object Notation)
							</SelectItem>
							<SelectItem value="txt">TXT (Tab Separated Values)</SelectItem>
							<SelectItem value="proto">
								Proto (Protocol Buffer Text Format)
							</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="rounded border bg-muted/20 p-4">
					<h4 className="mb-2 font-medium text-sm">What's Included:</h4>
					<ul className="space-y-1 text-muted-foreground text-sm">
						<li>
							• <strong>Events:</strong> Page views, custom events, user
							interactions
						</li>
						<li>
							• <strong>Errors:</strong> JavaScript errors and exceptions
						</li>
						<li>
							• <strong>Web Vitals:</strong> Performance metrics (FCP, LCP, CLS,
							etc.)
						</li>
						<li>
							• <strong>Metadata:</strong> Export information and record counts
						</li>
					</ul>
				</div>

				<div className="rounded border bg-green-50 p-4 dark:bg-green-950/20">
					<h4 className="mb-2 font-medium text-green-900 text-sm dark:text-green-100">
						Export Formats:
					</h4>
					<ul className="space-y-1 text-green-800 text-sm dark:text-green-200">
						<li>
							• <strong>CSV:</strong> Comma-separated values, great for
							Excel/spreadsheets
						</li>
						<li>
							• <strong>JSON:</strong> Structured data format, perfect for APIs
							and programming
						</li>
						<li>
							• <strong>TXT:</strong> Tab-separated plain text, easy to read and
							process
						</li>
						<li>
							• <strong>Proto:</strong> Protocol Buffer text format, ideal for
							data pipelines
						</li>
					</ul>
				</div>

				<Button
					className="w-full"
					disabled={isExporting}
					onClick={handleExport}
					size="lg"
				>
					{isExporting ? (
						<>
							<div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
							Exporting Data...
						</>
					) : (
						<>
							<DownloadIcon className="mr-2 h-4 w-4" weight="duotone" />
							Export Data
						</>
					)}
				</Button>

				<div className="text-center text-muted-foreground text-xs">
					Website ID:{' '}
					<code className="rounded bg-muted px-1 py-0.5 font-mono">
						{websiteId}
					</code>
				</div>
			</CardContent>
		</Card>
	);
}
