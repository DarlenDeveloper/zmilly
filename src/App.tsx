import { useState, useEffect } from "react";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import "./App.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { AgentProvider } from "./contexts/AgentContext";
import SmallScreenWarning from "./components/SmallScreenWarning";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Subscription from "./pages/Subscription";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import CallHistory from "./pages/CallHistory";
import AIVoiceSettings from "./pages/AIVoiceSettings";
import Analytics from "./pages/Analytics";
import Technical from "./pages/Technical";
import StatusUpdates from "./pages/StatusUpdates";
import ContactSales from "./pages/ContactSales";
import Agents from "./pages/Agents";
import Activity from "./pages/Activity";

// Components
import ProtectedRoute from "@/components/ProtectedRoute";
import { Toaster } from "./components/ui/sonner";

const queryClient = new QueryClient();

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 500);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="loading loading-dots loading-lg"></span>
      </div>
    );
  }

  const routes = [
    {
      path: "/",
      element: <Navigate to="/login" replace />,
    },
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/signup",
      element: <Signup />,
    },
    {
      path: "/forgot-password",
      element: <ForgotPassword />,
    },
    {
      path: "/contact-sales",
      element: <ProtectedRoute><ContactSales /></ProtectedRoute>,
    },
    {
      path: "/dashboard",
      element: <ProtectedRoute><Dashboard /></ProtectedRoute>,
    },
    {
      path: "/products",
      element: <ProtectedRoute><Products /></ProtectedRoute>,
    },
    {
      path: "/subscription",
      element: <ProtectedRoute><Subscription /></ProtectedRoute>,
    },
    {
      path: "/notifications",
      element: <ProtectedRoute><Notifications /></ProtectedRoute>,
    },
    {
      path: "/settings",
      element: <ProtectedRoute><Settings /></ProtectedRoute>,
    },
    {
      path: "/call-history",
      element: <ProtectedRoute><CallHistory /></ProtectedRoute>,
    },
    {
      path: "/ai-voice-settings",
      element: <ProtectedRoute><AIVoiceSettings /></ProtectedRoute>,
    },
    {
      path: "/analytics",
      element: <ProtectedRoute><Analytics /></ProtectedRoute>,
    },
    {
      path: "/technical",
      element: <ProtectedRoute><Technical /></ProtectedRoute>,
    },
    {
      path: "/status-updates",
      element: <ProtectedRoute><StatusUpdates /></ProtectedRoute>,
    },
    {
      path: "/agents",
      element: <ProtectedRoute><Agents /></ProtectedRoute>,
    },
    {
      path: "/activity",
      element: <ProtectedRoute><Activity /></ProtectedRoute>,
    },
    {
      path: "*",
      element: <NotFound />,
    },
  ];

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AgentProvider>
          <RouterProvider router={createBrowserRouter(routes)} />
          <Toaster />
          <SmallScreenWarning />
        </AgentProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
