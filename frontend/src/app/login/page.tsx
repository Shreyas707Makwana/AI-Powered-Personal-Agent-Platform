'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/app');
      }
    };
    checkAuth();
  }, [router]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setMessage(`Sign up error: ${error.message}`);
      } else {
        setMessage('Check your email for the confirmation link!');
      }
    } catch (error) {
      setMessage('Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(`Sign in error: ${error.message}`);
      } else {
        router.push('/app');
      }
    } catch (error) {
      setMessage('Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center">
      {/* Quantum Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="quantum-grid"></div>
      </div>

      {/* Login Card */}
      <div className="quantum-card max-w-md w-full mx-4 p-8 relative z-10">
        <div className="text-center mb-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="quantum-logo-ring-1"></div>
              <div className="quantum-logo-ring-2"></div>
              <svg className="h-16 w-16 relative z-10" style={{color: 'var(--neon-blue)'}} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl font-bold neon-text-gradient tracking-wider mb-4" 
              style={{fontFamily: 'var(--font-futuristic)'}}>
            QUANTUM NEXUS
          </h1>
          
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            Advanced AI-powered document intelligence platform with neural RAG capabilities. 
            Upload PDFs, engage with quantum-enhanced chat, and unlock the power of semantic search 
            through our Llama-3.1-8B neural core.
          </p>

          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="quantum-orb"></div>
            <h2 className="text-xl font-bold neon-text-cyan tracking-wider">
              {isSignUp ? 'INITIALIZE NEURAL ACCESS' : 'NEURAL AUTHENTICATION'}
            </h2>
          </div>
        </div>

        <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-6">
          <div>
            <label className="block text-sm font-mono text-cyan-400 mb-2">EMAIL_ADDRESS</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="quantum-input w-full"
              placeholder="user@quantum.net"
              required
              suppressHydrationWarning
            />
          </div>
          
          <div>
            <label className="block text-sm font-mono text-cyan-400 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="quantum-input w-full"
              placeholder="••••••••"
              required
              suppressHydrationWarning
            />
          </div>

          {message && (
            <div className={`text-sm font-mono text-center p-3 rounded ${
              message.includes('error') || message.includes('failed') 
                ? 'text-red-400 bg-red-900/20' 
                : 'text-emerald-400 bg-emerald-900/20'
            }`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary text-lg px-6 py-3 rounded-xl w-full font-heading"
            suppressHydrationWarning
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="quantum-loader">
                  <div className="quantum-particle"></div>
                  <div className="quantum-particle"></div>
                  <div className="quantum-particle"></div>
                </div>
                <span>PROCESSING...</span>
              </div>
            ) : (
              'Get Started'
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMessage('');
            }}
            className="text-sm bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 hover:text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25"
            suppressHydrationWarning
          >
            {isSignUp 
              ? 'Already have an account? Sign In' 
              : 'New User? Sign Up'
            }
          </button>
        </div>

        {/* System Status */}
        <div className="mt-8 pt-6 border-t border-gray-800">
          <div className="flex items-center justify-center space-x-4 text-xs font-mono text-gray-500">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span>LLAMA-3.1-8B CORE</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              <span>RAG PROTOCOL</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <span>VECTOR DB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
