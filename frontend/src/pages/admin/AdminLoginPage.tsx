/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, PrimaryButton } from '@/components';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import { adminLogin, adminSetup } from '@/api/admin';

export function AdminLoginPage() {
    const navigate = useNavigate();
    const { login } = useAdminAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isSetup, setIsSetup] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = isSetup
                ? await adminSetup(email, password, name)
                : await adminLogin(email, password);

            login(response.data.admin, response.data.token);
            navigate('/admin');
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Login failed';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background-subtle p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <img src="/logo.png" alt="Split-Ledger Logo" className="h-10 mx-auto mb-4" />
                    <p className="text-text-secondary mt-2">Platform Administration</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{isSetup ? 'Initial Setup' : 'Admin Login'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {isSetup && (
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-1">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-3 py-2 border border-border-default rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                        placeholder="Admin Name"
                                        required
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-3 py-2 border border-border-default rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                    placeholder="admin@example.com"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-1">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-3 py-2 border border-border-default rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                                    {error}
                                </div>
                            )}

                            <PrimaryButton type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Loading...' : isSetup ? 'Create Admin Account' : 'Sign In'}
                            </PrimaryButton>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => { setIsSetup(!isSetup); setError(''); }}
                                    className="text-sm text-violet-500 hover:text-violet-400"
                                >
                                    {isSetup ? 'Already have an account? Sign in' : 'First time? Set up admin account'}
                                </button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default AdminLoginPage;
