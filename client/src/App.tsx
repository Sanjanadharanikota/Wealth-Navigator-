import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import WelcomePage from './pages/WelcomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MainLayout from './components/layout/MainLayout';
import HomePage from './pages/HomePage';
import TransactionsPage from './pages/TransactionsPage';
import DashboardPage from './pages/DashboardPage';
import AssistantPage from './pages/AssistantPage';
import ProfilePage from './pages/ProfilePage';
import InsightsPage from './pages/InsightsPage';
import ChatPage from './pages/ChatPage';
import GoalsPage from './pages/GoalsPage';
import ScanPage from './pages/ScanPage';

// New onboarding pages we'll create next
import SetPinPage from './pages/onboarding/SetPinPage';
import ConnectBankPage from './pages/onboarding/ConnectBankPage';
import OnboardingLayout from './components/onboarding/OnboardingLayout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, onboardingStatus } = useAuthStore();
  const location = useLocation();

  // Redirect to welcome if not authenticated
  if (!isAuthenticated) {
    // Don't redirect if we're on a public route
    const publicRoutes = ['/welcome', '/login', '/register'];
    if (!publicRoutes.some(route => location.pathname.startsWith(route))) {
      return <Navigate to="/welcome" replace />;
    }
    return <>{children}</>;
  }

  // Check if we need to complete onboarding
  if (!onboardingStatus.complete) {
    // If already on an onboarding route, stay there
    if (location.pathname.startsWith('/onboarding')) {
      return <>{children}</>;
    }
    // Otherwise redirect to the appropriate onboarding step
    return <Navigate to={`/onboarding/${onboardingStatus.nextStep}`} replace />;
  }

  // If we get here, user is fully authenticated and onboarded
  // Redirect to home if trying to access auth routes
  const authRoutes = ['/welcome', '/login', '/register', '/onboarding'];
  if (authRoutes.some(route => location.pathname.startsWith(route))) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Onboarding routes */}
        <Route path="/onboarding" element={
          <ProtectedRoute>
            <OnboardingLayout />
          </ProtectedRoute>
        }>
          <Route path="set-pin" element={<SetPinPage />} />
          <Route path="bank-connection" element={<ConnectBankPage />} />
          <Route index element={<Navigate to="set-pin" replace />} />
        </Route>
        
        {/* Main app routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="insights" element={<InsightsPage />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="assistant" element={<AssistantPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="/scan" element={<ScanPage />} />
          
          {/* Redirect any other route to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
        
        {/* Catch-all redirect to welcome */}
        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;