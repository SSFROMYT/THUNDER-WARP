export enum BlockCategory {
    MOTION = 'Motion',
    LOOKS = 'Looks',
    SOUND = 'Sound',
    EVENTS = 'Events',
    CONTROL = 'Control',
    SENSING = 'Sensing',
    OPERATORS = 'Operators',
    VARIABLES = 'Variables',
    MY_BLOCKS = 'My Blocks',
    PEN = 'Pen',
    THREED = '3D',
}

export enum BlockName {
    // Motion
    MOTION_MOVE_STEPS = 'MOTION_MOVE_STEPS',
    MOTION_TURN_CW = 'MOTION_TURN_CW',
    MOTION_TURN_CCW = 'MOTION_TURN_CCW',
    MOTION_GOTO_XY = 'MOTION_GOTO_XY',
    MOTION_GOTO = 'MOTION_GOTO',
    MOTION_POINT_TOWARDS = 'MOTION_POINT_TOWARDS',
    MOTION_CHANGE_X_BY = 'MOTION_CHANGE_X_BY',
    MOTION_SET_X = 'MOTION_SET_X',
    MOTION_CHANGE_Y_BY = 'MOTION_CHANGE_Y_BY',
    MOTION_SET_Y = 'MOTION_SET_Y',
    MOTION_IF_ON_EDGE_BOUNCE = 'MOTION_IF_ON_EDGE_BOUNCE',
    MOTION_X_POSITION = 'MOTION_X_POSITION',
    MOTION_Y_POSITION = 'MOTION_Y_POSITION',
    MOTION_DIRECTION = 'MOTION_DIRECTION',

    // Looks
    LOOKS_SAY_FOR_SECS = 'LOOKS_SAY_FOR_SECS',
    LOOKS_SAY = 'LOOKS_SAY',
    LOOKS_THINK_FOR_SECS = 'LOOKS_THINK_FOR_SECS',
    LOOKS_THINK = 'LOOKS_THINK',
    LOOKS_SWITCH_COSTUME = 'LOOKS_SWITCH_COSTUME',
    LOOKS_NEXT_COSTUME = 'LOOKS_NEXT_COSTUME',
    LOOKS_CHANGE_SIZE_BY = 'LOOKS_CHANGE_SIZE_BY',
    LOOKS_SET_SIZE = 'LOOKS_SET_SIZE',
    LOOKS_SHOW = 'LOOKS_SHOW',
    LOOKS_HIDE = 'LOOKS_HIDE',
    LOOKS_COSTUME_NUMBER = 'LOOKS_COSTUME_NUMBER',
    LOOKS_SIZE = 'LOOKS_SIZE',

    // Sound
    SOUND_PLAY = 'SOUND_PLAY',
    SOUND_PLAY_UNTIL_DONE = 'SOUND_PLAY_UNTIL_DONE',
    SOUND_STOP_ALL = 'SOUND_STOP_ALL',
    SOUND_CHANGE_VOLUME_BY = 'SOUND_CHANGE_VOLUME_BY',
    SOUND_SET_VOLUME = 'SOUND_SET_VOLUME',
    SOUND_VOLUME = 'SOUND_VOLUME',

    // Events
    EVENTS_WHEN_FLAG_CLICKED = 'EVENTS_WHEN_FLAG_CLICKED',
    EVENTS_WHEN_SPRITE_CLICKED = 'EVENTS_WHEN_SPRITE_CLICKED',
    EVENTS_BROADCAST = 'EVENTS_BROADCAST',
    EVENTS_WHEN_I_RECEIVE = 'EVENTS_WHEN_I_RECEIVE',

    // Control
    CONTROL_WAIT = 'CONTROL_WAIT',
    CONTROL_REPEAT = 'CONTROL_REPEAT',
    CONTROL_FOREVER = 'CONTROL_FOREVER',
    CONTROL_IF = 'CONTROL_IF',
    CONTROL_WAIT_UNTIL = 'CONTROL_WAIT_UNTIL',
    
    // Sensing
    SENSING_ASK_AND_WAIT = 'SENSING_ASK_AND_WAIT',
    SENSING_ANSWER = 'SENSING_ANSWER',
    SENSING_TOUCHING = 'SENSING_TOUCHING',
    SENSING_MOUSE_X = 'SENSING_MOUSE_X',
    SENSING_MOUSE_Y = 'SENSING_MOUSE_Y',
    SENSING_KEY_PRESSED = 'SENSING_KEY_PRESSED',

    // Operators
    OPERATORS_ADD = 'OPERATORS_ADD',
    OPERATORS_SUBTRACT = 'OPERATORS_SUBTRACT',
    OPERATORS_MULTIPLY = 'OPERATORS_MULTIPLY',
    OPERATORS_DIVIDE = 'OPERATORS_DIVIDE',
    OPERATORS_RANDOM = 'OPERATORS_RANDOM',
    OPERATORS_GT = 'OPERATORS_GT',
    OPERATORS_LT = 'OPERATORS_LT',
    OPERATORS_EQUALS = 'OPERATORS_EQUALS',
    OPERATORS_AND = 'OPERATORS_AND',
    OPERATORS_OR = 'OPERATORS_OR',
    OPERATORS_NOT = 'OPERATORS_NOT',
    OPERATORS_JOIN = 'OPERATORS_JOIN',
    OPERATORS_LETTER_OF = 'OPERATORS_LETTER_OF',
    OPERATORS_LENGTH = 'OPERATORS_LENGTH',
    OPERATORS_CONTAINS = 'OPERATORS_CONTAINS',
    OPERATORS_MOD = 'OPERATORS_MOD',
    OPERATORS_ROUND = 'OPERATORS_ROUND',
    OPERATORS_MATH_OP = 'OPERATORS_MATH_OP',

    // Variables & My Blocks
    VARIABLES_SET = 'VARIABLES_SET',
    VARIABLES_CHANGE = 'VARIABLES_CHANGE',
    VARIABLES_REPORTER = 'VARIABLES_REPORTER',
    MYBLOCKS_DEFINE = 'MYBLOCKS_DEFINE',
    MYBLOCKS_RUN = 'MYBLOCKS_RUN',

    // Extensions
    PEN_ERASE_ALL = 'PEN_ERASE_ALL',
    PEN_DOWN = 'PEN_DOWN',
    PEN_UP = 'PEN_UP',
    PEN_SET_COLOR = 'PEN_SET_COLOR',
    PEN_SET_SIZE = 'PEN_SET_SIZE',
    THREED_CREATE_OBJECT = 'THREED_CREATE_OBJECT',
}

export type ParamValue = number | string | { variable: string } | ScriptBlock;

export interface BlockParam {
    name: string;
    type: 'number' | 'text' | 'variable_dropdown' | 'script_dropdown' | 'costume_dropdown' | 'sound_dropdown' | 'color' | 'dropdown';
    defaultValue: number | string;
    options?: readonly string[];
}

export interface BlockTemplate {
    name: BlockName;
    category: BlockCategory;
    label: string;
    shape: 'hat' | 'stack' | 'reporter' | 'c_block';
    paramDefs?: BlockParam[];
    defaultParams?: Record<string, number | string>;
}

export interface ScriptBlock extends BlockTemplate {
    id: string;
    params: Record<string, ParamValue>;
    x: number;
    y: number;
}

export interface SpriteState {
    id: string;
    name: string;
    x: number;
    y: number;
    rotation: number;
    visible: boolean;
    // FIX: Renamed 'bubble' to 'message' to match its usage in the rest of the application.
    message: string | null;
    costume: string;
    size: number;
    volume: number;
    penState: {
      isDown: boolean;
      color: string;
      size: number;
    };
}

export interface ThreeDObject {
    id: string;
    type: 'floor' | 'box';
    prompt: string;
    textureData: string;
}
