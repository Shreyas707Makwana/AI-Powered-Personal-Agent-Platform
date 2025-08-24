import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="quantum-card max-w-md w-full p-8 rounded-xl text-center">
        <div className="text-5xl mb-3">🔎</div>
        <h1 className="text-2xl font-bold mb-2">Page not found</h1>
        <p className="text-gray-400 mb-6">
          The page you are looking for doesnt exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/" className="quantum-button px-4 py-2 rounded-md text-sm">Go Home</Link>
          <Link href="/app" className="quantum-button px-4 py-2 rounded-md text-sm">Open App</Link>
        </div>
      </div>
    </div>
  );
}
