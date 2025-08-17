import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold text-center text-blue-600 mb-8">
          Hello AI Agent Platform
        </h1>
      </div>
      <div className="text-center">
        <p className="text-lg text-gray-600 mb-4">
          Welcome to your AI-Powered Personal Agent Platform
        </p>
        <p className="text-sm text-gray-500">
          Built with Next.js, FastAPI, and Supabase
        </p>
      </div>
    </main>
  )
}
