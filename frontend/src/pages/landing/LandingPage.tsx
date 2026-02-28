import React, { useEffect } from 'react';
import { HeroSection } from './HeroSection';
import { FeaturesSection } from './FeaturesSection';
import { HowItWorksSection } from './HowItWorksSection';
import { PricingSection } from './PricingSection';
import { CTASection } from './CTASection';
import { FooterSection } from './FooterSection';
import { NotificationBanner } from './NotificationBanner';

/**
 * LandingPage — Premium landing page composing all sections
 * Uses Three.js for 3D hero and GSAP for scroll-triggered animations
 */
export function LandingPage() {
    useEffect(() => {
        // Smooth scroll behavior for anchor links
        const handleAnchorClick = (e: MouseEvent) => {
            const target = e.target as HTMLAnchorElement;
            if (target.tagName === 'A' && target.hash) {
                const element = document.querySelector(target.hash);
                if (element) {
                    e.preventDefault();
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }
        };

        document.addEventListener('click', handleAnchorClick);
        return () => document.removeEventListener('click', handleAnchorClick);
    }, []);

    return (
        <div className="min-h-screen bg-zinc-950 text-white selection:bg-primary-500/30 selection:text-white">
            {/* Fixed header nav */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/60 backdrop-blur-2xl border-b border-white/[0.04]">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
                    <a href="/" className="flex items-center gap-2.5">
                        <img src="/logo.png" alt="Split-Ledger Logo" className="h-8 object-contain" />
                    </a>
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm text-zinc-400 hover:text-white transition-colors duration-200">Features</a>
                        <a href="#how-it-works" className="text-sm text-zinc-400 hover:text-white transition-colors duration-200">How It Works</a>
                        <a href="#pricing" className="text-sm text-zinc-400 hover:text-white transition-colors duration-200">Pricing</a>
                    </div>
                    <div className="flex items-center gap-3">
                        <a href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-200 px-3 py-2">
                            Login
                        </a>
                        <a
                            href="/register"
                            className="text-sm font-medium px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-violet-600 to-brand-fuchsia-600 text-white hover:shadow-lg hover:shadow-brand-violet-500/25 transition-all duration-300"
                        >
                            Get Started
                        </a>
                    </div>
                </div>
            </nav>

            {/* Page sections */}
            <div className="pt-16">
                <NotificationBanner />
            </div>
            <HeroSection />
            <div id="features">
                <FeaturesSection />
            </div>
            <div id="how-it-works">
                <HowItWorksSection />
            </div>
            <div id="pricing">
                <PricingSection />
            </div>
            <CTASection />
            <NotificationBanner />
            <FooterSection />
        </div>
    );
}

export default LandingPage;
