import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, CreditCard, BarChart3, Lightbulb, Sparkles, Camera } from 'lucide-react';

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/transactions', icon: CreditCard, label: 'Transactions' },
    { path: '/dashboard', icon: BarChart3, label: 'Dashboard' },
    { path: '/insights', icon: Lightbulb, label: 'Insights' },
    { path: '/chat', icon: Sparkles, label: 'AI Chat' },
    { path: '/scan', icon: Camera, label: 'Scan' },
];


  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 pb-20">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-800 border-t border-gray-200 dark:border-dark-700 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-around h-16">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`bottom-nav-item ${active ? 'active' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  <Icon className={`w-6 h-6 mb-1 ${active ? 'stroke-[2.5]' : ''}`} />
                  <span className={`text-xs ${active ? 'font-semibold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}