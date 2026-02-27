import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, PrimaryButton } from '@/components';
import { getAdminSettings, updateAdminSettings, testSmtpSettings } from '@/api/admin';

interface Setting {
    key: string;
    value: string;
    encrypted: boolean;
    description: string;
}

export function PlatformSettingsPage() {
    const [settings, setSettings] = useState<Setting[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testingSmtp, setTestingSmtp] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
    const [successMsg, setSuccessMsg] = useState('');

    // Local form values (key → value)
    const [formValues, setFormValues] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await getAdminSettings();
                setSettings(res.data.settings);
                const values: Record<string, string> = {};
                res.data.settings.forEach((s: Setting) => { values[s.key] = s.value; });
                setFormValues(values);
            } catch (err) {
                console.error('Failed to fetch settings', err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setSuccessMsg('');
        try {
            // Only send changed values (skip masked passwords unless actually changed)
            const changedSettings: Record<string, string> = {};
            settings.forEach((s) => {
                if (formValues[s.key] !== s.value && formValues[s.key] !== '••••••••') {
                    changedSettings[s.key] = formValues[s.key];
                }
            });

            if (Object.keys(changedSettings).length === 0) {
                setSuccessMsg('No changes to save.');
                return;
            }

            const res = await updateAdminSettings(changedSettings);
            setSettings(res.data.settings);
            const values: Record<string, string> = {};
            res.data.settings.forEach((s: Setting) => { values[s.key] = s.value; });
            setFormValues(values);
            setSuccessMsg(`Saved ${Object.keys(changedSettings).length} setting(s)`);
        } catch (err) {
            console.error('Failed to save settings', err);
        } finally {
            setSaving(false);
        }
    };

    const handleTestSmtp = async () => {
        if (!testEmail) return;
        setTestingSmtp(true);
        setTestResult(null);
        try {
            const res = await testSmtpSettings(testEmail);
            setTestResult(res.data);
        } catch (err: any) {
            setTestResult({ success: false, error: err.response?.data?.message || err.message });
        } finally {
            setTestingSmtp(false);
        }
    };

    const updateValue = (key: string, value: string) => {
        setFormValues((prev) => ({ ...prev, [key]: value }));
    };

    if (loading) {
        return (
            <AdminLayout title="Settings">
                <div className="flex items-center justify-center h-64">
                    <div className="text-text-secondary">Loading settings...</div>
                </div>
            </AdminLayout>
        );
    }

    // Group settings
    const generalSettings = settings.filter((s) => !s.key.startsWith('smtp_'));
    const smtpSettings = settings.filter((s) => s.key.startsWith('smtp_'));

    const fieldLabel = (key: string): string => {
        const labels: Record<string, string> = {
            platform_name: 'Platform Name',
            platform_fee_percent: 'Platform Fee (%)',
            smtp_host: 'SMTP Host',
            smtp_port: 'SMTP Port',
            smtp_user: 'SMTP Username',
            smtp_pass: 'SMTP Password',
            smtp_from_email: 'From Email',
            smtp_from_name: 'From Name',
            smtp_secure: 'Use TLS',
        };
        return labels[key] || key;
    };

    return (
        <AdminLayout title="Platform Settings">
            <div className="space-y-6 max-w-2xl">
                {/* Success Message */}
                {successMsg && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                        ✓ {successMsg}
                    </div>
                )}

                {/* General Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>General</CardTitle>
                        <CardDescription>Platform-wide configuration</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {generalSettings.map((s) => (
                                <div key={s.key}>
                                    <label className="block text-sm font-medium text-text-primary mb-1">
                                        {fieldLabel(s.key)}
                                    </label>
                                    <input
                                        type="text"
                                        value={formValues[s.key] || ''}
                                        onChange={(e) => updateValue(s.key, e.target.value)}
                                        className="w-full px-3 py-2 border border-border-default rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                                    />
                                    {s.description && (
                                        <p className="text-xs text-text-muted mt-1">{s.description}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* SMTP Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>📧 SMTP Configuration</CardTitle>
                        <CardDescription>Configure your email server for transactional emails (password resets, invitations, notifications)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {smtpSettings.map((s) => (
                                <div key={s.key}>
                                    <label className="block text-sm font-medium text-text-primary mb-1">
                                        {fieldLabel(s.key)}
                                    </label>
                                    {s.key === 'smtp_secure' ? (
                                        <select
                                            value={formValues[s.key] || 'true'}
                                            onChange={(e) => updateValue(s.key, e.target.value)}
                                            className="w-full px-3 py-2 border border-border-default rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm bg-white"
                                        >
                                            <option value="true">Yes (TLS)</option>
                                            <option value="false">No</option>
                                        </select>
                                    ) : (
                                        <input
                                            type={s.key === 'smtp_pass' ? 'password' : 'text'}
                                            value={formValues[s.key] || ''}
                                            onChange={(e) => updateValue(s.key, e.target.value)}
                                            placeholder={s.key === 'smtp_pass' ? 'Enter SMTP password' : ''}
                                            className="w-full px-3 py-2 border border-border-default rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                                        />
                                    )}
                                </div>
                            ))}

                            {/* Test Email */}
                            <div className="mt-6 pt-4 border-t border-border-default">
                                <label className="block text-sm font-medium text-text-primary mb-1">
                                    Send Test Email
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        value={testEmail}
                                        onChange={(e) => setTestEmail(e.target.value)}
                                        placeholder="recipient@example.com"
                                        className="flex-1 px-3 py-2 border border-border-default rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                                    />
                                    <PrimaryButton
                                        onClick={handleTestSmtp}
                                        disabled={testingSmtp || !testEmail}
                                    >
                                        {testingSmtp ? 'Sending...' : '📤 Test'}
                                    </PrimaryButton>
                                </div>
                                {testResult && (
                                    <div className={`mt-2 p-3 rounded-lg text-sm ${testResult.success
                                            ? 'bg-green-50 border border-green-200 text-green-700'
                                            : 'bg-red-50 border border-red-200 text-red-600'
                                        }`}>
                                        {testResult.success ? '✓ Test email sent successfully!' : `✗ Failed: ${testResult.error}`}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end">
                    <PrimaryButton onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save All Settings'}
                    </PrimaryButton>
                </div>
            </div>
        </AdminLayout>
    );
}

export default PlatformSettingsPage;
