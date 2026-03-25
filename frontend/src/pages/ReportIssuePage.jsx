import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, 
  Camera, 
  AlertTriangle, 
  Lightbulb, 
  Trash2, 
  Paintbrush,
  HelpCircle,
  X,
  Upload,
  CheckCircle
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

const categories = [
  { id: 'pothole', name: 'Pothole', icon: AlertTriangle, color: 'bg-amber-500' },
  { id: 'streetlight', name: 'Street Light', icon: Lightbulb, color: 'bg-yellow-400' },
  { id: 'garbage', name: 'Garbage', icon: Trash2, color: 'bg-green-500' },
  { id: 'graffiti', name: 'Graffiti', icon: Paintbrush, color: 'bg-purple-500' },
  { id: 'other', name: 'Other', icon: HelpCircle, color: 'bg-slate-500' },
];

const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
};

const ReportIssuePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [position, setPosition] = useState(null);
  const [address, setAddress] = useState('');
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get user's location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {
          // Default to Berlin if geolocation fails
          setPosition([52.52, 13.405]);
        }
      );
    } else {
      setPosition([52.52, 13.405]);
    }
  }, []);

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 5 * 1024 * 1024; // 5MB

    files.forEach((file) => {
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large. Max size is 5MB`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotos((prev) => [...prev, { file, preview: event.target.result }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!category) {
      toast.error('Please select a category');
      return;
    }
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (!position) {
      toast.error('Please select a location on the map');
      return;
    }

    setLoading(true);

    try {
      // Create the issue
      const issueResponse = await axios.post(
        `${API_URL}/api/issues`,
        {
          title,
          description,
          category,
          latitude: position[0],
          longitude: position[1],
          address: address || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const issueId = issueResponse.data.id;

      // Upload photos
      for (const photo of photos) {
        const formData = new FormData();
        formData.append('photo', photo.file);

        await axios.post(`${API_URL}/api/issues/${issueId}/photos`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      toast.success('Issue reported successfully!');
      navigate(`/issue/${issueId}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to report issue');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !category) {
      toast.error('Please select a category');
      return;
    }
    if (step === 2 && !title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (step === 3 && !position) {
      toast.error('Please select a location on the map');
      return;
    }
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-slate-900 mb-2" data-testid="report-title">
          Report an Issue
        </h1>
        <p className="text-slate-500">Help improve your city by reporting problems</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                s <= step
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
              data-testid={`step-indicator-${s}`}
            >
              {s < step ? <CheckCircle className="w-4 h-4" /> : s}
            </div>
            {s < 4 && (
              <div
                className={`w-12 sm:w-20 h-1 mx-2 rounded ${
                  s < step ? 'bg-slate-900' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Category */}
      {step === 1 && (
        <div className="space-y-6" data-testid="step-1-category">
          <h2 className="font-heading text-xl font-semibold text-slate-900">
            What type of issue are you reporting?
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  category === cat.id
                    ? 'border-slate-900 bg-slate-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                data-testid={`category-btn-${cat.id}`}
              >
                <div
                  className={`w-12 h-12 ${cat.color} rounded-lg flex items-center justify-center mx-auto mb-3`}
                >
                  <cat.icon className="w-6 h-6 text-white" />
                </div>
                <p className="font-medium text-slate-900">{cat.name}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Details */}
      {step === 2 && (
        <div className="space-y-6" data-testid="step-2-details">
          <h2 className="font-heading text-xl font-semibold text-slate-900">
            Describe the issue
          </h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Brief description of the issue"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-11"
                required
                data-testid="issue-title-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Details (optional)</Label>
              <Textarea
                id="description"
                placeholder="Provide more details about the issue..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                data-testid="issue-description-input"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Location */}
      {step === 3 && (
        <div className="space-y-6" data-testid="step-3-location">
          <h2 className="font-heading text-xl font-semibold text-slate-900">
            Mark the location
          </h2>
          <p className="text-slate-500 text-sm">Click on the map to set the issue location</p>
          
          <div className="h-[400px] rounded-lg overflow-hidden border border-slate-200 shadow-sm">
            {position && (
              <MapContainer
                center={position}
                zoom={15}
                className="h-full w-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker position={position} setPosition={setPosition} />
              </MapContainer>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address (optional)</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                id="address"
                placeholder="Street address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="pl-10 h-11"
                data-testid="issue-address-input"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Photos */}
      {step === 4 && (
        <div className="space-y-6" data-testid="step-4-photos">
          <h2 className="font-heading text-xl font-semibold text-slate-900">
            Add photos
          </h2>
          <p className="text-slate-500 text-sm">Upload photos to help identify the issue</p>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-slate-400 transition-colors"
            data-testid="photo-upload-area"
          >
            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Click to upload photos</p>
            <p className="text-slate-400 text-sm mt-1">Max 5MB per image</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
              data-testid="photo-input"
            />
          </div>

          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {photos.map((photo, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                  <img
                    src={photo.preview}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    data-testid={`remove-photo-${index}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
        {step > 1 ? (
          <Button
            variant="outline"
            onClick={prevStep}
            className="h-11 px-6"
            data-testid="prev-step-btn"
          >
            Back
          </Button>
        ) : (
          <div />
        )}
        
        {step < 4 ? (
          <Button
            onClick={nextStep}
            className="h-11 px-6 bg-slate-900 hover:bg-slate-800"
            data-testid="next-step-btn"
          >
            Continue
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="h-11 px-8 bg-orange-500 hover:bg-orange-600"
            data-testid="submit-report-btn"
          >
            {loading ? 'Submitting...' : 'Submit Report'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ReportIssuePage;
