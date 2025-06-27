import dynamic from "next/dynamic";
import { SkeletonChart } from "./skeleton-chart";

// Dynamic imports for heavy chart components
export const MetricsChart = dynamic(
  () => import("./metrics-chart").then((mod) => ({ default: mod.MetricsChart })),
  {
    loading: () => <SkeletonChart className="w-full" height={400} title="Loading chart..." />,
    ssr: false,
  }
);

export const DistributionChart = dynamic(
  () => import("./distribution-chart").then((mod) => ({ default: mod.DistributionChart })),
  {
    loading: () => <SkeletonChart className="w-full" height={190} title="Loading chart..." />,
    ssr: false,
  }
);

export const VersatileAIChart = dynamic(
  () => import("./versatile-ai-chart").then((mod) => ({ default: mod.VersatileAIChart })),
  {
    loading: () => <SkeletonChart className="w-full" height={260} title="Loading chart..." />,
    ssr: false,
  }
);

// Export skeleton chart directly (no need to lazy load)
export { SkeletonChart } from "./skeleton-chart";
