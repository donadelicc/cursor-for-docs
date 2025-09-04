'use client';

import Link from 'next/link';

export default function FeaturesSection() {
  const features = [
    {
      title: 'Inline AI Editing',
      description: 'Get real-time AI suggestions and edits directly within your text as you write.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      ),
    },
    {
      title: 'Research Assistant',
      description:
        'AI-powered research capabilities to help you find relevant information and sources.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      ),
    },
    {
      title: 'Connect and Manage Sources',
      description:
        'Seamlessly integrate and organize multiple data sources for comprehensive research.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
      ),
    },
    {
      title: 'Customize Chatbot Knowledge',
      description:
        'Tailor your AI assistant with specific knowledge bases and custom training data.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      ),
    },
    {
      title: 'Import Documents',
      description: 'Easily import and work with documents from various formats and platforms.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
          />
        </svg>
      ),
    },
    {
      title: 'Export or Save in Cloud',
      description: 'Save your work to various cloud platforms or export in multiple file formats.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-teal-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
            Your Modern Text Editor
          </h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Research and interact with your sources while writing your paper.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="backdrop-blur-sm border border-gray-700/30 rounded-xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-gray-600/50"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            >
              <div className="flex items-center justify-center w-16 h-16 rounded-lg mb-6"
                   style={{ backgroundColor: 'rgba(41,167,172,0.1)' }}>
                <div style={{ color: '#29a7ac' }}>
                  {feature.icon}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Start writing for free</h3>
            <p className="text-gray-600 mb-6">
              Stop wasting time navigating between different tools. Write seamlessly with your
              sources.{' '}
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-4 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-lg backdrop-blur-md border border-white/20 hover:border-white/40 hover:scale-105"
              style={{ 
                backgroundColor: 'rgba(41,167,172,0.15)',
                boxShadow: '0 8px 32px rgba(41,167,172,0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(41,167,172,0.25)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(41,167,172,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(41,167,172,0.15)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(41,167,172,0.2)';
              }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
