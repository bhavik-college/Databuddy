import type { FlagResult, StorageInterface } from "./types";

const isBrowser = typeof window !== "undefined" && typeof localStorage !== "undefined";

export class BrowserFlagStorage implements StorageInterface {
	private readonly ttl = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

	get(key: string) {
		if (!isBrowser) {
			return null;
		}
		return this.getFromLocalStorage(key);
	}

	set(key: string, value: unknown) {
		if (!isBrowser) {
			return;
		}
		this.setToLocalStorage(key, value);
	}

	getAll(): Record<string, FlagResult> {
		if (!isBrowser) {
			return {};
		}
		const result: Record<string, FlagResult> = {};
		const now = Date.now();

		const keys = Object.keys(localStorage).filter((key) =>
			key.startsWith("db-flag-")
		);

		for (const key of keys) {
			const flagKey = key.replace("db-flag-", "");
			try {
				const item = localStorage.getItem(key);
				if (item) {
					const parsed = JSON.parse(item);
					if (parsed.expiresAt && now > parsed.expiresAt) {
						localStorage.removeItem(key);
					} else {
						result[flagKey] = (parsed.value || parsed) as FlagResult;
					}
				}
			} catch { }
		}
		return result;
	}

	clear(): void {
		if (!isBrowser) {
			return;
		}
		const keys = Object.keys(localStorage).filter((key) =>
			key.startsWith("db-flag-")
		);
		for (const key of keys) {
			localStorage.removeItem(key);
		}
	}

	private getFromLocalStorage(key: string): any {
		try {
			const item = localStorage.getItem(`db-flag-${key}`);
			if (!item) {
				return null;
			}

			const parsed = JSON.parse(item);

			if (parsed.expiresAt) {
				if (this.isExpired(parsed.expiresAt)) {
					localStorage.removeItem(`db-flag-${key}`);
					return null;
				}
				return parsed.value;
			}

			return parsed;
		} catch {
			return null;
		}
	}

	private setToLocalStorage(key: string, value: unknown): void {
		try {
			const item = {
				value,
				timestamp: Date.now(),
				expiresAt: Date.now() + this.ttl,
			};
			localStorage.setItem(`db-flag-${key}`, JSON.stringify(item));
		} catch { }
	}

	private isExpired(expiresAt?: number): boolean {
		if (!expiresAt) {
			return false;
		}
		return Date.now() > expiresAt;
	}

	delete(key: string): void {
		if (!isBrowser) {
			return;
		}
		localStorage.removeItem(`db-flag-${key}`);
	}

	deleteMultiple(keys: string[]): void {
		if (!isBrowser) {
			return;
		}
		for (const key of keys) {
			localStorage.removeItem(`db-flag-${key}`);
		}
	}

	setAll(flags: Record<string, FlagResult>): void {
		if (!isBrowser) {
			return;
		}
		const currentFlags = this.getAll();
		const currentKeys = Object.keys(currentFlags);
		const newKeys = Object.keys(flags);

		const removedKeys = currentKeys.filter((key) => !newKeys.includes(key));

		if (removedKeys.length > 0) {
			this.deleteMultiple(removedKeys);
		}

		for (const [key, value] of Object.entries(flags)) {
			this.set(key, value);
		}
	}

	cleanupExpired(): void {
		if (!isBrowser) {
			return;
		}
		const now = Date.now();
		const keys = Object.keys(localStorage).filter((key) =>
			key.startsWith("db-flag-")
		);

		for (const key of keys) {
			try {
				const item = localStorage.getItem(key);
				if (item) {
					const parsed = JSON.parse(item);
					if (parsed.expiresAt && now > parsed.expiresAt) {
						localStorage.removeItem(key);
					}
				}
			} catch {
				localStorage.removeItem(key);
			}
		}
	}
}
