'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import TestimonialsCarousel from '@/components/TestimonialsCarousel';
import Button from '@/components/Button';

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsAuthed(true);
        router.push('/app');
      } else {
        setIsAuthed(false);
      }
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAuthed(true);
        router.push('/app');
      } else {
        setIsAuthed(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

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

  // Public landing when not authenticated
  if (isAuthed === false) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-[#0b0f1a] to-black text-white">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <div className="absolute -top-24 -left-24 w-[40rem] h-[40rem] bg-cyan-500/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -right-24 w-[40rem] h-[40rem] bg-purple-500/10 rounded-full blur-3xl"></div>
          </div>
          <div className="container mx-auto px-6 pt-24 pb-16">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold font-heading tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent animate-fade-in">
                AI-Powered Document Intelligence
              </h1>
              <p className="mt-6 text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed animate-slide-up">
                Transform how you work with documents. Get instant, cited answers from your PDFs with advanced RAG technology and optional agent tools.
              </p>
              <div className="mt-10 animate-slide-up" style={{animationDelay: '0.2s'}}>
                <div className="flex justify-center">
                  <a href="/login">
                    <Button variant="primary" size="lg" className="btn btn-primary text-lg px-6 py-3 rounded-xl font-heading">
                      Get Started
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Metrics strip */}
        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-sm border border-gray-700/50 p-6 rounded-2xl text-center hover:scale-105 transition-transform duration-200 animate-slide-up" style={{animationDelay: '0.1s'}}>
                <div className="text-4xl font-bold text-blue-400">2.3k</div>
                <div className="mt-2 text-sm text-gray-300 font-medium">Active Users</div>
              </div>
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-sm border border-gray-700/50 p-6 rounded-2xl text-center hover:scale-105 transition-transform duration-200 animate-slide-up" style={{animationDelay: '0.2s'}}>
                <div className="text-4xl font-bold text-purple-400">18k</div>
                <div className="mt-2 text-sm text-gray-300 font-medium">Monthly Messages</div>
              </div>
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-sm border border-gray-700/50 p-6 rounded-2xl text-center hover:scale-105 transition-transform duration-200 animate-slide-up" style={{animationDelay: '0.3s'}}>
                <div className="text-4xl font-bold text-green-400">97%</div>
                <div className="mt-2 text-sm text-gray-300 font-medium">Cited Responses</div>
              </div>
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-sm border border-gray-700/50 p-6 rounded-2xl text-center hover:scale-105 transition-transform duration-200 animate-slide-up" style={{animationDelay: '0.4s'}}>
                <div className="text-4xl font-bold text-orange-400">12</div>
                <div className="mt-2 text-sm text-gray-300 font-medium">Agent Tools</div>
              </div>
            </div>
          </div>
        </section>

        {/* Trusted By */}
        <section className="py-16">
          <div className="container mx-auto px-6 text-center">
            <p className="text-sm font-medium text-gray-400 mb-8 animate-fade-in">Trusted by forward-thinking teams</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-60">
              <div className="flex items-center justify-center py-6 text-lg font-semibold text-gray-500 hover:text-gray-300 transition-colors animate-slide-up" style={{animationDelay: '0.1s'}}>TechFlow</div>
              <div className="flex items-center justify-center py-6 text-lg font-semibold text-gray-500 hover:text-gray-300 transition-colors animate-slide-up" style={{animationDelay: '0.2s'}}>InnovateLabs</div>
              <div className="flex items-center justify-center py-6 text-lg font-semibold text-gray-500 hover:text-gray-300 transition-colors animate-slide-up" style={{animationDelay: '0.3s'}}>Quantum Research</div>
              <div className="flex items-center justify-center py-6 text-lg font-semibold text-gray-500 hover:text-gray-300 transition-colors animate-slide-up" style={{animationDelay: '0.4s'}}>DataCorp</div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold font-heading text-white mb-4 animate-fade-in">Powerful Features</h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto animate-slide-up">Everything you need for intelligent document processing and analysis</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-sm border border-gray-700/50 p-10 rounded-2xl hover:scale-105 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 animate-slide-up group" style={{animationDelay: '0.1s'}}>
                <div className="w-16 h-16 bg-blue-500/10 rounded-xl flex items-center justify-center mb-8 group-hover:bg-blue-500/20 transition-colors">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold font-heading text-white mb-6">RAG-Powered Intelligence</h3>
                <p className="text-gray-300 leading-relaxed text-lg mb-4">Advanced semantic retrieval with precise citations keeps all responses grounded in your documents. Our neural RAG system understands context and provides accurate, verifiable answers.</p>
                <p className="text-gray-400 text-sm">Powered by state-of-the-art embeddings and vector search technology for maximum accuracy and relevance.</p>
              </div>
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-sm border border-gray-700/50 p-10 rounded-2xl hover:scale-105 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 animate-slide-up group" style={{animationDelay: '0.2s'}}>
                <div className="w-16 h-16 bg-purple-500/10 rounded-xl flex items-center justify-center mb-8 group-hover:bg-purple-500/20 transition-colors">
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold font-heading text-white mb-6">Intelligent Agent Tools</h3>
                <p className="text-gray-300 leading-relaxed text-lg mb-4">Enable contextual tools like Weather and News with fine-grained per-agent controls. Each agent can be customized with specific capabilities tailored to your workflow needs.</p>
                <p className="text-gray-400 text-sm">Extensible architecture supports custom tool integration and advanced automation workflows.</p>
              </div>
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-sm border border-gray-700/50 p-10 rounded-2xl hover:scale-105 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 animate-slide-up group" style={{animationDelay: '0.3s'}}>
                <div className="w-16 h-16 bg-green-500/10 rounded-xl flex items-center justify-center mb-8 group-hover:bg-green-500/20 transition-colors">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold font-heading text-white mb-6">Enterprise Security</h3>
                <p className="text-gray-300 leading-relaxed text-lg mb-4">Enterprise-grade security with Supabase Auth and Row Level Security policies. Your data remains private and secure with industry-standard encryption and access controls.</p>
                <p className="text-gray-400 text-sm">Built with privacy-first architecture, GDPR compliance, and comprehensive audit logging capabilities.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold font-heading text-white mb-4 animate-fade-in">What Our Users Say</h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto animate-slide-up">See how teams are transforming their document workflows</p>
            </div>
            <div className="animate-slide-up" style={{animationDelay: '0.2s'}}>
              <TestimonialsCarousel />
            </div>
          </div>
        </section>

        <footer className="py-16 border-t border-gray-800/50">
          <div className="container mx-auto px-6 text-center">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} AI-Powered Personal Agent Platform. Built with precision.
            </p>
          </div>
        </footer>
      </div>
    );
  }

  return null;
}