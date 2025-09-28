import React from 'react';
import type { Extension } from '../extensions';

interface ExtensionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddExtension: (extension: Extension) => void;
    availableExtensions: Extension[];
}

export const ExtensionModal: React.FC<ExtensionModalProps> = ({ isOpen, onClose, onAddExtension, availableExtensions }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div 
                className="bg-panel-dark rounded-lg shadow-2xl border border-slate-700 w-full max-w-2xl max-h-[80vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-electric-yellow">Choose an Extension</h2>
                </header>
                <div className="p-6 overflow-y-auto">
                    {availableExtensions.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {availableExtensions.map(ext => (
                                <div 
                                    key={ext.id}
                                    className="bg-panel-light rounded-lg p-4 text-center cursor-pointer transition-transform hover:scale-105 hover:shadow-md border border-slate-600 hover:border-electric-yellow"
                                    onClick={() => onAddExtension(ext)}
                                >
                                    <div className="w-16 h-16 mx-auto mb-3 text-electric-yellow flex items-center justify-center">
                                        <ext.icon />
                                    </div>
                                    <h3 className="font-bold text-white">{ext.name}</h3>
                                    <p className="text-xs text-slate-400 mt-1">{ext.description}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-slate-400">No new extensions available.</p>
                    )}
                </div>
            </div>
        </div>
    );
};