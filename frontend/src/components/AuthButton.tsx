'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';

interface AuthButtonProps {
  className?: string;
}

export default function AuthButton({ className = '' }: AuthButtonProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert(`Sign in error: ${error.message}`);
      } else {
        setShowAuthModal(false);
        setEmail('');
        setPassword('');
      }
    } catch (error) {
      alert('Sign in failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        alert(`Sign up error: ${error.message}`);
      } else {
        alert('Check your email for the confirmation link!');
        setShowAuthModal(false);
        setEmail('');
        setPassword('');
      }
    } catch (error) {
      alert('Sign up failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert(`Sign out error: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
        <span className="text-xs text-gray-400 font-mono">AUTH_SYNC...</span>
      </div>
    );
  }

  if (user) {
    return (
      <div className={`flex items-center space-x-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-emerald-400 quantum-pulse-strong"></div>
          <span className="text-sm neon-text-cyan font-mono tracking-wider">
            {user.email}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          className="text-xs text-gray-400 hover:text-red-400 font-mono tracking-wider transition-colors"
        >
          SIGN_OUT
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowAuthModal(true)}
        className={`flex items-center space-x-2 text-sm neon-text-purple font-mono tracking-wider hover:text-cyan-400 transition-colors ${className}`}
      >
        <div className="w-3 h-3 rounded-full bg-purple-400 animate-pulse"></div>
        <span>NEURAL_AUTH</span>
      </button>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="quantum-card max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="quantum-orb"></div>
                <h2 className="text-xl font-bold neon-text-gradient tracking-wider">
                  {authMode === 'signin' ? 'NEURAL SIGN IN' : 'NEURAL SIGN UP'}
                </h2>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-gray-400 hover:text-red-400 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={authMode === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
              <div>
                <label className="block text-sm font-mono text-cyan-400 mb-2">EMAIL_ADDRESS</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="quantum-input w-full"
                  placeholder="user@quantum.net"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-mono text-cyan-400 mb-2">NEURAL_KEY</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="quantum-input w-full"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="quantum-button-primary w-full"
              >
                {authLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="quantum-loader">
                      <div className="quantum-particle"></div>
                      <div className="quantum-particle"></div>
                      <div className="quantum-particle"></div>
                    </div>
                    <span>PROCESSING...</span>
                  </div>
                ) : (
                  authMode === 'signin' ? 'AUTHENTICATE' : 'INITIALIZE_USER'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                className="text-sm text-gray-400 hover:text-cyan-400 font-mono transition-colors"
              >
                {authMode === 'signin' 
                  ? 'Need neural access? INITIALIZE_ACCOUNT' 
                  : 'Already have access? AUTHENTICATE'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
