import React, { useState, useEffect } from 'react';
import type { SpriteState } from '../types';
import { EyeIcon, EyeSlashIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface SpriteEditorProps {
    sprite: SpriteState;
    onUpdate: (updates: Partial<Omit<SpriteState, 'id'>>) => void;
    costumes: string[];
}

const renderCostumePreview = (costume: string) => {
    if (costume.startsWith('data:image/')) {
        return <img src={costume} alt="sprite costume" className="max-w-full max-h-full object-contain" draggable="false" />;
    }
    return <div className="text-4xl">{costume}</div>;
};

export const SpriteEditor: React.FC<SpriteEditorProps> = ({ sprite, onUpdate, costumes }) => {
    const { name, x, y, rotation, visible, costume, size, volume } = sprite;

    const [localName, setLocalName] = useState<string>(name);
    const [localX, setLocalX] = useState<number | string>(Math.round(x));
    const [localY, setLocalY] = useState<number | string>(Math.round(y));
    const [localRotation, setLocalRotation] = useState<number | string>(Math.round(rotation));
    const [localSize, setLocalSize] = useState<number | string>(Math.round(size));
    const [localVolume, setLocalVolume] = useState<number | string>(Math.round(volume));


    useEffect(() => {
        setLocalName(name);
        setLocalX(Math.round(x));
        setLocalY(Math.round(y));
        setLocalRotation(Math.round(rotation));
        setLocalSize(Math.round(size));
        setLocalVolume(Math.round(volume));
    }, [name, x, y, rotation, size, volume]);

    const commitPosition = () => {
        onUpdate({ x: Number(localX) || 0, y: Number(localY) || 0 });
    };

    const commitRotation = () => {
        onUpdate({ rotation: Number(localRotation) || 0 });
    };
    
    const commitSize = () => {
        onUpdate({ size: Math.max(0, Number(localSize) || 100) });
    };

    const commitVolume = () => {
        onUpdate({ volume: Math.max(0, Math.min(100, Number(localVolume) || 100)) });
    };

    const commitName = () => { onUpdate({ name: localName }); };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, callback: () => void) => {
        if (e.key === 'Enter') {
            callback();
            (e.target as HTMLInputElement).blur();
        }
    };

    const changeCostume = (direction: number) => {
        const currentIndex = costumes.indexOf(costume);
        if (currentIndex === -1) {
            // If current costume is not in the list (e.g., uploaded), jump to start/end of list
            if (direction > 0) {
                onUpdate({ costume: costumes[0] });
            } else {
                onUpdate({ costume: costumes[costumes.length - 1]});
            }
            return;
        }
        const nextIndex = (currentIndex + direction + costumes.length) % costumes.length;
        onUpdate({ costume: costumes[nextIndex] });
    };

    const inputClasses = "w-full bg-slate-700 border border-slate-600 rounded-md px-2 py-1 text-sm text-white placeholder-slate-400 focus:ring-2 focus:ring-electric-yellow focus:outline-none";

    return (
        <div className="p-3 flex-shrink-0 w-full">
            <h3 className="text-lg font-bold mb-3 text-electric-yellow tracking-wider">Sprite</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3 text-sm items-center">
                <label htmlFor="sprite-name" className="font-semibold text-slate-300">Name</label>
                <input id="sprite-name" type="text" value={localName} onChange={e => setLocalName(e.target.value)} onBlur={commitName} onKeyDown={e => handleKeyDown(e, commitName)} className={`${inputClasses} md:col-span-3`} />
                
                <label htmlFor="sprite-x" className="font-semibold text-slate-300">X</label>
                <input id="sprite-x" type="number" value={localX} onChange={e => setLocalX(e.target.value)} onBlur={commitPosition} onKeyDown={e => handleKeyDown(e, commitPosition)} className={inputClasses} />
                
                <label htmlFor="sprite-y" className="font-semibold text-slate-300">Y</label>
                <input id="sprite-y" type="number" value={localY} onChange={e => setLocalY(e.target.value)} onBlur={commitPosition} onKeyDown={e => handleKeyDown(e, commitPosition)} className={inputClasses} />
                
                <label htmlFor="sprite-size" className="font-semibold text-slate-300">Size</label>
                <input id="sprite-size" type="number" value={localSize} onChange={e => setLocalSize(e.target.value)} onBlur={commitSize} onKeyDown={e => handleKeyDown(e, commitSize)} className={inputClasses} />

                <label className="font-semibold text-slate-300">Show</label>
                <button onClick={() => onUpdate({ visible: !visible })} className="w-10 h-10 flex items-center justify-center bg-slate-700 rounded-md hover:bg-slate-600">
                    {visible ? <EyeIcon/> : <EyeSlashIcon/>}
                </button>

                <label htmlFor="sprite-rotation" className="font-semibold text-slate-300">Direction</label>
                <input id="sprite-rotation" type="number" value={localRotation} onChange={e => setLocalRotation(e.target.value)} onBlur={commitRotation} onKeyDown={e => handleKeyDown(e, commitRotation)} className={inputClasses} />
            </div>

            <div className="mt-4 flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 flex flex-col items-center">
                    <label className="font-semibold text-slate-300 text-sm mb-1">Costume</label>
                     <div className="flex items-center justify-center gap-2">
                        <button onClick={() => changeCostume(-1)} className="p-2 bg-slate-700 rounded-full hover:bg-slate-600"><ChevronLeftIcon/></button>
                        <div className="w-16 h-16 bg-space-dark rounded-md flex items-center justify-center p-1">
                            {renderCostumePreview(costume)}
                        </div>
                        <button onClick={() => changeCostume(1)} className="p-2 bg-slate-700 rounded-full hover:bg-slate-600"><ChevronRightIcon/></button>
                    </div>
                </div>
                 <div className="flex-1 w-full md:w-auto">
                     <label htmlFor="sprite-volume" className="font-semibold text-slate-300 text-sm mb-1 block text-center md:text-left">Volume</label>
                     <input
                         id="sprite-volume"
                         type="range"
                         min="0"
                         max="100"
                         value={localVolume}
                         onChange={(e) => setLocalVolume(e.target.value)}
                         onMouseUp={commitVolume}
                         onTouchEnd={commitVolume}
                         className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                     />
                 </div>
            </div>
        </div>
    );
};