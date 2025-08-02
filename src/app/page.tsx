"use client";

import Link from "next/link";
import Header from "@/components/Header";
import HeaderHome from "@/components/HeaderHome";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { currentUser } = useAuth();

  // Show different home page based on authentication status
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-white">
        <HeaderHome />
        <HeroSection />
        <FeaturesSection />
      </div>
    );
  }

  // Logged-in user's home page
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Supercharge Your
              <span className="text-indigo-600 block">
                Paperwriting Process
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              We maximize flow and reduce friction so you can focus on what
              matters most—your ideas.
            </p>

            <div className="mb-12">
              <Link href="/document">
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-10 rounded-xl text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                  Start Writing Now
                </button>
              </Link>
              {!currentUser && (
                <p className="text-sm text-gray-500 mt-4 max-w-md mx-auto">
                  No signup required. Start writing immediately and save your
                  work later.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-20 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-black opacity-10"></div>
          </div>

          <div className="max-w-6xl mx-auto relative">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Why Students
                <span className="text-yellow-300 block">Choose Us</span>
              </h2>
              <p className="text-xl text-indigo-100 max-w-2xl mx-auto">
                Stop wrestling with clunky editors. Start dominating your
                assignments.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="group">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl">
                  <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl">⚡</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    0 to Writing
                  </h3>
                  <p className="text-indigo-100 text-lg leading-relaxed">
                    <span className="text-yellow-300 font-semibold">
                      No setup.
                    </span>{" "}
                    No tutorials. No BS.
                    <br />
                    Just click and start crushing your paper.
                  </p>
                </div>
              </div>

              <div className="group">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl">
                  <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl">🧠</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Pure Focus Mode
                  </h3>
                  <p className="text-indigo-100 text-lg leading-relaxed">
                    <span className="text-green-300 font-semibold">
                      Zero distractions.
                    </span>{" "}
                    Maximum brain power.
                    <br />
                    Get in the zone and stay there.
                  </p>
                </div>
              </div>

              <div className="group">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl">
                  <div className="bg-gradient-to-br from-pink-400 to-purple-500 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl">🚀</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Smart Everything
                  </h3>
                  <p className="text-indigo-100 text-lg leading-relaxed">
                    <span className="text-pink-300 font-semibold">
                      Auto-save.
                    </span>{" "}
                    Smart formatting. Magic.
                    <br />
                    Your words, perfected instantly.
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl md:text-4xl font-bold text-yellow-300 mb-2">
                  3x
                </div>
                <div className="text-indigo-100">Faster Writing</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-green-300 mb-2">
                  0
                </div>
                <div className="text-indigo-100">Learning Curve</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-pink-300 mb-2">
                  100%
                </div>
                <div className="text-indigo-100">Focus Time</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-blue-300 mb-2">
                  ∞
                </div>
                <div className="text-indigo-100">Possibilities</div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-16 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Ready to Transform Your Writing Experience?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Join thousands of students who&apos;ve already supercharged their
              paperwriting process.
            </p>
            <Link href="/document">
              <button className="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-4 px-10 rounded-xl text-lg transition-all duration-200 shadow-lg hover:shadow-xl">
                Get Started Free
              </button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
