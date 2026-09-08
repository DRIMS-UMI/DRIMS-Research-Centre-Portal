import React from "react";
import { Cell, Label, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Loader2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import {
  ChartTooltip,
} from "@/components/ui/chart";
import { useGetStatusStatistics } from "@/store/tanstackStore/services/queries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_PALETTE = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"];

// Define default data for when the real data is loading
const defaultChartData = [
  { status: "Normal Progress", students: 0, fill: '#10B981' },
  { status: "Fieldwork", students: 0, fill: '#3B82F6' },
  { status: "Under Examination", students: 0, fill: '#F59E0B' },
  { status: "Scheduled for Viva", students: 0, fill: '#EC4899' },
  { status: "Results Approved", students: 0, fill: '#14B8A6' }
];

const formatStatusName = (status) => {
  if (!status) return "Unknown Status";
  return status
    .toString()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const DPieChart = () => {
  // State for the selected category
  const [category, setCategory] = React.useState("main");
  
  // Fetch student status data with the selected category
  const { data, isLoading, error } = useGetStatusStatistics(category);

  // Transform the data for the chart
  const chartData = React.useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    // The API returns an array of objects with status, students, and fill
    return data
      .map((item, index) => ({
        status: formatStatusName(item.status),
        students: Number(item.students || 0),
        fill: item.fill || STATUS_PALETTE[index % STATUS_PALETTE.length]
      }))
      .filter((item) => item.students > 0); // Only show non-zero values
  }, [data]);

  const totalStudents = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.students, 0);
  }, [chartData]);

  if (error) {
    return (
      <Card className="flex flex-col h-full shadow-sm rounded-lg border-0 bg-white">
        <CardContent className="flex items-center justify-center h-full min-h-[300px]">
          <p className="text-destructive text-sm font-medium">Failed to load student statistics</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full shadow-sm rounded-lg border-0 bg-white">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 py-5 px-6 pb-2">
        <div>
          <CardTitle className="text-lg font-medium text-gray-900">Status Distribution</CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Current student status breakdown
          </CardDescription>
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[175px] text-xs font-normal text-gray-900 h-9">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="main">Student Statuses</SelectItem>
            <SelectItem value="book">Dissertation Statuses</SelectItem>
            <SelectItem value="proposal">Proposal Statuses</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col justify-between px-6 pt-0 pb-4">
        <div className="w-full h-[190px] relative flex items-center justify-center">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-7 w-7 animate-spin text-[#23388F]" />
            </div>
          ) : totalStudents > 0 ? (
            <ResponsiveContainer width="100%" height={190}>
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const itemData = payload[0].payload;
                    return (
                      <div className="rounded-lg bg-white p-2.5 shadow-md border border-gray-100 text-xs">
                        <div className="flex items-center gap-2 font-medium text-gray-900">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: itemData.fill }}
                          />
                          <span>{itemData.status}</span>
                        </div>
                        <p className="text-gray-500 mt-1 pl-4">
                          {itemData.students} {itemData.students === 1 ? 'student' : 'students'} ({((itemData.students / totalStudents) * 100).toFixed(1)}%)
                        </p>
                      </div>
                    );
                  }}
                />
                <Pie
                  data={chartData}
                  dataKey="students"
                  nameKey="status"
                  innerRadius={52}
                  outerRadius={75}
                  paddingAngle={chartData.length > 1 ? 3 : 0}
                  cx="50%"
                  cy="50%"
                  strokeWidth={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fill}
                      stroke="#ffffff"
                    />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      if (!viewBox) return null;
                      const { cx, cy } = viewBox;
                      return (
                        <text
                          x={cx}
                          y={cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={cx}
                            y={(cy || 0) - 5}
                            className="fill-gray-900 font-bold"
                            style={{ fontSize: '24px', fontWeight: 700, fill: '#111827' }}
                          >
                            {totalStudents}
                          </tspan>
                          <tspan
                            x={cx}
                            y={(cy || 0) + 16}
                            className="fill-gray-500 font-medium"
                            style={{ fontSize: '11px', fill: '#6B7280' }}
                          >
                            Total Students
                          </tspan>
                        </text>
                      );
                    }}
                  />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            // Empty state
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center mb-2">
                <span className="text-xs text-gray-400 font-medium">No Data</span>
              </div>
              <div className="text-xs font-medium text-gray-600">No student status data available</div>
              <div className="text-[11px] text-gray-400 mt-0.5">Data will appear when students are enrolled</div>
            </div>
          )}
        </div>

        {/* Legend */}
        {!isLoading && chartData.length > 0 && totalStudents > 0 && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t border-gray-100 mt-1">
            {chartData.map((entry, index) => (
              <div key={index} className="flex items-center space-x-2 min-w-0">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: entry.fill }}
                />
                <div className="flex items-center justify-between w-full min-w-0">
                  <span className="text-xs font-medium text-gray-700 truncate" title={entry.status}>
                    {entry.status}
                  </span>
                  <span className="text-xs font-medium text-gray-500 shrink-0 ml-2">
                    {entry.students} <span className="text-gray-400 font-normal">({((entry.students / totalStudents) * 100).toFixed(0)}%)</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DPieChart;
