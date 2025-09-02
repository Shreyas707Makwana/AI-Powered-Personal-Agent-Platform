'use client';

import React, { useState, useEffect } from 'react';
import Upload from '@/components/Upload';
import DocumentsList from '@/components/DocumentsList';
import Chat from '@/components/Chat';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import ToolsCard from '@/components/ToolsCard';
import { openWeatherTool, openNewsTool } from '@/lib/toolBus';
import Button from '@/components/Button';

export default function AppPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [showUploadDrawer, setShowUploadDrawer] = useState(false);
  const [showArchiveDrawer, setShowArchiveDrawer] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);
      setLoading(false);
    };

    checkAuth();

    // restore sidebar preference
    try {
      const saved = localStorage.getItem('sidebarCollapsed');
      if (saved) setSidebarCollapsed(saved === '1');
    } catch {}

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login');
      } else if (session) {
        setUser(session.user);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleDocumentSelect = (docId: string | null) => {
    setSelectedDocId(docId);
  };

  const handleDocumentsRefresh = () => {
    // Trigger refresh of documents list
  };

  const handleUploaded = () => {
    handleDocumentsRefresh();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();

    router.push('/');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem('sidebarCollapsed', next ? '1' : '0'); } catch {}
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="quantum-loader">
          <div className="quantum-particle"></div>
          <div className="quantum-particle"></div>
          <div className="quantum-particle"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Enhanced Quantum Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="quantum-grid opacity-20"></div>
        <div className="neural-background"></div>
        <div className="data-flow-lines opacity-10"></div>
      </div>

      {/* Enhanced Header with Mobile Support */}
      <header className="sticky top-0 z-50 border-b border-cyan-500/20 bg-black/80 backdrop-blur-xl shadow-2xl shadow-cyan-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Enhanced Logo */}
            <div className="flex items-center space-x-3">
              <div className="relative group">
                <div className="quantum-logo-ring-1 group-hover:animate-spin"></div>
                <div className="quantum-logo-ring-2 group-hover:animate-spin"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full blur-md opacity-30 group-hover:opacity-60 transition-opacity"></div>
                <svg className="h-10 w-10 lg:h-12 lg:w-12 relative z-10 text-cyan-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl lg:text-2xl font-bold neon-text-gradient tracking-wider" 
                    style={{fontFamily: 'var(--font-futuristic)'}}>
                  QUANTUM NEXUS
                </h1>
                <div className="text-xs text-cyan-400/60 font-mono tracking-widest">NEURAL INTERFACE v2.0</div>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* Desktop User Info */}
            <div className="hidden lg:flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-gray-800/60 px-4 py-2 rounded-lg border border-gray-700/50">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm text-gray-300 truncate max-w-48">{user?.email}</span>
              </div>
              <Button
                variant="muted"
                size="sm"
                onClick={toggleSidebar}
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                className="btn btn-muted flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarCollapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
                </svg>
                <span>{sidebarCollapsed ? 'Expand' : 'Collapse'}</span>
              </Button>
              <a href="/analytics">
                <Button variant="secondary" size="sm" className="btn btn-secondary">Analytics</Button>
              </a>
              <Button
                variant="muted"
                size="sm"
                onClick={handleSignOut}
                className="hover:!bg-red-900/20 hover:!border-red-500/30 hover:!text-red-300"
              >
                Sign Out
              </Button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div className="lg:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-cyan-500/20 shadow-2xl">
              <div className="px-4 py-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-mono text-emerald-400">{user?.email}</span>
                  </div>
                  <Button
                    variant="muted"
                    size="sm"
                    onClick={handleSignOut}
                    className="hover:!bg-red-900/20 hover:!border-red-500/30 hover:!text-red-300"
                  >
                    Sign Out
                  </Button>
                </div>
                <div className="flex space-x-3">
                  <a href="/analytics" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="secondary" size="md" className="w-full">Analytics</Button>
                  </a>
                  <Button
                    variant="secondary"
                    size="md"
                    className="flex-1"
                    onClick={() => { setShowUploadDrawer(true); setIsMobileMenuOpen(false); }}
                  >
                    📤 Upload
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    className="flex-1"
                    onClick={() => { setShowArchiveDrawer(true); setIsMobileMenuOpen(false); }}
                  >
                    🗃️ Archive
                  </Button>
                </div>
                {/* Tools shortcuts for mobile */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => { openWeatherTool(); setIsMobileMenuOpen(false); }}
                  >
                    ☀️ Weather
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => { openNewsTool(); setIsMobileMenuOpen(false); }}
                  >
                    📰 News
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Enhanced Main Content */}
      <main className="relative z-10 min-h-[calc(100vh-5rem)] lg:min-h-[calc(100vh-6rem)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 h-full">
            {/* Enhanced Left Column: Tools + Upload + Archive (Desktop, collapsible) */}
            {!sidebarCollapsed && (
            <div className="hidden lg:flex lg:col-span-5 xl:col-span-4 flex-col space-y-6">
              <div className="transform hover:scale-[1.02] transition-transform duration-300">
                <ToolsCard />
              </div>
              <div className="transform hover:scale-[1.02] transition-transform duration-300">
                <Upload onUploaded={handleUploaded} />
              </div>
              <div className="flex-1 transform hover:scale-[1.02] transition-transform duration-300">
                <DocumentsList 
                  selectedDocId={selectedDocId}
                  onDocumentSelect={handleDocumentSelect}
                  onRefresh={handleDocumentsRefresh}
                />
              </div>
            </div>
            )}

            {/* Enhanced Chat Column (Responsive) */}
            <div className={`${sidebarCollapsed ? 'lg:col-span-12 xl:col-span-12' : 'lg:col-span-7 xl:col-span-8'} flex flex-col min-h-[calc(100vh-8rem)] lg:min-h-[calc(100vh-10rem)]`}>
              <div className="flex-1 transform hover:scale-[1.01] transition-transform duration-300">
                <Chat 
                  selectedDocId={selectedDocId}
                  onDocumentsRefresh={handleDocumentsRefresh}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Enhanced Upload Drawer (Mobile) */}
      {showUploadDrawer && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-fade-in"
            onClick={() => setShowUploadDrawer(false)}
          />
          <div className="absolute inset-y-0 left-0 w-full max-w-sm bg-gradient-to-br from-gray-900/95 to-black/95 border-r border-cyan-500/30 shadow-2xl shadow-cyan-500/20 overflow-y-auto animate-slide-in-left">
            <div className="sticky top-0 bg-black/90 backdrop-blur-xl border-b border-cyan-500/20 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <h3 className="text-lg font-bold text-cyan-400 tracking-wider" style={{fontFamily: 'var(--font-futuristic)'}}>UPLOAD INTERFACE</h3>
              </div>
              <button 
                aria-label="Close Upload drawer" 
                className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all" 
                onClick={() => setShowUploadDrawer(false)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <Upload onUploaded={() => { setShowUploadDrawer(false); handleUploaded(); }} />
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Archive Drawer (Mobile) */}
      {showArchiveDrawer && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-fade-in"
            onClick={() => setShowArchiveDrawer(false)}
          />
          <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-gradient-to-bl from-gray-900/95 to-black/95 border-l border-purple-500/30 shadow-2xl shadow-purple-500/20 overflow-y-auto animate-slide-in-right">
            <div className="sticky top-0 bg-black/90 backdrop-blur-xl border-b border-purple-500/20 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <h3 className="text-lg font-bold text-purple-400 tracking-wider" style={{fontFamily: 'var(--font-futuristic)'}}>NEURAL ARCHIVE</h3>
              </div>
              <button 
                aria-label="Close Archive drawer" 
                className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all" 
                onClick={() => setShowArchiveDrawer(false)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 h-full">
              <DocumentsList
                selectedDocId={selectedDocId}
                onDocumentSelect={(id) => { setShowArchiveDrawer(false); handleDocumentSelect(id); }}
                onRefresh={handleDocumentsRefresh}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
