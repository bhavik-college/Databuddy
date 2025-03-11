"use client";

import { useMemo } from "react";
import dayjs from "dayjs";

interface DailyStats {
  date: string;
  visitors: number;
  pageViews: number;
  bounceRate: number;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    fill?: boolean;
  }[];
}

type ChartType = "visitors" | "pageViews" | "bounceRate" | "all";

export function useChartData(dailyStats: DailyStats[], type: ChartType = "visitors") {
  return useMemo(() => {
    if (!dailyStats || dailyStats.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    const labels = dailyStats.map(stat => dayjs(stat.date).format("MMM D"));
    
    const datasets = [];
    
    if (type === "visitors" || type === "all") {
      datasets.push({
        label: "Visitors",
        data: dailyStats.map(stat => stat.visitors),
        borderColor: "rgb(56, 189, 248)",
        backgroundColor: "rgba(56, 189, 248, 0.1)",
        fill: true,
      });
    }
    
    if (type === "pageViews" || type === "all") {
      datasets.push({
        label: "Page Views",
        data: dailyStats.map(stat => stat.pageViews),
        borderColor: "rgb(129, 140, 248)",
        backgroundColor: "rgba(129, 140, 248, 0.1)",
        fill: true,
      });
    }
    
    if (type === "bounceRate" || type === "all") {
      datasets.push({
        label: "Bounce Rate (%)",
        data: dailyStats.map(stat => stat.bounceRate),
        borderColor: "rgb(251, 191, 36)",
        backgroundColor: "rgba(251, 191, 36, 0.1)",
        fill: true,
      });
    }
    
    return {
      labels,
      datasets,
    };
  }, [dailyStats, type]);
}

export function useDeviceChartData(devices: { device: string; count: number }[]) {
  return useMemo(() => {
    if (!devices || devices.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    return {
      labels: devices.map(d => d.device),
      datasets: [
        {
          label: "Devices",
          data: devices.map(d => d.count),
          backgroundColor: [
            "rgba(56, 189, 248, 0.8)",
            "rgba(129, 140, 248, 0.8)",
            "rgba(251, 191, 36, 0.8)",
          ],
        },
      ],
    };
  }, [devices]);
}

export function useBrowserChartData(browsers: { browser: string; count: number }[]) {
  return useMemo(() => {
    if (!browsers || browsers.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    return {
      labels: browsers.map(b => b.browser),
      datasets: [
        {
          label: "Browsers",
          data: browsers.map(b => b.count),
          backgroundColor: [
            "rgba(56, 189, 248, 0.8)",
            "rgba(129, 140, 248, 0.8)",
            "rgba(251, 191, 36, 0.8)",
            "rgba(52, 211, 153, 0.8)",
            "rgba(248, 113, 113, 0.8)",
          ],
        },
      ],
    };
  }, [browsers]);
}

export function useCountryChartData(countries: { country: string; count: number }[]) {
  return useMemo(() => {
    if (!countries || countries.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    return {
      labels: countries.map(c => c.country || "Unknown"),
      datasets: [
        {
          label: "Countries",
          data: countries.map(c => c.count),
          backgroundColor: [
            "rgba(56, 189, 248, 0.8)",
            "rgba(129, 140, 248, 0.8)",
            "rgba(251, 191, 36, 0.8)",
            "rgba(52, 211, 153, 0.8)",
            "rgba(248, 113, 113, 0.8)",
            "rgba(192, 132, 252, 0.8)",
            "rgba(251, 146, 60, 0.8)",
          ],
        },
      ],
    };
  }, [countries]);
} 