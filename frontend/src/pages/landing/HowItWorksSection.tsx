import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const steps = [
    {
        number: '01',
        title: 'Provision Your Tenant Workspace',
        description: 'Sign up and get an instantly provisioned, completely isolated PostgreSQL schema. Create users with strict RBAC controls.',
        gradient: 'from-brand-violet-500 to-info-500',
    },
    {
        number: '02',
        title: 'Integrate APIs & Webhooks',
        description: 'Generate secure sk_live_* API Keys, map your custom endpoints, and start listening to real-time events via HMAC-signed Webhook bursts.',
        gradient: 'from-brand-fuchsia-500 to-brand-pink-500',
    },
    {
        number: '03',
        title: 'Meter Usage & Collect Revenue',
        description: 'Every API call and storage byte is metered automatically. Connect your Stripe account to invoice users at the end of the month without lifting a finger.',
        gradient: 'from-warning-500 to-danger-500',
    },
];

/**
 * HowItWorksSection — Vertical timeline with staggered reveals
 */
export function HowItWorksSection() {
    const stepsRef = useRef<HTMLDivElement[]>([]);

    useEffect(() => {
        stepsRef.current.filter(Boolean).forEach((step, i) => {
            gsap.fromTo(
                step,
                { opacity: 0, x: i % 2 === 0 ? -60 : 60 },
                {
                    opacity: 1,
                    x: 0,
                    duration: 0.8,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: step,
                        start: 'top 80%',
                        toggleActions: 'play none none none',
                    },
                }
            );
        });

        return () => { ScrollTrigger.getAll().forEach((t) => t.kill()); };
    }, []);

    return (
        <section className="relative py-24 lg:py-32 bg-gradient-to-b from-[#0a0a1a] to-[#0f0e2e]">
            <div className="max-w-5xl mx-auto px-6 lg:px-8">
                {/* Section header */}
                <div className="text-center mb-20">
                    <span className="inline-block text-sm font-semibold text-brand-fuchsia-500 tracking-widest uppercase mb-3">How It Works</span>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                        Up and running in{' '}
                        <span className="bg-gradient-to-r from-brand-fuchsia-500 to-brand-pink-400 bg-clip-text text-transparent">minutes</span>
                    </h2>
                </div>

                {/* Timeline */}
                <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-8 lg:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-brand-violet-500/50 via-brand-fuchsia-500/50 to-brand-pink-500/20 hidden md:block" />

                    <div className="space-y-16">
                        {steps.map((step, index) => (
                            <div
                                key={index}
                                ref={(el) => { if (el) stepsRef.current[index] = el; }}
                                className={`relative flex flex-col md:flex-row items-start md:items-center gap-8 opacity-0 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                                    }`}
                            >
                                {/* Content card */}
                                <div className={`flex-1 ${index % 2 === 0 ? 'md:text-right md:pr-12' : 'md:pl-12'}`}>
                                    <div className="p-8 rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-transparent hover:border-white/10 transition-all duration-300">
                                        <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                                        <p className="text-zinc-400 leading-relaxed">{step.description}</p>
                                    </div>
                                </div>

                                {/* Number circle */}
                                <div className={`relative z-10 w-16 h-16 rounded-full bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                                    <span className="text-lg font-bold text-white">{step.number}</span>
                                </div>

                                {/* Spacer for alignment */}
                                <div className="flex-1 hidden md:block" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default HowItWorksSection;
