import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps
} from "recharts";

// Custom tooltip styles
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 p-3 rounded-md shadow-md">
        <p className="text-slate-200 text-sm font-medium mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value?.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Line Chart Component
interface LineChartProps {
  data: number[];
  labels: string[];
  colors?: string[];
  showLegend?: boolean;
  yAxisWidth?: number;
}

export function LineChart({ 
  data, 
  labels, 
  colors = ["#3b82f6"], 
  showLegend = true,
  yAxisWidth = 40
}: LineChartProps) {
  // Format data for Recharts
  const chartData = labels.map((label, index) => ({
    name: label,
    value: data[index] || 0
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsLineChart
        data={chartData}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis 
          dataKey="name" 
          tick={{ fill: "#94a3b8", fontSize: 11 }}
          tickLine={{ stroke: "#1e293b" }}
          axisLine={{ stroke: "#1e293b" }}
        />
        <YAxis 
          width={yAxisWidth}
          tick={{ fill: "#94a3b8", fontSize: 11 }}
          tickLine={{ stroke: "#1e293b" }}
          axisLine={{ stroke: "#1e293b" }}
        />
        <Tooltip content={<CustomTooltip />} />
        {showLegend && <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />}
        <Line
          type="monotone"
          dataKey="value"
          name="Value"
          stroke={colors[0]}
          strokeWidth={2}
          dot={{ r: 3, fill: "#0f172a", stroke: colors[0], strokeWidth: 2 }}
          activeDot={{ r: 5, stroke: colors[0], strokeWidth: 2 }}
          fill={`${colors[0]}20`}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}

// Bar Chart Component
interface BarChartProps {
  data: number[];
  labels: string[];
  colors?: string[];
  showLegend?: boolean;
  yAxisWidth?: number;
  layout?: "vertical" | "horizontal";
}

export function BarChart({ 
  data, 
  labels, 
  colors = ["#3b82f6"], 
  showLegend = true,
  yAxisWidth = 40,
  layout = "vertical"
}: BarChartProps) {
  // Format data for Recharts
  const chartData = labels.map((label, index) => ({
    name: label,
    value: data[index] || 0
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      {layout === "horizontal" ? (
        <RechartsBarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
          <XAxis 
            type="number"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            tickLine={{ stroke: "#1e293b" }}
            axisLine={{ stroke: "#1e293b" }}
          />
          <YAxis 
            dataKey="name"
            type="category"
            width={yAxisWidth}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            tickLine={{ stroke: "#1e293b" }}
            axisLine={{ stroke: "#1e293b" }}
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />}
          <Bar 
            dataKey="value" 
            name="Value"
            fill={`${colors[0]}80`}
            stroke={colors[0]}
            strokeWidth={1}
            radius={[0, 4, 4, 0]}
          />
        </RechartsBarChart>
      ) : (
        <RechartsBarChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            tickLine={{ stroke: "#1e293b" }}
            axisLine={{ stroke: "#1e293b" }}
          />
          <YAxis 
            width={yAxisWidth}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            tickLine={{ stroke: "#1e293b" }}
            axisLine={{ stroke: "#1e293b" }}
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />}
          <Bar 
            dataKey="value" 
            name="Value"
            fill={`${colors[0]}80`}
            stroke={colors[0]}
            strokeWidth={1}
            radius={[4, 4, 0, 0]}
          />
        </RechartsBarChart>
      )}
    </ResponsiveContainer>
  );
}

// Pie Chart Component
interface PieChartProps {
  data: number[];
  labels: string[];
  colors?: string[];
}

export function PieChart({ 
  data, 
  labels, 
  colors = ["#3b82f6", "#10b981", "#f59e0b", "#6366f1", "#ec4899"]
}: PieChartProps) {
  // Format data for Recharts
  const chartData = labels.map((label, index) => ({
    name: label,
    value: data[index] || 0
  }));

  // Ensure we have enough colors
  const extendedColors = [...colors];
  while (extendedColors.length < chartData.length) {
    extendedColors.push(colors[extendedColors.length % colors.length]);
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={extendedColors[index]} stroke={extendedColors[index]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          layout="vertical" 
          verticalAlign="middle" 
          align="right"
          wrapperStyle={{ fontSize: 12, color: "#94a3b8" }}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
} 