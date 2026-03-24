import Link from 'next/link'

export default function ProPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="max-w-2xl text-center">
        <h1 className="mb-4 text-4xl font-light tracking-tight">
          Plumber Dashboard
        </h1>
        <p className="mb-8 text-xl font-light text-white/80">
          $49/month subscription
        </p>
        <div className="space-y-4">
          <p className="text-white/60">
            Login / Subscribe placeholder
          </p>
          <Link
            href="/"
            className="inline-block rounded-full border border-white/20 px-8 py-3 font-light text-white/80 transition-colors hover:border-white/40 hover:text-white"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  )
}
