'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Organized navigation links by category
  const navCategories = [
    {
      label: 'Main',
      links: [
        { href: '/dashboard', label: 'Dashboard', icon: '📊' },
        { href: '/analytics', label: 'Analytics', icon: '📈' },
        { href: '/calendar', label: 'Calendar', icon: '📅' },
      ],
    },
    {
      label: 'Jobs & Services',
      links: [
        { href: '/jobs', label: 'All Jobs', icon: '🔧' },
        { href: '/urgent-jobs', label: 'Urgent Jobs', icon: '🚨' },
        { href: '/diagnostics', label: 'OBD / Diagnostics', icon: '🔌' },
        { href: '/torque-specs', label: 'Torque Specs', icon: '🔩' },
        { href: '/calendar', label: 'Calendar', icon: '📅' },
        { href: '/map', label: 'Job Map', icon: '🗺️' },
        { href: '/job-templates', label: 'Job Templates', icon: '📝' },
        { href: '/photos', label: 'Job Photos', icon: '📸' },
        { href: '/checklist', label: 'Daily Checklist', icon: '✅' },
        { href: '/status', label: 'Job Status', icon: '⚙️' },
        { href: '/services', label: 'Services', icon: '🔧' },
        { href: '/services/menu', label: 'Service Menu', icon: '📋' },
        { href: '/reminders', label: 'Reminders', icon: '🔔' },
      ],
    },
    {
      label: 'People & Vehicles',
      links: [
        { href: '/employees', label: 'Employees', icon: '👥' },
        { href: '/performance', label: 'Performance', icon: '📊' },
        { href: '/payroll', label: 'Payroll / Hours', icon: '⏰' },
        { href: '/customers', label: 'Customers', icon: '👤' },
        { href: '/vehicles', label: 'Vehicles', icon: '🚗' },
      ],
    },
    {
      label: 'Inventory & Orders',
      links: [
        { href: '/parts', label: 'Parts', icon: '🔩' },
        { href: '/part-orders', label: 'Part Orders', icon: '📦' },
        { href: '/tools', label: 'Tools', icon: '🛠️' },
      ],
    },
    {
      label: 'Business',
      links: [
        { href: '/quotes', label: 'Quotes', icon: '💰' },
        { href: '/invoices', label: 'Invoices', icon: '🧾' },
        { href: '/messages', label: 'Messages', icon: '💬' },
        { href: '/reminders-customers', label: 'Customer Reminders', icon: '🔔' },
        { href: '/notes', label: 'Notes', icon: '📝' },
      ],
    },
    {
      label: 'Vehicle Maintenance',
      links: [
        { href: '/maintenance', label: 'Maintenance History', icon: '🔧' },
        { href: '/maintenance-intervals', label: 'Intervals Tracker', icon: '⏱️' },
        { href: '/vin-lookup', label: 'VIN Lookup', icon: '🔍' },
      ],
    },
    {
      label: 'Inspections',
      links: [
        { href: '/inspections', label: 'Inspection Checklist', icon: '📋' },
      ],
    },
  ];

  // Logo Configuration
  const useLogo = false;
  const logoPath = '/logo.png';

  // More aggressive authentication check - show nav if we have session OR if status is authenticated
  // Also show if we're not on login/register pages (assume logged in)
  const isAuthenticated = mounted && (
    status === 'authenticated' || 
    session || 
    (typeof window !== 'undefined' && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register'))
  );

  const handleLogout = async () => {
    try {
      setMobileMenuOpen(false);
      setDropdownOpen(false);
      await signOut({ callbackUrl: '/login' });
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect if signOut fails
      window.location.href = '/login';
    }
  };

  // Don't show navigation on login/register pages
  const isAuthPage = typeof window !== 'undefined' && 
    (window.location.pathname === '/login' || 
     window.location.pathname === '/register' || 
     window.location.pathname === '/forgot-password' || 
     window.location.pathname === '/reset-password');

  // If on auth pages, show minimal nav
  if (isAuthPage && mounted) {
    return (
      <header className="bg-blue-600 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <Link href="/login" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
              <span className="text-xl md:text-2xl font-bold">
                TNT Apex Elite AutoCare
              </span>
            </Link>
            {status === 'authenticated' && (
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-md font-medium hover:bg-red-400 transition-colors text-sm"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-blue-600 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo/Brand */}
          <Link 
            href={isAuthenticated ? '/dashboard' : '/login'} 
            className="flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            {useLogo ? (
              <Image
                src={logoPath}
                alt="Company Logo"
                width={120}
                height={40}
                className="h-8 md:h-10 w-auto object-contain"
                priority
              />
            ) : (
              <span className="text-xl md:text-2xl font-bold">
                TNT Apex Elite AutoCare
              </span>
            )}
          </Link>

          {/* Desktop Navigation - Always show when mounted (assume logged in if not on auth pages) */}
          {mounted && (
            <nav className="hidden lg:flex gap-3 items-center">
              {/* Quick Access Links */}
              <div className="flex gap-2">
                <Link
                  href="/dashboard"
                  className="bg-blue-500 text-white px-3 py-2 rounded-md font-medium hover:bg-blue-400 transition-colors text-sm"
                >
                  Dashboard
                </Link>
                <Link
                  href="/calendar"
                  className="bg-blue-500 text-white px-3 py-2 rounded-md font-medium hover:bg-blue-400 transition-colors text-sm"
                >
                  Calendar
                </Link>
                <Link
                  href="/jobs/new"
                  className="bg-white text-blue-600 px-3 py-2 rounded-md font-medium hover:bg-blue-50 transition-colors text-sm"
                >
                  + New Job
                </Link>
              </div>

              {/* Dropdown Menu */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="bg-blue-500 text-white px-3 py-2 rounded-md font-medium hover:bg-blue-400 transition-colors text-sm flex items-center gap-1"
                >
                  Menu
                  <svg
                    className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 max-h-[80vh] overflow-y-auto">
                    {navCategories.map((category, catIdx) => (
                      <div key={catIdx} className="mb-2 last:mb-0">
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {category.label}
                        </div>
                        {category.links.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          >
                            <span>{link.icon}</span>
                            <span>{link.label}</span>
                          </Link>
                        ))}
                        {catIdx < navCategories.length - 1 && (
                          <div className="border-t border-gray-200 my-2"></div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* User Info & Logout - ALWAYS SHOW */}
              <div className="ml-2 flex items-center gap-2 border-l border-blue-400 pl-3">
                <span className="text-sm text-blue-100">
                  {session?.user?.name || session?.user?.username || 'User'}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-3 py-2 rounded-md font-medium hover:bg-red-400 transition-colors text-sm"
                >
                  Logout
                </button>
              </div>
            </nav>
          )}

          {/* Mobile Menu Button - Always show when mounted */}
          {mounted && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          )}
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && mounted && (
          <nav className="lg:hidden mt-4 pb-2 space-y-2 max-h-[80vh] overflow-y-auto">
            {/* Quick Actions */}
            <div className="space-y-2 mb-4">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block bg-blue-500 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-400 transition-colors"
              >
                📊 Dashboard
              </Link>
              <Link
                href="/calendar"
                onClick={() => setMobileMenuOpen(false)}
                className="block bg-blue-500 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-400 transition-colors"
              >
                📅 Calendar
              </Link>
              <Link
                href="/jobs/new"
                onClick={() => setMobileMenuOpen(false)}
                className="block bg-white text-blue-600 px-4 py-2 rounded-md font-medium hover:bg-blue-50 transition-colors"
              >
                + New Job
              </Link>
            </div>

            {/* Categorized Links */}
            {navCategories.map((category, catIdx) => (
              <div key={catIdx} className="mb-4">
                <div className="px-4 py-2 text-xs font-semibold text-blue-200 uppercase tracking-wider">
                  {category.label}
                </div>
                {category.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block bg-blue-500 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-400 transition-colors mb-1"
                  >
                    {link.icon} {link.label}
                  </Link>
                ))}
              </div>
            ))}

            {/* User Info & Logout - ALWAYS SHOW */}
            <div className="pt-2 border-t border-blue-400">
              <div className="text-sm text-blue-100 px-4 py-2">
                {session?.user?.name || session?.user?.username || 'User'}
              </div>
              <button
                onClick={handleLogout}
                className="block w-full text-left bg-red-500 text-white px-4 py-2 rounded-md font-medium hover:bg-red-400 transition-colors"
              >
                Logout
              </button>
            </div>
          </nav>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {dropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setDropdownOpen(false)}
        />
      )}
    </header>
  );
}


