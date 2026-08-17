import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLowStock } from '../hooks/useLowStock';
import { useAuth } from '../context/AuthContext';

export interface SidebarProps {
  isPinned: boolean;
  isOpen: boolean;
  onTogglePin: () => void;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isPinned,
  isOpen,
  onTogglePin,
  onClose,
}) => {
  const location = useLocation();
  const { lowStock: lowStockData } = useLowStock();
  const { user } = useAuth();

  const navItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 00-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      badge: lowStockData?.count > 0 ? lowStockData.count : null,
    },
    {
      path: '/pos',
      label: 'POS & Scan',
      icon: (
        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      path: '/products',
      label: 'Products',
      icon: (
        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      path: '/stock',
      label: 'Stock',
      icon: (
        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      path: '/cashflow',
      label: 'Cashflow',
      icon: (
        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      path: '/accounts',
      label: 'Accounts',
      icon: (
        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      path: '/sales',
      label: 'Sales History',
      icon: (
        <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    ...(user?.role === 'ADMIN'
      ? [
          {
            path: '/register',
            label: 'Register User',
            icon: (
              <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            ),
          },
        ]
      : []),
  ];

  const handleNavClick = () => {
    if (!isPinned) {
      onClose();
    }
  };

  const transformClass = isPinned
    ? (isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0')
    : (isOpen ? 'translate-x-0' : '-translate-x-full');

  return (
    <>
      {/* Backdrop overlay when unpinned & open or mobile & open */}
      {isOpen && (
        <div
          className={`fixed inset-0 bg-black/50 z-30 transition-opacity ${
            isPinned ? 'md:hidden' : 'block'
          }`}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gray-800 text-white z-40 p-4 flex flex-col transition-transform duration-300 ease-in-out shadow-lg ${transformClass}`}
        aria-label="Sidebar Navigation"
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-700">
          <h2 className="text-xl font-bold tracking-wide">Navigation</h2>
          <div className="flex items-center space-x-1">
            {/* Pin Toggle Button */}
            <button
              type="button"
              onClick={onTogglePin}
              className={`p-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                isPinned
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
              }`}
              title={isPinned ? 'Unpin sidebar (Auto-hide)' : 'Pin sidebar (Keep visible)'}
              aria-label={isPinned ? 'Unpin sidebar (Auto-hide)' : 'Pin sidebar (Keep visible)'}
            >
              <span className={`text-base inline-block transform ${isPinned ? 'rotate-0' : '-rotate-45 opacity-70'}`}>
                📌
              </span>
            </button>

            {/* Close Button (visible when open on mobile or when unpinned) */}
            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                isPinned ? 'md:hidden' : 'block'
              }`}
              aria-label="Close sidebar"
              title="Close sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto">
          <ul className="space-y-1.5">
            {navItems.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path + '/'));
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={handleNavClick}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white font-medium shadow'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== null && item.badge !== undefined && (
                      <span className="bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer info in sidebar */}
        <div className="pt-4 border-t border-gray-700 text-xs text-gray-400 flex items-center justify-between">
          <span>Mode: {isPinned ? 'Pinned' : 'Auto-hide'}</span>
          <span className="text-[10px] text-gray-500">v1.0</span>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;