import React, { useState, useRef, useEffect } from 'react';
import type { SpriteState } from '../types';
import { PlusIcon, UploadIcon, AnimalIcon, TrashIcon } from './Icons';

interface SpriteListProps {
    sprites: SpriteState[];
    activeSpriteId: string | null;
    onSelectSprite: (id: string) => void;
    onAddSprite: () => void;
    onAddSpriteFromUpload: (imageDataUrl: string) => void;
    onDeleteSprite: (id: string) => void;
}

const renderCostumeThumbnail = (costume: string) => {
    if (costume.startsWith('data:image/')) {
        return <img src={costume} alt="sprite costume" className="w-full h-full object-contain" draggable="false" />;
    }
    return <div className="text-4xl">{costume}</div>;
};

export const SpriteList: React.FC<SpriteListProps> = ({ sprites, activeSpriteId, onSelectSprite, onAddSprite, onAddSpriteFromUpload, onDeleteSprite }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onAddSpriteFromUpload(reader.result as string);
                setIsMenuOpen(false);
            };
            reader.readAsDataURL(file);
        }
        if (e.target) e.target.value = ''; // Reset input
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleAddAnimalClick = () => {
        onAddSprite();
        setIsMenuOpen(false);
    };

    return (
        <div className="p-3 flex-shrink-0 w-full border-t border-slate-700">
            <div className="flex items-start gap-3">
                <div className="flex-1 flex items-start gap-2 overflow-x-auto pb-2">
                    {sprites.map(sprite => (
                        <div
                            key={sprite.id}
                            onClick={() => onSelectSprite(sprite.id)}
                            className={`relative group p-1 rounded-lg cursor-pointer transition-colors flex-shrink-0 border-2 ${activeSpriteId === sprite.id ? 'border-electric-yellow bg-panel-light' : 'border-transparent bg-panel-dark hover:bg-slate-700'}`}
                            title={sprite.name}
                        >
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteSprite(sprite.id);
                                }}
                                className="absolute top-0 right-0 z-10 p-1 bg-red-500 text-white rounded-full flex items-center justify-center translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 hover:bg-red-400 transition-all scale-90 hover:scale-100"
                                title={`Delete ${sprite.name}`}
                            >
                                <TrashIcon />
                            </button>
                            <div className="w-16 h-16 bg-space-dark border border-slate-600 rounded-md flex items-center justify-center overflow-hidden">
                                {renderCostumeThumbnail(sprite.costume)}
                            </div>
                            <div className={`mt-1 text-center text-xs font-semibold truncate ${activeSpriteId === sprite.id ? 'text-electric-yellow' : 'text-slate-300'}`}>
                                {sprite.name}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setIsMenuOpen(prev => !prev)}
                        className="flex-shrink-0 w-12 h-12 bg-electric-yellow text-space-dark rounded-full flex items-center justify-center hover:bg-yellow-400 transition-colors"
                        title="Add Sprite"
                    >
                        <PlusIcon />
                    </button>
                    {isMenuOpen && (
                        <div className="absolute bottom-full right-0 mb-2 w-48 bg-panel-light rounded-lg shadow-lg border border-slate-600 z-20 overflow-hidden">
                            <button
                                onClick={handleAddAnimalClick}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-600 transition-colors"
                            >
                                <AnimalIcon />
                                <span>Choose an Animal</span>
                            </button>
                             <button
                                onClick={handleUploadClick}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-600 transition-colors"
                            >
                                <UploadIcon />
                                <span>Upload Sprite</span>
                            </button>
                        </div>
                    )}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                    />
                </div>
            </div>
        </div>
    );
};