import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AppDetail from "./pages/AppDetail";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AppForm from "./pages/admin/AppForm";
import NotFound from "./pages/NotFound";
import ContactUs from "./pages/ContactUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import Feedback from "./pages/Feedback";
import PromoteApp from "./pages/PromoteApp";
import PromotionRequests from "./pages/admin/PromotionRequests";
import UploadApp from "./pages/UploadApp";
import MyApps from "./pages/MyApps";
import AppReviews from "./pages/admin/AppReviews";
import ApiSettings from "./pages/admin/ApiSettings";
import AppsPage from "./pages/AppsPage";
import GamesPage from "./pages/GamesPage";
import CategoriesPage from "./pages/CategoriesPage";
import DeveloperRegister from "./pages/DeveloperRegister";
import DeveloperWallet from "./pages/DeveloperWallet";
import SDKDocs from "./pages/SDKDocs";
import AdminWithdrawals from "./pages/admin/AdminWithdrawals";
import ManageBanners from "./pages/admin/ManageBanners";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/apps" element={<AppsPage />} />
            <Route path="/games" element={<GamesPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/app/:id" element={<AppDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/apps/new" element={<ProtectedRoute adminOnly><AppForm /></ProtectedRoute>} />
            <Route path="/admin/apps/:id/edit" element={<ProtectedRoute adminOnly><AppForm /></ProtectedRoute>} />
            <Route path="/admin/reviews" element={<ProtectedRoute adminOnly><AppReviews /></ProtectedRoute>} />
            <Route path="/admin/api-settings" element={<ProtectedRoute adminOnly><ApiSettings /></ProtectedRoute>} />
            <Route path="/admin/promotions" element={<ProtectedRoute adminOnly><PromotionRequests /></ProtectedRoute>} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsConditions />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/promote" element={<PromoteApp />} />
            <Route path="/upload" element={<ProtectedRoute><UploadApp /></ProtectedRoute>} />
            <Route path="/my-apps" element={<ProtectedRoute><MyApps /></ProtectedRoute>} />
            <Route path="/developer" element={<ProtectedRoute><DeveloperRegister /></ProtectedRoute>} />
            <Route path="/wallet" element={<ProtectedRoute><DeveloperWallet /></ProtectedRoute>} />
            <Route path="/sdk-docs" element={<SDKDocs />} />
            <Route path="/admin/withdrawals" element={<ProtectedRoute adminOnly><AdminWithdrawals /></ProtectedRoute>} />
            <Route path="/admin/banners" element={<ProtectedRoute adminOnly><ManageBanners /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
