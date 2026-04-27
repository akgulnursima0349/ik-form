import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthGuard } from './components/AuthGuard';
import { OnboardingPage } from './pages/onboarding/OnboardingPage';
import { SuccessPage } from './pages/onboarding/SuccessPage';
import { LoginPage } from './pages/admin/LoginPage';
import { DashboardPage } from './pages/admin/DashboardPage';
import { SubmissionDetailPage } from './pages/admin/SubmissionDetailPage';
import { InvitePage } from './pages/admin/InvitePage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter basename="/ik-form/">
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Navigate to="/admin/login" replace />} />
        <Route path="/onboarding/success" element={<SuccessPage />} />
        <Route path="/onboarding/:token" element={<OnboardingPage />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route
          path="/admin"
          element={
            <AuthGuard>
              <DashboardPage />
            </AuthGuard>
          }
        />
        <Route
          path="/admin/submissions/:id"
          element={
            <AuthGuard>
              <SubmissionDetailPage />
            </AuthGuard>
          }
        />
        <Route
          path="/admin/invite"
          element={
            <AuthGuard>
              <InvitePage />
            </AuthGuard>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
