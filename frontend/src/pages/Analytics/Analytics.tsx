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
                {analyticsData.overview.totalConsultations.toLocaleString()}
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
                {Math.round(analyticsData.overview.totalProcessingTime / 1000)}s
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
                {Math.round(analyticsData.overview.averageAccuracy * 100)}%
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
                {analyticsData.overview.activeUsers}
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
              />
              <Line 
                type="monotone" 
                dataKey="consultations" 
                stroke={COLORS.primary} 
                strokeWidth={3}
                dot={{ fill: COLORS.primary, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: COLORS.primary, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
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
              />
              <Bar 
                dataKey="avgTime" 
                fill={COLORS.secondary}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
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
                  <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="medical-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Peak Usage Hours</h4>
            <p className="text-sm text-blue-700">
              Most consultations occur between 9:00 AM - 12:00 PM
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">Processing Efficiency</h4>
            <p className="text-sm text-green-700">
              Average processing time improved by 15% this month
            </p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <h4 className="font-medium text-orange-900 mb-2">User Satisfaction</h4>
            <p className="text-sm text-orange-700">
              95% of notes are approved without edits
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;