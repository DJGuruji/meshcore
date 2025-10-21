'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { UserIcon, ArrowRightOnRectangleIcon, KeyIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Listen for sidebar state changes from the main page
  useEffect(() => {
    const handleSidebarToggle = (event: CustomEvent) => {
      setIsSidePanelOpen(event.detail.isOpen);
    };

    window.addEventListener('sidebarToggle', handleSidebarToggle as EventListener);
    
    return () => {
      window.removeEventListener('sidebarToggle', handleSidebarToggle as EventListener);
    };
  }, []);

  const handleSidebarToggle = () => {
    const newState = true;
    setIsSidePanelOpen(newState);
    
    // Dispatch custom event to notify main page
    window.dispatchEvent(new CustomEvent('openSidebar', { 
      detail: { isOpen: newState } 
    }));
  };

  // Only show sidebar toggle on the main page
  const isMainPage = pathname === '/';

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Attempting to change password...');
      const response = await axios.post('/api/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      console.log('Password change response:', response.data);
      toast.success('Password changed successfully');
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Password change error:', error.response?.data || error);
      const errorMessage = error.response?.data?.error || 'Failed to change password';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation items
  const navItems = [
    { name: 'Mock Server', href: '/' },
    { name: 'Dev Tools', href: '/tools' },
    { name: 'API Tester', href: '/api-tester' },
  ];

  return (
    <>
      <header className="bg-gradient-to-r from-gray-900 to-black shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              {/* Mobile sidebar toggle */}
              {isMainPage && isMobile && !isSidePanelOpen && (
                <button
                  onClick={handleSidebarToggle}
                  className="p-2 rounded-md bg-slate-800 text-yellow-400 hover:bg-slate-700 transition-colors duration-200"
                  aria-label="Open sidebar"
                >
                  <Bars3Icon className="h-6 w-6" />
                </button>
              )}
              <div className="flex-shrink-0">
                <Link href="/" className="text-xl font-bold text-white">
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  Dev Tools Hub
                  </span>
                </Link>
              </div>
              
              {/* Desktop Navigation */}
              {status === 'authenticated' && (
                <nav className="hidden md:flex space-x-1 ml-8">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        pathname === item.href 
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md' 
                          : 'text-slate-300 hover:text-yellow-400 hover:bg-slate-800'
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>
              )}
            </div>
            
            {/* Desktop Auth Section */}
            <div className="hidden md:flex items-center space-x-3">
              {status === 'authenticated' ? (
                <div className="relative">
                  <button
                    onClick={toggleDropdown}
                    className="flex items-center space-x-2 bg-gradient-to-r from-slate-800 to-slate-900 py-2 px-4 rounded-lg hover:from-slate-700 hover:to-slate-800 transition-all duration-200 border border-slate-700"
                  >
                    <UserIcon className="h-5 w-5 text-yellow-400" />
                    <span className="text-sm font-medium text-white">{session.user.name}</span>
                  </button>
                  
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl shadow-xl py-2 z-10 border border-slate-700">
                      <div className="px-4 py-3 text-sm text-slate-300 border-b border-slate-700">
                        <p className="font-medium text-yellow-400">Signed in as</p>
                        <p className="truncate">{session.user.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          setIsPasswordModalOpen(true);
                          setIsDropdownOpen(false);
                        }}
                        className="flex w-full items-center px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-yellow-400 transition-colors duration-200"
                      >
                        <KeyIcon className="h-5 w-5 mr-3 text-yellow-400" />
                        Change Password
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center px-4 py-3 text-sm text-red-400 font-medium hover:bg-slate-700 hover:text-red-300 transition-colors duration-200"
                      >
                        <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex space-x-3">
                  <Link
                    href="/auth/signin"
                    className="text-slate-300 hover:text-yellow-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:bg-slate-800"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-800 transition-all duration-200 shadow-md"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 rounded-md bg-slate-800 text-slate-300 hover:text-yellow-400 hover:bg-slate-700 transition-colors duration-200"
                aria-label="Open menu"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <Dialog
        open={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        className="fixed inset-0 z-50 md:hidden"
      >
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
        
        <div className="relative bg-gradient-to-b from-gray-900 to-black min-h-full w-full max-w-xs ml-auto shadow-xl border-l border-gray-700">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <Link 
                href="/" 
                className="text-xl font-bold text-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  Dev Tools Hub
                </span>
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-md text-slate-400 hover:text-yellow-400 hover:bg-slate-800 transition-colors duration-200"
                aria-label="Close menu"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4">
              {status === 'authenticated' ? (
                <>
                  <nav className="px-2 space-y-1">
                    {navItems.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors duration-200 ${
                          pathname === item.href
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md'
                            : 'text-slate-300 hover:text-yellow-400 hover:bg-slate-800'
                        }`}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </nav>
                  
                  <div className="pt-8 px-4 border-t border-gray-700 mt-4">
                    <div className="flex items-center px-2 py-3">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-gray-900" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-white">{session.user.name}</p>
                        <p className="text-xs font-medium text-slate-400 truncate">{session.user.email}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <button
                        onClick={() => {
                          setIsPasswordModalOpen(true);
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center px-4 py-3 text-base font-medium text-slate-300 rounded-lg hover:bg-slate-800 hover:text-yellow-400 transition-colors duration-200"
                      >
                        <KeyIcon className="h-5 w-5 mr-3 text-yellow-400" />
                        Change Password
                      </button>
                      <button
                        onClick={() => {
                          handleSignOut();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center px-4 py-3 text-base font-medium text-red-400 rounded-lg hover:bg-slate-800 hover:text-red-300 transition-colors duration-200"
                      >
                        <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="px-4 py-6 space-y-4">
                  <Link
                    href="/auth/signin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full text-center px-4 py-3 bg-slate-800 text-slate-300 rounded-lg font-medium hover:text-yellow-400 hover:bg-slate-700 transition-colors duration-200"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full text-center px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-800 transition-all duration-200 shadow-md"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </Dialog>

      {/* Password Change Modal */}
      <Dialog
        open={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        className="fixed z-50 inset-0 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />

          <div className="relative bg-gradient-to-b from-gray-900 to-black rounded-2xl w-full max-w-md mx-4 p-6 shadow-2xl border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Change Password
              </h3>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-2 rounded-md text-slate-400 hover:text-yellow-400 hover:bg-slate-800 transition-colors duration-200"
                aria-label="Close"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors duration-200 border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Dialog>
    </>
  );
}