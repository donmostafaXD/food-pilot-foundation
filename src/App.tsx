import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AdminPlanOverrideProvider, useAdminPlanOverride } from "@/contexts/AdminPlanOverrideContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import PlanGate from "@/components/PlanGate";

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

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user, loading } = useAuth();
  const { overrideRole } = useAdminPlanOverride();
  const isStaffPreview = overrideRole === "Staff";

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
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/setup" element={<ProtectedRoute><SetupWizard /></ProtectedRoute>} />
      <Route path="/haccp" element={<ProtectedRoute><HACCPPlan /></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute><PlanGate feature="canAccessDocuments"><Documents /></PlanGate></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute>{isStaffPreview ? <Navigate to="/dashboard" replace /> : <SettingsPage />}</ProtectedRoute>} />
      <Route path="/logs" element={<ProtectedRoute><Logs /></ProtectedRoute>} />
      <Route path="/prp" element={<ProtectedRoute>{isStaffPreview ? <Navigate to="/dashboard" replace /> : <PlanGate feature="canAccessPRP"><PRP /></PlanGate>}</ProtectedRoute>} />
      <Route path="/sop" element={<ProtectedRoute>{isStaffPreview ? <Navigate to="/dashboard" replace /> : <PlanGate feature="canAccessSOP"><SOP /></PlanGate>}</ProtectedRoute>} />
      <Route path="/equipment" element={<ProtectedRoute>{isStaffPreview ? <Navigate to="/dashboard" replace /> : <PlanGate feature="canAccessEquipment"><EquipmentPage /></PlanGate>}</ProtectedRoute>} />
      <Route path="/audit" element={<ProtectedRoute>{isStaffPreview ? <Navigate to="/dashboard" replace /> : <AuditReady />}</ProtectedRoute>} />

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
              <AppRoutes />
            </AdminPlanOverrideProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
