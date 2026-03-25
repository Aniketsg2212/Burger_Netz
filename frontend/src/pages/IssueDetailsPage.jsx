import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toast } from 'sonner';
import { 
  AlertTriangle, 
  Lightbulb, 
  Trash2, 
  Paintbrush, 
  HelpCircle,
  MapPin,
  Calendar,
  User,
  ArrowLeft,
  Trash,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const categoryConfig = {
  pothole: { icon: AlertTriangle, color: 'bg-amber-500', name: 'Pothole' },
  streetlight: { icon: Lightbulb, color: 'bg-yellow-400', name: 'Street Light' },
  garbage: { icon: Trash2, color: 'bg-green-500', name: 'Garbage' },
  graffiti: { icon: Paintbrush, color: 'bg-purple-500', name: 'Graffiti' },
  other: { icon: HelpCircle, color: 'bg-slate-500', name: 'Other' },
};

const statusConfig = {
  pending: { 
    label: 'Pending', 
    class: 'bg-orange-100 text-orange-700 border-orange-200',
    icon: Clock,
    description: 'Your report is awaiting review'
  },
  in_progress: { 
    label: 'In Progress', 
    class: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: AlertCircle,
    description: 'The issue is being addressed'
  },
  resolved: { 
    label: 'Resolved', 
    class: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: CheckCircle,
    description: 'The issue has been resolved'
  },
};

const IssueDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchIssue = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/issues/${id}`);
        setIssue(response.data);
      } catch (error) {
        toast.error('Issue not found');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchIssue();
  }, [id, navigate]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${API_URL}/api/issues/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Issue deleted successfully');
      navigate('/my-reports');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete issue');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!issue) return null;

  const categoryInfo = categoryConfig[issue.category] || categoryConfig.other;
  const statusInfo = statusConfig[issue.status] || statusConfig.pending;
  const IconComponent = categoryInfo.icon;
  const StatusIcon = statusInfo.icon;
  const isOwner = user && user.id === issue.user_id;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      {/* Back Button */}
      <Link 
        to="/map" 
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        data-testid="back-link"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Map
      </Link>

      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex items-start gap-4 mb-6">
          <div className={`w-14 h-14 ${categoryInfo.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
            <IconComponent className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-heading text-2xl font-bold text-slate-900 mb-1" data-testid="issue-title">
                  {issue.title}
                </h1>
                <p className="text-slate-500">{categoryInfo.name}</p>
              </div>
              <Badge className={`${statusInfo.class} text-sm py-1 px-3`} data-testid="issue-status">
                {statusInfo.label}
              </Badge>
            </div>
          </div>
        </div>

        {/* Status Timeline */}
        <div className={`${statusInfo.class.replace('border-', 'border-l-4 border-')} bg-opacity-30 rounded-r-lg p-4 mb-6`}>
          <div className="flex items-center gap-3">
            <StatusIcon className="w-5 h-5" />
            <div>
              <p className="font-medium">{statusInfo.label}</p>
              <p className="text-sm opacity-80">{statusInfo.description}</p>
            </div>
          </div>
        </div>

        {/* Description */}
        {issue.description && (
          <div className="mb-6">
            <h2 className="font-heading font-semibold text-slate-900 mb-2">Description</h2>
            <p className="text-slate-600 leading-relaxed" data-testid="issue-description">
              {issue.description}
            </p>
          </div>
        )}

        {/* Meta Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <User className="w-4 h-4 text-slate-400" />
            <span>Reported by {issue.user_name}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{formatDate(issue.created_at)}</span>
          </div>
          {issue.address && (
            <div className="flex items-center gap-2 text-slate-600 sm:col-span-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>{issue.address}</span>
            </div>
          )}
        </div>
      </div>

      {/* Photos */}
      {issue.photos && issue.photos.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-6">
          <h2 className="font-heading font-semibold text-slate-900 mb-4">Photos</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {issue.photos.map((photo, index) => (
              <div key={index} className="aspect-square rounded-lg overflow-hidden">
                <img
                  src={photo}
                  alt={`Issue photo ${index + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  data-testid={`issue-photo-${index}`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Map */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-6">
        <h2 className="font-heading font-semibold text-slate-900 mb-4">Location</h2>
        <div className="h-[300px] rounded-lg overflow-hidden border border-slate-200">
          <MapContainer
            center={[issue.latitude, issue.longitude]}
            zoom={16}
            className="h-full w-full"
            data-testid="issue-map"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[issue.latitude, issue.longitude]} />
          </MapContainer>
        </div>
      </div>

      {/* Actions for Owner */}
      {isOwner && (
        <div className="flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 gap-2"
                data-testid="delete-issue-btn"
              >
                <Trash className="w-4 h-4" />
                Delete Report
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this report?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your issue report.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={deleting}
                  data-testid="confirm-delete-btn"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
};

export default IssueDetailsPage;
