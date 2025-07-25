import { Analytics } from "../../types/tables";
import type { SimpleQueryConfig } from "../types";

export const PerformanceBuilders: Record<string, SimpleQueryConfig> = {
    performance_metrics: {
        table: Analytics.web_vitals,
        fields: [
            'AVG(fcp) as avg_fcp',
            'AVG(lcp) as avg_lcp',
            'AVG(cls) as avg_cls',
            'AVG(fid) as avg_fid',
            'AVG(inp) as avg_inp',
            'COUNT(*) as total_events'
        ],
        where: [],
        timeField: 'timestamp',
        allowedFilters: ['path', 'device_type', 'browser_name', 'country', 'region', 'os_name'],
        customizable: true
    },

    slow_pages: {
        table: Analytics.web_vitals,
        fields: [
            'path as name',
            'COUNT(DISTINCT anonymous_id) as visitors',
            'AVG(fcp) as avg_fcp',
            'AVG(lcp) as avg_lcp',
            'AVG(cls) as avg_cls',
            'AVG(fid) as avg_fid',
            'AVG(inp) as avg_inp',
            'COUNT(*) as pageviews'
        ],
        where: ["path != ''"],
        groupBy: ['path'],
        orderBy: 'avg_lcp DESC',
        limit: 100,
        timeField: 'timestamp',
        allowedFilters: ['path', 'device_type', 'browser_name'],
        customizable: true
    },

    performance_by_device: {
        table: Analytics.web_vitals,
        fields: [
            'device_type as name',
            'COUNT(DISTINCT anonymous_id) as visitors',
            'AVG(fcp) as avg_fcp',
            'AVG(lcp) as avg_lcp',
            'AVG(cls) as avg_cls',
            'AVG(fid) as avg_fid',
            'AVG(inp) as avg_inp',
            'COUNT(*) as pageviews'
        ],
        where: ["device_type != ''"],
        groupBy: ['device_type'],
        orderBy: 'avg_lcp DESC',
        limit: 100,
        timeField: 'timestamp',
        allowedFilters: ['path', 'device_type', 'browser_name'],
        customizable: true
    },

    performance_by_browser: {
        table: Analytics.web_vitals,
        fields: [
            "CONCAT(browser_name, ' ', browser_version) as name",
            'COUNT(DISTINCT anonymous_id) as visitors',
            'AVG(fcp) as avg_fcp',
            'AVG(lcp) as avg_lcp',
            'AVG(cls) as avg_cls',
            'AVG(fid) as avg_fid',
            'AVG(inp) as avg_inp',
            'COUNT(*) as pageviews'
        ],
        where: [
            "browser_name != ''",
            "browser_version != ''",
            'browser_version IS NOT NULL'
        ],
        groupBy: ['browser_name', 'browser_version'],
        orderBy: 'avg_lcp DESC',
        limit: 100,
        timeField: 'timestamp',
        allowedFilters: ['path', 'device_type', 'browser_name'],
        customizable: true
    },

    performance_by_country: {
        table: Analytics.web_vitals,
        fields: [
            'country as name',
            'COUNT(DISTINCT anonymous_id) as visitors',
            'AVG(fcp) as avg_fcp',
            'AVG(lcp) as avg_lcp',
            'AVG(cls) as avg_cls',
            'AVG(fid) as avg_fid',
            'AVG(inp) as avg_inp',
            'COUNT(*) as pageviews'
        ],
        where: ["country != ''"],
        groupBy: ['country'],
        orderBy: 'avg_lcp DESC',
        limit: 100,
        timeField: 'timestamp',
        allowedFilters: ['path', 'device_type', 'browser_name'],
        customizable: true
    },

    performance_by_os: {
        table: Analytics.web_vitals,
        fields: [
            'os_name as name',
            'COUNT(DISTINCT anonymous_id) as visitors',
            'AVG(fcp) as avg_fcp',
            'AVG(lcp) as avg_lcp',
            'AVG(cls) as avg_cls',
            'AVG(fid) as avg_fid',
            'AVG(inp) as avg_inp',
            'COUNT(*) as pageviews'
        ],
        where: ["os_name != ''"],
        groupBy: ['os_name'],
        orderBy: 'avg_lcp DESC',
        limit: 100,
        timeField: 'timestamp',
        allowedFilters: ['path', 'device_type', 'browser_name'],
        customizable: true
    },

    performance_by_region: {
        table: Analytics.web_vitals,
        fields: [
            "CONCAT(region, ', ', country) as name",
            'COUNT(DISTINCT anonymous_id) as visitors',
            'AVG(fcp) as avg_fcp',
            'AVG(lcp) as avg_lcp',
            'AVG(cls) as avg_cls',
            'AVG(fid) as avg_fid',
            'AVG(inp) as avg_inp',
            'COUNT(*) as pageviews'
        ],
        where: ["region != ''"],
        groupBy: ['region', 'country'],
        orderBy: 'avg_lcp DESC',
        limit: 100,
        timeField: 'timestamp',
        allowedFilters: ['path', 'device_type', 'browser_name'],
        customizable: true
    },

    performance_time_series: {
        table: Analytics.web_vitals,
        fields: [
            'toDate(timestamp) as date',
            'AVG(fcp) as avg_fcp',
            'AVG(lcp) as avg_lcp',
            'AVG(cls) as avg_cls',
            'AVG(fid) as avg_fid',
            'AVG(inp) as avg_inp',
            'COUNT(*) as pageviews'
        ],
        groupBy: ['toDate(timestamp)'],
        orderBy: 'date ASC',
        timeField: 'timestamp',
        allowedFilters: ['path', 'device_type', 'browser_name'],
        customizable: true
    }
}; 