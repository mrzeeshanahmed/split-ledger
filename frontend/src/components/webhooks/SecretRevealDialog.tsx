import React, { useState } from 'react';
import { Modal, Button } from '../index';

interface SecretRevealDialogProps {
    secret: string;
    onClose: () => void;
}

export const SecretRevealDialog: React.FC<SecretRevealDialogProps> = ({ secret, onClose }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(secret);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Modal
            isOpen={true}
            onClose={() => { }} // Force explicit confirm to close
            title="Webhook Secret Generated"
            size="md"
        >
            <div className="space-y-4">
                <div className="bg-warning-50 border border-warning-200 p-4 rounded-md">
                    <p className="text-sm text-warning-700 font-medium pb-1">
                        ⚠️ Please save this secret key now.
                    </p>
                    <p className="text-sm text-warning-600">
                        For security reasons, this signing secret will only be shown to you once. You will not be able to retrieve it again.
                    </p>
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-text-primary">Webhook Signing Secret</label>
                    <div className="flex relative">
                        <input
                            type="text"
                            readOnly
                            value={secret}
                            className="w-full font-mono text-sm px-4 py-3 bg-secondary-50 border border-border-default rounded-md pr-24 focus:outline-none"
                        />
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="absolute right-1.5 top-1.5"
                            onClick={handleCopy}
                        >
                            {copied ? 'Copied!' : 'Copy'}
                        </Button>
                    </div>
                </div>

                <div className="pt-4 border-t border-border-default flex justify-end">
                    <Button onClick={onClose}>I have saved this secret key</Button>
                </div>
            </div>
        </Modal>
    );
};
