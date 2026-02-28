import React from 'react';
import { Link } from 'react-router-dom';

export function PrivacyPolicyPage() {
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
                <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">Privacy Policy</h1>
                <p className="text-zinc-500 mb-10">Last Updated: {new Date().toLocaleDateString()}</p>

                <div className="space-y-8 text-sm leading-relaxed text-zinc-400">
                    <section>
                        <p className="text-lg text-zinc-300 font-medium">
                            Split-Ledger takes your privacy and the logical isolation of your data extremely seriously. This Privacy Policy outlines how your Personal Information is collected, used, and strictly firewalled within our Multi-Tenant architecture.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">1. Information We Collect</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Account Information:</strong> When you register a tenant workspace, we collect your email address, name, business name, and hashed passwords.</li>
                            <li><strong>Tenant Data:</strong> Any data you push into your isolated PostgreSQL schema via our APIs. This data is physically isolated and exclusively yours.</li>
                            <li><strong>Billing Information:</strong> Credit card payments and commission transfers are tokenized and processed exclusively via Stripe. We do NOT store raw credit card numbers.</li>
                            <li><strong>Telemetry & Usage:</strong> API call volumes, bandwidth, error rates, and webhook delivery statues for the explicit purpose of computing usage-based billing.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">2. How We Use Your Information</h2>
                        <p>We process your information specifically to:</p>
                        <ul className="list-disc pl-6 mt-4 space-y-2">
                            <li>Provision isolated compute and database environments for your Micro-SaaS.</li>
                            <li>Provide seamless authentication, JWT signing, and RBAC authorization workflows.</li>
                            <li>Meter your infrastructure consumption to calculate precise monthly commission invoices.</li>
                            <li>Dispatch real-time webhooks securely to your registered endpoints.</li>
                            <li>Monitor platform stability and defend against DDoS or abuse via rate limiters.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">3. Data Isolation and Multi-Tenancy Guarantee</h2>
                        <p>
                            Unlike traditional SaaS models that pool data, Split-Ledger leverages a strict <strong>Schema-per-Tenant</strong> architecture.
                            Your data resides in a dedicated PostgreSQL schema. Access to this schema is cryptographically enforced through JWTs scoped exclusively to your tenant ID. Cross-tenant data bleed is mathematically impossible by design at the database connection layer.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">4. Sharing Your Personal Information</h2>
                        <p>We do not sell, trade, or otherwise transfer your Personally Identifiable Information to outside parties. This does not include trusted third parties who assist us in operating our platform, so long as those parties agree to keep this information confidential. Key processing partners include:</p>
                        <ul className="list-disc pl-6 mt-4 space-y-2">
                            <li><strong>Stripe:</strong> For payment processing and Identity Verification (KYC) required for commissions.</li>
                            <li><strong>AWS/Vercel:</strong> For serverless compute hosting and geographic load balancing.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">5. Your Rights & Data Export</h2>
                        <p>
                            You have the right to access, verify, and export all data held within your tenant workspace. Through the Split-Ledger dashboard, administrators can trigger a full schema dump export at any time. You also maintain the right to instantly and irrevocably delete your tenant schema, completely expunging all underlying tables, rows, and traces from our servers.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">6. Contact Us</h2>
                        <p>
                            For more information about our privacy practices, if you have questions, or if you would like to make a complaint, please contact our Data Protection Officer by e-mail at <a href="mailto:privacy@split-ledger.com" className="text-violet-400 hover:text-fuchsia-400">privacy@split-ledger.com</a>.
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
}

export default PrivacyPolicyPage;
