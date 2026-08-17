import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { SystemStatus } from './SystemStatus';

const PIN_STORAGE_KEY = 'sidebar_pinned';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuth();

  // Initialize pin state from localStorage (default: true)
  const [isPinned, setIsPinned] = useState<boolean>(() => {
    const saved = localStorage.getItem(PIN_STORAGE_KEY);
    return saved !== null ? saved === 'true' : true;
  });

  // Controls open state when unpinned or on mobile
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Sync isPinned state change
  const handleTogglePin = () => {
    setIsPinned((prev) => {
      const next = !prev;
      localStorage.setItem(PIN_STORAGE_KEY, String(next));
      return next;
    });
  };

  // Close sidebar on Escape key when unpinned
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPinned && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPinned, isOpen]);

  // Public/Unauthenticated layout (Login, Register, Forgot Password)
  if (!isAuthenticated) {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Sidebar Component */}
      <Sidebar
        isPinned={isPinned}
        isOpen={isOpen}
        onTogglePin={handleTogglePin}
        onClose={() => setIsOpen(false)}
      />

      {/* Main Content Area - adjusts margin based on pinned state */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isPinned ? 'md:ml-64' : 'ml-0'
        }`}
      >
        {/* Top Bar Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            {/* Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              className={`p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                isPinned ? 'md:hidden' : 'block'
              }`}
              aria-label="Toggle navigation menu"
              title="Toggle navigation menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center space-x-2">
              <span className="text-lg md:text-xl font-bold text-gray-800 tracking-tight">
                Shop Inventory & Cashflow
              </span>
              <SystemStatus />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-sm font-semibold text-gray-800">{user.name}</span>
                  <span className="text-xs text-gray-500">{user.email}</span>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md font-medium transition-colors border border-gray-300"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Main Page Viewport */}
        <main className="flex-1 w-full">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
