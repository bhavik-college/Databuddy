import type { SimpleQueryConfig } from "../types";
import { Analytics } from "../../types/tables";

export const DevicesBuilders: Record<string, SimpleQueryConfig<typeof Analytics.events>> = {
    browser_name: {
        table: Analytics.events,
        fields: [
            'browser_name as name',
            'COUNT(*) as pageviews',
            'COUNT(DISTINCT anonymous_id) as visitors',
            'ROUND((COUNT(*) / SUM(COUNT(*)) OVER()) * 100, 2) as percentage'
        ],
        where: ['browser_name != \'\'', 'event_name = \'screen_view\''],
        groupBy: ['browser_name'],
        orderBy: 'pageviews DESC',
        limit: 100,
        timeField: 'time',
        allowedFilters: ['path', 'device_type', 'country'],
        customizable: true
    },

    os_name: {
        table: Analytics.events,
        fields: [
            'os_name as name',
            'COUNT(*) as pageviews',
            'COUNT(DISTINCT anonymous_id) as visitors',
            'ROUND((COUNT(*) / SUM(COUNT(*)) OVER()) * 100, 2) as percentage'
        ],
        where: ['os_name != \'\'', 'event_name = \'screen_view\''],
        groupBy: ['os_name'],
        orderBy: 'pageviews DESC',
        limit: 100,
        timeField: 'time',
        allowedFilters: ['path', 'referrer', 'device_type'],
        customizable: true
    },

    screen_resolution: {
        table: Analytics.events,
        fields: [
            'screen_resolution as name',
            'COUNT(*) as pageviews',
            'COUNT(DISTINCT anonymous_id) as visitors'
        ],
        where: ['screen_resolution != \'\'', 'event_name = \'screen_view\''],
        groupBy: ['screen_resolution'],
        orderBy: 'pageviews DESC',
        limit: 100,
        timeField: 'time',
        allowedFilters: ['path', 'referrer', 'device_type'],
        customizable: true
    },

    connection_type: {
        table: Analytics.events,
        fields: [
            'connection_type as name',
            'COUNT(*) as pageviews',
            'COUNT(DISTINCT anonymous_id) as visitors'
        ],
        where: ['connection_type != \'\'', 'event_name = \'screen_view\''],
        groupBy: ['connection_type'],
        orderBy: 'pageviews DESC',
        limit: 100,
        timeField: 'time',
        allowedFilters: ['path', 'referrer', 'device_type'],
        customizable: true
    },

    browsers_grouped: {
        table: Analytics.events,
        fields: [
            'CONCAT(browser_name, \' \', browser_version) as name',
            'browser_name',
            'browser_version',
            'COUNT(*) as pageviews',
            'COUNT(DISTINCT anonymous_id) as visitors',
            'COUNT(DISTINCT session_id) as sessions'
        ],
        where: [
            'browser_name != \'\'',
            'browser_version != \'\'',
            'browser_version IS NOT NULL',
            'event_name = \'screen_view\''
        ],
        groupBy: ['browser_name', 'browser_version'],
        orderBy: 'visitors DESC',
        limit: 100,
        timeField: 'time',
        allowedFilters: ['path', 'referrer', 'device_type'],
        customizable: true
    },

    device_types: {
        table: Analytics.events,
        fields: [
            'screen_resolution as name',
            'COUNT(*) as pageviews',
            'COUNT(DISTINCT anonymous_id) as visitors',
            'ROUND((COUNT(*) / SUM(COUNT(*)) OVER()) * 100, 2) as percentage'
        ],
        where: ["screen_resolution != ''", 'event_name = \'screen_view\''],
        groupBy: ['screen_resolution'],
        orderBy: 'pageviews DESC',
        limit: 100,
        timeField: 'time',
        allowedFilters: ['path', 'referrer', 'browser_name'],
        customizable: true,
        plugins: { mapDeviceTypes: true }
    },

    browsers: {
        table: Analytics.events,
        fields: [
            'browser_name as name',
            'COUNT(*) as pageviews',
            'COUNT(DISTINCT anonymous_id) as visitors',
            'ROUND((COUNT(*) / SUM(COUNT(*)) OVER()) * 100, 2) as percentage'
        ],
        where: ['browser_name != \'\'', 'event_name = \'screen_view\''],
        groupBy: ['browser_name'],
        orderBy: 'pageviews DESC',
        limit: 25,
        timeField: 'time',
        allowedFilters: ['browser_name', 'path', 'device_type', 'country'],
        customizable: true
    },

    browser_versions: {
        table: Analytics.events,
        fields: [
            'CONCAT(browser_name, \' \', browser_version) as name',
            'COUNT(*) as pageviews',
            'COUNT(DISTINCT anonymous_id) as visitors'
        ],
        where: ['browser_name != \'\'', 'browser_version != \'\'', 'event_name = \'screen_view\''],
        groupBy: ['browser_name', 'browser_version'],
        orderBy: 'pageviews DESC',
        limit: 100,
        timeField: 'time',
        allowedFilters: ['path', 'referrer', 'device_type'],
        customizable: true
    },

    operating_systems: {
        table: Analytics.events,
        fields: [
            'os_name as name',
            'COUNT(*) as pageviews',
            'COUNT(DISTINCT anonymous_id) as visitors',
            'ROUND((COUNT(*) / SUM(COUNT(*)) OVER()) * 100, 2) as percentage'
        ],
        where: ['os_name != \'\'', 'event_name = \'screen_view\''],
        groupBy: ['os_name'],
        orderBy: 'pageviews DESC',
        limit: 100,
        timeField: 'time',
        allowedFilters: ['path', 'referrer', 'device_type'],
        customizable: true
    },

    os_versions: {
        table: Analytics.events,
        fields: [
            'CONCAT(os_name, \' \', os_version) as name',
            'COUNT(*) as pageviews',
            'COUNT(DISTINCT anonymous_id) as visitors'
        ],
        where: ['os_name != \'\'', 'os_version != \'\'', 'event_name = \'screen_view\''],
        groupBy: ['os_name', 'os_version'],
        orderBy: 'pageviews DESC',
        limit: 25,
        timeField: 'time',
        allowedFilters: ['os_name', 'os_version', 'path', 'device_type'],
        customizable: true
    },

    screen_resolutions: {
        table: Analytics.events,
        fields: [
            'screen_resolution as name',
            'COUNT(*) as pageviews',
            'COUNT(DISTINCT anonymous_id) as visitors'
        ],
        where: ['screen_resolution != \'\'', 'event_name = \'screen_view\''],
        groupBy: ['screen_resolution'],
        orderBy: 'pageviews DESC',
        limit: 100,
        timeField: 'time',
        allowedFilters: ['path', 'referrer', 'device_type'],
        customizable: true
    }
}; 