import { describe, expect, it } from 'vitest';
import {
	anonymizeIp,
	extractIpFromRequest,
	getClientIp,
	getIpType,
} from './ip-geo';

const hexRegex = /^[a-f0-9]{12}$/;

describe('IP Geolocation Utils', () => {
	describe('getIpType', () => {
		it('should detect IPv4 addresses correctly', () => {
			expect(getIpType('192.168.1.1')).toBe('ipv4');
			expect(getIpType('8.8.8.8')).toBe('ipv4');
			expect(getIpType('127.0.0.1')).toBe('ipv4');
			expect(getIpType('255.255.255.255')).toBe('ipv4');
			expect(getIpType('0.0.0.0')).toBe('ipv4');
		});

		it('should detect IPv6 addresses correctly', () => {
			expect(getIpType('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe('ipv6');
			expect(getIpType('2001:db8:85a3:0:0:8a2e:370:7334')).toBe('ipv6');
			expect(getIpType('::1')).toBe('ipv6');
			expect(getIpType('fe80::1')).toBe('ipv6');
		});

		it('should return null for invalid IP addresses', () => {
			expect(getIpType('')).toBe(null);
			expect(getIpType('invalid')).toBe(null);
			expect(getIpType('256.256.256.256')).toBe(null);
			expect(getIpType('192.168.1')).toBe(null);
			expect(getIpType('192.168.1.1.1')).toBe(null);
			expect(getIpType('gggg::1')).toBe(null);
		});

		it('should handle edge cases', () => {
			expect(getIpType(null as unknown as string)).toBe(null);
			expect(getIpType(undefined as unknown as string)).toBe(null);
			expect(getIpType('   ')).toBe(null);
		});
	});

	describe('anonymizeIp', () => {
		it('should anonymize IPv4 addresses consistently', () => {
			const ip = '192.168.1.1';
			const hash1 = anonymizeIp(ip);
			const hash2 = anonymizeIp(ip);

			expect(hash1).toBe(hash2);
			expect(hash1).toHaveLength(12);
			expect(hash1).toMatch(hexRegex);
		});

		it('should anonymize IPv6 addresses consistently', () => {
			const ip = '2001:db8::1';
			const hash1 = anonymizeIp(ip);
			const hash2 = anonymizeIp(ip);

			expect(hash1).toBe(hash2);
			expect(hash1).toHaveLength(12);
			expect(hash1).toMatch(hexRegex);
		});

		it('should produce different hashes for different IPs', () => {
			const hash1 = anonymizeIp('192.168.1.1');
			const hash2 = anonymizeIp('192.168.1.2');

			expect(hash1).not.toBe(hash2);
		});

		it('should handle empty IP', () => {
			expect(anonymizeIp('')).toBe('');
		});
	});

	describe('getClientIp', () => {
		it('should prioritize Cloudflare IP', () => {
			const request = new Request('http://test.com', {
				headers: {
					'cf-connecting-ip': '1.2.3.4',
					'x-forwarded-for': '5.6.7.8',
					'x-real-ip': '9.10.11.12',
				},
			});

			expect(getClientIp(request)).toBe('1.2.3.4');
		});

		it('should use X-Forwarded-For when Cloudflare IP is not available', () => {
			const request = new Request('http://test.com', {
				headers: {
					'x-forwarded-for': '5.6.7.8, 192.168.1.1',
					'x-real-ip': '9.10.11.12',
				},
			});

			expect(getClientIp(request)).toBe('5.6.7.8');
		});

		it('should use X-Real-IP as fallback', () => {
			const request = new Request('http://test.com', {
				headers: {
					'x-real-ip': '9.10.11.12',
				},
			});

			expect(getClientIp(request)).toBe('9.10.11.12');
		});

		it('should return undefined when no IP headers are present', () => {
			const request = new Request('http://test.com');
			expect(getClientIp(request)).toBeUndefined();
		});

		it('should handle IPv6 addresses', () => {
			const request = new Request('http://test.com', {
				headers: {
					'cf-connecting-ip': '2001:db8::1',
				},
			});

			expect(getClientIp(request)).toBe('2001:db8::1');
		});
	});

	describe('extractIpFromRequest', () => {
		it('should extract and trim Cloudflare IP', () => {
			const request = new Request('http://test.com', {
				headers: {
					'cf-connecting-ip': '  1.2.3.4  ',
				},
			});

			expect(extractIpFromRequest(request)).toBe('1.2.3.4');
		});

		it('should extract first IP from X-Forwarded-For', () => {
			const request = new Request('http://test.com', {
				headers: {
					'x-forwarded-for': '5.6.7.8, 192.168.1.1, 10.0.0.1',
				},
			});

			expect(extractIpFromRequest(request)).toBe('5.6.7.8');
		});

		it('should extract and trim X-Real-IP', () => {
			const request = new Request('http://test.com', {
				headers: {
					'x-real-ip': '  9.10.11.12  ',
				},
			});

			expect(extractIpFromRequest(request)).toBe('9.10.11.12');
		});

		it('should return empty string when no IP is found', () => {
			const request = new Request('http://test.com');
			expect(extractIpFromRequest(request)).toBe('');
		});
	});

	describe('IPv4 vs IPv6 Detection', () => {
		const testCases = [
			// IPv4 addresses
			{ ip: '8.8.8.8', expected: 'ipv4', description: 'Google DNS' },
			{ ip: '192.168.1.1', expected: 'ipv4', description: 'Private IPv4' },
			{ ip: '10.0.0.1', expected: 'ipv4', description: 'Private IPv4 Class A' },
			{
				ip: '172.16.0.1',
				expected: 'ipv4',
				description: 'Private IPv4 Class B',
			},
			{ ip: '203.0.113.1', expected: 'ipv4', description: 'Test IPv4' },

			// IPv6 addresses
			{
				ip: '2001:db8::1',
				expected: 'ipv6',
				description: 'Documentation IPv6',
			},
			{
				ip: '2001:4860:4860::8888',
				expected: 'ipv6',
				description: 'Google DNS IPv6',
			},
			{ ip: 'fe80::1', expected: 'ipv6', description: 'Link-local IPv6' },
			{ ip: '::1', expected: 'ipv6', description: 'IPv6 loopback' },
			{
				ip: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
				expected: 'ipv6',
				description: 'Full IPv6',
			},

			// Invalid addresses
			{ ip: '256.256.256.256', expected: null, description: 'Invalid IPv4' },
			{ ip: '192.168.1', expected: null, description: 'Incomplete IPv4' },
			{ ip: 'gggg::1', expected: null, description: 'Invalid IPv6' },
			{ ip: 'not-an-ip', expected: null, description: 'Not an IP' },
		];

		for (const { ip, expected, description } of testCases) {
			it(`should correctly identify ${description}: ${ip}`, () => {
				expect(getIpType(ip)).toBe(expected);
			});
		}
	});

	describe('Real-world IP examples', () => {
		const realWorldIPs = [
			// Common public IPv4 addresses
			{ ip: '8.8.8.8', type: 'ipv4', description: 'Google DNS' },
			{ ip: '1.1.1.1', type: 'ipv4', description: 'Cloudflare DNS' },
			{ ip: '208.67.222.222', type: 'ipv4', description: 'OpenDNS' },

			// Common public IPv6 addresses
			{
				ip: '2001:4860:4860::8888',
				type: 'ipv6',
				description: 'Google DNS IPv6',
			},
			{
				ip: '2606:4700:4700::1111',
				type: 'ipv6',
				description: 'Cloudflare DNS IPv6',
			},
		];

		for (const { ip, type, description } of realWorldIPs) {
			it(`should handle real-world ${type} address: ${description}`, () => {
				expect(getIpType(ip)).toBe(type);
			});
		}
	});

	describe('IP Header Priority', () => {
		it('should follow correct priority order: Cloudflare > X-Forwarded-For > X-Real-IP', () => {
			const request = new Request('http://test.com', {
				headers: {
					'cf-connecting-ip': '1.1.1.1',
					'x-forwarded-for': '2.2.2.2',
					'x-real-ip': '3.3.3.3',
				},
			});

			// Both functions should prioritize Cloudflare
			expect(getClientIp(request)).toBe('1.1.1.1');
			expect(extractIpFromRequest(request)).toBe('1.1.1.1');
		});

		it('should handle X-Forwarded-For chain correctly', () => {
			const request = new Request('http://test.com', {
				headers: {
					'x-forwarded-for': '203.0.113.1, 198.51.100.1, 192.0.2.1',
				},
			});

			// Should extract the first IP in the chain
			expect(getClientIp(request)).toBe('203.0.113.1');
			expect(extractIpFromRequest(request)).toBe('203.0.113.1');
		});
	});

	describe('IPv6 Edge Cases', () => {
		it('should handle compressed IPv6 addresses', () => {
			expect(getIpType('::1')).toBe('ipv6');
			expect(getIpType('fe80::')).toBe('ipv6');
			expect(getIpType('2001:db8::')).toBe('ipv6');
		});

		it('should handle full IPv6 addresses', () => {
			expect(getIpType('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe('ipv6');
			expect(getIpType('fe80:0000:0000:0000:0202:b3ff:fe1e:8329')).toBe('ipv6');
		});
	});
});
