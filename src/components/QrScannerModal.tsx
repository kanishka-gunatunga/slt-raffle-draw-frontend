"use client";

import { Scanner } from '@yudiel/react-qr-scanner';
import { X, Check } from 'lucide-react';

interface QrScannerModalProps {
    onScan: (data: string | null) => void;
    onClose: () => void;
    feedback?: { type: 'success' | 'error' | 'info'; message: string } | null;
}

export default function QrScannerModal({ onScan, onClose, feedback }: QrScannerModalProps) {
    const handleScan = (detectedCodes: any[]) => {
        if (detectedCodes && detectedCodes.length > 0) {
            const code = detectedCodes[0];
            if (code.rawValue) {
                onScan(code.rawValue);
            }
        }
    };

    const handleError = (err: any) => {
        console.error(err);
    };

    return (
        <div className="fixed inset-0 bg-black z-[60] flex flex-col items-center justify-center p-4">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors z-20"
            >
                <X className="w-6 h-6" />
            </button>
            <div className="w-full max-w-sm bg-black rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl relative aspect-[3/4]">
                <Scanner
                    onScan={handleScan}
                    onError={handleError}
                    components={{
                        onOff: false,
                        torch: false,
                        zoom: false,
                        finder: false // We use our own custom finder overlay
                    }}
                    styles={{
                        container: { width: '100%', height: '100%' },
                        video: { width: '100%', height: '100%', objectFit: 'cover' }
                    }}
                />

                {/* Scanner Frame */}
                <div className="absolute inset-0 border-[40px] border-black/50 pointer-events-none">
                    <div className="w-full h-full border-2 border-white/50 rounded-xl relative">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500 -mt-1 -ml-1 rounded-tl-lg"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500 -mt-1 -mr-1 rounded-tr-lg"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500 -mb-1 -ml-1 rounded-bl-lg"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500 -mb-1 -mr-1 rounded-br-lg"></div>
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-green-500/50 animate-scan"></div>
                    </div>
                </div>

                {/* Feedback Overlay */}
                {feedback && (
                    <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm transition-all duration-300 animate-in fade-in`}>
                        <div className={`p-4 rounded-full mb-4 ${feedback.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                            {feedback.type === 'success' ? (
                                <Check className="w-8 h-8 text-white" />
                            ) : (
                                <X className="w-8 h-8 text-white" />
                            )}
                        </div>
                        <p className="text-white text-xl font-bold text-center px-6">{feedback.message}</p>
                    </div>
                )}
            </div>
            <p className="text-white/70 mt-8 text-center font-medium">Point camera at User's QR Code</p>
        </div>
    );
}
