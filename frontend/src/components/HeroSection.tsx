"use client";

import { useEffect, useState, useCallback } from "react";
import WaitlistButton from "./WaitlistButton";

export default function HeroSection() {
  const [showTyping, setShowTyping] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animationCycle, setAnimationCycle] = useState(0);

  const fullText =
    "This warming trend is primarily attributed to human activities, particularly the burning of fossil fuels.";

  // Reset animation state
  const resetAnimation = () => {
    setShowTyping(false);
    setShowSuggestion(false);
    setTypedText("");
    setCurrentIndex(0);
  };

  // Start new animation cycle
  const startAnimationCycle = useCallback(() => {
    resetAnimation();

    // Start the animation sequence
    const timer1 = setTimeout(() => setShowTyping(true), 1000);
    const timer2 = setTimeout(() => setShowSuggestion(true), 5000); // Delayed to after typing completes

    // Start next cycle after current one completes
    const cycleTimer = setTimeout(() => {
      setAnimationCycle((prev) => prev + 1);
    }, 9000); // Extended to 9 seconds to accommodate the delay

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(cycleTimer);
    };
  }, []);

  useEffect(() => {
    const cleanup = startAnimationCycle();
    return cleanup;
  }, [animationCycle, startAnimationCycle]); // Re-run when animationCycle changes

  useEffect(() => {
    if (showTyping && currentIndex < fullText.length) {
      const timer = setTimeout(() => {
        setTypedText(fullText.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, 50); // Adjust speed here (lower = faster)

      return () => clearTimeout(timer);
    }
  }, [showTyping, currentIndex, fullText]);

  return (
    <section className="relative h-screen overflow-hidden">
      {/* Background with flowing elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background">
        {/* 3D Wave Effect */}
        <div className="absolute inset-0">
          <svg
            className="w-full h-full"
            viewBox="0 0 1200 800"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient
                id="waveGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#29a7ac" stopOpacity="0.15" />
                <stop offset="33%" stopColor="#2b7ab0" stopOpacity="0.2" />
                <stop offset="66%" stopColor="#513fbd" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#b92a8f" stopOpacity="0.2" />
              </linearGradient>
            </defs>

            {/* Main Wave */}
            <path
              d="M0,400 Q200,350 400,400 Q600,450 800,400 Q1000,350 1200,400 L1200,800 L0,800 Z"
              fill="url(#waveGradient)"
              opacity="0.3"
            >
              <animate
                attributeName="d"
                values="M0,400 Q200,350 400,400 Q600,450 800,400 Q1000,350 1200,400 L1200,800 L0,800 Z;
                        M0,400 Q200,450 400,400 Q600,350 800,400 Q1000,450 1200,400 L1200,800 L0,800 Z;
                        M0,400 Q200,380 400,400 Q600,420 800,400 Q1000,380 1200,400 L1200,800 L0,800 Z;
                        M0,400 Q200,350 400,400 Q600,450 800,400 Q1000,350 1200,400 L1200,800 L0,800 Z"
                dur="20s"
                repeatCount="indefinite"
              />
            </path>

            {/* Secondary Wave */}
            <path
              d="M0,450 Q150,400 300,450 Q450,500 600,450 Q750,400 900,450 Q1050,500 1200,450 L1200,800 L0,800 Z"
              fill="url(#waveGradient)"
              opacity="0.2"
            >
              <animate
                attributeName="d"
                values="M0,450 Q150,500 300,450 Q450,400 600,450 Q750,500 900,450 Q1050,400 1200,450 L1200,800 L0,800 Z;
                        M0,450 Q150,420 300,450 Q450,480 600,450 Q750,420 900,450 Q1050,480 1200,450 L1200,800 L0,800 Z;
                        M0,450 Q150,480 300,450 Q450,420 600,450 Q750,480 900,450 Q1050,420 1200,450 L1200,800 L0,800 Z;
                        M0,450 Q150,400 300,450 Q450,500 600,450 Q750,400 900,450 Q1050,500 1200,450 L1200,800 L0,800 Z"
                dur="16s"
                repeatCount="indefinite"
              />
            </path>

            {/* Top Wave */}
            <path
              d="M0,350 Q100,320 200,350 Q300,380 400,350 Q500,320 600,350 Q700,380 800,350 Q900,320 1000,350 Q1100,380 1200,350 L1200,800 L0,800 Z"
              fill="url(#waveGradient)"
              opacity="0.15"
            >
              <animate
                attributeName="d"
                values="M0,350 Q100,380 200,350 Q300,320 400,350 Q500,380 600,350 Q700,320 800,350 Q900,380 1000,350 Q1100,320 1200,350 L1200,800 L0,800 Z;
                        M0,350 Q100,335 200,350 Q300,365 400,350 Q500,335 600,350 Q700,365 800,350 Q900,335 1000,350 Q1100,365 1200,350 L1200,800 L0,800 Z;
                        M0,350 Q100,365 200,350 Q300,335 400,350 Q500,365 600,350 Q700,335 800,350 Q900,365 1000,350 Q1100,335 1200,350 L1200,800 L0,800 Z;
                        M0,350 Q100,320 200,350 Q300,380 400,350 Q500,320 600,350 Q700,380 800,350 Q900,320 1000,350 Q1100,380 1200,350 L1200,800 L0,800 Z"
                dur="24s"
                repeatCount="indefinite"
              />
            </path>
          </svg>
        </div>

        {/* Teal flowing element */}
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-8"
          style={{
            background:
              "radial-gradient(circle, rgba(41,167,172,0.08) 0%, transparent 70%)",
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* Purple flowing element */}
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-6"
          style={{
            background:
              "radial-gradient(circle, rgba(81,63,189,0.06) 0%, transparent 70%)",
            transform: "translate(50%, 50%)",
          }}
        />

        {/* Blue flowing element */}
        <div
          className="absolute top-1/2 right-1/3 w-72 h-72 rounded-full opacity-5"
          style={{
            background:
              "radial-gradient(circle, rgba(43,122,176,0.05) 0%, transparent 70%)",
            transform: "translate(50%, -50%)",
          }}
        />
      </div>

      <div className="relative h-full flex items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
          {/* Left side - Text content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-relaxed bg-gradient-to-r from-teal-400 via-blue-500 to-purple-600 bg-clip-text text-transparent pb-2">
              Elevate your writing
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Create compelling content with AI that references your sources,
              suggests improvements, and helps you write like a professional.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <WaitlistButton
                className="inline-flex items-center justify-center px-8 py-4 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-lg backdrop-blur-md border border-white/20 hover:border-white/40 hover:scale-105"
                style={{
                  backgroundColor: "rgba(41,167,172,0.15)",
                  boxShadow: "0 4px 16px rgba(41,167,172,0.15)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(41,167,172,0.25)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 20px rgba(41,167,172,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(41,167,172,0.15)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 16px rgba(41,167,172,0.15)";
                }}
              >
                Join Waitlist
              </WaitlistButton>
            </div>
          </div>

          {/* Right side - Animated Document Preview */}
          <div className="flex justify-center lg:justify-end">
            <div
              className="w-full max-w-lg aspect-square rounded-2xl shadow-xl flex items-center justify-center backdrop-blur-sm border border-gray-700/30 overflow-hidden"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
            >
              {/* Animated Document Content */}
              <div className="w-full h-full p-6 flex flex-col">
                {/* Document Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: "#29a7ac" }}
                    ></div>
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: "#2b7ab0" }}
                    ></div>
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: "#513fbd" }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-400">
                    Research Paper.docx
                  </div>
                </div>

                {/* Document Content */}
                <div className="flex-1 bg-white/10 rounded-lg p-6 font-sans text-sm text-gray-300 overflow-hidden">
                  <div className="space-y-3">
                    {/* Title */}
                    <div className="text-xl font-bold text-white mb-4">
                      Research Paper on Climate Change
                    </div>

                    {/* Writing Area */}
                    <div className="min-h-[120px]">
                      {/* Initial text */}
                      <div className="text-gray-300 leading-relaxed">
                        Climate change represents one of the most pressing
                        challenges of our time.
                      </div>

                      <div className="text-gray-300 leading-relaxed">
                        Recent studies indicate that global temperatures keeps
                        rising at a steady growth rate.
                      </div>

                      {/* Typewriter text */}
                      {showTyping && (
                        <div className="text-gray-300 leading-relaxed">
                          <span>{typedText}</span>
                          <span className="text-teal-400 animate-pulse">|</span>
                        </div>
                      )}
                    </div>

                    {/* AI Suggestions Area */}
                    <div className="space-y-3">
                      {/* AI Suggestion Box */}
                      {showSuggestion && (
                        <div className="p-4 rounded-lg border-l-4 border-teal-500/50 bg-teal-500/10 animate-slide-up">
                          <div className="flex items-start space-x-3">
                            <div
                              className="w-2 h-2 rounded-full mt-2 animate-pulse"
                              style={{ backgroundColor: "#29a7ac" }}
                            ></div>
                            <div className="flex-1">
                              <div className="text-xs font-medium text-teal-400 mb-2">
                                AI Assistant
                              </div>
                              <div className="text-sm text-gray-300">
                                <span className="text-teal-400">
                                  💡 Suggestion:
                                </span>{" "}
                                Consider adding data from your uploaded IPCC
                                report.
                                <br />
                                <span className="text-gray-400 italic">
                                  &ldquo;Global temperatures have risen by 1.1°C
                                  since pre-industrial levels...&rdquo;
                                </span>
                                <br />
                                <span className="text-blue-400 text-xs cursor-pointer hover:text-blue-300 transition-colors">
                                  📚 View in source: IPCC Report 2023
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Bar */}
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span>AI Assistant: Active</span>
                    <span>Sources: 3 connected</span>
                  </div>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }
      `}</style>
    </section>
  );
}
