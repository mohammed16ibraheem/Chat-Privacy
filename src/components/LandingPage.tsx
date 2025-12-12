'use client';

import { useState, useEffect, useRef } from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const [activeTab, setActiveTab] = useState<'features' | 'comparison' | 'how-it-works'>('features');
  const [isVisible, setIsVisible] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
    
    // Animation cycle for encryption diagram
    const interval = setInterval(() => {
      setAnimationStep((prev) => (prev + 1) % 4);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className={`border-b border-gray-200 transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Chat Privacy</h1>
            <button
              onClick={onGetStarted}
              className="px-4 py-2 sm:px-6 sm:py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-300 font-medium text-sm sm:text-base transform hover:scale-105"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
        <div className={`text-center max-w-3xl mx-auto transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
            Private Messaging.
            <br />
            <span className="text-gray-600">No Compromises.</span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 px-2">
            End-to-end encrypted chat with zero metadata collection. 
            No phone number required. Your privacy, your control.
          </p>
          <button
            onClick={onGetStarted}
            className="px-6 py-3 sm:px-8 sm:py-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-300 font-semibold text-base sm:text-lg transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Start Chatting Now
          </button>
        </div>
      </section>

      {/* Tabs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 sm:mb-12">
        <div className="flex justify-center border-b border-gray-200 overflow-x-auto">
          <div className="flex min-w-max">
            <button
              onClick={() => setActiveTab('features')}
              className={`px-4 sm:px-6 py-2 sm:py-3 font-medium transition-all duration-300 text-sm sm:text-base whitespace-nowrap ${
                activeTab === 'features'
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Features
            </button>
            <button
              onClick={() => setActiveTab('how-it-works')}
              className={`px-4 sm:px-6 py-2 sm:py-3 font-medium transition-all duration-300 text-sm sm:text-base whitespace-nowrap ${
                activeTab === 'how-it-works'
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              How It Works
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`px-4 sm:px-6 py-2 sm:py-3 font-medium transition-all duration-300 text-sm sm:text-base whitespace-nowrap ${
                activeTab === 'comparison'
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Comparison
            </button>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-20" ref={sectionRef}>
        {activeTab === 'features' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ),
                title: 'End-to-End Encryption',
                description: 'Messages are encrypted using libsodium (NaCl) - the same encryption used by Signal and ProtonMail. Your messages are encrypted before leaving your device.',
              },
              {
                icon: (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ),
                title: 'Anonymous Accounts',
                description: 'No phone number or email required. Create an account with just a username. Your identity stays private.',
              },
              {
                icon: (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: 'Zero Metadata',
                description: 'We don\'t collect or store metadata. No tracking, no logs, no persistent storage. Your conversations are truly private.',
              },
              {
                icon: (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                ),
                title: 'User-Controlled Keys',
                description: 'Your encryption keys are generated and stored locally on your device. We never have access to your private keys.',
              },
              {
                icon: (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                ),
                title: 'Real-Time Messaging',
                description: 'Instant message delivery with WebSocket technology. See who\'s online and chat in real-time.',
              },
              {
                icon: (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: 'Open Source',
                description: 'Built with open-source libraries. Fully auditable encryption. You can verify the security yourself.',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-4 sm:p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                style={{
                  animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
                }}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-900 rounded-lg flex items-center justify-center mb-3 sm:mb-4 transform hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        ) : activeTab === 'how-it-works' ? (
          <div className="max-w-6xl mx-auto">
            <div className="mb-8 sm:mb-12 text-center px-2">
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">How End-to-End Encryption Works</h3>
              <p className="text-sm sm:text-base md:text-lg text-gray-600">
                Your messages are encrypted before they leave your device and can only be decrypted by the recipient.
              </p>
            </div>

            {/* Encryption Flow Diagram - Mobile Optimized */}
            <div className="relative mb-12 sm:mb-16">
              {/* Mobile Vertical Layout */}
              <div className="block md:hidden">
                <div className="space-y-8">
                  {/* User A */}
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gray-900 rounded-full mx-auto flex items-center justify-center text-white text-xl font-bold mb-3 animate-pulse">
                      A
                    </div>
                    <div className="text-sm text-gray-600 mb-2">User A</div>
                    <div className="text-xs text-gray-500">Generates Key Pair</div>
                    <div className="bg-gray-50 p-3 rounded-lg mt-4 max-w-xs mx-auto">
                      <div className="text-xs font-mono text-gray-700 mb-1">Private Key 🔐</div>
                      <div className="text-xs font-mono text-gray-500 mb-2">Stored locally</div>
                      <div className="text-xs font-mono text-gray-700">Public Key 📤</div>
                      <div className="text-xs font-mono text-gray-500">Shared</div>
                    </div>
                  </div>

                  {/* Arrow Down */}
                  <div className={`flex justify-center transition-all duration-1000 ${
                    animationStep >= 1 ? 'opacity-100' : 'opacity-30'
                  }`}>
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>

                  {/* Encryption Box */}
                  <div className={`bg-gray-900 text-white p-4 rounded-lg text-center transition-all duration-1000 ${
                    animationStep >= 1 ? 'opacity-100 scale-100' : 'opacity-50 scale-95'
                  }`}>
                    <div className="text-sm font-semibold mb-2">Message Encryption</div>
                    <div className="text-xs font-mono opacity-75">
                      {animationStep >= 1 ? '🔒 Encrypted' : '📝 Plain text'}
                    </div>
                  </div>

                  {/* Arrow Down */}
                  <div className={`flex justify-center transition-all duration-1000 ${
                    animationStep >= 2 ? 'opacity-100' : 'opacity-30'
                  }`}>
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>

                  {/* Server */}
                  <div className="text-center">
                    <div className={`w-16 h-16 bg-gray-200 rounded-lg mx-auto flex items-center justify-center mb-3 transition-all duration-1000 ${
                      animationStep >= 2 ? 'opacity-100' : 'opacity-30'
                    }`}>
                      <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                      </svg>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">Server</div>
                    <div className="text-xs text-gray-500 mb-2">Routes encrypted data</div>
                    <div className="text-xs text-red-600">❌ Cannot read</div>
                  </div>

                  {/* Arrow Down */}
                  <div className={`flex justify-center transition-all duration-1000 ${
                    animationStep >= 2 ? 'opacity-100' : 'opacity-30'
                  }`}>
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>

                  {/* Encrypted Message */}
                  <div className={`bg-gray-900 text-white p-4 rounded-lg text-center transition-all duration-1000 ${
                    animationStep >= 2 ? 'opacity-100 scale-100' : 'opacity-50 scale-95'
                  }`}>
                    <div className="text-sm font-semibold mb-2">Encrypted Message</div>
                    <div className="text-xs font-mono opacity-75">🔒 Ciphertext</div>
                  </div>

                  {/* Arrow Down */}
                  <div className={`flex justify-center transition-all duration-1000 ${
                    animationStep >= 3 ? 'opacity-100' : 'opacity-30'
                  }`}>
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>

                  {/* User B */}
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gray-900 rounded-full mx-auto flex items-center justify-center text-white text-xl font-bold mb-3 animate-pulse">
                      B
                    </div>
                    <div className="text-sm text-gray-600 mb-2">User B</div>
                    <div className="text-xs text-gray-500 mb-3">Decrypts Message</div>
                    <div className={`bg-gray-50 p-3 rounded-lg max-w-xs mx-auto transition-all duration-1000 ${
                      animationStep >= 3 ? 'opacity-100' : 'opacity-50'
                    }`}>
                      <div className="text-xs font-mono text-gray-700 mb-1">Decrypted</div>
                      <div className="text-xs font-mono text-gray-900">
                        {animationStep >= 3 ? '✅ Message readable' : '🔒 Encrypted'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop Horizontal Layout */}
              <div className="hidden md:flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-8">
                {/* User A */}
                <div className="flex-1 text-center">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gray-900 rounded-full mx-auto flex items-center justify-center text-white text-xl lg:text-2xl font-bold mb-4 animate-pulse">
                      A
                    </div>
                    <div className="text-sm text-gray-600">User A</div>
                    <div className="text-xs text-gray-500 mt-1">Generates Key Pair</div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 lg:p-4 rounded-lg mb-4">
                    <div className="text-xs font-mono text-gray-700 mb-2">Private Key</div>
                    <div className="text-xs font-mono text-gray-500 break-all">🔐 Stored locally</div>
                    <div className="text-xs font-mono text-gray-700 mt-2">Public Key</div>
                    <div className="text-xs font-mono text-gray-500 break-all">📤 Shared</div>
                  </div>
                </div>

                {/* Arrow and Encryption Process */}
                <div className="flex-1 flex flex-col items-center">
                  <div className="relative w-full">
                    <div className={`flex items-center justify-center mb-4 transition-all duration-1000 ${
                      animationStep >= 1 ? 'opacity-100' : 'opacity-30'
                    }`}>
                      <svg className="w-10 h-10 lg:w-12 lg:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                    
                    <div className={`bg-gray-900 text-white p-4 lg:p-6 rounded-lg text-center transition-all duration-1000 ${
                      animationStep >= 1 ? 'opacity-100 scale-100' : 'opacity-50 scale-95'
                    }`}>
                      <div className="text-xs lg:text-sm font-semibold mb-2">Message Encryption</div>
                      <div className="text-xs font-mono opacity-75">
                        {animationStep >= 1 ? '🔒 Encrypted' : '📝 Plain text'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Server (Middle) */}
                <div className="flex-1 text-center">
                  <div className="relative mb-6">
                    <div className={`w-16 h-16 lg:w-20 lg:h-20 bg-gray-200 rounded-lg mx-auto flex items-center justify-center mb-4 transition-all duration-1000 ${
                      animationStep >= 2 ? 'opacity-100' : 'opacity-30'
                    }`}>
                      <svg className="w-8 h-8 lg:w-10 lg:h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                      </svg>
                    </div>
                    <div className="text-sm text-gray-600">Server</div>
                    <div className="text-xs text-gray-500 mt-1">Routes encrypted data</div>
                    <div className="text-xs text-red-600 mt-2">❌ Cannot read</div>
                  </div>
                </div>

                {/* Arrow to User B */}
                <div className="flex-1 flex flex-col items-center">
                  <div className="relative w-full">
                    <div className={`flex items-center justify-center mb-4 transition-all duration-1000 ${
                      animationStep >= 2 ? 'opacity-100' : 'opacity-30'
                    }`}>
                      <svg className="w-10 h-10 lg:w-12 lg:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                    
                    <div className={`bg-gray-900 text-white p-4 lg:p-6 rounded-lg text-center transition-all duration-1000 ${
                      animationStep >= 2 ? 'opacity-100 scale-100' : 'opacity-50 scale-95'
                    }`}>
                      <div className="text-xs lg:text-sm font-semibold mb-2">Encrypted Message</div>
                      <div className="text-xs font-mono opacity-75">🔒 Ciphertext</div>
                    </div>
                  </div>
                </div>

                {/* User B */}
                <div className="flex-1 text-center">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gray-900 rounded-full mx-auto flex items-center justify-center text-white text-xl lg:text-2xl font-bold mb-4 animate-pulse">
                      B
                    </div>
                    <div className="text-sm text-gray-600">User B</div>
                    <div className="text-xs text-gray-500 mt-1">Decrypts Message</div>
                  </div>
                  
                  <div className={`bg-gray-50 p-3 lg:p-4 rounded-lg transition-all duration-1000 ${
                    animationStep >= 3 ? 'opacity-100' : 'opacity-50'
                  }`}>
                    <div className="text-xs font-mono text-gray-700 mb-2">Decrypted</div>
                    <div className="text-xs font-mono text-gray-900">
                      {animationStep >= 3 ? '✅ Message readable' : '🔒 Encrypted'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Steps */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
              {[
                { step: 1, title: 'Key Generation', desc: 'Each user generates a unique key pair locally' },
                { step: 2, title: 'Encryption', desc: 'Message encrypted with recipient\'s public key' },
                { step: 3, title: 'Routing', desc: 'Server routes encrypted data (cannot read)' },
                { step: 4, title: 'Decryption', desc: 'Recipient decrypts with their private key' },
              ].map((item) => (
                <div key={item.step} className="text-center p-4 sm:p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-all duration-300">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-900 text-white rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 font-bold text-sm sm:text-base">
                    {item.step}
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">{item.title}</h4>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Security Features */}
            <div className="bg-gray-50 p-6 sm:p-8 rounded-lg border border-gray-200">
              <h4 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Security Guarantees</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {[
                  {
                    title: 'Server Cannot Read Messages',
                    desc: 'Messages are encrypted end-to-end. The server only routes encrypted data and cannot decrypt it.',
                  },
                  {
                    title: 'No Metadata Collection',
                    desc: 'We don\'t track who you talk to, when, or how often. Zero metadata means complete privacy.',
                  },
                  {
                    title: 'Client-Side Key Generation',
                    desc: 'Encryption keys are generated in your browser. Private keys never leave your device.',
                  },
                  {
                    title: 'Ephemeral Storage',
                    desc: 'Public keys are stored only in memory while users are online. No persistent storage.',
                  },
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3 sm:gap-4">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">{item.title}</h5>
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            <div className="mb-6 sm:mb-8 text-center px-2">
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
                How We Compare
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                See how Chat Privacy stacks up against WhatsApp and Telegram
              </p>
            </div>

            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-900">
                      <th className="text-left py-3 px-3 sm:py-4 sm:px-6 font-semibold text-gray-900 text-xs sm:text-sm">Feature</th>
                      <th className="text-center py-3 px-3 sm:py-4 sm:px-6 font-semibold text-gray-900 text-xs sm:text-sm">WhatsApp</th>
                      <th className="text-center py-3 px-3 sm:py-4 sm:px-6 font-semibold text-gray-900 text-xs sm:text-sm">Telegram</th>
                      <th className="text-center py-3 px-3 sm:py-4 sm:px-6 font-semibold text-gray-900 bg-gray-50 text-xs sm:text-sm">Chat Privacy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { feature: 'Default End-to-End Encryption', whatsapp: '✓ Yes (Signal Protocol)', telegram: '✗ Cloud chats: No\nSecret chats: Yes', privacy: '✓ Yes (libsodium/NaCl)' },
                      { feature: 'Phone Number Required', whatsapp: '✓ Required', telegram: '✓ Usually required', privacy: '✗ Not required' },
                      { feature: 'Metadata Collection', whatsapp: '✓ Yes (who, when, device)', telegram: '✓ Yes', privacy: '✗ Zero metadata' },
                      { feature: 'Server Can Read Messages', whatsapp: '✗ No', telegram: '⚠️ Yes (cloud chats)', privacy: '✗ No' },
                      { feature: 'Anonymous Accounts', whatsapp: '✗ No', telegram: '△ Limited', privacy: '✓ Fully anonymous' },
                      { feature: 'User-Controlled Keys', whatsapp: '✗ No', telegram: '✗ No', privacy: '✓ Yes (100% client-side)' },
                      { feature: 'Message Storage', whatsapp: 'On device', telegram: 'On Telegram cloud', privacy: 'Device only (ephemeral)' },
                      { feature: 'Open Source', whatsapp: '✗ Not open source', telegram: '△ Partially', privacy: '✓ Fully open source' },
                      { feature: 'Perfect Forward Secrecy', whatsapp: '✓ Yes (Double Ratchet)', telegram: '△ Weak/limited', privacy: '✓ Yes (if implemented)' },
                      { feature: 'Custom Features', whatsapp: '✗ No', telegram: '✗ Limited', privacy: '✓ Unlimited control' },
                    ].map((row, index) => (
                      <tr key={index} className={`border-b border-gray-200 ${index % 2 === 1 ? 'bg-gray-50' : ''}`}>
                        <td className="py-3 px-3 sm:py-4 sm:px-6 font-medium text-gray-900 text-xs sm:text-sm">{row.feature}</td>
                        <td className="py-3 px-3 sm:py-4 sm:px-6 text-center text-gray-600 text-xs sm:text-sm whitespace-nowrap">{row.whatsapp}</td>
                        <td className="py-3 px-3 sm:py-4 sm:px-6 text-center text-gray-600 text-xs sm:text-sm whitespace-nowrap">{row.telegram}</td>
                        <td className={`py-3 px-3 sm:py-4 sm:px-6 text-center text-gray-900 font-semibold text-xs sm:text-sm ${index % 2 === 1 ? 'bg-white' : 'bg-gray-50'}`}>{row.privacy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-8 sm:mt-12 p-6 sm:p-8 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Why Choose Chat Privacy?</h4>
              <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-700">
                <li className="flex items-start">
                  <span className="text-gray-900 mr-2">•</span>
                  <span><strong>True Privacy:</strong> No metadata collection means no one can track who you talk to or when.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-900 mr-2">•</span>
                  <span><strong>Anonymous by Design:</strong> No phone number or email means complete anonymity.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-900 mr-2">•</span>
                  <span><strong>You Control Your Keys:</strong> Your encryption keys are generated and stored on your device only.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-900 mr-2">•</span>
                  <span><strong>Open & Auditable:</strong> Built with open-source libraries you can verify yourself.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-900 mr-2">•</span>
                  <span><strong>No Cloud Storage:</strong> Messages are ephemeral - no permanent storage on servers.</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 text-white py-12 sm:py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h3 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Ready to Chat Privately?</h3>
          <p className="text-gray-300 mb-6 sm:mb-8 text-base sm:text-lg px-2">
            Join Chat Privacy today. No sign-up forms, no phone numbers, just secure messaging.
          </p>
          <button
            onClick={onGetStarted}
            className="px-6 py-3 sm:px-8 sm:py-4 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-all duration-300 font-semibold text-base sm:text-lg transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Get Started Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">
            <p>Chat Privacy - End-to-end encrypted messaging. Your privacy is our priority.</p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <a
              href="https://t.me/I_am_codeing"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              <span className="font-medium">@I_am_codeing</span>
            </a>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
