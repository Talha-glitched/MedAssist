import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Calendar, TrendingUp, Clock, Users, FileText, Activity } from 'lucide-react';
import { analyticsAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Analytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState({
    overview: {
      totalConsultations: 0,
      totalProcessingTime: 0,
      averageAccuracy: 0,
      activeUsers: 0,
    },
    consultationTrends: [],
    processingMetrics: [],
    accuracyStats: [],
    statusDistribution: [],
    performanceInsights: {
      peakHours: { hour: 0, count: 0 },
      efficiencyTrend: { trend: 'stable', percentage: 0 },
      qualityMetrics: { avgAccuracy: 0, avgProcessingTime: 0 },
      recommendations: []
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30'); // days

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const [dashboardResponse, usageResponse, performanceResponse] = await Promise.all([
        analyticsAPI.getDashboardStats(),
        analyticsAPI.getUsageStats({ days: timeRange }),
        analyticsAPI.getPerformanceMetrics(),
      ]);

      if (dashboardResponse.data.success) {
        setAnalyticsData((prev) => ({
          ...prev,
          overview: dashboardResponse.data.data,
        }));
      }

      if (usageResponse.data.success) {
        setAnalyticsData((prev) => ({
          ...prev,
          consultationTrends: usageResponse.data.data.consultationTrends || [],
          statusDistribution: usageResponse.data.data.statusDistribution || [],
        }));
      }

      if (performanceResponse.data.success) {
        setAnalyticsData((prev) => ({
          ...prev,
          processingMetrics: performanceResponse.data.data.processingMetrics || [],
          accuracyStats: performanceResponse.data.data.accuracyStats || [],
          performanceInsights: performanceResponse.data.data.performanceInsights || {
            peakHours: { hour: 0, count: 0 },
            efficiencyTrend: { trend: 'stable', percentage: 0 },
            qualityMetrics: { avgAccuracy: 0, avgProcessingTime: 0 },
            recommendations: []
          }
        }));
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const COLORS = {
    primary: '#0066CC',
    secondary: '#00B8A6',
    accent: '#FF6B35',
    success: '#00C853',
    warning: '#FFA726',
    error: '#EF5350',
  };

  const pieColors = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.success];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-medical-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Monitor performance, usage trends, and system metrics
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <label className="text-sm font-medium text-gray-700">Time Range:</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input-field w-32"
          >
            <option value="7">7 days</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
            <option value="365">1 year</option>
          </select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="medical-card border-l-medical-blue">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Consultations</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {(analyticsData.overview.totalConsultations || 0).toLocaleString()}
              </p>
            </div>
            <FileText className="w-8 h-8 text-medical-blue" />
          </div>
        </div>

        <div className="medical-card border-l-medical-teal">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Processing Time</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {Math.round(analyticsData.overview.totalProcessingTime || 0)}s
              </p>
              <p className="text-sm text-gray-500">Average</p>
            </div>
            <Clock className="w-8 h-8 text-medical-teal" />
          </div>
        </div>

        <div className="medical-card border-l-medical-green">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Accuracy Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {Math.round((analyticsData.overview.averageAccuracy || 0) * 100)}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-medical-green" />
          </div>
        </div>

        <div className="medical-card border-l-medical-orange">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {analyticsData.overview.activeUsers || 0}
              </p>
            </div>
            <Users className="w-8 h-8 text-medical-orange" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Consultation Trends */}
        <div className="medical-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-medical-blue" />
            Consultation Trends
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.consultationTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                stroke="#666"
                fontSize={12}
              />
              <YAxis stroke="#666" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value, name) => [
                  name === 'consultations' ? value : `${value}${name === 'avgAccuracy' ? '%' : 's'}`,
                  name === 'consultations' ? 'Consultations' : name === 'avgAccuracy' ? 'Accuracy' : 'Processing Time'
                ]}
              />
              <Line
                type="monotone"
                dataKey="consultations"
                stroke={COLORS.primary}
                strokeWidth={3}
                dot={{ fill: COLORS.primary, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: COLORS.primary, strokeWidth: 2 }}
                name="Consultations"
              />
              <Line
                type="monotone"
                dataKey="avgAccuracy"
                stroke={COLORS.success}
                strokeWidth={2}
                dot={{ fill: COLORS.success, strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, stroke: COLORS.success, strokeWidth: 2 }}
                name="Accuracy"
              />
            </LineChart>
          </ResponsiveContainer>
          {/* Trend Summary */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900">Total Consultations</p>
              <p className="text-lg font-bold text-blue-700">
                {analyticsData.consultationTrends.reduce((sum, trend) => sum + (trend.consultations || 0), 0)}
              </p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-900">Avg Accuracy</p>
              <p className="text-lg font-bold text-green-700">
                {analyticsData.consultationTrends.length > 0
                  ? Math.round(analyticsData.consultationTrends.reduce((sum, trend) => sum + (trend.avgAccuracy || 0), 0) / analyticsData.consultationTrends.length)
                  : 0}%
              </p>
            </div>
            <div className="text-center p-3 bg-teal-50 rounded-lg">
              <p className="text-sm font-medium text-teal-900">Avg Processing Time</p>
              <p className="text-lg font-bold text-teal-700">
                {analyticsData.consultationTrends.length > 0
                  ? Math.round(analyticsData.consultationTrends.reduce((sum, trend) => sum + (trend.avgProcessingTime || 0), 0) / analyticsData.consultationTrends.length)
                  : 0}s
              </p>
            </div>
          </div>
        </div>

        {/* Processing Performance */}
        <div className="medical-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-medical-teal" />
            Processing Performance
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.processingMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="service"
                stroke="#666"
                fontSize={12}
              />
              <YAxis stroke="#666" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value, name) => [
                  `${value}${name === 'avgTime' ? 's' : '%'}`,
                  name === 'avgTime' ? 'Processing Time' : 'Efficiency'
                ]}
              />
              <Bar
                dataKey="avgTime"
                fill={COLORS.secondary}
                radius={[4, 4, 0, 0]}
                name="Processing Time"
              />
              <Bar
                dataKey="efficiency"
                fill={COLORS.success}
                radius={[4, 4, 0, 0]}
                name="Efficiency"
              />
            </BarChart>
          </ResponsiveContainer>
          {/* Performance Status Indicators */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            {analyticsData.processingMetrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{metric.service}</p>
                  <p className="text-xs text-gray-500">
                    {metric.trend === 'up' ? '↗ Improving' : metric.trend === 'down' ? '↘ Declining' : '→ Stable'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{metric.avgTime}s</p>
                  <p className="text-xs text-gray-500">{metric.efficiency}% efficiency</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Accuracy Distribution */}
        <div className="medical-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-medical-green" />
            Accuracy Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.accuracyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="range"
                stroke="#666"
                fontSize={12}
              />
              <YAxis stroke="#666" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar
                dataKey="count"
                fill={COLORS.success}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="medical-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-medical-blue" />
            Note Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {analyticsData.statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name, props) => [
                  `${value} notes`,
                  `${props.payload.name} (${((props.payload.percent || 0) * 100).toFixed(1)}%)`
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Status Metrics */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            {analyticsData.statusDistribution.map((status, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: status.color || pieColors[index % pieColors.length] }}
                  ></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 capitalize">{status.name}</p>
                    <p className="text-xs text-gray-500">{status.count} notes</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{status.avgProcessingTime || 0}s</p>
                  <p className="text-xs text-gray-500">{status.avgAccuracy || 0}% accuracy</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Performance Insights */}
      <div className="medical-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-medical-green" />
          Performance Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Peak Usage Hours</h4>
            <p className="text-sm text-blue-700">
              {analyticsData.performanceInsights.peakHours.count > 0
                ? `Peak activity at ${analyticsData.performanceInsights.peakHours.hour}:00 (${analyticsData.performanceInsights.peakHours.count} consultations)`
                : 'No peak hours data available'
              }
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">Efficiency Trend</h4>
            <p className="text-sm text-green-700">
              {analyticsData.performanceInsights.efficiencyTrend.trend === 'improving'
                ? `Improving by ${analyticsData.performanceInsights.efficiencyTrend.percentage}%`
                : analyticsData.performanceInsights.efficiencyTrend.trend === 'declining'
                  ? `Declining by ${analyticsData.performanceInsights.efficiencyTrend.percentage}%`
                  : 'Stable performance'
              }
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-medium text-purple-900 mb-2">Quality Metrics</h4>
            <p className="text-sm text-purple-700">
              {analyticsData.performanceInsights.qualityMetrics.avgAccuracy > 0
                ? `${analyticsData.performanceInsights.qualityMetrics.avgAccuracy}% accuracy, ${analyticsData.performanceInsights.qualityMetrics.avgProcessingTime}s avg time`
                : 'No quality metrics available'
              }
            </p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <h4 className="font-medium text-orange-900 mb-2">Recommendations</h4>
            <p className="text-sm text-orange-700">
              {analyticsData.performanceInsights.recommendations.length > 0
                ? analyticsData.performanceInsights.recommendations[0]
                : 'No recommendations available'
              }
            </p>
          </div>
        </div>

        {/* Detailed Recommendations */}
        {analyticsData.performanceInsights.recommendations.length > 1 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Additional Recommendations</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              {analyticsData.performanceInsights.recommendations.slice(1).map((rec, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-medical-blue mr-2">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;