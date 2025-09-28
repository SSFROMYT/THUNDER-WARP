import { BlockCategory, BlockName } from './types';
import type { BlockTemplate } from './types';

export const CATEGORY_COLORS: Record<BlockCategory, { bg: string; text: string; dark: string; }> = {
    [BlockCategory.MOTION]: { bg: 'bg-cyan-500', text: 'text-white', dark: '#0891B2' },
    [BlockCategory.LOOKS]: { bg: 'bg-fuchsia-500', text: 'text-white', dark: '#A21CAF' },
    [BlockCategory.SOUND]: { bg: 'bg-purple-500', text: 'text-white', dark: '#6B21A8' },
    [BlockCategory.EVENTS]: { bg: 'bg-yellow-400', text: 'text-slate-900', dark: '#CA8A04' },
    [BlockCategory.CONTROL]: { bg: 'bg-amber-500', text: 'text-white', dark: '#B45309' },
    [BlockCategory.SENSING]: { bg: 'bg-blue-400', text: 'text-white', dark: '#3B82F6' },
    [BlockCategory.OPERATORS]: { bg: 'bg-lime-500', text: 'text-white', dark: '#65A30D' },
    [BlockCategory.VARIABLES]: { bg: 'bg-orange-500', text: 'text-white', dark: '#C2410C' },
    [BlockCategory.MY_BLOCKS]: { bg: 'bg-red-500', text: 'text-white', dark: '#B91C1C' },
    [BlockCategory.PEN]: { bg: 'bg-emerald-500', text: 'text-white', dark: '#047857' },
    [BlockCategory.THREED]: { bg: 'bg-sky-600', text: 'text-white', dark: '#0369A1' },
};

export const MOTION_BLOCKS: BlockTemplate[] = [
    {
        name: BlockName.MOTION_MOVE_STEPS,
        category: BlockCategory.MOTION,
        shape: 'stack',
        label: 'move {steps} steps',
        paramDefs: [{ name: 'steps', type: 'number', defaultValue: 10 }],
        defaultParams: { steps: 10 },
    },
    {
        name: BlockName.MOTION_TURN_CW,
        category: BlockCategory.MOTION,
        shape: 'stack',
        label: 'turn ↻ {degrees} degrees',
        paramDefs: [{ name: 'degrees', type: 'number', defaultValue: 15 }],
        defaultParams: { degrees: 15 },
    },
    {
        name: BlockName.MOTION_TURN_CCW,
        category: BlockCategory.MOTION,
        shape: 'stack',
        label: 'turn ↺ {degrees} degrees',
        paramDefs: [{ name: 'degrees', type: 'number', defaultValue: 15 }],
        defaultParams: { degrees: 15 },
    },
    {
        name: BlockName.MOTION_GOTO,
        category: BlockCategory.MOTION,
        shape: 'stack',
        label: 'go to {target}',
        paramDefs: [{ name: 'target', type: 'dropdown', defaultValue: '_random_', options: ['_random_', '_mouse_'] }],
        defaultParams: { target: '_random_' },
    },
    {
        name: BlockName.MOTION_GOTO_XY,
        category: BlockCategory.MOTION,
        shape: 'stack',
        label: 'go to x: {x} y: {y}',
        paramDefs: [
            { name: 'x', type: 'number', defaultValue: 0 },
            { name: 'y', type: 'number', defaultValue: 0 }
        ],
        defaultParams: { x: 0, y: 0 },
    },
    {
        name: BlockName.MOTION_POINT_TOWARDS,
        category: BlockCategory.MOTION,
        shape: 'stack',
        label: 'point towards {target}',
        paramDefs: [{ name: 'target', type: 'dropdown', defaultValue: '_mouse_', options: ['_mouse_'] }],
        defaultParams: { target: '_mouse_' },
    },
    {
        name: BlockName.MOTION_CHANGE_X_BY,
        category: BlockCategory.MOTION,
        shape: 'stack',
        label: 'change x by {dx}',
        paramDefs: [{ name: 'dx', type: 'number', defaultValue: 10 }],
        defaultParams: { dx: 10 },
    },
    {
        name: BlockName.MOTION_SET_X,
        category: BlockCategory.MOTION,
        shape: 'stack',
        label: 'set x to {x}',
        paramDefs: [{ name: 'x', type: 'number', defaultValue: 0 }],
        defaultParams: { x: 0 },
    },
    {
        name: BlockName.MOTION_CHANGE_Y_BY,
        category: BlockCategory.MOTION,
        shape: 'stack',
        label: 'change y by {dy}',
        paramDefs: [{ name: 'dy', type: 'number', defaultValue: 10 }],
        defaultParams: { dy: 10 },
    },
    {
        name: BlockName.MOTION_SET_Y,
        category: BlockCategory.MOTION,
        shape: 'stack',
        label: 'set y to {y}',
        paramDefs: [{ name: 'y', type: 'number', defaultValue: 0 }],
        defaultParams: { y: 0 },
    },
    {
        name: BlockName.MOTION_IF_ON_EDGE_BOUNCE,
        category: BlockCategory.MOTION,
        shape: 'stack',
        label: 'if on edge, bounce',
    },
    { name: BlockName.MOTION_X_POSITION, category: BlockCategory.MOTION, shape: 'reporter', label: 'x position' },
    { name: BlockName.MOTION_Y_POSITION, category: BlockCategory.MOTION, shape: 'reporter', label: 'y position' },
    { name: BlockName.MOTION_DIRECTION, category: BlockCategory.MOTION, shape: 'reporter', label: 'direction' },
];

export const LOOKS_BLOCKS: BlockTemplate[] = [
    {
        name: BlockName.LOOKS_SAY_FOR_SECS,
        category: BlockCategory.LOOKS,
        shape: 'stack',
        label: 'say {message} for {seconds} seconds',
        paramDefs: [
            { name: 'message', type: 'text', defaultValue: 'Hello!' },
            { name: 'seconds', type: 'number', defaultValue: 2 }
        ],
        defaultParams: { message: 'Hello!', seconds: 2 },
    },
    {
        name: BlockName.LOOKS_SAY,
        category: BlockCategory.LOOKS,
        shape: 'stack',
        label: 'say {message}',
        paramDefs: [{ name: 'message', type: 'text', defaultValue: 'Hello!' }],
        defaultParams: { message: 'Hello!' },
    },
    {
        name: BlockName.LOOKS_THINK_FOR_SECS,
        category: BlockCategory.LOOKS,
        shape: 'stack',
        label: 'think {message} for {seconds} seconds',
        paramDefs: [
            { name: 'message', type: 'text', defaultValue: 'Hmm...' },
            { name: 'seconds', type: 'number', defaultValue: 2 }
        ],
        defaultParams: { message: 'Hmm...', seconds: 2 },
    },
    {
        name: BlockName.LOOKS_THINK,
        category: BlockCategory.LOOKS,
        shape: 'stack',
        label: 'think {message}',
        paramDefs: [{ name: 'message', type: 'text', defaultValue: 'Hmm...' }],
        defaultParams: { message: 'Hmm...' },
    },
    {
        name: BlockName.LOOKS_SWITCH_COSTUME,
        category: BlockCategory.LOOKS,
        shape: 'stack',
        label: 'switch costume to {costume}',
        paramDefs: [
            { name: 'costume', type: 'costume_dropdown', defaultValue: '🐱' }
        ],
        defaultParams: { costume: '🐱' },
    },
    {
        name: BlockName.LOOKS_NEXT_COSTUME,
        category: BlockCategory.LOOKS,
        shape: 'stack',
        label: 'next costume',
    },
    {
        name: BlockName.LOOKS_CHANGE_SIZE_BY,
        category: BlockCategory.LOOKS,
        shape: 'stack',
        label: 'change size by {size}',
        paramDefs: [{ name: 'size', type: 'number', defaultValue: 10 }],
        defaultParams: { size: 10 },
    },
    {
        name: BlockName.LOOKS_SET_SIZE,
        category: BlockCategory.LOOKS,
        shape: 'stack',
        label: 'set size to {size}%',
        paramDefs: [{ name: 'size', type: 'number', defaultValue: 100 }],
        defaultParams: { size: 100 },
    },
    { name: BlockName.LOOKS_SHOW, category: BlockCategory.LOOKS, shape: 'stack', label: 'show' },
    { name: BlockName.LOOKS_HIDE, category: BlockCategory.LOOKS, shape: 'stack', label: 'hide' },
    { name: BlockName.LOOKS_COSTUME_NUMBER, category: BlockCategory.LOOKS, shape: 'reporter', label: 'costume #' },
    { name: BlockName.LOOKS_SIZE, category: BlockCategory.LOOKS, shape: 'reporter', label: 'size' },
];

export const SOUND_BLOCKS: BlockTemplate[] = [
    {
        name: BlockName.SOUND_PLAY,
        category: BlockCategory.SOUND,
        shape: 'stack',
        label: 'play sound {sound}',
        paramDefs: [{ name: 'sound', type: 'sound_dropdown', defaultValue: 'Laser' }],
        defaultParams: { sound: 'Laser' },
    },
    {
        name: BlockName.SOUND_PLAY_UNTIL_DONE,
        category: BlockCategory.SOUND,
        shape: 'stack',
        label: 'play sound {sound} until done',
        paramDefs: [{ name: 'sound', type: 'sound_dropdown', defaultValue: 'Laser' }],
        defaultParams: { sound: 'Laser' },
    },
    {
        name: BlockName.SOUND_STOP_ALL,
        category: BlockCategory.SOUND,
        shape: 'stack',
        label: 'stop all sounds',
    },
    {
        name: BlockName.SOUND_CHANGE_VOLUME_BY,
        category: BlockCategory.SOUND,
        shape: 'stack',
        label: 'change volume by {volume}',
        paramDefs: [{ name: 'volume', type: 'number', defaultValue: -10 }],
        defaultParams: { volume: -10 },
    },
    {
        name: BlockName.SOUND_SET_VOLUME,
        category: BlockCategory.SOUND,
        shape: 'stack',
        label: 'set volume to {volume}%',
        paramDefs: [{ name: 'volume', type: 'number', defaultValue: 100 }],
        defaultParams: { volume: 100 },
    },
    {
        name: BlockName.SOUND_VOLUME,
        category: BlockCategory.SOUND,
        shape: 'reporter',
        label: 'volume',
    },
];

export const EVENTS_BLOCKS: BlockTemplate[] = [
    {
        name: BlockName.EVENTS_WHEN_FLAG_CLICKED,
        category: BlockCategory.EVENTS,
        shape: 'hat',
        label: 'when 🏁 clicked',
    },
    {
        name: BlockName.EVENTS_WHEN_SPRITE_CLICKED,
        category: BlockCategory.EVENTS,
        shape: 'hat',
        label: 'when this sprite clicked',
    },
    {
        name: BlockName.EVENTS_BROADCAST,
        category: BlockCategory.EVENTS,
        shape: 'stack',
        label: 'broadcast {message}',
        paramDefs: [{ name: 'message', type: 'text', defaultValue: 'message1' }],
        defaultParams: { message: 'message1' },
    },
    {
        name: BlockName.EVENTS_WHEN_I_RECEIVE,
        category: BlockCategory.EVENTS,
        shape: 'hat',
        label: 'when I receive {message}',
        paramDefs: [{ name: 'message', type: 'text', defaultValue: 'message1' }],
        defaultParams: { message: 'message1' },
    },
];

const KEYS = ['space', 'up arrow', 'down arrow', 'right arrow', 'left arrow', 'any', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

export const CONTROL_BLOCKS: BlockTemplate[] = [
    {
        name: BlockName.CONTROL_WAIT,
        category: BlockCategory.CONTROL,
        shape: 'stack',
        label: 'wait {seconds} seconds',
        paramDefs: [{ name: 'seconds', type: 'number', defaultValue: 1 }],
        defaultParams: { seconds: 1 },
    },
    {
        name: BlockName.CONTROL_REPEAT,
        category: BlockCategory.CONTROL,
        shape: 'c_block',
        label: 'repeat {times}',
        paramDefs: [{ name: 'times', type: 'number', defaultValue: 10 }],
        defaultParams: { times: 10 },
    },
    {
        name: BlockName.CONTROL_FOREVER,
        category: BlockCategory.CONTROL,
        shape: 'c_block',
        label: 'forever',
    },
    {
        name: BlockName.CONTROL_IF,
        category: BlockCategory.CONTROL,
        shape: 'c_block',
        label: 'if {condition} then',
        paramDefs: [{ name: 'condition', type: 'text', defaultValue: '' }],
    },
    {
        name: BlockName.CONTROL_WAIT_UNTIL,
        category: BlockCategory.CONTROL,
        shape: 'stack',
        label: 'wait until {condition}',
        paramDefs: [{ name: 'condition', type: 'text', defaultValue: '' }],
    },
];

export const SENSING_BLOCKS: BlockTemplate[] = [
    {
        name: BlockName.SENSING_ASK_AND_WAIT,
        category: BlockCategory.SENSING,
        shape: 'stack',
        label: 'ask {question} and wait',
        paramDefs: [{ name: 'question', type: 'text', defaultValue: "What's your name?" }],
        defaultParams: { question: "What's your name?" },
    },
    {
        name: BlockName.SENSING_TOUCHING,
        category: BlockCategory.SENSING,
        shape: 'reporter',
        label: 'touching {target}?',
        paramDefs: [{ name: 'target', type: 'dropdown', defaultValue: '_mouse_', options: ['_mouse_', '_edge_'] }],
        defaultParams: { target: '_mouse_' },
    },
    {
        name: BlockName.SENSING_KEY_PRESSED,
        category: BlockCategory.SENSING,
        shape: 'reporter',
        label: 'key {key} pressed?',
        paramDefs: [{ name: 'key', type: 'dropdown', defaultValue: 'space', options: KEYS }],
        defaultParams: { key: 'space' },
    },
    {
        name: BlockName.SENSING_ANSWER,
        category: BlockCategory.SENSING,
        shape: 'reporter',
        label: 'answer',
    },
    { name: BlockName.SENSING_MOUSE_X, category: BlockCategory.SENSING, shape: 'reporter', label: 'mouse x' },
    { name: BlockName.SENSING_MOUSE_Y, category: BlockCategory.SENSING, shape: 'reporter', label: 'mouse y' },
];

const MATH_OPS = ['abs', 'floor', 'ceiling', 'sqrt', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'ln', 'log', 'e ^', '10 ^'] as const;

export const OPERATORS_BLOCKS: BlockTemplate[] = [
    {
        name: BlockName.OPERATORS_ADD,
        category: BlockCategory.OPERATORS,
        shape: 'reporter',
        label: '{NUM1} + {NUM2}',
        paramDefs: [
            { name: 'NUM1', type: 'number', defaultValue: '' },
            { name: 'NUM2', type: 'number', defaultValue: '' }
        ],
        defaultParams: { NUM1: '', NUM2: '' },
    },
    {
        name: BlockName.OPERATORS_SUBTRACT,
        category: BlockCategory.OPERATORS,
        shape: 'reporter',
        label: '{NUM1} - {NUM2}',
        paramDefs: [
            { name: 'NUM1', type: 'number', defaultValue: '' },
            { name: 'NUM2', type: 'number', defaultValue: '' }
        ],
        defaultParams: { NUM1: '', NUM2: '' },
    },
    {
        name: BlockName.OPERATORS_MULTIPLY,
        category: BlockCategory.OPERATORS,
        shape: 'reporter',
        label: '{NUM1} * {NUM2}',
        paramDefs: [
            { name: 'NUM1', type: 'number', defaultValue: '' },
            { name: 'NUM2', type: 'number', defaultValue: '' }
        ],
        defaultParams: { NUM1: '', NUM2: '' },
    },
    {
        name: BlockName.OPERATORS_DIVIDE,
        category: BlockCategory.OPERATORS,
        shape: 'reporter',
        label: '{NUM1} / {NUM2}',
        paramDefs: [
            { name: 'NUM1', type: 'number', defaultValue: '' },
            { name: 'NUM2', type: 'number', defaultValue: '' }
        ],
        defaultParams: { NUM1: '', NUM2: '' },
    },
    {
        name: BlockName.OPERATORS_RANDOM,
        category: BlockCategory.OPERATORS,
        shape: 'reporter',
        label: 'pick random from {FROM} to {TO}',
        paramDefs: [
            { name: 'FROM', type: 'number', defaultValue: 1 },
            { name: 'TO', type: 'number', defaultValue: 10 }
        ],
        defaultParams: { FROM: 1, TO: 10 },
    },
    {
        name: BlockName.OPERATORS_GT,
        category: BlockCategory.OPERATORS,
        shape: 'reporter',
        label: '{OPERAND1} > {OPERAND2}',
        paramDefs: [
            { name: 'OPERAND1', type: 'text', defaultValue: '' },
            { name: 'OPERAND2', type: 'text', defaultValue: '50' }
        ],
        defaultParams: { OPERAND1: '', OPERAND2: '50' },
    },
    {
        name: BlockName.OPERATORS_LT,
        category: BlockCategory.OPERATORS,
        shape: 'reporter',
        label: '{OPERAND1} < {OPERAND2}',
        paramDefs: [
            { name: 'OPERAND1', type: 'text', defaultValue: '' },
            { name: 'OPERAND2', type: 'text', defaultValue: '50' }
        ],
        defaultParams: { OPERAND1: '', OPERAND2: '50' },
    },
    {
        name: BlockName.OPERATORS_EQUALS,
        category: BlockCategory.OPERATORS,
        shape: 'reporter',
        label: '{OPERAND1} = {OPERAND2}',
        paramDefs: [
            { name: 'OPERAND1', type: 'text', defaultValue: '' },
            { name: 'OPERAND2', type: 'text', defaultValue: '50' }
        ],
        defaultParams: { OPERAND1: '', OPERAND2: '50' },
    },
    {
        name: BlockName.OPERATORS_AND,
        category: BlockCategory.OPERATORS,
        shape: 'reporter',
        label: '{OPERAND1} and {OPERAND2}',
        paramDefs: [
            { name: 'OPERAND1', type: 'text', defaultValue: '' },
            { name: 'OPERAND2', type: 'text', defaultValue: '' }
        ],
        defaultParams: { OPERAND1: '', OPERAND2: '' },
    },
    {
        name: BlockName.OPERATORS_OR,
        category: BlockCategory.OPERATORS,
        shape: 'reporter',
        label: '{OPERAND1} or {OPERAND2}',
        paramDefs: [
            { name: 'OPERAND1', type: 'text', defaultValue: '' },
            { name: 'OPERAND2', type: 'text', defaultValue: '' }
        ],
        defaultParams: { OPERAND1: '', OPERAND2: '' },
    },
    {
        name: BlockName.OPERATORS_NOT,
        category: BlockCategory.OPERATORS,
        shape: 'reporter',
        label: 'not {OPERAND}',
        paramDefs: [ { name: 'OPERAND', type: 'text', defaultValue: '' } ],
        defaultParams: { OPERAND: '' },
    },
    {
        name: BlockName.OPERATORS_JOIN,
        category: BlockCategory.OPERATORS,
        shape: 'reporter',
        label: 'join {STRING1} {STRING2}',
        paramDefs: [
            { name: 'STRING1', type: 'text', defaultValue: 'hello' },
            { name: 'STRING2', type: 'text', defaultValue: 'world' }
        ],
        defaultParams: { STRING1: 'hello', STRING2: 'world' },
    },
    {
        name: BlockName.OPERATORS_LETTER_OF,
        category: BlockCategory.OPERATORS,
        shape: 'reporter',
        label: 'letter {LETTER} of {STRING}',
        paramDefs: [
            { name: 'LETTER', type: 'number', defaultValue: 1 },
            { name: 'STRING', type: 'text', defaultValue: 'world' }
        ],
        defaultParams: { LETTER: 1, STRING: 'world' },
    },
    {
        name: BlockName.OPERATORS_LENGTH,
        category: BlockCategory.OPERATORS,
        shape: 'reporter',
        label: 'length of {STRING}',
        paramDefs: [{ name: 'STRING', type: 'text', defaultValue: 'apple' }],
        defaultParams: { STRING: 'apple' },
    },
    {
        name: BlockName.OPERATORS_CONTAINS,
        category: BlockCategory.OPERATORS,
        shape: 'reporter',
        label: '{STRING1} contains {STRING2}?',
        paramDefs: [
            { name: 'STRING1', type: 'text', defaultValue: 'apple' },
            { name: 'STRING2', type: 'text', defaultValue: 'a' }
        ],
        defaultParams: { STRING1: 'apple', STRING2: 'a' },
    },
    {
        name: BlockName.OPERATORS_MOD,
        category: BlockCategory.OPERATORS,
        shape: 'reporter',
        label: '{NUM1} mod {NUM2}',
        paramDefs: [
            { name: 'NUM1', type: 'number', defaultValue: '' },
            { name: 'NUM2', type: 'number', defaultValue: '' }
        ],
        defaultParams: { NUM1: '', NUM2: '' },
    },
    {
        name: BlockName.OPERATORS_ROUND,
        category: BlockCategory.OPERATORS,
        shape: 'reporter',
        label: 'round {NUM}',
        paramDefs: [{ name: 'NUM', type: 'number', defaultValue: '' }],
        defaultParams: { NUM: '' },
    },
    {
        name: BlockName.OPERATORS_MATH_OP,
        category: BlockCategory.OPERATORS,
        shape: 'reporter',
        label: '{OP} of {NUM}',
        paramDefs: [
            { name: 'OP', type: 'dropdown', defaultValue: 'abs', options: MATH_OPS },
            { name: 'NUM', type: 'number', defaultValue: '10' }
        ],
        defaultParams: { OP: 'abs', NUM: '10' },
    },
];


// FIX: Export ALL_BLOCKS to be used in ScriptArea.tsx for creating new blocks.
export const ALL_BLOCKS = [
    { category: BlockCategory.MOTION, blocks: MOTION_BLOCKS },
    { category: BlockCategory.LOOKS, blocks: LOOKS_BLOCKS },
    { category: BlockCategory.SOUND, blocks: SOUND_BLOCKS },
    { category: BlockCategory.EVENTS, blocks: EVENTS_BLOCKS },
    { category: BlockCategory.CONTROL, blocks: CONTROL_BLOCKS },
    { category: BlockCategory.SENSING, blocks: SENSING_BLOCKS },
    { category: BlockCategory.OPERATORS, blocks: OPERATORS_BLOCKS },
];

export const VARIABLE_BLOCK_TEMPLATES: BlockTemplate[] = [
    {
        name: BlockName.VARIABLES_SET,
        category: BlockCategory.VARIABLES,
        shape: 'stack',
        label: 'set {variable} to {value}',
        paramDefs: [
            { name: 'variable', type: 'variable_dropdown', defaultValue: '' },
            { name: 'value', type: 'text', defaultValue: '0' }
        ],
        defaultParams: { value: '0' },
    },
    {
        name: BlockName.VARIABLES_CHANGE,
        category: BlockCategory.VARIABLES,
        shape: 'stack',
        label: 'change {variable} by {value}',
        paramDefs: [
            { name: 'variable', type: 'variable_dropdown', defaultValue: '' },
            { name: 'value', type: 'number', defaultValue: 1 }
        ],
        defaultParams: { value: 1 },
    },
    {
        name: BlockName.VARIABLES_REPORTER,
        category: BlockCategory.VARIABLES,
        shape: 'reporter',
        label: '{variable}',
        paramDefs: [{ name: 'variable', type: 'variable_dropdown', defaultValue: '' }],
    }
];

export const MY_BLOCKS_TEMPLATES: BlockTemplate[] = [
    {
        name: BlockName.MYBLOCKS_DEFINE,
        category: BlockCategory.MY_BLOCKS,
        shape: 'c_block',
        label: 'create script called {name}',
        paramDefs: [{ name: 'name', type: 'text', defaultValue: 'script1' }],
        defaultParams: { name: 'script1' },
    },
    {
        name: BlockName.MYBLOCKS_RUN,
        category: BlockCategory.MY_BLOCKS,
        shape: 'stack',
        label: 'run script {name}',
        paramDefs: [{ name: 'name', type: 'script_dropdown', defaultValue: '' }],
    },
];
