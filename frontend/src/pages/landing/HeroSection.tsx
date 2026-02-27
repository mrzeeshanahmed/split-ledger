import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';

/**
 * HeroSection — Full-viewport hero with premium animated background and text
 */
export function HeroSection() {
    const headlineRef = useRef<HTMLHeadingElement>(null);
    const subtextRef = useRef<HTMLParagraphElement>(null);
    const buttonsRef = useRef<HTMLDivElement>(null);
    const badgeRef = useRef<HTMLDivElement>(null);
    const orbsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        // Entrance animations
        tl.fromTo(badgeRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 })
            .fromTo(headlineRef.current, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8 }, '-=0.3')
            .fromTo(subtextRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7 }, '-=0.4')
            .fromTo(buttonsRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.3');

        // Orb floating animations
        if (orbsRef.current) {
            const orbs = orbsRef.current.children as HTMLCollectionOf<HTMLElement>;
            gsap.to(orbs[0], { y: -50, x: 30, scale: 1.2, duration: 4, repeat: -1, yoyo: true, ease: 'sine.inOut' });
            gsap.to(orbs[1], { y: 60, x: -40, scale: 1.1, duration: 5, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1 });
            gsap.to(orbs[2], { y: -30, x: -50, scale: 1.3, duration: 6, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 2 });
        }

        return () => { tl.kill(); };
    }, []);

    return (
        <section className="relative min-h-screen flex items-center overflow-hidden bg-zinc-950">
            {/* Premium Animated Background */}
            <div className="absolute inset-0 z-0 overflow-hidden" ref={orbsRef}>
                {/* Glow Orb 1 */}
                <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] rounded-full bg-brand-violet-600/20 blur-[120px] mix-blend-screen pointer-events-none" />
                {/* Glow Orb 2 */}
                <div className="absolute top-[40%] right-[10%] w-[400px] h-[400px] rounded-full bg-brand-fuchsia-600/20 blur-[100px] mix-blend-screen pointer-events-none" />
                {/* Glow Orb 3 */}
                <div className="absolute bottom-[-10%] left-[30%] w-[600px] h-[600px] rounded-full bg-success-600/15 blur-[120px] mix-blend-screen pointer-events-none" />

                {/* Grid Overlay */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAzNGwtMTQgMTQgMTQgMTRoMTRMMzYgMzR6IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDIiLz48L2c+PC9zdmc+')] opacity-50 pointer-events-none" />
            </div>

            {/* Gradient overlays to smooth edges */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a1a]/80 via-transparent to-[#0a0a1a]/60 z-[1] pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0a0a1a] to-transparent z-[1] pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 py-20">
                <div className="max-w-3xl">
                    {/* Badge */}
                    <div ref={badgeRef} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-violet-500/10 border border-brand-violet-500/20 mb-8 opacity-0 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                        <span className="w-2 h-2 rounded-full bg-success-400 animate-pulse" />
                        <span className="text-sm font-medium text-secondary-300">Now in public beta</span>
                    </div>

                    {/* Headline */}
                    <h1
                        ref={headlineRef}
                        className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight mb-6 opacity-0"
                    >
                        <span className="text-white">Micro-SaaS Infrastructure.</span>
                        <br />
                        <span className="bg-gradient-to-r from-brand-violet-500 via-brand-fuchsia-500 to-brand-pink-400 bg-clip-text text-transparent">
                            Ready to scale.
                        </span>
                    </h1>

                    {/* Subtext */}
                    <p
                        ref={subtextRef}
                        className="text-lg sm:text-xl text-zinc-400 leading-relaxed max-w-2xl mb-10 opacity-0"
                    >
                        The ultimate boilerplate for developers. Provisions isolated PostgreSQL schemas per tenant,
                        secures API Keys, streams Webhooks, and meters Usage-Based Billing via Stripe.
                    </p>

                    {/* CTA Buttons */}
                    <div ref={buttonsRef} className="flex flex-wrap items-center gap-4 opacity-0">
                        <Link
                            to="/register"
                            className="group relative inline-flex items-center px-8 py-4 rounded-xl bg-gradient-to-r from-brand-violet-600 to-brand-fuchsia-600 text-white font-semibold text-lg shadow-lg shadow-brand-violet-500/25 hover:shadow-brand-violet-500/40 transition-all duration-300 hover:scale-[1.02]"
                        >
                            Start Free Trial
                            <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                        <Link
                            to="/login"
                            className="inline-flex items-center px-8 py-4 rounded-xl border border-white/10 text-white font-semibold text-lg hover:bg-white/5 transition-all duration-300"
                        >
                            Sign In
                        </Link>
                    </div>

                    {/* Trust line */}
                    <div className="mt-12 flex items-center gap-6 text-sm text-zinc-500">
                        <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-success-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            No credit card required
                        </div>
                        <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-success-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Free forever plan
                        </div>
                        <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-success-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Setup in 60 seconds
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default HeroSection;
