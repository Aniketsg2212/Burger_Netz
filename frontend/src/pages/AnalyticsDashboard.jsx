import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { 
  AlertTriangle, 
  Lightbulb, 
  Trash2, 
  Paintbrush, 
  HelpCircle,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  MapPin
} from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const categoryConfig = {
  pothole: { icon: AlertTriangle, color: '#f59e0b', name: 'Potholes' },
  streetlight: { icon: Lightbulb, color: '#facc15', name: 'Street Lights' },
  garbage: { icon: Trash2, color: '#22c55e', name: 'Garbage' },
  graffiti: { icon: Paintbrush, color: '#a855f7', name: 'Graffiti' },
  other: { icon: HelpCircle, color: '#64748b', name: 'Other' },
};

const statusConfig = {
  pending: { label: 'Pending', color: '#f97316', icon: Clock },
  in_progress: { label: 'In Progress', color: '#3b82f6', icon: AlertCircle },
  resolved: { label: 'Resolved', color: '#10b981', icon: CheckCircle },
};

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/analytics`);
        setAnalytics(response.data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <p className="text-slate-500">Failed to load analytics</p>
      </div>
    );
  }

  const categoryData = Object.entries(analytics.by_category).map(([key, value]) => ({
    name: categoryConfig[key]?.name || key,
    value,
    color: categoryConfig[key]?.color || '#64748b',
  }));

  const statusData = Object.entries(analytics.by_status).map(([key, value]) => ({
    name: statusConfig[key]?.label || key,
    value,
    color: statusConfig[key]?.color || '#64748b',
  }));

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-slate-900 mb-2" data-testid="analytics-title">
          City Analytics Dashboard
        </h1>
        <p className="text-slate-500">Overview of reported issues and trends</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6" data-testid="stat-total">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-slate-700" />
            </div>
            <div>
              <p className="text-3xl font-heading font-bold text-slate-900">{analytics.total_issues}</p>
              <p className="text-slate-500 text-sm">Total Reports</p>
            </div>
          </div>
        </div>

        {Object.entries(statusConfig).map(([key, config]) => {
          const IconComponent = config.icon;
          return (
            <div key={key} className="bg-white rounded-lg border border-slate-200 shadow-sm p-6" data-testid={`stat-${key}`}>
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${config.color}20` }}
                >
                  <IconComponent className="w-6 h-6" style={{ color: config.color }} />
                </div>
                <div>
                  <p className="text-3xl font-heading font-bold text-slate-900">
                    {analytics.by_status[key] || 0}
                  </p>
                  <p className="text-slate-500 text-sm">{config.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Category Distribution */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6" data-testid="category-chart">
          <h2 className="font-heading font-semibold text-slate-900 mb-4">Issues by Category</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={12} width={80} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6" data-testid="status-chart">
          <h2 className="font-heading font-semibold text-slate-900 mb-4">Issues by Status</h2>
          <div className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-slate-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-8" data-testid="trends-chart">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-slate-500" />
          <h2 className="font-heading font-semibold text-slate-900">Monthly Trends</h2>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics.monthly_trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#0f172a" 
                strokeWidth={2}
                dot={{ fill: '#0f172a', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#f97316' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Issues */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6" data-testid="recent-issues">
        <h2 className="font-heading font-semibold text-slate-900 mb-4">Recent Reports</h2>
        {analytics.recent_issues.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No recent issues</p>
        ) : (
          <div className="space-y-3">
            {analytics.recent_issues.map((issue) => {
              const catConfig = categoryConfig[issue.category] || categoryConfig.other;
              const IconComponent = catConfig.icon;
              const statConfig = statusConfig[issue.status] || statusConfig.pending;

              return (
                <Link 
                  key={issue.id} 
                  to={`/issue/${issue.id}`}
                  className="block"
                  data-testid={`recent-issue-${issue.id}`}
                >
                  <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: catConfig.color }}
                    >
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{issue.title}</p>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{issue.address || 'Location marked on map'}</span>
                      </div>
                    </div>
                    <Badge 
                      className="text-xs"
                      style={{ 
                        backgroundColor: `${statConfig.color}20`,
                        color: statConfig.color,
                        borderColor: statConfig.color
                      }}
                    >
                      {statConfig.label}
                    </Badge>
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {formatDate(issue.created_at)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
