"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  MessageCircle,
  Shield,
  Zap,
  ArrowRight,
  Globe,
  Users,
  Coins,
  Lock,
  Eye,
  Network,
  TrendingUp,
  Award,
} from "lucide-react"
import { WalletConnect } from "./wallet-connect"

import { InviteBootstrap } from "./invite-bootstrap"
import { useEffect, useRef, Suspense } from "react"

export function WelcomeScreen() {
  const heroRef = useRef<HTMLDivElement>(null)
  const sectionsRef = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-cyber-reveal")
          }
        })
      },
      { threshold: 0.1 },
    )

    sectionsRef.current.forEach((section) => {
      if (section) observer.observe(section)
    })

    return () => observer.disconnect()
  }, [])

  const addToRefs = (el: HTMLDivElement) => {
    if (el && !sectionsRef.current.includes(el)) {
      sectionsRef.current.push(el)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      <div className="fixed inset-0 bg-gradient-to-br from-black via-red-950/30 to-orange-950/20">
        <div className="absolute inset-0 bg-[url('/placeholder.svg?height=1080&width=1920')] bg-cover bg-center opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,100,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,100,0,0.05)_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/5 to-transparent animate-cyber-scan"></div>
        {/* Animated flame particles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-orange-500 rounded-full animate-flame-float opacity-30"></div>
          <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-red-500 rounded-full animate-flame-float-delayed opacity-40"></div>
          <div className="absolute bottom-1/3 left-2/3 w-3 h-3 bg-yellow-500 rounded-full animate-flame-float-slow opacity-20"></div>
        </div>
      </div>

      <section ref={heroRef} className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <div className="absolute inset-0 bg-[url('/1.webp')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60"></div>
        <div className="max-w-6xl mx-auto text-center space-y-12 relative z-10">
          <div className="space-y-6 cyber-entrance-1">
            <div className="inline-flex items-center space-x-2 bg-red-500/20 border border-red-400 rounded-full px-6 py-3 text-sm text-red-300 backdrop-blur-sm cyber-glow-red">
              <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
              <span className="font-mono tracking-wider">XMTP + ANYONE PROTOCOL ACTIVE</span>
            </div>

            <h1 className="text-5xl md:text-8xl font-bold leading-tight font-mono tracking-tight">
              <span className="block text-white cyber-smooth-glow animate-in slide-in-from-bottom-4 duration-1000">EMPOWER YOUR</span>
              <span className="block text-red-400 cyber-glow-red cyber-smooth-glow animate-in slide-in-from-bottom-4 duration-1000 delay-300">CONVERSATIONS</span>
              <span className="block text-2xl md:text-4xl text-cyan-400 cyber-glow-cyan mt-4 animate-in slide-in-from-bottom-4 duration-1000 delay-500">
                UNCOMPROMISED PRIVACY
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed font-mono">
              <span className="text-cyan-400">[SYSTEM INITIALIZED]</span> In a world where your data is currency, we're
              building the future of communication—where privacy isn't a privilege, but a{" "}
              <span className="text-red-400 cyber-glow-red">fundamental right</span> for every person on Earth.
            </p>
          </div>

          <div className="pt-8 cyber-entrance-2">
            <WalletConnect />
            {/* Handle invite deep link: connect, register if needed, then open DM */}
            <Suspense fallback={null}>
              <InviteBootstrap />
            </Suspense>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 relative z-10">
        <div className="absolute inset-0 bg-[url('/2.webp')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-black/80 to-black/90"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div ref={addToRefs} className="text-center mb-16 cyber-section">
            <div className="inline-block mb-6">
              <h2 className="text-4xl md:text-6xl font-bold font-mono cyber-smooth-glow text-white">
                DIGITAL PRIVACY CRISIS
              </h2>
              <div className="h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent mt-2 cyber-glow-red"></div>
            </div>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-mono">
              <span className="text-red-400">[WARNING]</span> Every day, billions of conversations happen across the
              globe.
              <span className="text-cyan-400">But who's listening?</span>
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
            <div ref={addToRefs} className="space-y-6 cyber-section">
              <div className="flex items-center space-x-3 text-red-400">
                <Eye className="w-8 h-8 cyber-glow-red" />
                <span className="text-xl font-bold font-mono tracking-wider">[THREAT DETECTED]</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold font-mono text-white cyber-smooth-glow">
                YOUR MESSAGES AREN'T YOURS
              </h3>
              <p className="text-gray-300 text-lg leading-relaxed">
                From journalists in authoritarian regimes to families sharing personal moments, millions of people
                worldwide face surveillance, censorship, and data exploitation. Traditional messaging platforms store
                your conversations, analyze your behavior, and profit from your privacy.
              </p>
              <div className="space-y-4">
                {[
                  "4.8 billion people use messaging apps daily",
                  "90% of messages are stored on centralized servers",
                  "Your data is sold to advertisers without consent",
                ].map((stat, index) => (
                  <div key={index} className="flex items-center space-x-3 text-gray-300 cyber-stat">
                    <div className="w-3 h-3 bg-red-500 rounded-full cyber-glow-red animate-pulse"></div>
                    <span className="font-mono">{stat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div ref={addToRefs} className="relative cyber-section">
              <div className="relative group">
                {/* Cyberpunk border effect with red theme */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/30 via-red-600/30 to-red-500/30 rounded-2xl blur-md group-hover:blur-lg transition-all duration-500"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/15 to-red-600/15 rounded-2xl animate-pulse"></div>

                {/* Main threat card */}
                <div className="relative bg-black/90 border-2 border-red-500/50 rounded-2xl p-8 backdrop-blur-sm overflow-hidden group-hover:border-red-400/70 transition-all duration-500">
                  {/* Multiple scanning lines */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  <div className="absolute inset-0 bg-gradient-to-l from-transparent via-red-600/15 to-transparent translate-x-[100%] group-hover:translate-x-[-100%] transition-transform duration-1200 delay-200"></div>

                  {/* Corner decorations */}
                  <div className="absolute top-4 left-4 w-6 h-6 border-l-3 border-t-3 border-red-500"></div>
                  <div className="absolute top-4 right-4 w-6 h-6 border-r-3 border-t-3 border-red-600"></div>
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-l-3 border-b-3 border-red-600"></div>
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-r-3 border-b-3 border-red-500"></div>

                  {/* Threat indicator */}
                  <div className="flex items-center justify-center mb-6">
                    <div className="flex items-center space-x-2 bg-red-500/20 border border-red-400/50 rounded-full px-4 py-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-red-400 font-mono tracking-wider">[THREAT LEVEL: CRITICAL]</span>
                    </div>
                  </div>

                  {/* Icon container */}
                  <div className="relative w-24 h-24 mx-auto mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-700 rounded-xl rotate-45 group-hover:rotate-[225deg] transition-transform duration-700"></div>
                    <div className="absolute inset-1 bg-black rounded-xl rotate-45"></div>
                    <div className="relative w-full h-full flex items-center justify-center">
                      <Globe className="w-12 h-12 text-red-400 group-hover:text-red-300 transition-colors duration-500 relative z-10" />
                    </div>
                    {/* Corner accents */}
                    <div className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-red-500"></div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 border-r-2 border-t-2 border-red-600"></div>
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l-2 border-b-2 border-red-600"></div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-red-500"></div>
                  </div>

                  <div className="text-center relative z-10">
                    <div className="text-4xl md:text-5xl font-bold text-red-400 mb-2 font-mono cyber-counter group-hover:text-red-300 transition-colors duration-300">2.8B+</div>
                    <div className="text-gray-300 font-mono text-sm group-hover:text-red-200 transition-colors duration-300">PEOPLE AFFECTED BY DATA BREACHES IN 2023</div>

                    {/* Bottom accent line */}
                    <div className="mt-4 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div ref={addToRefs} className="relative cyber-section">
              <div className="relative group">
                {/* Cyberpunk border effect with cyan theme */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/30 via-cyan-400/30 to-cyan-500/30 rounded-2xl blur-md group-hover:blur-lg transition-all duration-500"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/15 to-cyan-400/15 rounded-2xl animate-pulse"></div>

                {/* Main solution card */}
                <div className="relative bg-black/90 border-2 border-cyan-500/50 rounded-2xl p-8 backdrop-blur-sm overflow-hidden group-hover:border-cyan-400/70 transition-all duration-500">
                  {/* Multiple scanning lines */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  <div className="absolute inset-0 bg-gradient-to-l from-transparent via-cyan-400/15 to-transparent translate-x-[100%] group-hover:translate-x-[-100%] transition-transform duration-1200 delay-200"></div>

                  {/* Corner decorations */}
                  <div className="absolute top-4 left-4 w-6 h-6 border-l-3 border-t-3 border-cyan-500"></div>
                  <div className="absolute top-4 right-4 w-6 h-6 border-r-3 border-t-3 border-cyan-400"></div>
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-l-3 border-b-3 border-cyan-400"></div>
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-r-3 border-b-3 border-cyan-500"></div>

                  {/* Solution indicator */}
                  <div className="flex items-center justify-center mb-6">
                    <div className="flex items-center space-x-2 bg-cyan-500/20 border border-cyan-400/50 rounded-full px-4 py-2">
                      <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-cyan-400 font-mono tracking-wider">[SECURITY: MAXIMUM]</span>
                    </div>
                  </div>

                  {/* Icon container */}
                  <div className="relative w-24 h-24 mx-auto mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl rotate-45 group-hover:rotate-[225deg] transition-transform duration-700"></div>
                    <div className="absolute inset-1 bg-black rounded-xl rotate-45"></div>
                    <div className="relative w-full h-full flex items-center justify-center">
                      <Shield className="w-12 h-12 text-cyan-400 group-hover:text-cyan-300 transition-colors duration-500 relative z-10" />
                    </div>
                    {/* Corner accents */}
                    <div className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-cyan-500"></div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 border-r-2 border-t-2 border-cyan-400"></div>
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l-2 border-b-2 border-cyan-400"></div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-cyan-500"></div>
                  </div>

                  <div className="text-center relative z-10">
                    <div className="text-4xl md:text-5xl font-bold text-cyan-400 mb-2 font-mono cyber-counter group-hover:text-cyan-300 transition-colors duration-300">100%</div>
                    <div className="text-gray-300 font-mono text-sm group-hover:text-cyan-200 transition-colors duration-300">END-TO-END ENCRYPTED CONVERSATIONS</div>

                    {/* Bottom accent line */}
                    <div className="mt-4 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
                  </div>
                </div>
              </div>
            </div>

            <div ref={addToRefs} className="space-y-6 cyber-section">
              <div className="flex items-center space-x-3 text-cyan-400">
                <Lock className="w-8 h-8 cyber-glow-cyan" />
                <span className="text-xl font-bold font-mono tracking-wider">[SOLUTION FOUND]</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold font-mono text-white cyber-smooth-glow">
                DECENTRALIZED COMMUNICATION
              </h3>
              <p className="text-gray-300 text-lg leading-relaxed">
                Our app combines XMTP's decentralized messaging protocol with Anyone Protocol's privacy network,
                creating an unbreakable shield around your conversations. Whether you're an activist fighting for
                democracy, a business protecting trade secrets, or a family staying connected—your privacy is
                <span className="text-cyan-400 cyber-glow-cyan"> guaranteed</span>.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-gray-900/20 relative z-10">
        <div className="absolute inset-0 bg-[url('/3.webp')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-orange-950/10 via-black/85 to-red-950/10"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div ref={addToRefs} className="text-center mb-16 cyber-section">
            <div className="inline-block mb-6">
              <h2 className="text-4xl md:text-6xl font-bold font-mono cyber-smooth-glow text-white">SYSTEM FEATURES</h2>
              <div className="h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mt-2 cyber-glow-cyan"></div>
            </div>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-mono">
              <span className="text-cyan-400">[INITIALIZED]</span> Built for everyone, everywhere. Privacy made
              accessible to all.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: Network,
                title: "DECENTRALIZED PROTOCOL",
                desc: "Built on XMTP, your messages live on a decentralized network—no single point of failure, no corporate surveillance, no data mining.",
              },
              {
                icon: Shield,
                title: "ANONYMOUS ROUTING",
                desc: "Anyone Protocol's onion routing ensures your IP address and location remain hidden, protecting your identity from surveillance.",
              },
              {
                icon: Users,
                title: "USER-FRIENDLY DESIGN",
                desc: "Complex privacy technology made simple. No technical knowledge required—just connect your wallet and start chatting securely.",
              },
            ].map((feature, index) => (
              <div key={index} ref={addToRefs} className="cyber-section">
                <div className="relative group">
                  {/* Cyberpunk border effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-cyan-500/20 to-red-500/20 rounded-2xl blur-sm group-hover:blur-md transition-all duration-500"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-cyan-500/10 rounded-2xl animate-pulse"></div>

                  {/* Main card */}
                  <Card className="relative bg-black/80 border border-gray-700/50 backdrop-blur-sm hover:bg-black/90 transition-all duration-500 group rounded-2xl overflow-hidden">
                    {/* Scanning line effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

                    <CardHeader className="pb-4 relative z-10">
                      {/* Hexagonal icon container */}
                      <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-cyan-600 rounded-xl rotate-45 group-hover:rotate-[225deg] transition-transform duration-700"></div>
                        <div className="absolute inset-1 bg-black rounded-xl rotate-45"></div>
                        <div className="relative w-full h-full flex items-center justify-center">
                          <feature.icon className="w-10 h-10 text-cyan-400 group-hover:text-red-400 transition-colors duration-500 relative z-10" />
                        </div>
                        {/* Corner accents */}
                        <div className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-cyan-500"></div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 border-r-2 border-t-2 border-red-500"></div>
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l-2 border-b-2 border-red-500"></div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-cyan-500"></div>
                      </div>

                      <CardTitle className="text-white text-xl font-mono tracking-wider text-center group-hover:text-cyan-400 transition-colors duration-300">
                        {feature.title}
                      </CardTitle>

                      {/* Status indicator */}
                      <div className="flex items-center justify-center space-x-2 mt-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-400 font-mono">[ACTIVE]</span>
                      </div>
                    </CardHeader>

                    <CardContent className="relative z-10">
                      <CardDescription className="text-gray-300 leading-relaxed text-center font-mono text-sm">
                        {feature.desc}
                      </CardDescription>

                      {/* Bottom accent line */}
                      <div className="mt-4 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: Zap,
                title: "LIGHTNING FAST",
                desc: "Real-time messaging with instant delivery. Privacy doesn't mean sacrificing speed—experience the fastest secure messaging available.",
              },
              {
                icon: MessageCircle,
                title: "MODERN INTERFACE",
                desc: "Sleek, Discord-like interface that feels familiar yet revolutionary. Beautiful design meets uncompromising security.",
              },
            ].map((feature, index) => (
              <div key={index} ref={addToRefs} className="cyber-section">
                <div className="relative group">
                  {/* Cyberpunk border effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-cyan-500/20 to-red-500/20 rounded-2xl blur-sm group-hover:blur-md transition-all duration-500"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-cyan-500/10 rounded-2xl animate-pulse"></div>

                  {/* Main card */}
                  <Card className="relative bg-black/80 border border-gray-700/50 backdrop-blur-sm hover:bg-black/90 transition-all duration-500 group rounded-2xl overflow-hidden">
                    {/* Scanning line effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

                    <CardHeader className="pb-4 relative z-10">
                      {/* Hexagonal icon container */}
                      <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-cyan-600 rounded-xl rotate-45 group-hover:rotate-[225deg] transition-transform duration-700"></div>
                        <div className="absolute inset-1 bg-black rounded-xl rotate-45"></div>
                        <div className="relative w-full h-full flex items-center justify-center">
                          <feature.icon className="w-10 h-10 text-cyan-400 group-hover:text-red-400 transition-colors duration-500 relative z-10" />
                        </div>
                        {/* Corner accents */}
                        <div className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-cyan-500"></div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 border-r-2 border-t-2 border-red-500"></div>
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l-2 border-b-2 border-red-500"></div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-cyan-500"></div>
                      </div>

                      <CardTitle className="text-white text-xl font-mono tracking-wider text-center group-hover:text-cyan-400 transition-colors duration-300">
                        {feature.title}
                      </CardTitle>

                      {/* Status indicator */}
                      <div className="flex items-center justify-center space-x-2 mt-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-400 font-mono">[ACTIVE]</span>
                      </div>
                    </CardHeader>

                    <CardContent className="relative z-10">
                      <CardDescription className="text-gray-300 leading-relaxed text-center font-mono text-sm">
                        {feature.desc}
                      </CardDescription>

                      {/* Bottom accent line */}
                      <div className="mt-4 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 relative z-10">
        <div className="absolute inset-0 bg-[url('/4.webp')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-950/15 via-black/80 to-orange-950/15"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div ref={addToRefs} className="text-center mb-16 cyber-section">
            <div className="inline-flex items-center space-x-2 bg-yellow-500/20 border border-yellow-400 rounded-full px-6 py-3 text-sm text-yellow-300 mb-6 backdrop-blur-sm cyber-glow-yellow">
              <Coins className="w-5 h-5" />
              <span className="font-mono tracking-wider">PHENIX TOKEN PROTOCOL</span>
            </div>
            <div className="inline-block mb-6">
              <h2 className="text-4xl md:text-6xl font-bold font-mono cyber-smooth-glow text-white">
                TOKENOMICS SYSTEM
              </h2>
              <div className="h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent mt-2 cyber-glow-yellow"></div>
            </div>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-mono">
              <span className="text-yellow-400">[ECONOMY ACTIVE]</span> The Phenix token powers a self-sustaining
              ecosystem that rewards privacy advocates and funds the future of decentralized communication
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: Award,
                title: "EARN BY USING",
                desc: "Receive Phenix tokens for active participation in the network. The more you use privacy-focused communication, the more you earn.",
              },
              {
                icon: TrendingUp,
                title: "GOVERNANCE RIGHTS",
                desc: "Phenix holders vote on protocol upgrades, feature development, and the future direction of the privacy ecosystem.",
              },
              {
                icon: Network,
                title: "NETWORK INCENTIVES",
                desc: "Support relay operators and infrastructure providers who maintain the privacy network, creating a sustainable decentralized economy.",
              },
            ].map((token, index) => (
              <div key={index} ref={addToRefs} className="cyber-section">
                <div className="relative group">
                  {/* Cyberpunk border effect with golden theme */}
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-yellow-500/20 rounded-2xl blur-sm group-hover:blur-md transition-all duration-500"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-2xl animate-pulse"></div>

                  {/* Main card */}
                  <Card className="relative bg-black/80 border border-yellow-600/30 backdrop-blur-sm hover:bg-black/90 transition-all duration-500 group rounded-2xl overflow-hidden">
                    {/* Scanning line effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

                    <CardHeader className="pb-4 relative z-10">
                      {/* Hexagonal icon container with golden theme */}
                      <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl rotate-45 group-hover:rotate-[225deg] transition-transform duration-700"></div>
                        <div className="absolute inset-1 bg-black rounded-xl rotate-45"></div>
                        <div className="relative w-full h-full flex items-center justify-center">
                          <token.icon className="w-10 h-10 text-yellow-400 group-hover:text-orange-400 transition-colors duration-500 relative z-10" />
                        </div>
                        {/* Corner accents with golden theme */}
                        <div className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-yellow-500"></div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 border-r-2 border-t-2 border-orange-500"></div>
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l-2 border-b-2 border-orange-500"></div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-yellow-500"></div>
                      </div>

                      <CardTitle className="text-white text-xl font-mono tracking-wider text-center group-hover:text-yellow-400 transition-colors duration-300">
                        {token.title}
                      </CardTitle>

                      {/* Status indicator with golden theme */}
                      <div className="flex items-center justify-center space-x-2 mt-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-yellow-400 font-mono">[EARNING]</span>
                      </div>
                    </CardHeader>

                    <CardContent className="relative z-10">
                      <CardDescription className="text-gray-300 leading-relaxed text-center font-mono text-sm">
                        {token.desc}
                      </CardDescription>

                      {/* Bottom accent line with golden theme */}
                      <div className="mt-4 h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>

          <div ref={addToRefs} className="cyber-section">
            <div className="relative group">
              {/* Enhanced cyberpunk border for stats panel */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/30 via-orange-500/30 to-yellow-500/30 rounded-2xl blur-md group-hover:blur-lg transition-all duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/15 to-orange-500/15 rounded-2xl animate-pulse"></div>

              {/* Main stats panel */}
              <div className="relative bg-black/90 border-2 border-yellow-500/40 rounded-2xl p-8 backdrop-blur-sm overflow-hidden">
                {/* Multiple scanning lines */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-orange-500/15 to-transparent translate-x-[100%] group-hover:translate-x-[-100%] transition-transform duration-1200 delay-200"></div>

                {/* Corner decorations */}
                <div className="absolute top-4 left-4 w-6 h-6 border-l-3 border-t-3 border-yellow-500"></div>
                <div className="absolute top-4 right-4 w-6 h-6 border-r-3 border-t-3 border-orange-500"></div>
                <div className="absolute bottom-4 left-4 w-6 h-6 border-l-3 border-b-3 border-orange-500"></div>
                <div className="absolute bottom-4 right-4 w-6 h-6 border-r-3 border-b-3 border-yellow-500"></div>

                {/* Header indicator */}
                <div className="flex items-center justify-center mb-6">
                  <div className="flex items-center space-x-2 bg-yellow-500/20 border border-yellow-400/50 rounded-full px-4 py-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-yellow-400 font-mono tracking-wider">[TOKENOMICS MATRIX]</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-8 text-center relative z-10">
                  {[
                    { value: "1B", label: "TOTAL SUPPLY" },
                    { value: "40%", label: "USER REWARDS" },
                    { value: "30%", label: "DEVELOPMENT" },
                    { value: "30%", label: "ECOSYSTEM GROWTH" },
                  ].map((stat, index) => (
                    <div key={index} className="cyber-stat group/stat">
                      {/* Individual stat container */}
                      <div className="relative p-4 rounded-xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 group-hover/stat:border-yellow-500/40 transition-all duration-300">
                        <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2 font-mono cyber-counter group-hover/stat:text-orange-400 transition-colors duration-300">
                          {stat.value}
                        </div>
                        <div className="text-gray-300 text-sm font-mono tracking-wider group-hover/stat:text-yellow-300 transition-colors duration-300">
                          {stat.label}
                        </div>
                        {/* Stat accent line */}
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-px bg-gradient-to-r from-transparent via-yellow-500 to-transparent group-hover/stat:w-12 transition-all duration-300"></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom accent lines */}
                <div className="mt-6 flex justify-center space-x-4">
                  <div className="h-px w-16 bg-gradient-to-r from-transparent via-yellow-500 to-transparent"></div>
                  <div className="h-px w-8 bg-gradient-to-r from-transparent via-orange-500 to-transparent"></div>
                  <div className="h-px w-16 bg-gradient-to-r from-transparent via-yellow-500 to-transparent"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-gradient-to-br from-red-600/10 to-red-800/10 relative z-10">
        <div className="absolute inset-0 bg-[url('/5.webp')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-red-950/30 to-black/70"></div>
        <div ref={addToRefs} className="max-w-4xl mx-auto text-center space-y-8 cyber-section relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold font-mono cyber-smooth-glow text-white">JOIN THE REVOLUTION</h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto font-mono">
            <span className="text-red-400">[SYSTEM READY]</span> Start your journey toward true digital freedom <span className="text-cyan-400">today</span>.
          </p>
          <WalletConnect />
        </div>
      </section>

      <footer className="py-12 px-4 border-t border-gray-800 relative z-10">
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 font-mono">
            {[
              { label: "XMTP NETWORK", color: "green" },
              { label: "ANYONE PROTOCOL", color: "blue" },
              { label: "PHENIX TOKEN", color: "yellow" },
            ].map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 bg-${item.color}-500 rounded-full animate-pulse cyber-glow-${item.color}`}
                ></div>
                <span>{item.label}</span>
                {index < 2 && <ArrowRight className="w-4 h-4 ml-6" />}
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
