import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { WebhookDelivery } from '../../types/webhooks';
import { getWebhookDeliveries, redeliverWebhook } from '../../api/webhooks';
import {
    DataTable,
    Column,
    Badge,
    Button,
    useToast,
} from '../index';
import { DeliveryDetailDrawer } from './DeliveryDetailDrawer';

interface DeliveryLogsTableProps {
    webhookId: string;
}

export const DeliveryLogsTable: React.FC<DeliveryLogsTableProps> = ({ webhookId }) => {
    const { addToast } = useToast();
    const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const pageSize = 20;

    // Drawer state
    const [selectedDelivery, setSelectedDelivery] = useState<WebhookDelivery | null>(null);

    const fetchDeliveries = useCallback(async () => {
        try {
            setLoading(true);
            const offset = (currentPage - 1) * pageSize;
            const data = await getWebhookDeliveries(webhookId, undefined, pageSize, offset);
            setDeliveries(data.deliveries);
            setTotalItems(data.total);
        } catch {
            addToast({
                message: 'Could not fetch delivery logs.',
                variant: 'error',
            });
        } finally {
            setLoading(false);
        }
    }, [webhookId, currentPage, addToast, pageSize]);

    useEffect(() => {
        fetchDeliveries();
    }, [fetchDeliveries]);

    const handleRedeliver = async (deliveryId: string, ev?: React.MouseEvent) => {
        if (ev) ev.stopPropagation();
        try {
            await redeliverWebhook(webhookId, deliveryId);
            addToast({
                message: 'A new delivery attempt has been scheduled.',
                variant: 'success',
            });
            // Refresh list to show new pending delivery
            setCurrentPage(1);
            fetchDeliveries();
        } catch {
            addToast({
                message: 'Could not schedule a new delivery attempt.',
                variant: 'error',
            });
        }
    };

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

    const columns: Column<WebhookDelivery>[] = [
        {
            key: 'eventType',
            header: 'Event Type',
            render: (eventType) => <span className="font-mono text-sm">{String(eventType)}</span>,
        },
        {
            key: 'status',
            header: 'Status',
            render: (status) => renderStatusBadge(String(status)),
        },
        {
            key: 'attemptCount',
            header: 'Attempts',
            align: 'center',
        },
        {
            key: 'lastResponseStatus',
            header: 'HTTP Code',
            render: (code) => (
                <span className={code ? (Number(code) >= 200 && Number(code) < 300 ? 'text-accent-600' : 'text-danger-600') : 'text-text-muted'}>
                    {code ? String(code) : '—'}
                </span>
            ),
        },
        {
            key: 'createdAt',
            header: 'Timestamp',
            render: (date) => (
                <span className="text-sm text-text-secondary whitespace-nowrap">
                    {format(new Date(String(date)), 'MMM d, yyyy HH:mm:ss')}
                </span>
            ),
        },
        {
            key: 'actions',
            header: '',
            align: 'right',
            render: (_, row) => {
                if (row.status === 'failed' || row.status === 'dead') {
                    return (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => handleRedeliver(row.id, e)}
                        >
                            Redeliver
                        </Button>
                    );
                }
                return null;
            },
        },
    ];

    return (
        <>
            <DataTable
                columns={columns}
                data={deliveries}
                rowKey="id"
                loading={loading}
                onRowClick={(row: WebhookDelivery) => setSelectedDelivery(row)}
                emptyMessage="No deliveries logged for this endpoint yet."
                striped
                pagination={{
                    currentPage,
                    pageSize,
                    totalItems,
                    onPageChange: setCurrentPage,
                }}
            />

            {selectedDelivery && (
                <DeliveryDetailDrawer
                    isOpen={true}
                    delivery={selectedDelivery}
                    onClose={() => setSelectedDelivery(null)}
                    onRedeliver={() => handleRedeliver(selectedDelivery.id)}
                />
            )}
        </>
    );
};
