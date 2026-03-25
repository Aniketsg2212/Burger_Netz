import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { MapPin, AlertTriangle, Lightbulb, Trash2, ChevronRight, Users, CheckCircle, Clock } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const categories = [
  {
    id: 'pothole',
    name: 'Potholes',
    description: 'Report road damage and potholes',
    icon: AlertTriangle,
    color: 'bg-amber-500',
    image: 'https://images.unsplash.com/photo-1675430427954-2a1c9c8e4a06?w=400&h=300&fit=crop'
  },
  {
    id: 'streetlight',
    name: 'Street Lights',
    description: 'Report broken or malfunctioning lights',
    icon: Lightbulb,
    color: 'bg-yellow-400',
    image: 'https://images.unsplash.com/photo-1629890113575-0a0c33b43e76?w=400&h=300&fit=crop'
  },
  {
    id: 'garbage',
    name: 'Garbage',
    description: 'Report waste collection issues',
    icon: Trash2,
    color: 'bg-green-500',
    image: 'https://images.unsplash.com/photo-1762187547870-83fbeef1afcf?w=400&h=300&fit=crop'
  }
];

const LandingPage = () => {
  const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/analytics`);
        setStats({
          total: response.data.total_issues,
          resolved: response.data.by_status.resolved || 0,
          pending: response.data.by_status.pending || 0
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1717224157584-af2f29f523b1?w=1920&h=800&fit=crop')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/60 to-slate-900/80" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-orange-400 uppercase tracking-wider mb-4" data-testid="hero-tagline">
              Connecting Citizens, Shaping the City
            </p>
            <h1 className="font-heading text-4xl md:text-6xl font-bold text-white tracking-tight leading-tight mb-6" data-testid="hero-title">
              Report City Issues,<br />
              <span className="text-orange-400">Make a Difference</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300 leading-relaxed mb-8 max-w-2xl" data-testid="hero-description">
              BurgerNetz empowers citizens to report potholes, broken streetlights, garbage issues, 
              and more. Track your reports and watch your city improve.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/report">
                <Button 
                  size="lg" 
                  className="bg-orange-500 hover:bg-orange-600 text-white h-12 px-8 text-base gap-2"
                  data-testid="hero-report-btn"
                >
                  <MapPin className="w-5 h-5" />
                  Report an Issue
                </Button>
              </Link>
              <Link to="/map">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-white text-white hover:bg-white hover:text-slate-900 h-12 px-8 text-base gap-2"
                  data-testid="hero-map-btn"
                >
                  View City Map
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4" data-testid="stat-total">
              <div className="w-14 h-14 bg-slate-100 rounded-lg flex items-center justify-center">
                <Users className="w-7 h-7 text-slate-700" />
              </div>
              <div>
                <p className="text-3xl font-heading font-bold text-slate-900">{stats.total}</p>
                <p className="text-slate-500 text-sm">Total Reports</p>
              </div>
            </div>
            <div className="flex items-center gap-4" data-testid="stat-resolved">
              <div className="w-14 h-14 bg-emerald-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <p className="text-3xl font-heading font-bold text-slate-900">{stats.resolved}</p>
                <p className="text-slate-500 text-sm">Issues Resolved</p>
              </div>
            </div>
            <div className="flex items-center gap-4" data-testid="stat-pending">
              <div className="w-14 h-14 bg-orange-50 rounded-lg flex items-center justify-center">
                <Clock className="w-7 h-7 text-orange-600" />
              </div>
              <div>
                <p className="text-3xl font-heading font-bold text-slate-900">{stats.pending}</p>
                <p className="text-slate-500 text-sm">Pending Review</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-semibold text-slate-900 mb-4" data-testid="categories-title">
              What Can You Report?
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Select a category to report an issue in your neighborhood
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Link 
                key={category.id} 
                to={`/report?category=${category.id}`}
                data-testid={`category-${category.id}`}
              >
                <div className="group bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 overflow-hidden">
                  <div className="aspect-video relative overflow-hidden">
                    <img 
                      src={category.image} 
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className={`absolute top-4 left-4 w-10 h-10 ${category.color} rounded-lg flex items-center justify-center`}>
                      <category.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-heading font-semibold text-lg text-slate-900 mb-1">
                      {category.name}
                    </h3>
                    <p className="text-slate-500 text-sm">
                      {category.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-semibold text-slate-900 mb-4" data-testid="how-it-works-title">
              How It Works
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Three simple steps to report and track city issues
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Report', desc: 'Take a photo and mark the location on the map' },
              { step: '02', title: 'Track', desc: 'Monitor the status of your report in real-time' },
              { step: '03', title: 'Resolved', desc: 'Get notified when the issue is fixed' }
            ].map((item, index) => (
              <div key={index} className="text-center" data-testid={`step-${index + 1}`}>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 text-white rounded-full font-heading font-bold text-xl mb-4">
                  {item.step}
                </div>
                <h3 className="font-heading font-semibold text-xl text-slate-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-slate-500">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold text-white mb-4" data-testid="cta-title">
            Ready to Improve Your City?
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
            Join thousands of citizens making their neighborhoods better, one report at a time.
          </p>
          <Link to="/register">
            <Button 
              size="lg" 
              className="bg-orange-500 hover:bg-orange-600 text-white h-12 px-8 text-base"
              data-testid="cta-btn"
            >
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="font-heading font-bold">BurgerNetz</span>
            </div>
            <p className="text-slate-500 text-sm">
              © 2024 BurgerNetz. Connecting citizens, shaping the city.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
