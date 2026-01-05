import { motion } from 'framer-motion';
import EmailTrick from './components/EmailTrick';
import MarketingBroadcast from './components/MarketingBroadcast';
import SunoGenerator from './components/SunoGenerator';

export default function App() {
  return (
    <div className="min-h-screen font-sans selection:bg-blue-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/20" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              AIGestion
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
            <a href="#features" className="hover:text-blue-400 transition-colors">
              Features
            </a>
            <a href="#testimonials" className="hover:text-blue-400 transition-colors">
              Client Cases
            </a>
            <a
              href="#demo"
              className="px-4 py-2 rounded-full border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-all"
            >
              Request Demo
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-8 leading-[1.1]">
              Scale your business with <span className="text-blue-500">Intelligent</span>{' '}
              Automation.
            </h1>
            <p className="text-xl text-white/50 mb-10 leading-relaxed max-w-2xl">
              AIGestion Nexus V1 is the premium suite for forward-thinking enterprises. Transform
              your data into actionable insights and automate complex workflows with ease.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="px-8 py-4 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-400 shadow-lg shadow-blue-500/20 transition-all">
                Get Started Now
              </button>
              <button className="px-8 py-4 rounded-xl bg-white/5 text-white font-semibold border border-white/10 hover:bg-white/10 transition-all">
                View Architecture
              </button>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Features Grid */}
      <section id="features" className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Enterprise-Grade Features</h2>
            <p className="text-white/50">Built for scale, security, and performance.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Real-time Analytics',
                desc: 'Visualize your entire operation in a single glass-morphism dashboard with millisecond latency.',
              },
              {
                title: 'Predictive AI',
                desc: 'Prevent bottlenecks before they happen with our proprietary forecasting engine.',
              },
              {
                title: 'Global Scale',
                desc: 'Deploy on a robust Google Cloud infrastructure with enterprise-level security and compliance.',
              },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                whileHover={{ y: -5 }}
                className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all"
              >
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-6 text-blue-400">
                  {i + 1}
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{f.title}</h3>
                <p className="text-white/40 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Marketing Broadcast Dashboard */}
      <MarketingBroadcast />

      {/* Suno AI Music Generator */}
      <SunoGenerator />

      {/* Email Optimization Trick Section */}
      <EmailTrick />

      {/* CTA Section */}
      <section id="demo" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-600/5 blur-3xl rounded-full" />
        <div className="max-w-4xl mx-auto px-6 relative text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 text-balance">
            Ready to lead the next generation of business management?
          </h2>
          <div className="p-8 rounded-3xl bg-slate-900 border border-white/10">
            <form className="grid gap-4" onSubmit={(e) => e.preventDefault()}>
              <div className="grid sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="First Name"
                  className="p-4 rounded-xl bg-white/5 border border-white/10 text-white focus:border-blue-500 outline-none"
                />
                <input
                  type="email"
                  placeholder="Business Email"
                  className="p-4 rounded-xl bg-white/5 border border-white/10 text-white focus:border-blue-500 outline-none"
                />
              </div>
              <textarea
                placeholder="Tell us about your requirements"
                rows={4}
                className="p-4 rounded-xl bg-white/5 border border-white/10 text-white focus:border-blue-500 outline-none"
              />
              <button className="w-full py-4 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-400 transition-all">
                Submit Request
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 text-center text-white/30 text-sm">
        <p>© 2025 AIGestion Nexus V1. All rights reserved.</p>
      </footer>
    </div>
  );
}
