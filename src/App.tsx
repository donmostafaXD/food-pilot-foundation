import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AdminPlanOverrideProvider } from "@/contexts/AdminPlanOverrideContext";
import { ActivityProvider } from "@/contexts/ActivityContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/admin/AdminRoute";

// Public pages
import Home from "./pages/Home";
import PricingPublic from "./pages/PricingPublic";
import About from "./pages/About";
import Contact from "./pages/Contact";

// Auth pages
import Login from "./pages/Login";
import Register from "./pages/Register";

// App pages
import Dashboard from "./pages/Dashboard";
import SetupWizard from "./pages/SetupWizard";
import HACCPPlan from "./pages/HACCPPlan";
import Documents from "./pages/Documents";
import SettingsPage from "./pages/Settings";
import Logs from "./pages/Logs";
import PRP from "./pages/PRP";
import SOP from "./pages/SOP";
import EquipmentPage from "./pages/Equipment";
import AuditReady from "./pages/AuditReady";

// Admin pages (completely separate system)
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrganizations from "./pages/admin/AdminOrganizations";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPlans from "./pages/admin/AdminPlans";
import AdminAccess from "./pages/admin/AdminAccess";
import AdminCMS from "./pages/admin/AdminCMS";
import AdminUI from "./pages/admin/AdminUI";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Home />} />
      <Route path="/pricing" element={user ? <Navigate to="/app/pricing" replace /> : <PricingPublic />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />

      {/* Auth */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />

      {/* Protected app routes */}
      <Route path="/dashboard" element={<ProtectedRoute module="dashboard"><Dashboard /></ProtectedRoute>} />
      <Route path="/setup" element={<ProtectedRoute module="activities"><SetupWizard /></ProtectedRoute>} />
      <Route path="/haccp" element={<ProtectedRoute module="haccp_plan"><HACCPPlan /></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute module="documents"><Documents /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute module="settings"><SettingsPage /></ProtectedRoute>} />
      <Route path="/logs" element={<ProtectedRoute module="logs"><Logs /></ProtectedRoute>} />
      <Route path="/prp" element={<ProtectedRoute module="prp"><PRP /></ProtectedRoute>} />
      <Route path="/sop" element={<ProtectedRoute module="sop"><SOP /></ProtectedRoute>} />
      <Route path="/equipment" element={<ProtectedRoute module="equipment"><EquipmentPage /></ProtectedRoute>} />
      <Route path="/audit" element={<ProtectedRoute module="audit"><AuditReady /></ProtectedRoute>} />

      {/* ─── Super Admin Panel (completely separate system) ─── */}
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/organizations" element={<AdminRoute><AdminOrganizations /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
      <Route path="/admin/plans" element={<AdminRoute><AdminPlans /></AdminRoute>} />
      <Route path="/admin/access" element={<AdminRoute><AdminAccess /></AdminRoute>} />
      <Route path="/admin/cms" element={<AdminRoute><AdminCMS /></AdminRoute>} />
      <Route path="/admin/ui" element={<AdminRoute><AdminUI /></AdminRoute>} />

      {/* Redirects for removed routes */}
      <Route path="/app/pricing" element={<ProtectedRoute><Navigate to="/settings" replace /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><Navigate to="/settings" replace /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AdminPlanOverrideProvider>
              <ActivityProvider>
                <AppRoutes />
              </ActivityProvider>
            </AdminPlanOverrideProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
