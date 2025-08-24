'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  content: string;
  metric: string;
  avatar: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Sarah Chen",
    role: "Research Director",
    company: "TechFlow Analytics",
    content: "This AI agent transformed how we handle research documentation. The citation accuracy is incredible, and the RAG capabilities saved us countless hours of manual document analysis.",
    metric: "Saved 15 hours/week",
    avatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23374151'/%3E%3Ctext x='20' y='26' text-anchor='middle' fill='%23f9fafb' font-family='Inter' font-size='16' font-weight='600'%3ESC%3C/text%3E%3C/svg%3E"
  },
  {
    id: 2,
    name: "Marcus Rodriguez",
    role: "Product Manager",
    company: "InnovateLabs",
    content: "The document intelligence capabilities are outstanding. Our team can now query complex technical specifications instantly and get accurate, contextual responses with proper citations.",
    metric: "95% accuracy rate",
    avatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%234b5563'/%3E%3Ctext x='20' y='26' text-anchor='middle' fill='%23f9fafb' font-family='Inter' font-size='16' font-weight='600'%3EMR%3C/text%3E%3C/svg%3E"
  },
  {
    id: 3,
    name: "Dr. Emily Watson",
    role: "Lead Data Scientist",
    company: "Quantum Research Institute",
    content: "The integration of weather and news tools alongside document analysis creates a comprehensive research environment. It's like having a personal research assistant that never sleeps.",
    metric: "3x faster insights",
    avatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%236b7280'/%3E%3Ctext x='20' y='26' text-anchor='middle' fill='%23f9fafb' font-family='Inter' font-size='16' font-weight='600'%3EEW%3C/text%3E%3C/svg%3E"
  }
];

export default function TestimonialsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const stopAutoplay = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    const startAutoplay = () => {
      if (prefersReducedMotion) return;
      
      intervalRef.current = setInterval(() => {
        if (!isPaused) {
          setCurrentIndex((prev) => (prev + 1) % testimonials.length);
        }
      }, 7000);
    };

    if (isPlaying && !prefersReducedMotion) {
      startAutoplay();
    } else {
      stopAutoplay();
    }

    return () => stopAutoplay();
  }, [isPlaying, isPaused, prefersReducedMotion]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        goToPrevious();
        break;
      case 'ArrowRight':
        event.preventDefault();
        goToNext();
        break;
      case ' ':
        event.preventDefault();
        setIsPlaying(!isPlaying);
        break;
    }
  };

  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  const handleFocus = () => {
    setIsPaused(true);
  };

  const handleBlur = () => {
    setIsPaused(false);
  };

  return (
    <div className="relative max-w-4xl mx-auto">
      <div
        ref={carouselRef}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="region"
        aria-label="Customer testimonials carousel"
        aria-live="polite"
      >
        <div 
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="w-full flex-shrink-0 p-8 md:p-12"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="flex-shrink-0">
                  <img
                    src={testimonial.avatar}
                    alt={`${testimonial.name} avatar`}
                    className="w-16 h-16 rounded-full border-2 border-gray-600/50"
                  />
                </div>
                
                <div className="flex-1">
                  <blockquote className="text-lg md:text-xl text-gray-100 leading-relaxed mb-4">
                    &ldquo;{testimonial.content}&rdquo;
                  </blockquote>
                  
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <cite className="not-italic">
                        <div className="font-semibold text-white">{testimonial.name}</div>
                        <div className="text-sm text-gray-400">
                          {testimonial.role} at {testimonial.company}
                        </div>
                      </cite>
                    </div>
                    
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                      <span className="text-sm font-medium text-blue-400">
                        {testimonial.metric}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Controls */}
        <div className="absolute inset-y-0 left-4 flex items-center">
          <button
            onClick={goToPrevious}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className="p-2 rounded-full bg-gray-800/80 hover:bg-gray-700/80 border border-gray-600/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            aria-label="Previous testimonial"
          >
            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <div className="absolute inset-y-0 right-4 flex items-center">
          <button
            onClick={goToNext}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className="p-2 rounded-full bg-gray-800/80 hover:bg-gray-700/80 border border-gray-600/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            aria-label="Next testimonial"
          >
            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Indicators */}
      <div className="flex justify-center mt-6 gap-2">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`w-3 h-3 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
              index === currentIndex
                ? 'bg-blue-500'
                : 'bg-gray-600 hover:bg-gray-500'
            }`}
            aria-label={`Go to testimonial ${index + 1}`}
          />
        ))}
      </div>

      {/* Play/Pause Control */}
      {!prefersReducedMotion && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-4 py-2 text-sm text-gray-400 hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded"
            aria-label={isPlaying ? 'Pause carousel' : 'Play carousel'}
          >
            {isPlaying ? 'Pause' : 'Play'} Auto-advance
          </button>
        </div>
      )}
    </div>
  );
}
