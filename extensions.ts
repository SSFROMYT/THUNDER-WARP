// FIX: Import React to make the React namespace available for type annotations like React.FC.
import React from 'react';
import { BlockCategory, BlockName, BlockTemplate } from './types';
import { PenIcon, ThreeDIcon } from './components/Icons';

export interface Extension {
    id: string;
    name: string;
    description: string;
    icon: React.FC;
    category: BlockCategory;
    blocks: BlockTemplate[];
}

const PEN_BLOCKS: BlockTemplate[] = [
    {
        name: BlockName.PEN_ERASE_ALL,
        category: BlockCategory.PEN,
        shape: 'stack',
        label: 'erase all',
    },
    {
        name: BlockName.PEN_DOWN,
        category: BlockCategory.PEN,
        shape: 'stack',
        label: 'pen down',
    },
    {
        name: BlockName.PEN_UP,
        category: BlockCategory.PEN,
        shape: 'stack',
        label: 'pen up',
    },
    {
        name: BlockName.PEN_SET_COLOR,
        category: BlockCategory.PEN,
        shape: 'stack',
        label: 'set pen color to {color}',
        paramDefs: [{ name: 'color', type: 'color', defaultValue: '#ffc700' }],
        defaultParams: { color: '#ffc700' },
    },
    {
        name: BlockName.PEN_SET_SIZE,
        category: BlockCategory.PEN,
        shape: 'stack',
        label: 'set pen size to {size}',
        paramDefs: [{ name: 'size', type: 'number', defaultValue: 10 }],
        defaultParams: { size: 10 },
    },
];

const THREED_BLOCKS: BlockTemplate[] = [
    {
        name: BlockName.THREED_CREATE_OBJECT,
        category: BlockCategory.THREED,
        shape: 'stack',
        label: 'Make {object}',
        paramDefs: [{ name: 'object', type: 'text', defaultValue: 'a floor with grass texture' }],
        defaultParams: { object: 'a floor with grass texture' },
    }
];

const PEN_EXTENSION: Extension = {
    id: 'pen',
    name: 'Pen',
    description: 'Draw with your sprites.',
    icon: PenIcon,
    category: BlockCategory.PEN,
    blocks: PEN_BLOCKS,
};

const THREED_EXTENSION: Extension = {
    id: '3d',
    name: '3D',
    description: 'Create 3D objects with AI.',
    icon: ThreeDIcon,
    category: BlockCategory.THREED,
    blocks: THREED_BLOCKS,
};


export const ALL_EXTENSIONS: Extension[] = [
    PEN_EXTENSION,
    THREED_EXTENSION,
];
