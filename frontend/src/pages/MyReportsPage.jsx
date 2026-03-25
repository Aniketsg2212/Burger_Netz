import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  AlertTriangle, 
  Lightbulb, 
  Trash2, 
  Paintbrush, 
  HelpCircle,
  MapPin,
  Calendar,
  ChevronRight,
  PlusCircle,
  FileText
} from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const categoryConfig = {
  pothole: { icon: AlertTriangle, color: 'bg-amber-500', name: 'Pothole' },
  streetlight: { icon: Lightbulb, color: 'bg-yellow-400', name: 'Street Light' },
  garbage: { icon: Trash2, color: 'bg-green-500', name: 'Garbage' },
  graffiti: { icon: Paintbrush, color: 'bg-purple-500', name: 'Graffiti' },
  other: { icon: HelpCircle, color: 'bg-slate-500', name: 'Other' },
};

const statusConfig = {
  pending: { label: 'Pending', class: 'bg-orange-100 text-orange-700 border-orange-200' },
  in_progress: { label: 'In Progress', class: 'bg-blue-100 text-blue-700 border-blue-200' },
  resolved: { label: 'Resolved', class: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
};

const MyReportsPage = () => {
  const { user, token, loading: authLoading } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyIssues = async () => {
      if (authLoading) return;
      if (!user || !token) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await axios.get(`${API_URL}/api/issues?user_id=${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIssues(response.data);
      } catch (error) {
        console.error('Failed to fetch issues:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyIssues();
  }, [user, token, authLoading]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900 mb-2" data-testid="my-reports-title">
            My Reports
          </h1>
          <p className="text-slate-500">Track the status of your submitted issues</p>
        </div>
        <Link to="/report">
          <Button className="bg-orange-500 hover:bg-orange-600 gap-2" data-testid="new-report-btn">
            <PlusCircle className="w-4 h-4" />
            New Report
          </Button>
        </Link>
      </div>

      {issues.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-slate-200">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-heading text-lg font-medium text-slate-900 mb-2">
            No reports yet
          </h3>
          <p className="text-slate-500 mb-6">
            You haven't submitted any issue reports yet.
          </p>
          <Link to="/report">
            <Button className="bg-slate-900 hover:bg-slate-800 gap-2" data-testid="first-report-btn">
              <PlusCircle className="w-4 h-4" />
              Report Your First Issue
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => {
            const categoryInfo = categoryConfig[issue.category] || categoryConfig.other;
            const statusInfo = statusConfig[issue.status] || statusConfig.pending;
            const IconComponent = categoryInfo.icon;

            return (
              <Link 
                key={issue.id} 
                to={`/issue/${issue.id}`}
                data-testid={`issue-card-${issue.id}`}
              >
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all p-4 sm:p-6 flex items-start gap-4">
                  {/* Category Icon */}
                  <div className={`w-12 h-12 ${categoryInfo.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="font-medium text-slate-900 truncate mb-1">
                          {issue.title}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {categoryInfo.name}
                        </p>
                      </div>
                      <Badge className={`${statusInfo.class} flex-shrink-0`}>
                        {statusInfo.label}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                      {issue.address && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate max-w-[200px]">{issue.address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(issue.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyReportsPage;
