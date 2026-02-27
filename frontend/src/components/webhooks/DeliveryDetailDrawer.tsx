import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { WebhookDelivery } from '../../types/webhooks';
import { getWebhookDelivery } from '../../api/webhooks';
import { Button, Badge, Spinner, useToast } from '../index';

interface DeliveryDetailDrawerProps {
    isOpen: boolean;
    delivery: WebhookDelivery;
    onClose: () => void;
    onRedeliver: () => void;
}

export const DeliveryDetailDrawer: React.FC<DeliveryDetailDrawerProps> = ({
    isOpen,
    delivery,
    onClose,
    onRedeliver,
}) => {
    const { addToast } = useToast();
    const [fullDelivery, setFullDelivery] = useState<WebhookDelivery | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFullDelivery = async () => {
            try {
                setLoading(true);
                const res = await getWebhookDelivery(delivery.webhookId, delivery.id);
                setFullDelivery(res.delivery);
            } catch {
                addToast({ message: 'Could not load full delivery data.', variant: 'error' });
                onClose(); // auto-close if failed
            } finally {
                setLoading(false);
            }
        };

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            fetchFullDelivery();
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen, delivery.id, delivery.webhookId, addToast, onClose]);



    if (!isOpen) return null;

    const displayData = fullDelivery || delivery;

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'delivered': return <Badge variant="success">Delivered</Badge>;
            case 'failed': return <Badge variant="error">Failed</Badge>;
            case 'dead': return <Badge variant="default">Dead</Badge>;
            case 'retrying': return <Badge variant="warning">Retrying</Badge>;
            case 'pending': return <Badge variant="warning">Pending</Badge>;
            default: return <Badge variant="default">{status}</Badge>;
        }
    };

    return (
        <>
            <div
                className="fixed inset-0 bg-secondary-900/40 z-40 transition-opacity"
                onClick={onClose}
            />
            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-xl flex flex-col animate-slide-in-right">

                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-border-default">
                    <div>
                        <h2 className="text-lg font-semibold text-text-primary">Delivery Details</h2>
                        <p className="text-sm text-text-muted mt-1 font-mono">{displayData.id}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-text-muted hover:text-text-primary p-2 rounded-full hover:bg-secondary-100 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Spinner size="lg" />
                        </div>
                    ) : (
                        <>
                            {/* Properties Strip */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-border-default">
                                <div>
                                    <span className="block text-xs text-text-muted uppercase mb-1">Status</span>
                                    {renderStatusBadge(displayData.status)}
                                </div>
                                <div>
                                    <span className="block text-xs text-text-muted uppercase mb-1">Triggered At</span>
                                    <span className="text-sm font-medium">{format(new Date(displayData.createdAt), 'MMM d HH:mm:ss')}</span>
                                </div>
                                <div>
                                    <span className="block text-xs text-text-muted uppercase mb-1">Attempt</span>
                                    <span className="text-sm font-medium">{displayData.attemptCount}</span>
                                </div>
                                <div>
                                    <span className="block text-xs text-text-muted uppercase mb-1">HTTP Response</span>
                                    <span className={`text-sm font-medium ${displayData.lastResponseStatus && displayData.lastResponseStatus >= 200 && displayData.lastResponseStatus < 300 ? 'text-accent-600' : 'text-danger-600'}`}>
                                        {displayData.lastResponseStatus || 'None'}
                                    </span>
                                </div>
                            </div>

                            {/* Request Payload */}
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold text-text-primary">Request Payload</h3>
                                <div className="bg-secondary-800 text-secondary-50 font-mono text-xs p-4 rounded-lg overflow-x-auto">
                                    <pre>{JSON.stringify(displayData.payload, null, 2)}</pre>
                                </div>
                            </div>

                            {/* Response Body */}
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold text-text-primary">Provider Response Body</h3>
                                <div className="bg-secondary-800 text-secondary-50 font-mono text-xs p-4 rounded-lg overflow-x-auto max-h-60 overflow-y-auto">
                                    <pre>{displayData.lastResponseBody || 'No response body recorded.'}</pre>
                                </div>
                            </div>

                            {/* Response Error */}
                            {displayData.lastError && (
                                <div className="space-y-2">
                                    <h3 className="text-sm font-semibold text-danger-700">Internal Error Trace</h3>
                                    <div className="bg-danger-50 text-danger-900 border border-danger-200 font-mono text-xs p-4 rounded-lg overflow-x-auto">
                                        <pre>{displayData.lastError}</pre>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border-default bg-secondary-50 flex justify-between items-center">
                    <span className="text-sm text-text-secondary">
                        {displayData.status === 'pending' || displayData.status === 'retrying' ? 'Delivery in progress...' : 'Delivery finalized.'}
                    </span>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={onClose}>Close</Button>
                        {(displayData.status === 'failed' || displayData.status === 'dead') && (
                            <Button onClick={onRedeliver}>Redeliver Now</Button>
                        )}
                    </div>
                </div>

            </div>
        </>
    );
};
