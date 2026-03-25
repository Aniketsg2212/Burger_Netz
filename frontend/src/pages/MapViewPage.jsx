import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { 
  AlertTriangle, 
  Lightbulb, 
  Trash2, 
  Paintbrush, 
  HelpCircle,
  Filter,
  MapPin
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
  pothole: { icon: AlertTriangle, color: '#f59e0b', name: 'Pothole' },
  streetlight: { icon: Lightbulb, color: '#facc15', name: 'Street Light' },
  garbage: { icon: Trash2, color: '#22c55e', name: 'Garbage' },
  graffiti: { icon: Paintbrush, color: '#a855f7', name: 'Graffiti' },
  other: { icon: HelpCircle, color: '#64748b', name: 'Other' },
};

const statusConfig = {
  pending: { label: 'Pending', class: 'bg-orange-100 text-orange-700 border-orange-200' },
  in_progress: { label: 'In Progress', class: 'bg-blue-100 text-blue-700 border-blue-200' },
  resolved: { label: 'Resolved', class: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
};

const createCustomIcon = (category) => {
  const config = categoryConfig[category] || categoryConfig.other;
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${config.color}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        ${getCategoryIconSvg(category)}
      </svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const getCategoryIconSvg = (category) => {
  switch (category) {
    case 'pothole':
      return '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>';
    case 'streetlight':
      return '<line x1="9" y1="18" x2="15" y2="18"></line><line x1="10" y1="22" x2="14" y2="22"></line><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"></path>';
    case 'garbage':
      return '<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>';
    case 'graffiti':
      return '<path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle>';
    default:
      return '<circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line>';
  }
};

const MapViewPage = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [center, setCenter] = useState([52.52, 13.405]);

  useEffect(() => {
    fetchIssues();
    
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCenter([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {}
      );
    }
  }, []);

  const fetchIssues = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/issues`);
      setIssues(response.data);
    } catch (error) {
      console.error('Failed to fetch issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredIssues = issues.filter((issue) => {
    if (categoryFilter !== 'all' && issue.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && issue.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Filters */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-slate-500">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px]" data-testid="category-filter">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(categoryConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]" data-testid="status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(statusConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="ml-auto text-sm text-slate-500" data-testid="issues-count">
            {filteredIssues.length} issue{filteredIssues.length !== 1 ? 's' : ''} found
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative" data-testid="map-container">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
          </div>
        ) : (
          <MapContainer center={center} zoom={13} className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filteredIssues.map((issue) => (
              <Marker
                key={issue.id}
                position={[issue.latitude, issue.longitude]}
                icon={createCustomIcon(issue.category)}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <div className="flex items-start gap-2 mb-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: categoryConfig[issue.category]?.color || '#64748b' }}
                      >
                        {(() => {
                          const IconComponent = categoryConfig[issue.category]?.icon || HelpCircle;
                          return <IconComponent className="w-4 h-4 text-white" />;
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-900 text-sm truncate">
                          {issue.title}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {categoryConfig[issue.category]?.name || 'Other'}
                        </p>
                      </div>
                    </div>
                    <Badge className={`${statusConfig[issue.status]?.class} text-xs mb-3`}>
                      {statusConfig[issue.status]?.label || issue.status}
                    </Badge>
                    <Link to={`/issue/${issue.id}`}>
                      <Button size="sm" className="w-full h-8 text-xs">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}

        {/* Legend */}
        <div className="absolute bottom-6 left-6 bg-white rounded-lg shadow-lg p-4 z-[1000]" data-testid="map-legend">
          <h4 className="font-medium text-slate-900 text-sm mb-3">Legend</h4>
          <div className="space-y-2">
            {Object.entries(categoryConfig).map(([key, config]) => (
              <div key={key} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                <span className="text-xs text-slate-600">{config.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapViewPage;
