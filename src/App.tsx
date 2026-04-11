import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Layout
import Layout from "@/components/layout/Layout";

// Auth Pages
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";

// Main Pages
import DashboardPage from "@/pages/DashboardPage";
import MedicinesPage from "@/pages/MedicinesPage";
import RemindersPage from "@/pages/RemindersPage";
import PrescriptionsPage from "@/pages/PrescriptionsPage";
import InventoryPage from "@/pages/InventoryPage";
import HistoryPage from "@/pages/HistoryPage";
import ReportsPage from "@/pages/ReportsPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";
// import UploadPrescriptionPage from "@/pages/UploadPrescriptionPage";
import OCRUpload from "@/components/OCRUpload";

import { ROUTES } from "@/lib/constants";
import { useEffect } from "react";
import { requestForToken } from "@/firebase"
import axios from "axios";

const queryClient = new QueryClient();


function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  // useEffect(() => {
  //   if ("serviceWorker" in navigator) {
  //     // navigator.serviceWorker
  //     //   .register("/sw.js")
  //       .then((registration) => {
  //         console.log("Service Worker registered:", registration);
  //       })
  //       .catch((error) => {
  //         console.error("Service Worker registration failed:", error);
  //       });
  //   }
  // }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
      <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />

      {/* Protected Routes */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
        <Route path={ROUTES.MEDICINES} element={<MedicinesPage />} />
        <Route path={ROUTES.REMINDERS} element={<RemindersPage />} />
        <Route path={ROUTES.PRESCRIPTIONS} element={<PrescriptionsPage />} />
        <Route path={ROUTES.INVENTORY} element={<InventoryPage />} />
        <Route path={ROUTES.HISTORY} element={<HistoryPage />} />
        <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
        <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => {

  useEffect(() => {
    const setupFCM = async () => {
      const token = await requestForToken();
      if (token) {
        console.log("FCM TOKEN:", token);

        // 🔥 SEND TO BACKEND
        await axios.post(
          "https://medimate-k4yl.onrender.com/api/v1/users/save-token",
          {
            token: token
          }
        );
      }
    };

    setupFCM();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </TooltipProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
