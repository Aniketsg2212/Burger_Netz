import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ReportIssuePage from "./pages/ReportIssuePage";
import MapViewPage from "./pages/MapViewPage";
import MyReportsPage from "./pages/MyReportsPage";
import IssueDetailsPage from "./pages/IssueDetailsPage";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import "@/App.css";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function AppContent() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/map" element={<MapViewPage />} />
        <Route path="/analytics" element={<AnalyticsDashboard />} />
        <Route path="/issue/:id" element={<IssueDetailsPage />} />
        <Route 
          path="/report" 
          element={
            <ProtectedRoute>
              <ReportIssuePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/my-reports" 
          element={
            <ProtectedRoute>
              <MyReportsPage />
            </ProtectedRoute>
          } 
        />
      </Routes>
      <Toaster position="top-right" />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
