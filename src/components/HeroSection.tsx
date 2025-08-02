"use client";

import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Store and share files on the web
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              &ldquo;AI-powered text editor for faster paper writing integrated
              with your sources&rdquo;.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/editor"
                className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-lg"
              >
                Start Writing
              </Link>
              <Link
                href="/features"
                className="inline-flex items-center justify-center px-8 py-4 bg-transparent hover:bg-gray-50 text-blue-600 font-semibold rounded-lg border-2 border-blue-600 transition-all duration-200 text-lg"
              >
                Learn More
              </Link>
            </div>
          </div>

          {/* Right side - Image placeholder */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-lg aspect-square bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl shadow-xl flex items-center justify-center">
              {/* Placeholder for future image */}
              <div className="text-center">
                <div className="w-24 h-24 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">Document Preview</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
