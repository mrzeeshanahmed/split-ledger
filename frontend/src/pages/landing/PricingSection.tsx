import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const plans = [
    {
        name: 'Sandbox',
        price: '0%',
        period: 'Platform Fee',
        description: 'Adjustable commission model governed by platform operators. Perfect for trying out the APIs.',
        features: ['Free up to $1,000 processed', '10,000 API calls/month', 'Community support', 'Standard rate limits', 'No Stripe account needed until live'],
        cta: 'Start Building Free',
        popular: false,
        gradient: 'from-zinc-800/50 to-zinc-900/50',
        border: 'border-white/[0.06]',
    },
    {
        name: 'Production',
        price: 'Variable',
        period: 'Commission',
        description: 'This platform operates on a transparent commission model. The commission rate can be adjusted entirely by the people that deploy this project.',
        features: ['Unlimited API calls', 'Adjustable commission rates', 'Instant Webhook Delivery', 'Operator Controls', 'Full Stripe Connect access', 'Advanced Analytics'],
        cta: 'Deploy to Production',
        popular: true,
        gradient: 'from-brand-violet-600/20 to-brand-fuchsia-600/20',
        border: 'border-brand-violet-500/40',
    },
    {
        name: 'Enterprise',
        price: 'Custom',
        period: 'Volume pricing',
        description: 'For high-volume deployments looking to customize the core infrastructure.',
        features: ['Discounted platform fees', 'Dedicated Account Manager', 'Custom integrations', 'Data export API', 'On-premise deployment options'],
        cta: 'Contact Sales',
        popular: false,
        gradient: 'from-zinc-800/50 to-zinc-900/50',
        border: 'border-white/[0.06]',
    },
];

/**
 * PricingSection — 3-tier glassmorphism pricing cards
 */
export function PricingSection() {
    const cardsRef = useRef<HTMLDivElement[]>([]);

    useEffect(() => {
        cardsRef.current.filter(Boolean).forEach((card, i) => {
            gsap.fromTo(
                card,
                { opacity: 0, y: 50, scale: 0.95 },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.7,
                    delay: i * 0.15,
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
        <section className="relative py-24 lg:py-32 bg-zinc-950">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                {/* Section header */}
                <div className="text-center mb-16">
                    <span className="inline-block text-sm font-semibold text-success-400 tracking-widest uppercase mb-3">Pricing</span>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                        Simple, transparent{' '}
                        <span className="bg-gradient-to-r from-success-400 to-success-300 bg-clip-text text-transparent">pricing</span>
                    </h2>
                    <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                        Start free and scale as you grow. No hidden fees, no surprises.
                    </p>
                </div>

                {/* Pricing cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                    {plans.map((plan, index) => (
                        <div
                            key={index}
                            ref={(el) => { if (el) cardsRef.current[index] = el; }}
                            className={`relative flex flex-col p-8 rounded-2xl border bg-gradient-to-b ${plan.gradient} ${plan.border} backdrop-blur-sm opacity-0 ${plan.popular ? 'lg:scale-105 lg:-my-4 shadow-2xl shadow-brand-violet-500/10' : ''
                                } hover:border-brand-violet-500/30 transition-all duration-500`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-brand-violet-600 to-brand-fuchsia-600 text-white text-xs font-bold uppercase tracking-wider shadow-lg">
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-white mb-2">{plan.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                                    <span className="text-zinc-400 text-sm">{plan.period}</span>
                                </div>
                                <p className="text-sm text-zinc-400 mt-2">{plan.description}</p>
                            </div>

                            <ul className="space-y-3 mb-8 flex-1">
                                {plan.features.map((feature, fIndex) => (
                                    <li key={fIndex} className="flex items-center gap-3 text-sm text-zinc-300">
                                        <svg className="w-4 h-4 text-success-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <Link
                                to="/register"
                                className={`w-full py-3 rounded-xl font-semibold text-center transition-all duration-300 block ${plan.popular
                                    ? 'bg-gradient-to-r from-brand-violet-600 to-brand-fuchsia-600 text-white shadow-lg shadow-brand-violet-500/25 hover:shadow-brand-violet-500/40 hover:scale-[1.02]'
                                    : 'border border-white/10 text-white hover:bg-white/5'
                                    }`}
                            >
                                {plan.cta}
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default PricingSection;
