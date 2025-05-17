"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, RadialBarChart, RadialBar
} from "recharts"
import { ArrowUpRight, ArrowDownRight, Users, Clock, MousePointer, Globe, Smartphone, Laptop, ExternalLink, Download } from "lucide-react"
import GlobeVisualizer from "@/app/components/GlobeVisualizer"
import { Badge } from "@/components/ui/badge"
// Import Navbar and Footer components
const Navbar = dynamic(() => import("@/app/components/navbar"), { ssr: true })
const Footer = dynamic(() => import("@/app/components/footer"), { ssr: true })

// Sample data for charts - 90 days
const generateData = (days: number) => {
  // Generate dates for the past X days
  const dates = Array.from({ length: days }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (days - 1 - i))
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  })

  // Page Views data
  const pageViewsData = dates.map(date => {
    const baseValue = Math.floor(Math.random() * 3000) + 2000
    return { date, "Page Views": baseValue }
  })

  // Sessions data
  const sessionsData = dates.map((date, i) => {
    const baseSessionValue = Math.floor(Math.random() * 2000) + 1000
    const baseDurationValue = Math.floor(Math.random() * 100) + 80
    return { 
      date, 
      "Sessions": baseSessionValue, 
      "Avg Duration": baseDurationValue 
    }
  })

  // Bounce Rate data
  const bounceRateData = dates.map(date => {
    const baseValue = Math.floor(Math.random() * 25) + 30
    return { date, "Bounce Rate": baseValue }
  })

  return { pageViewsData, sessionsData, bounceRateData }
}

// Fixed data for pie charts
const referralsData = [
  { name: "Google", value: 45, color: "#0ea5e9" },
  { name: "Direct", value: 25, color: "#8b5cf6" },
  { name: "Twitter", value: 15, color: "#10b981" },
  { name: "LinkedIn", value: 10, color: "#f59e0b" },
  { name: "Other", value: 5, color: "#6b7280" },
]

const geographyData = [
  { name: "United States", value: 40, color: "#0ea5e9" },
  { name: "United Kingdom", value: 15, color: "#8b5cf6" },
  { name: "Germany", value: 12, color: "#10b981" },
  { name: "Canada", value: 8, color: "#f59e0b" },
  { name: "France", value: 6, color: "#ec4899" },
  { name: "Australia", value: 5, color: "#f43f5e" },
  { name: "Other", value: 14, color: "#6b7280" },
]

const deviceData = [
  { name: "Desktop", value: 55, color: "#0ea5e9" },
  { name: "Mobile", value: 35, color: "#8b5cf6" },
  { name: "Tablet", value: 10, color: "#10b981" },
]

// Top pages data
const topPagesData = [
  { page: "/", views: 12500, change: 12.5 },
  { page: "/features", views: 8700, change: 7.2 },
  { page: "/pricing", views: 6400, change: -2.3 },
  { page: "/blog", views: 5200, change: 15.8 },
  { page: "/contact", views: 3100, change: 4.1 },
]

// Custom tooltip component for better styling
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 p-3 rounded-md shadow-lg">
        <p className="text-slate-200 font-medium mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color || entry.stroke }}></div>
            <p className="text-slate-300 text-sm">
              {entry.name}: <span className="font-medium text-white">{entry.value.toLocaleString()}</span>
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function DemoPage() {
  const [timeRange, setTimeRange] = useState("14d")
  const [chartData, setChartData] = useState<any>({
    pageViewsData: [],
    sessionsData: [],
    bounceRateData: []
  })
  const [summaryData, setSummaryData] = useState({
    totalPageViews: 0,
    totalSessions: 0,
    avgSessionDuration: "0m 0s",
    bounceRate: 0,
    pageViewsChange: 0,
    sessionsChange: 0,
    durationChange: 0,
    bounceRateChange: 0
  })
  
  // Update data when time range changes
  useEffect(() => {
    const days = timeRange === "24h" ? 1 : 
                timeRange === "7d" ? 7 : 
                timeRange === "14d" ? 14 : 
                timeRange === "30d" ? 30 : 90
    
    const { pageViewsData, sessionsData, bounceRateData } = generateData(days)
    
    // Calculate summary data
    const totalPageViews = pageViewsData.reduce((sum, item) => sum + item["Page Views"], 0)
    const totalSessions = sessionsData.reduce((sum, item) => sum + item["Sessions"], 0)
    const avgDurationSeconds = Math.floor(sessionsData.reduce((sum, item) => sum + item["Avg Duration"], 0) / sessionsData.length)
    const avgSessionDuration = `${Math.floor(avgDurationSeconds / 60)}m ${avgDurationSeconds % 60}s`
    const bounceRate = Math.floor(bounceRateData.reduce((sum, item) => sum + item["Bounce Rate"], 0) / bounceRateData.length)
    
    // Random changes for demonstration
    const pageViewsChange = (Math.random() * 20 - 5).toFixed(1)
    const sessionsChange = (Math.random() * 15 - 3).toFixed(1)
    const durationChange = (Math.random() * 10 - 2).toFixed(1)
    const bounceRateChange = (Math.random() * 8 - 4).toFixed(1)
    
    setChartData({ pageViewsData, sessionsData, bounceRateData })
    setSummaryData({
      totalPageViews,
      totalSessions,
      avgSessionDuration,
      bounceRate,
      pageViewsChange: parseFloat(pageViewsChange),
      sessionsChange: parseFloat(sessionsChange),
      durationChange: parseFloat(durationChange),
      bounceRateChange: parseFloat(bounceRateChange)
    })
  }, [timeRange])
  
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 scrollbar-hide">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16 relative overflow-y-auto scrollbar-hide">
        {/* Background decorations */}
        <div className="absolute top-0 left-0 right-0 h-full overflow-hidden pointer-events-none">
          <div className="absolute top-40 left-10 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl opacity-30"></div>
          <div className="absolute top-80 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl opacity-30"></div>
          <div className="absolute bottom-40 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl opacity-30"></div>
        </div>
        
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">Analytics Dashboard</h1>
              <div className="flex items-center mt-1">
                <span className="text-slate-400">Live demo of Databuddy</span>
                <Badge variant="outline" color="blue" className="ml-2 bg-blue-500/10 text-blue-500">Placeholder Data</Badge>
              </div>
            </div>
            
            
            <div className="flex items-center gap-3">
              <Select defaultValue={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[180px] bg-slate-800/90 border-slate-700/50 backdrop-blur-sm hover:border-sky-500/50 transition-all">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700/50">
                  <SelectItem value="24h">Last 24 hours</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="14d">Last 14 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" className="border-slate-700/50 hover:border-sky-500/50 text-white bg-slate-800/90 backdrop-blur-sm hover:bg-slate-800 transition-all">
                <Download className="h-4 w-4 mr-2 text-sky-400" />
                Export Report
              </Button>
            </div>
          </div>
          
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            <Card className="bg-slate-800/80 border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/90 transition-all duration-300 hover:shadow-lg hover:shadow-sky-500/10 group">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-400">Total Page Views</p>
                    <h3 className="text-2xl font-bold text-white mt-1 group-hover:text-sky-300 transition-colors">{summaryData.totalPageViews.toLocaleString()}</h3>
                    <div className={`flex items-center mt-1 ${summaryData.pageViewsChange >= 0 ? 'text-emerald-500' : 'text-red-500'} text-sm`}>
                      {summaryData.pageViewsChange >= 0 ? (
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 mr-1" />
                      )}
                      <span>{Math.abs(summaryData.pageViewsChange)}% from previous period</span>
                    </div>
                  </div>
                  <div className="bg-sky-500/30 p-2 rounded-md group-hover:bg-sky-500/40 transition-colors">
                    <MousePointer className="h-5 w-5 text-sky-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/80 border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/90 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 group">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-400">Total Sessions</p>
                    <h3 className="text-2xl font-bold text-white mt-1 group-hover:text-purple-300 transition-colors">{summaryData.totalSessions.toLocaleString()}</h3>
                    <div className={`flex items-center mt-1 ${summaryData.sessionsChange >= 0 ? 'text-emerald-500' : 'text-red-500'} text-sm`}>
                      {summaryData.sessionsChange >= 0 ? (
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 mr-1" />
                      )}
                      <span>{Math.abs(summaryData.sessionsChange)}% from previous period</span>
                    </div>
                  </div>
                  <div className="bg-purple-500/30 p-2 rounded-md group-hover:bg-purple-500/40 transition-colors">
                    <Users className="h-5 w-5 text-purple-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/80 border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/90 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 group">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-400">Avg. Session Duration</p>
                    <h3 className="text-2xl font-bold text-white mt-1 group-hover:text-emerald-300 transition-colors">{summaryData.avgSessionDuration}</h3>
                    <div className={`flex items-center mt-1 ${summaryData.durationChange >= 0 ? 'text-emerald-500' : 'text-red-500'} text-sm`}>
                      {summaryData.durationChange >= 0 ? (
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 mr-1" />
                      )}
                      <span>{Math.abs(summaryData.durationChange)}% from previous period</span>
                    </div>
                  </div>
                  <div className="bg-emerald-500/30 p-2 rounded-md group-hover:bg-emerald-500/40 transition-colors">
                    <Clock className="h-5 w-5 text-emerald-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/80 border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/90 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10 group">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-400">Bounce Rate</p>
                    <h3 className="text-2xl font-bold text-white mt-1 group-hover:text-amber-300 transition-colors">{summaryData.bounceRate}%</h3>
                    <div className={`flex items-center mt-1 ${summaryData.bounceRateChange <= 0 ? 'text-emerald-500' : 'text-red-500'} text-sm`}>
                      {summaryData.bounceRateChange <= 0 ? (
                        <ArrowDownRight className="h-3 w-3 mr-1" />
                      ) : (
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                      )}
                      <span>{Math.abs(summaryData.bounceRateChange)}% from previous period</span>
                    </div>
                  </div>
                  <div className="bg-amber-500/30 p-2 rounded-md group-hover:bg-amber-500/40 transition-colors">
                    <ExternalLink className="h-5 w-5 text-amber-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            <Card className="bg-slate-800/80 border-slate-700/50 backdrop-blur-sm hover:shadow-lg hover:shadow-sky-500/10 transition-all duration-300">
              <CardHeader className="pb-2 border-b border-slate-700/50">
                <CardTitle className="text-white text-lg">Page Views</CardTitle>
                <CardDescription>Daily page views over time</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData.pageViewsData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="Page Views" 
                        stroke="#0ea5e9" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorViews)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/80 border-slate-700/50 backdrop-blur-sm hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
              <CardHeader className="pb-2 border-b border-slate-700/50">
                <CardTitle className="text-white text-lg">Sessions & Duration</CardTitle>
                <CardDescription>Daily sessions and average duration</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData.sessionsData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" stroke="#94a3b8" />
                      <YAxis yAxisId="left" stroke="#94a3b8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line 
                        yAxisId="left" 
                        type="monotone" 
                        dataKey="Sessions" 
                        stroke="#8b5cf6" 
                        strokeWidth={2}
                        activeDot={{ r: 8 }} 
                      />
                      <Line 
                        yAxisId="right" 
                        type="monotone" 
                        dataKey="Avg Duration" 
                        stroke="#10b981" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Secondary Charts */}
          <h2 className="text-xl font-semibold text-white mb-5 mt-8">Detailed Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <Card className="bg-slate-800/80 border-slate-700/50 backdrop-blur-sm hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300">
              <CardHeader className="pb-2 border-b border-slate-700/50">
                <CardTitle className="text-white text-lg">Bounce Rate</CardTitle>
                <CardDescription>Daily bounce rate percentage</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData.bounceRateData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="Bounce Rate" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/80 border-slate-700/50 backdrop-blur-sm hover:shadow-lg hover:shadow-sky-500/10 transition-all duration-300">
              <CardHeader className="pb-2 border-b border-slate-700/50">
                <CardTitle className="text-white text-lg">Referral Sources</CardTitle>
                <CardDescription>Traffic sources breakdown</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={referralsData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {referralsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/80 border-slate-700/50 backdrop-blur-sm hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
              <CardHeader className="pb-2 border-b border-slate-700/50">
                <CardTitle className="text-white text-lg">Device Breakdown</CardTitle>
                <CardDescription>Visits by device type</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deviceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {deviceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Geography and Top Pages */}
          <h2 className="text-xl font-semibold text-white mb-5 mt-8">Geographic & Content Analysis</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="bg-slate-800/80 border-slate-700/50 backdrop-blur-sm hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300">
              <CardHeader className="pb-2 border-b border-slate-700/50">
                <CardTitle className="text-white text-lg">Geography</CardTitle>
                <CardDescription>Visitors by country</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={geographyData}
                      margin={{ top: 10, right: 10, left: 40, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis type="number" stroke="#94a3b8" />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {geographyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/80 border-slate-700/50 backdrop-blur-sm hover:shadow-lg hover:shadow-sky-500/10 transition-all duration-300">
              <CardHeader className="pb-2 border-b border-slate-700/50">
                <CardTitle className="text-white text-lg">Top Pages</CardTitle>
                <CardDescription>Most visited pages</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {topPagesData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between pb-3 border-b border-slate-700/30 hover:bg-slate-700/20 p-3 rounded-md transition-colors">
                      <div>
                        <p className="font-medium text-white">{item.page}</p>
                        <p className="text-sm text-slate-400">{item.views.toLocaleString()} views</p>
                      </div>
                      <div className={`flex items-center ${item.change >= 0 ? 'text-emerald-500' : 'text-red-500'} px-2 py-1 rounded-full ${item.change >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                        {item.change >= 0 ? (
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 mr-1" />
                        )}
                        <span>{Math.abs(item.change)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Global Visitor Map - Full Width Section */}
          <h2 className="text-xl font-bold text-white mb-5 mt-12 flex items-center">
            <Globe className="h-5 w-5 mr-2 text-sky-400" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-purple-400 to-emerald-400">Global Visitor Map</span>
          </h2>
          <div className="mb-16">
            <GlobeVisualizer />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
} 