import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * CTASection — Gradient CTA banner with parallax effect
 */
export function CTASection() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!contentRef.current || !sectionRef.current) return;

        gsap.fromTo(
            contentRef.current,
            { opacity: 0, y: 40 },
            {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: 'top 75%',
                    toggleActions: 'play none none none',
                },
            }
        );

        return () => { ScrollTrigger.getAll().forEach((t) => t.kill()); };
    }, []);

    return (
        <section ref={sectionRef} className="relative py-24 lg:py-32 overflow-hidden">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-brand-violet-600 via-brand-fuchsia-600 to-brand-pink-600" />

            {/* Animated mesh pattern */}
            <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: `radial-gradient(circle at 25% 25%, white 1px, transparent 1px),
                          radial-gradient(circle at 75% 75%, white 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
            }} />

            {/* Glow effects */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-brand-violet-400/10 rounded-full blur-3xl" />

            <div ref={contentRef} className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 text-center opacity-0">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">
                    Ready to scale your<br />Micro-SaaS?
                </h2>
                <p className="text-lg sm:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
                    Join thousands of developers using Split-Ledger to instantly provision secure multi-tenant architecture and Stripe-enabled billing.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                    <Link
                        to="/register"
                        className="inline-flex items-center px-10 py-4 rounded-xl bg-white text-primary-700 font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-[1.03] transition-all duration-300"
                    >
                        Get Started for Free
                        <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </Link>
                    <a
                        href="#features"
                        className="inline-flex items-center px-8 py-4 rounded-xl border-2 border-white/30 text-white font-semibold text-lg hover:bg-white/10 transition-all duration-300"
                    >
                        Learn More
                    </a>
                </div>
            </div>
        </section>
    );
}

export default CTASection;
