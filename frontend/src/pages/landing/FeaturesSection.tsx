import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const features = [
    {
        icon: (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2h10a2 2 0 012 2v2" />
            </svg>
        ),
        title: 'Isolated Multi-Tenancy',
        description: 'Automatic schema-per-tenant PostgreSQL architecture ensures strict data isolation and zero cross-tenant bleeds. Every workspace gets its own world.',
    },
    {
        icon: (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.536 18.464a2.992 2.992 0 01-.3 3.197 2.993 2.993 0 01-4.237.225 3 3 0 01-.225-4.237 2.992 2.992 0 013.197-.3l3.72-3.721a6 6 0 015.743-7.743z" />
            </svg>
        ),
        title: 'API Key Management',
        description: 'Stripe-inspired API keys (sk_live_...) with 256-bit entropy, prefix-indexed fast lookups, RBAC scopes, and strict Redis sliding-window rate limiting.',
    },
    {
        icon: (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        ),
        title: 'Webhook Dispatcher',
        description: 'Broadcast events to your tenants via HMAC-SHA256 signed payloads. Backed by Redis queues, exponential backoff retries, and dead-letter interfaces.',
    },
    {
        icon: (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        title: 'Usage-Based Billing',
        description: 'A complete billing engine metering API calls and storage. Aggregated via a perfectly idempotent monthly cron job and synced with Stripe Connect transfers.',
    },
    {
        icon: (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        ),
        title: 'RBAC & Security',
        description: 'Stateless, cross-tenant protected JWT tokens. Every request boundary is aggressively shielded by Zod schemas, HTTP-Only cookies, and timing-safe algorithms.',
    },
    {
        icon: (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
        ),
        title: 'Analytics & Telemetry',
        description: 'Calculate real-time MRR, pinpoint active churn, and generate multi-dimensional API usage heatmaps instantly. Driven by React Query caching.',
    },
];

/**
 * FeaturesSection — Animated feature cards
 */
export function FeaturesSection() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const cardsRef = useRef<HTMLDivElement[]>([]);

    useEffect(() => {
        const cards = cardsRef.current.filter(Boolean);

        cards.forEach((card, i) => {
            gsap.fromTo(
                card,
                { opacity: 0, y: 80, scale: 0.95 },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.8,
                    delay: i % 3 * 0.15,
                    ease: 'back.out(1.2)',
                    scrollTrigger: {
                        trigger: card,
                        start: 'top 85%',
                        toggleActions: 'play none none none',
                    },
                }
            );
        });

        return () => { ScrollTrigger.getAll().forEach((t) => t.kill()); };
    }, []);

    return (
        <section ref={sectionRef} className="relative py-24 lg:py-32 bg-zinc-950">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                {/* Section header */}
                <div className="text-center mb-16">
                    <span className="inline-block text-sm font-semibold text-brand-violet-500 tracking-widest uppercase mb-3">Features</span>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                        Everything you need to{' '}
                        <span className="bg-gradient-to-r from-brand-violet-500 to-brand-fuchsia-500 bg-clip-text text-transparent">ship blazing fast</span>
                    </h2>
                    <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                        Built for developers who want to focus on their unique product value, not rebuilding auth, multi-tenancy, and billing systems from scratch.
                    </p>
                </div>

                {/* Feature grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            ref={(el) => { if (el) cardsRef.current[index] = el; }}
                            className="group relative p-8 rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-transparent hover:border-brand-violet-500/30 hover:bg-white/[0.06] transition-all duration-500 opacity-0"
                        >
                            <div className="w-12 h-12 rounded-xl bg-brand-violet-500/10 border border-brand-violet-500/20 flex items-center justify-center text-brand-violet-500 mb-5 group-hover:bg-brand-violet-500/20 group-hover:scale-110 transition-all duration-300">
                                {feature.icon}
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                            <p className="text-sm text-zinc-400 leading-relaxed">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default FeaturesSection;
