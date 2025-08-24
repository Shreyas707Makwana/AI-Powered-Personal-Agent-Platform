"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="quantum-card max-w-md w-full p-8 rounded-xl text-center">
        <div className="text-5xl mb-3">⚠️</div>
        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
        <p className="text-gray-400 mb-4">An unexpected error occurred. Please try again.</p>
        {error?.digest && (
          <div className="text-xs text-gray-500 mb-4">Error: {error.digest}</div>
        )}
        <div className="flex gap-3 justify-center">
          <button onClick={() => reset()} className="quantum-button px-4 py-2 rounded-md text-sm">
            Try Again
          </button>
          <Link href="/" className="quantum-button px-4 py-2 rounded-md text-sm">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
