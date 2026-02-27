import React, { useState, useEffect } from 'react';
import { Webhook } from '../../types/webhooks';
import { getAvailableEvents, createWebhook, updateWebhook } from '../../api/webhooks';
import {
    Modal,
    Button,
    InputField,
    TextAreaField,
    useToast,
} from '../index';

interface WebhookModalProps {
    isOpen: boolean;
    onClose: () => void;
    webhook: Webhook | null;
    onSaved: (secret?: string) => void;
}

export const WebhookModal: React.FC<WebhookModalProps> = ({ isOpen, onClose, webhook, onSaved }) => {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [fetchingEvents, setFetchingEvents] = useState(false);
    const [availableEvents, setAvailableEvents] = useState<string[]>([]);

    const [url, setUrl] = useState('');
    const [description, setDescription] = useState('');
    const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

    const isEditing = !!webhook;

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setFetchingEvents(true);
                const evs = await getAvailableEvents();
                setAvailableEvents(evs);
            } catch {
                addToast({ message: 'Failed to load event types.', variant: 'error' });
            } finally {
                setFetchingEvents(false);
            }
        };

        if (isOpen) {
            fetchEvents();
            if (webhook) {
                setUrl(webhook.url);
                setDescription(webhook.description || '');
                setSelectedEvents([...webhook.events]);
            } else {
                setUrl('');
                setDescription('');
                setSelectedEvents([]);
            }
        }
    }, [isOpen, webhook, addToast]);

    const handleToggleEvent = (eventName: string) => {
        if (selectedEvents.includes(eventName)) {
            setSelectedEvents(selectedEvents.filter(e => e !== eventName));
        } else {
            setSelectedEvents([...selectedEvents, eventName]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.startsWith('https://')) {
            addToast({ message: 'URL must use HTTPS protocol.', variant: 'error' });
            return;
        }
        if (selectedEvents.length === 0) {
            addToast({ message: 'You must select at least one event.', variant: 'error' });
            return;
        }

        try {
            setLoading(true);
            if (isEditing) {
                await updateWebhook(webhook.id, { url, description, events: selectedEvents });
                addToast({ message: 'Webhook endpoint updated successfully.', variant: 'success' });
                onSaved();
            } else {
                const res = await createWebhook({ url, description, events: selectedEvents });
                addToast({ message: 'Webhook endpoint created.', variant: 'success' });
                onSaved(res.secret);
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: { message?: string } } } };
            addToast({
                message: err?.response?.data?.error?.message || 'Could not save webhook.',
                variant: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Edit Webhook Endpoint' : 'Add Webhook Endpoint'}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <InputField
                    label="Endpoint URL"
                    placeholder="https://your-domain.com/webhooks"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    helperText="Must be a valid HTTPS URL."
                />

                <TextAreaField
                    label="Description (Optional)"
                    placeholder="e.g. Production billing alerts"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                />

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-text-primary">
                        Events to Listen For
                    </label>
                    <div className="bg-secondary-50 border border-border-default rounded-md p-4 max-h-60 overflow-y-auto">
                        {fetchingEvents ? (
                            <p className="text-sm text-text-muted">Loading events...</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {availableEvents.map(eventName => (
                                    <label key={eventName} className="flex items-start gap-2 cursor-pointer group">
                                        <div className="flex items-center h-5">
                                            <input
                                                type="checkbox"
                                                checked={selectedEvents.includes(eventName)}
                                                onChange={() => handleToggleEvent(eventName)}
                                                className="w-4 h-4 text-violet-500 border-border-default rounded focus:ring-primary-500"
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm text-text-primary font-mono select-none group-hover:text-violet-400 transition-colors">
                                                {eventName}
                                            </span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                    {selectedEvents.length === 0 && (
                        <p className="text-xs text-danger-500">Please select at least one event type.</p>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border-default">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading || fetchingEvents}>
                        {loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Webhook')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
