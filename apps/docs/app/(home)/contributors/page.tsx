import type { Metadata } from 'next';
import { Footer } from '@/components/footer';
import Section from '@/components/landing/section';
import { Spotlight } from '@/components/landing/spotlight';
import ActivityStats from './activity-stats';
import CommitActivityChart from './commit-activity-chart';
import ContributorsGrid from './contributors-grid';
import ContributorsHero from './contributors-hero';

export const metadata: Metadata = {
	title: 'Contributors | Databuddy',
	description:
		'Meet the amazing developers building the future of privacy-first analytics',
};

// GitHub API interfaces
interface GitHubRepo {
	stargazers_count: number;
	forks_count: number;
	open_issues_count: number;
	watchers_count: number;
	language: string;
}

interface GitHubContributor {
	login: string;
	id: number;
	avatar_url: string;
	html_url: string;
	contributions: number;
	type: string;
}

interface GitHubLanguages {
	[key: string]: number;
}

interface GitHubPullRequest {
	state: 'open' | 'closed';
	merged_at: string | null;
}

interface GitHubCommitActivity {
	days: number[];
	total: number;
	week: number;
}

interface ProcessedCommitActivity {
	week: string;
	commits: number;
	date: Date;
}

function fetchWithRetry(
	url: string,
	options: RequestInit,
	maxRetries = 3
): Promise<Response> {
	async function attemptFetch(attempt: number): Promise<Response> {
		const response = await fetch(url, options);

		if (response.status === 202 && attempt < maxRetries) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			return attemptFetch(attempt + 1);
		}

		return response;
	}

	return attemptFetch(1);
}

async function fetchGitHubData() {
	const headers = {
		Accept: 'application/vnd.github.v3+json',
		'User-Agent': 'Databuddy-Docs',
	};

	const requestInit: RequestInit = {
		headers,
		next: { revalidate: 600 }, // 10 minutes
	};

	const statsRequestInit: RequestInit = {
		headers,
		next: { revalidate: 3600 }, // 1 hour for stats
	};

	try {
		// Fetch repository info
		const repoResponse = await fetch(
			'https://api.github.com/repos/databuddy-analytics/Databuddy',
			requestInit
		);

		if (!repoResponse.ok) {
			throw new Error(`Failed to fetch repo: ${repoResponse.status}`);
		}

		const repo: GitHubRepo = await repoResponse.json();

		// Fetch contributors
		const contributorsResponse = await fetch(
			'https://api.github.com/repos/databuddy-analytics/Databuddy/contributors?per_page=100',
			requestInit
		);

		if (!contributorsResponse.ok) {
			throw new Error(
				`Failed to fetch contributors: ${contributorsResponse.status}`
			);
		}

		const contributorsData = await contributorsResponse.json();
		const contributors: GitHubContributor[] = Array.isArray(contributorsData)
			? contributorsData
			: [];

		// Fetch languages
		const languagesResponse = await fetch(
			'https://api.github.com/repos/databuddy-analytics/Databuddy/languages',
			requestInit
		);

		if (!languagesResponse.ok) {
			throw new Error(`Failed to fetch languages: ${languagesResponse.status}`);
		}

		const languages: GitHubLanguages = await languagesResponse.json();

		// Fetch PRs
		const prsResponse = await fetch(
			'https://api.github.com/repos/databuddy-analytics/Databuddy/pulls?state=all&per_page=100',
			requestInit
		);

		if (!prsResponse.ok) {
			throw new Error(`Failed to fetch PRs: ${prsResponse.status}`);
		}

		const prsData = await prsResponse.json();
		const prs: GitHubPullRequest[] = Array.isArray(prsData) ? prsData : [];

		// Fetch commit activity stats
		let commitActivity: ProcessedCommitActivity[] = [];
		try {
			const commitActivityResponse = await fetchWithRetry(
				'https://api.github.com/repos/databuddy-analytics/Databuddy/stats/commit_activity',
				statsRequestInit
			);

			if (commitActivityResponse.ok) {
				const commitActivityData: GitHubCommitActivity[] =
					await commitActivityResponse.json();

				if (Array.isArray(commitActivityData)) {
					commitActivity = commitActivityData.map((week) => ({
						week: new Date(week.week * 1000).toISOString().split('T')[0],
						commits: week.total,
						date: new Date(week.week * 1000),
					}));
				}
			}
		} catch (error) {
			console.error('Failed to fetch commit activity:', error);
			// Continue without commit activity data
		}

		// Process the data
		const totalContributions = contributors.reduce(
			(sum, contributor) => sum + contributor.contributions,
			0
		);

		const processedContributors = contributors
			.filter((contributor) => contributor.type === 'User')
			.slice(0, 12) // Top 12 contributors
			.map((contributor, index) => ({
				...contributor,
				rank: index + 1,
				percentage: (
					(contributor.contributions / totalContributions) *
					100
				).toFixed(1),
			}));

		const totalLanguageBytes = Object.values(languages).reduce(
			(sum, bytes) => sum + bytes,
			0
		);

		const processedLanguages = Object.entries(languages)
			.map(([name, bytes]) => ({
				name,
				bytes,
				percentage: ((bytes / totalLanguageBytes) * 100).toFixed(1),
			}))
			.sort((a, b) => b.bytes - a.bytes)
			.slice(0, 6);

		const openPRs = prs.filter((pr) => pr.state === 'open').length;
		const mergedPRs = prs.filter((pr) => pr.merged_at !== null).length;
		const closedPRs = prs.filter(
			(pr) => pr.state === 'closed' && pr.merged_at === null
		).length;

		return {
			repo,
			contributors: processedContributors,
			languages: processedLanguages,
			commitActivity,
			stats: {
				totalContributors: contributors.length,
				totalContributions,
				openPRs,
				mergedPRs,
				closedPRs,
			},
		};
	} catch (error) {
		console.error('Failed to fetch GitHub data:', error);
		// Return default data if API fails
		return {
			repo: {
				stargazers_count: 0,
				forks_count: 0,
				open_issues_count: 0,
				watchers_count: 0,
				language: 'TypeScript',
			},
			contributors: [],
			languages: [],
			commitActivity: [],
			stats: {
				totalContributors: 0,
				totalContributions: 0,
				openPRs: 0,
				mergedPRs: 0,
				closedPRs: 0,
			},
		};
	}
}

export default async function ContributorsPage() {
	const data = await fetchGitHubData();

	return (
		<div className="overflow-hidden">
			<Spotlight transform="translateX(-60%) translateY(-50%)" />

			{/* Hero Section */}
			<Section
				className="overflow-hidden"
				customPaddings
				id="contributors-hero"
			>
				<ContributorsHero
					contributors={data.stats.totalContributors}
					forks={data.repo.forks_count}
					issues={data.repo.open_issues_count}
					stars={data.repo.stargazers_count}
				/>
			</Section>

			{/* Contributors Grid Section */}
			<Section
				className="border-border border-t border-b bg-background/50"
				id="contributors-grid"
			>
				<div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
					<ContributorsGrid contributors={data.contributors} />
				</div>
			</Section>

			{/* Commit Activity Section */}
			<Section
				className="border-border border-b bg-background/30"
				id="commit-activity"
			>
				<div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
					<CommitActivityChart data={data.commitActivity} />
				</div>
			</Section>

			{/* Activity Stats Section */}
			<Section className="bg-background/50" id="activity-stats">
				<div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
					<ActivityStats languages={data.languages} stats={data.stats} />
				</div>
			</Section>

			{/* Gradient Divider */}
			<div className="w-full">
				<div className="mx-auto h-px max-w-6xl bg-gradient-to-r from-transparent via-border/30 to-transparent" />
			</div>

			{/* Footer Section */}
			<Footer />

			{/* Final Gradient Divider */}
			<div className="w-full">
				<div className="mx-auto h-px max-w-6xl bg-gradient-to-r from-transparent via-border/30 to-transparent" />
			</div>
		</div>
	);
}
