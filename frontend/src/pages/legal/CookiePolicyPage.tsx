import React from 'react';
import { Link } from 'react-router-dom';

export function CookiePolicyPage() {
    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans overflow-x-hidden">
            <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center">
                    <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                        <img src="/logo.png" alt="Split-Ledger Logo" className="h-8 object-contain" />
                    </Link>
                </div>
            </nav>
            <main className="pt-32 pb-24 max-w-3xl mx-auto px-6">
                <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">Cookie Policy</h1>
                <p className="text-zinc-500 mb-10">Last Updated: {new Date().toLocaleDateString()}</p>

                <div className="space-y-8 text-sm leading-relaxed text-zinc-400">
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">1. What Are Cookies</h2>
                        <p>
                            Cookies are small text files that are placed on your computer or mobile device when you visit our website or use the Split-Ledger platform. They are widely used to make websites work, or work more efficiently, as well as to provide reporting information to the site owners.
                        </p>
                        <p className="mt-2">
                            Cookies set by the website owner (in this case, Split-Ledger) are called "first-party cookies". Cookies set by parties other than the website owner are called "third-party cookies". Third-party cookies enable third-party features or functionality to be provided on or through the website (e.g., interactive content, reporting, and Stripe integration).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">2. Why We Use Cookies</h2>
                        <p>We use first and third-party cookies for several essential reasons:</p>
                        <ul className="list-disc pl-6 mt-4 space-y-2">
                            <li><strong>Essential Operation:</strong> Some cookies are required for technical reasons in order for our platform to operate. We refer to these as "essential" or "strictly necessary" cookies. This includes session tokens to keep you logged in.</li>
                            <li><strong>Security:</strong> We use specific cookies (`_csrf`) to protect against Cross-Site Request Forgery attacks.</li>
                            <li><strong>Performance & Analytics:</strong> Cookies that help us track platform usage to optimize API routing, backend provisioning, and dashboard layouts.</li>
                            <li><strong>Payment Processing:</strong> Stripe, our payment processor, utilizes strictly necessary cookies to securely collect payment information and route commission payouts.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">3. Specific Cookies We Serve</h2>
                        <div className="bg-zinc-900/50 border border-white/5 rounded-lg p-5 mt-4 text-sm">
                            <div className="grid grid-cols-3 font-semibold text-white mb-2 border-b border-white/10 pb-2">
                                <div>Name</div>
                                <div>Purpose</div>
                                <div>Duration</div>
                            </div>
                            <div className="grid grid-cols-3 py-2 border-b border-white/5">
                                <div><code className="bg-zinc-800 text-violet-400 px-1 py-0.5 rounded">_csrf</code></div>
                                <div>Security against forged requests</div>
                                <div>Session</div>
                            </div>
                            <div className="grid grid-cols-3 py-2 border-b border-white/5">
                                <div><code className="bg-zinc-800 text-violet-400 px-1 py-0.5 rounded">sid</code> / Auth Token</div>
                                <div>Maintains active login state</div>
                                <div>7 Days</div>
                            </div>
                            <div className="grid grid-cols-3 py-2">
                                <div><code className="bg-zinc-800 text-violet-400 px-1 py-0.5 rounded">stripe.network</code></div>
                                <div>Fraud prevention and billing sync</div>
                                <div>Varies (3rd Party)</div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">4. How Can I Control Cookies?</h2>
                        <p>
                            You have the right to decide whether to accept or reject cookies. You can exercise your cookie rights by setting your preferences in your web browser controls. If you choose to reject cookies, you may still use our website though your access to some functionality and areas of our platform (such as the tenant dashboard and automated billing sections) will be fundamentally broken, restricted, or insecure.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">5. Updates to this Policy</h2>
                        <p>
                            We may update this Cookie Policy from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal, or regulatory reasons. Please therefore re-visit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
}

export default CookiePolicyPage;
