// Enhanced Custom Tooltip for Error Chart
export const ErrorChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg text-xs">
            <p className="font-semibold mb-2 text-foreground">{label}</p>
            <div className="space-y-1.5">
                {payload.map((entry: any) => (
                    <div key={`tooltip-${entry.dataKey}-${entry.value}`} className="flex items-center gap-2">
                        <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-muted-foreground">{entry.name}:</span>
                        <span className="font-medium text-foreground">{entry.value.toLocaleString()}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}; 