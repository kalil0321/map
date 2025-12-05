import Link from 'next/link';
import { StapplyLogo } from '@/components/logo';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-5 text-center">
      <div className="animate-fade-in max-w-md w-full">
        <div className="flex justify-center mb-8">
          <StapplyLogo size={64} />
        </div>
        
        <h1 className="text-6xl md:text-8xl font-light tabular-nums mb-4 text-blue-500">
          404
        </h1>
        
        <h2 className="text-2xl md:text-3xl font-semibold mb-4">
          Page Not Found
        </h2>
        
        <p className="text-slate-400 mb-8 text-lg">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/8 text-white rounded-full border border-white/12 text-[13px] font-medium no-underline transition-[border-color,background-color] duration-200 hover:bg-white/12 hover:border-white/20"
          >
            Go to Home
          </Link>
          
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/8 text-white rounded-full border border-white/12 text-[13px] font-medium no-underline transition-[border-color,background-color] duration-200 hover:bg-white/12 hover:border-white/20"
          >
            Browse Jobs
          </Link>
        </div>
      </div>
    </div>
  );
}

