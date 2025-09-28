

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { BlockPalette } from './components/BlockPalette';
import { ScriptArea } from './components/ScriptArea';
import { Stage } from './components/Stage';
import { SpriteEditor } from './components/SpriteEditor';
import { GreenFlagIcon, StopSignIcon } from './components/Icons';
import { ExtensionModal } from './components/ExtensionModal';
import type { ScriptBlock, SpriteState, ParamValue, ThreeDObject, BlockTemplate } from './types';
import { BlockName, BlockCategory } from './types';
import { SpriteList } from './components/SpriteList';
import { ALL_EXTENSIONS, Extension } from './extensions';
import { 
    EVENTS_BLOCKS, MOTION_BLOCKS, LOOKS_BLOCKS, SOUND_BLOCKS, CONTROL_BLOCKS, SENSING_BLOCKS, OPERATORS_BLOCKS, ALL_BLOCKS as ALL_BLOCK_TEMPLATES, VARIABLE_BLOCK_TEMPLATES, MY_BLOCKS_TEMPLATES
} from './constants';
import { GoogleGenAI } from "@google/genai";
import { Block } from './components/Block';

const COSTUMES = ['🐱', '🐶', '🦊', '🐻', '🐼', '🐸', '🦁', '🐯'];
const SOUNDS = ['Laser', 'Warp', 'Beep', 'Boop'];

const createInitialSpriteState = (id: string, name: string, costume?: string): SpriteState => ({
  id,
  name,
  x: 0,
  y: 0,
  rotation: 90,
  visible: true,
  message: null,
  costume: costume || COSTUMES[0],
  size: 100,
  volume: 100,
  penState: {
    isDown: false,
    color: '#ffc700', // Default to electric yellow
    size: 3,
  }
});

// Approximate heights for script traversal logic
const BLOCK_HEIGHT = 40; // The height of the main block body.
const HAT_BLOCK_HEIGHT = 40; // Hat blocks have the same body height for stacking.
const C_BLOCK_HEADER_HEIGHT = 36; // The visible top part of a C-block.
const C_BLOCK_BOTTOM_HEIGHT = 16;
const C_BLOCK_INDENT = 20; // How much child blocks are indented.
const C_BLOCK_MIN_BODY_HEIGHT = 24;


function App() {
  const firstSpriteId = `sprite-${Date.now()}`;
  const [sprites, setSprites] = useState<SpriteState[]>([createInitialSpriteState(firstSpriteId, 'Sprite1')]);
  const [activeSpriteId, setActiveSpriteId] = useState<string | null>(firstSpriteId);
  const [scripts, setScripts] = useState<Record<string, ScriptBlock[]>>({ [firstSpriteId]: [] });
  
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [variables, setVariables] = useState<Record<string, string | number>>({ answer: '' });
  const [monitors, setMonitors] = useState<Record<string, boolean>>({ answer: false });
  const [definedScripts, setDefinedScripts] = useState<string[]>([]);
  
  const [activeExtensions, setActiveExtensions] = useState<Extension[]>([]);
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);

  const [threeDObjects, setThreeDObjects] = useState<ThreeDObject[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [askingState, setAskingState] = useState<{ question: string; spriteId: string; resolve: (answer: string) => void; } | null>(null);

  const [activeTab, setActiveTab] = useState<'code' | 'costumes' | 'sounds'>('code');

  // Touch Drag & Drop state
  const [draggedBlockInfo, setDraggedBlockInfo] = useState<{
    block: BlockTemplate | ScriptBlock;
    clientX: number;
    clientY: number;
    offsetX: number;
    offsetY: number;
    isNew: boolean;
    stack?: ScriptBlock[]; // Store the whole stack for moving
  } | null>(null);

  const activeSprite = sprites.find(s => s.id === activeSpriteId);
  const activeScript = activeSpriteId ? scripts[activeSpriteId] || [] : [];
  const scriptAreaRef = useRef<HTMLDivElement>(null);


  const executionRef = useRef<{ running: boolean }>({ running: true });
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourcesRef = useRef<AudioScheduledSourceNode[]>([]);
  const canvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const prevSpritesRef = useRef<SpriteState[]>([]);
  
  const paletteBlocks = useMemo(() => {
    let baseCategories = [
        { category: BlockCategory.MOTION, blocks: MOTION_BLOCKS },
        { category: BlockCategory.LOOKS, blocks: LOOKS_BLOCKS },
        { category: BlockCategory.SOUND, blocks: SOUND_BLOCKS },
        { category: BlockCategory.EVENTS, blocks: EVENTS_BLOCKS },
        { category: BlockCategory.CONTROL, blocks: CONTROL_BLOCKS },
        { category: BlockCategory.SENSING, blocks: SENSING_BLOCKS },
        { category: BlockCategory.OPERATORS, blocks: OPERATORS_BLOCKS },
    ];

    const extensionBlocks = activeExtensions.map(ext => ({
        category: ext.category,
        blocks: ext.blocks,
    }));
    
    return [...baseCategories, ...extensionBlocks];
  }, [activeExtensions]);

    // Stack calculation logic, moved here to be accessible by touch handlers
    const findChildStack = useCallback((parentBlock: ScriptBlock, allBlocks: ScriptBlock[]): ScriptBlock[] => {
        const stack: ScriptBlock[] = [];
        if (parentBlock.shape !== 'c_block') return stack;

        const findNext = (current: ScriptBlock): ScriptBlock | undefined => {
            const nextY = current.y + BLOCK_HEIGHT;
            return allBlocks.find(b =>
                b.id !== current.id && b.shape === 'stack' &&
                Math.abs(b.x - current.x) < 10 &&
                Math.abs(b.y - nextY) < 10
            );
        };

        let firstChild = allBlocks.find(b =>
            b.shape === 'stack' &&
            Math.abs(b.x - (parentBlock.x + C_BLOCK_INDENT)) < 10 &&
            Math.abs(b.y - (parentBlock.y + C_BLOCK_HEADER_HEIGHT)) < 10
        );

        if (firstChild) {
            stack.push(firstChild);
            let current = firstChild;
            let next = findNext(current);
            while (next) {
                stack.push(next);
                current = next;
                next = findNext(current);
            }
        }
        return stack;
    }, []);

    const cBlockBodyHeights = useMemo(() => {
        const heights: Record<string, number> = {};
        const cBlocks = activeScript.filter(b => b.shape === 'c_block');
        for (const cBlock of cBlocks) {
            const childStack = findChildStack(cBlock, activeScript);
            const childrenHeight = childStack.length * BLOCK_HEIGHT;
            heights[cBlock.id] = Math.max(C_BLOCK_MIN_BODY_HEIGHT, childrenHeight);
        }
        return heights;
    }, [activeScript, findChildStack]);

    const getStack = useCallback((headBlock: ScriptBlock, allBlocks: ScriptBlock[]): ScriptBlock[] => {
        const stack = [headBlock];
        if (headBlock.shape === 'reporter') return stack;
        let current = headBlock;
        while (current) {
        const isCBlock = current.shape === 'c_block';
        const currentHeight = isCBlock 
            ? C_BLOCK_HEADER_HEIGHT + (cBlockBodyHeights[current.id] || C_BLOCK_MIN_BODY_HEIGHT) + C_BLOCK_BOTTOM_HEIGHT 
            : (current.shape === 'hat' ? HAT_BLOCK_HEIGHT : BLOCK_HEIGHT);
        
        const nextY = current.y + currentHeight;

        const nextBlock = allBlocks.find(b => 
            b.id !== current.id &&
            b.shape === 'stack' &&
            Math.abs(b.x - current.x) < 20 &&
            Math.abs(b.y - nextY) < 20
        );
        if (nextBlock) {
            stack.push(nextBlock);
            current = nextBlock;
        } else {
            break;
        }
        }
        return stack;
    }, [cBlockBodyHeights]);


  useEffect(() => {
    // Collect defined scripts from all sprites
    const allScripts = Object.values(scripts).flat();
    const scriptNames = allScripts
        .filter((b: ScriptBlock) => b.name === BlockName.MYBLOCKS_DEFINE)
        .map((b: ScriptBlock) => String(b.params.name || ''))
        .filter(name => name.trim());
    setDefinedScripts([...new Set(scriptNames)]);
  }, [scripts]);

  useEffect(() => {
    const ctx = canvasCtxRef.current;
    if (!ctx) return;

    const stageWidth = 480;
    const stageHeight = 360;

    sprites.forEach(sprite => {
        const prevSprite = prevSpritesRef.current.find(p => p.id === sprite.id);
        if (prevSprite && sprite.penState.isDown) {
            if (sprite.x !== prevSprite.x || sprite.y !== prevSprite.y) {
                ctx.beginPath();
                ctx.moveTo(prevSprite.x + stageWidth / 2, -prevSprite.y + stageHeight / 2);
                ctx.lineTo(sprite.x + stageWidth / 2, -sprite.y + stageHeight / 2);
                ctx.strokeStyle = sprite.penState.color;
                ctx.lineWidth = sprite.penState.size;
                ctx.lineCap = 'round';
                ctx.stroke();
            }
        }
    });

    prevSpritesRef.current = sprites.map(s => ({...s, penState: {...s.penState}}));
  }, [sprites]);


  const createVariable = (name: string) => {
    const trimmedName = name.trim();
    if (trimmedName && trimmedName.toLowerCase() === 'answer') {
        alert("'answer' is a reserved variable name and cannot be created.");
        return;
    }
    if (trimmedName && !variables.hasOwnProperty(trimmedName)) {
        setVariables(prev => ({ ...prev, [trimmedName]: 0 }));
        setMonitors(prev => ({ ...prev, [trimmedName]: false }));
    } else if (trimmedName) {
        alert("A variable with this name already exists or the name is invalid.");
    }
  };
  
  const toggleMonitor = (name: string) => {
    setMonitors(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const setActiveScript = useCallback((newScript: ScriptBlock[] | ((prev: ScriptBlock[]) => ScriptBlock[])) => {
      if (!activeSpriteId) return;
      setScripts(s => ({
          ...s,
          [activeSpriteId]: typeof newScript === 'function' ? newScript(s[activeSpriteId] || []) : newScript
      }));
  }, [activeSpriteId]);

  const updateBlockParam = (blockId: string, paramName: string, value: ParamValue) => {
    setActiveScript(script => 
        (script || []).map(block => 
            block.id === blockId ? { ...block, params: { ...block.params, [paramName]: value } } : block
        )
    );
  };
  
  const updateSpriteState = useCallback((id: string, updates: Partial<Omit<SpriteState, 'id'>>) => {
      setSprites(s => s.map(sprite => sprite.id === id ? { ...sprite, ...updates } : sprite));
  }, []);

  const updateActiveSpriteState = (updates: Partial<Omit<SpriteState, 'id'>>) => {
    if (activeSpriteId) {
        // Normalize rotation
        if (typeof updates.rotation === 'number') {
            const newRotation = updates.rotation % 360;
            updates.rotation = newRotation < 0 ? newRotation + 360 : newRotation;
        }
        updateSpriteState(activeSpriteId, updates);
    }
  };

  const addSprite = () => {
      const newId = `sprite-${Date.now()}`;
      const newName = `Sprite${sprites.length + 1}`;
      // Cycle through costumes for new sprites
      const newCostume = COSTUMES[sprites.length % COSTUMES.length];
      const newSprite = createInitialSpriteState(newId, newName, newCostume);
      setSprites(s => [...s, newSprite]);
      setScripts(s => ({...s, [newId]: []}));
      setActiveSpriteId(newId);
  };

  const addSpriteFromUpload = (imageDataUrl: string) => {
      const newId = `sprite-${Date.now()}`;
      const newName = `Sprite${sprites.length + 1}`;
      const newSprite = createInitialSpriteState(newId, newName, imageDataUrl);
      setSprites(s => [...s, newSprite]);
      setScripts(s => ({...s, [newId]: []}));
      setActiveSpriteId(newId);
  };

  const deleteSprite = (idToDelete: string) => {
      const newSprites = sprites.filter(s => s.id !== idToDelete);
      const newScripts = { ...scripts };
      delete newScripts[idToDelete];

      let newActiveSpriteId: string | null = activeSpriteId;
      if (activeSpriteId === idToDelete) {
          newActiveSpriteId = newSprites.length > 0 ? newSprites[0].id : null;
      }
      
      setSprites(newSprites);
      setScripts(newScripts);
      setActiveSpriteId(newActiveSpriteId);
  };

  const resetStage = () => {
    if (canvasCtxRef.current) {
        const { canvas } = canvasCtxRef.current;
        canvasCtxRef.current.clearRect(0, 0, canvas.width, canvas.height);
    }
    setSprites(s => s.map(sprite => {
        const { id, name, costume } = sprite;
        // Keep original name, id, and costume, but reset everything else
        return createInitialSpriteState(id, name, costume);
    }));
    setThreeDObjects([]);
  };

  const stopAllSounds = useCallback(() => {
    activeSourcesRef.current.forEach(source => source.stop());
    activeSourcesRef.current = [];
  }, []);
  
  const stopScript = useCallback(() => {
    if (askingState) {
        askingState.resolve(''); // Resolve promise to unblock execution
        setAskingState(null);
    }
    executionRef.current.running = false;
    setIsRunning(false);
    setSprites(s => s.map(sprite => ({ ...sprite, message: null })));
    stopAllSounds();
  }, [askingState, stopAllSounds]);
  
  const resolveParam = async (paramValue: ParamValue, spriteId: string, currentScript: ScriptBlock[]): Promise<string | number> => {
    if (typeof paramValue === 'string' || typeof paramValue === 'number') {
        return paramValue;
    }
    if (typeof paramValue === 'object' && paramValue !== null) {
        if ('variable' in paramValue) {
            const varName = (paramValue as { variable: string }).variable;
            return variables[varName] ?? '';
        }
        if ('shape' in paramValue && (paramValue as ScriptBlock).shape === 'reporter') {
            return await executeReporterBlock(paramValue as ScriptBlock, spriteId, currentScript);
        }
    }
    return ''; // Default value
  };

  const executeReporterBlock = async (block: ScriptBlock, spriteId: string, currentScript: ScriptBlock[]): Promise<string | number> => {
      const params = block.params as any;
      
      const getNum = async (paramName: string): Promise<number> => {
          const val = await resolveParam(params[paramName], spriteId, currentScript);
          return Number(val) || 0;
      };

      const getStr = async (paramName: string): Promise<string> => {
        const val = await resolveParam(params[paramName], spriteId, currentScript);
        return String(val);
      };
      
      const getVal = async (paramName: string): Promise<string | number> => {
        return resolveParam(params[paramName], spriteId, currentScript);
      };

      const isTruthy = (val: any): boolean => {
          // Emulate Scratch's definition of truthy:
          // false, 0, '0', '' are falsy. Everything else is truthy.
          if (val === false || val === 0 || val === '0' || val === '') {
              return false;
          }
          return true;
      };

      switch (block.name) {
          case BlockName.SENSING_ANSWER:
              return variables.answer ?? '';
          case BlockName.VARIABLES_REPORTER:
              return variables[String(params.variable)] ?? 0;
          
          case BlockName.OPERATORS_ADD:
              return await getNum('NUM1') + await getNum('NUM2');
          case BlockName.OPERATORS_SUBTRACT:
              return await getNum('NUM1') - await getNum('NUM2');
          case BlockName.OPERATORS_MULTIPLY:
              return await getNum('NUM1') * await getNum('NUM2');
          case BlockName.OPERATORS_DIVIDE:
              const n1_div = await getNum('NUM1');
              const n2_div = await getNum('NUM2');
              return n2_div === 0 ? Infinity : n1_div / n2_div;
          case BlockName.OPERATORS_RANDOM:
              const from = Math.round(await getNum('FROM'));
              const to = Math.round(await getNum('TO'));
              const min = Math.min(from, to);
              const max = Math.max(from, to);
              return Math.floor(Math.random() * (max - min + 1)) + min;
          case BlockName.OPERATORS_GT: {
              const v1 = await getVal('OPERAND1');
              const v2 = await getVal('OPERAND2');
              const n1 = Number(v1);
              const n2 = Number(v2);
              if (!isNaN(n1) && !isNaN(n2)) {
                  return n1 > n2 ? 1 : 0;
              }
              return String(v1).toLowerCase() > String(v2).toLowerCase() ? 1 : 0;
          }
          case BlockName.OPERATORS_LT: {
              const v1 = await getVal('OPERAND1');
              const v2 = await getVal('OPERAND2');
              const n1 = Number(v1);
              const n2 = Number(v2);
              if (!isNaN(n1) && !isNaN(n2)) {
                  return n1 < n2 ? 1 : 0;
              }
              return String(v1).toLowerCase() < String(v2).toLowerCase() ? 1 : 0;
          }
          case BlockName.OPERATORS_EQUALS: {
              const v1 = await getVal('OPERAND1');
              const v2 = await getVal('OPERAND2');
              const n1 = Number(v1);
              const n2 = Number(v2);
              if (!isNaN(n1) && !isNaN(n2)) {
                  return n1 == n2 ? 1 : 0;
              }
              return String(v1).toLowerCase() === String(v2).toLowerCase() ? 1 : 0;
          }
          case BlockName.OPERATORS_AND: {
              const v1 = await getVal('OPERAND1');
              const v2 = await getVal('OPERAND2');
              return isTruthy(v1) && isTruthy(v2) ? 1 : 0;
          }
          case BlockName.OPERATORS_OR: {
              const v1 = await getVal('OPERAND1');
              const v2 = await getVal('OPERAND2');
              return isTruthy(v1) || isTruthy(v2) ? 1 : 0;
          }
          case BlockName.OPERATORS_NOT: {
              const v1 = await getVal('OPERAND');
              return !isTruthy(v1) ? 1 : 0;
          }
          case BlockName.OPERATORS_JOIN:
              return `${await getStr('STRING1')}${await getStr('STRING2')}`;
          case BlockName.OPERATORS_LENGTH:
              return (await getStr('STRING')).length;
          case BlockName.OPERATORS_CONTAINS: {
              const s1 = await getStr('STRING1');
              const s2 = await getStr('STRING2');
              return s1.toLowerCase().includes(s2.toLowerCase()) ? 1 : 0;
          }
          case BlockName.OPERATORS_MOD:
              return (await getNum('NUM1')) % (await getNum('NUM2'));
          case BlockName.OPERATORS_ROUND:
              return Math.round(await getNum('NUM'));
      }
      return '';
  };


  const findNextBlock = (currentBlock: ScriptBlock, allBlocks: ScriptBlock[]): ScriptBlock | undefined => {
      if (currentBlock.shape === 'reporter') return undefined;
      const currentHeight = currentBlock.shape === 'hat' ? HAT_BLOCK_HEIGHT : BLOCK_HEIGHT;
      const nextY = currentBlock.y + currentHeight;

      return allBlocks.find(block => 
          block.id !== currentBlock.id &&
          block.shape === 'stack' &&
          Math.abs(block.x - currentBlock.x) < 20 && 
          Math.abs(block.y - nextY) < 20 
      );
  };

  const findFirstChildBlock = (parentBlock: ScriptBlock, allBlocks: ScriptBlock[]): ScriptBlock | undefined => {
      if (parentBlock.shape !== 'c_block') return undefined;
      
      const childY = parentBlock.y + C_BLOCK_HEADER_HEIGHT;

      return allBlocks.find(block => 
          block.id !== parentBlock.id &&
          block.shape === 'stack' &&
          Math.abs(block.x - (parentBlock.x + C_BLOCK_INDENT)) < 10 &&
          Math.abs(block.y - childY) < 10
      );
  };

    const playSound = (soundName: string, waitUntilDone: boolean): Promise<void> => {
        return new Promise(resolve => {
            const audioCtx = audioContextRef.current;
            if (!audioCtx) {
                resolve();
                return;
            }

            let duration = 0.2;
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            switch (soundName) {
                case 'Laser':
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + duration);
                    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
                    break;
                case 'Warp':
                    duration = 0.4;
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + duration);
                    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
                    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);
                    break;
                case 'Beep':
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(440, audioCtx.currentTime);
                    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
                    break;
                case 'Boop':
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(220, audioCtx.currentTime);
                    gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
                    break;
                default:
                    resolve();
                    return;
            }

            osc.start();
            osc.stop(audioCtx.currentTime + duration);
            activeSourcesRef.current.push(osc);

            osc.onended = () => {
                activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== osc);
                if (waitUntilDone) {
                    resolve();
                }
            };
            
            if (!waitUntilDone) {
                resolve();
            }
        });
    };
    
    const handleAnswerSubmit = (answer: string) => {
        if (askingState) {
            askingState.resolve(answer);
        }
    };

    const handleBlockTouchStart = useCallback((e: React.TouchEvent, block: BlockTemplate | ScriptBlock, isNew: boolean) => {
        e.stopPropagation(); // Prevent script area scroll
        const touch = e.touches[0];
        const rect = e.currentTarget.getBoundingClientRect();
        
        let stack: ScriptBlock[] | undefined;
        if (!isNew) {
            stack = getStack(block as ScriptBlock, activeScript);
        }

        setDraggedBlockInfo({
            block,
            clientX: touch.clientX,
            clientY: touch.clientY,
            offsetX: touch.clientX - rect.left,
            offsetY: touch.clientY - rect.top,
            isNew,
            stack
        });
    }, [activeScript, getStack]);

    useEffect(() => {
        const handleTouchMove = (e: TouchEvent) => {
            if (!draggedBlockInfo) return;
            e.preventDefault();
            const touch = e.touches[0];
            setDraggedBlockInfo(prev => prev ? { ...prev, clientX: touch.clientX, clientY: touch.clientY } : null);
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (!draggedBlockInfo || !scriptAreaRef.current) {
                if (draggedBlockInfo) setDraggedBlockInfo(null);
                return;
            };

            const scriptAreaRect = scriptAreaRef.current.getBoundingClientRect();
            const touch = e.changedTouches[0];

            // Check if dropped inside script area
            if (
                touch.clientX >= scriptAreaRect.left &&
                touch.clientX <= scriptAreaRect.right &&
                touch.clientY >= scriptAreaRect.top &&
                touch.clientY <= scriptAreaRect.bottom
            ) {
                const finalX = touch.clientX - scriptAreaRect.left + scriptAreaRef.current.scrollLeft;
                const finalY = touch.clientY - scriptAreaRect.top + scriptAreaRef.current.scrollTop;

                if (draggedBlockInfo.isNew) {
                    const blockTemplate = draggedBlockInfo.block as BlockTemplate;
                    const extensionBlocks = ALL_EXTENSIONS.flatMap(ext => ext.blocks);
                    const allBlockTemplates = [...ALL_BLOCK_TEMPLATES.flatMap(c => c.blocks), ...VARIABLE_BLOCK_TEMPLATES, ...MY_BLOCKS_TEMPLATES, ...extensionBlocks];
                    const foundTemplate = allBlockTemplates.find(b => b.name === blockTemplate.name);
                    
                    if (foundTemplate) {
                        let defaultParams = foundTemplate.defaultParams ? { ...foundTemplate.defaultParams } : {};
                        if (foundTemplate.category === BlockCategory.VARIABLES && Object.keys(variables).length > 0) {
                            defaultParams.variable = Object.keys(variables)[0];
                        }
                        if (foundTemplate.name === BlockName.MYBLOCKS_RUN && definedScripts.length > 0) {
                            defaultParams.name = definedScripts[0];
                        }
                        if (foundTemplate.name === BlockName.LOOKS_SWITCH_COSTUME && COSTUMES.length > 0) {
                            defaultParams.costume = COSTUMES[0];
                        }
                        if ((foundTemplate.name === BlockName.SOUND_PLAY || foundTemplate.name === BlockName.SOUND_PLAY_UNTIL_DONE) && SOUNDS.length > 0) {
                            defaultParams.sound = SOUNDS[0];
                        }

                        const newBlock: ScriptBlock = {
                            ...foundTemplate,
                            id: `${foundTemplate.name}-${Date.now()}`,
                            params: defaultParams,
                            x: finalX - draggedBlockInfo.offsetX,
                            y: finalY - draggedBlockInfo.offsetY,
                        };
                        setActiveScript(prev => [...prev, newBlock]);
                    }
                } else { // Moving existing block
                    const { offsetX, offsetY, stack } = draggedBlockInfo;
                    const draggedStack = stack || [draggedBlockInfo.block as ScriptBlock];
                    
                    const newHeadX = finalX - offsetX;
                    const newHeadY = finalY - offsetY;
                    
                    const deltaX = newHeadX - draggedStack[0].x;
                    const deltaY = newHeadY - draggedStack[0].y;
                    
                    setActiveScript(currentScript => currentScript.map(b => {
                        const dragged = draggedStack.find(ds => ds.id === b.id);
                        return dragged ? { ...b, x: b.x + deltaX, y: b.y + deltaY } : b;
                    }));
                }
            } else {
                if (!draggedBlockInfo.isNew) {
                    const stackToRemove = draggedBlockInfo.stack || [draggedBlockInfo.block as ScriptBlock];
                    const idsToRemove = new Set(stackToRemove.map(b => b.id));
                    setActiveScript(script => script.filter(b => !idsToRemove.has(b.id)));
                }
            }
            setDraggedBlockInfo(null);
        };

        if (draggedBlockInfo) {
            window.addEventListener('touchmove', handleTouchMove, { passive: false });
            window.addEventListener('touchend', handleTouchEnd);
        }

        return () => {
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        }
    }, [draggedBlockInfo, setActiveScript, variables, definedScripts, getStack]);

  const runScript = async () => {
    if (isRunning) return;

    if (!audioContextRef.current) {
        try {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser");
            return;
        }
    }
    // Resume audio context on user gesture
    if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
    }
    
    // Prepare for run: just clear messages, don't reset positions.
    setSprites(s => s.map(sprite => ({ ...sprite, message: null })));
    
    setIsRunning(true);
    executionRef.current.running = true;

    await new Promise(resolve => setTimeout(resolve, 50));
    
    const executionPromises = sprites.map(sprite => {
        const spriteScript = scripts[sprite.id] || [];
        const hatBlocks = spriteScript.filter(b => b.name === BlockName.EVENTS_WHEN_FLAG_CLICKED);
        
        return hatBlocks.map(async (headBlock) => {
            let currentBlock: ScriptBlock | undefined = headBlock;
            
            currentBlock = findNextBlock(currentBlock, spriteScript);
            
            while (currentBlock && executionRef.current.running) {
                await executeBlock(currentBlock, sprite.id, spriteScript);
                await new Promise(resolve => setTimeout(resolve, 50));
                currentBlock = findNextBlock(currentBlock, spriteScript);
            }
        });
    }).flat();

    await Promise.all(executionPromises);

    stopScript();
  };
  
  const executeBlock = async (block: ScriptBlock, spriteId: string, currentScript: ScriptBlock[]) => {
    const params = block.params as any;
    const updateThisSprite = (updater: (s: SpriteState) => Partial<Omit<SpriteState, 'id'>>) => {
        setSprites(sprites => sprites.map(s => s.id === spriteId ? {...s, ...updater(s)} : s))
    };

    switch (block.name) {
        case BlockName.MOTION_MOVE_STEPS:
            const steps = Number(await resolveParam(params.steps, spriteId, currentScript));
            updateThisSprite(s => {
                const radians = (s.rotation - 90) * (Math.PI / 180);
                return {
                    x: s.x + steps * Math.cos(radians),
                    y: s.y + steps * Math.sin(radians),
                };
            });
            break;
        case BlockName.MOTION_TURN_CW:
            const degrees = Number(await resolveParam(params.degrees, spriteId, currentScript));
            updateThisSprite(s => ({ rotation: (s.rotation + degrees) % 360 }));
            break;
        case BlockName.MOTION_TURN_CCW:
            const degrees_ccw = Number(await resolveParam(params.degrees, spriteId, currentScript));
            updateThisSprite(s => ({ rotation: (s.rotation - degrees_ccw + 360) % 360 }));
            break;
        case BlockName.MOTION_GOTO_XY:
            const x = Number(await resolveParam(params.x, spriteId, currentScript));
            const y = Number(await resolveParam(params.y, spriteId, currentScript));
            updateThisSprite(s => ({ x, y }));
            break;
        case BlockName.LOOKS_SAY_FOR_SECS:
            const message = String(await resolveParam(params.message, spriteId, currentScript));
            const seconds = Number(await resolveParam(params.seconds, spriteId, currentScript));
            updateThisSprite(() => ({ message }));
            await new Promise(resolve => setTimeout(resolve, seconds * 1000));
            if (executionRef.current.running) {
              updateThisSprite(() => ({ message: null }));
            }
            break;
        case BlockName.LOOKS_SWITCH_COSTUME:
            const costume = String(await resolveParam(params.costume, spriteId, currentScript));
            updateThisSprite(() => ({ costume }));
            break;
        case BlockName.LOOKS_NEXT_COSTUME:
            updateThisSprite(s => {
                const currentIndex = COSTUMES.indexOf(s.costume);
                const nextIndex = (currentIndex + 1) % COSTUMES.length;
                return { costume: COSTUMES[nextIndex] };
            });
            break;
        case BlockName.LOOKS_CHANGE_SIZE_BY:
            const size_change = Number(await resolveParam(params.size, spriteId, currentScript));
            updateThisSprite(s => ({ size: Math.max(0, s.size + size_change) }));
            break;
        case BlockName.LOOKS_SET_SIZE:
            const size = Number(await resolveParam(params.size, spriteId, currentScript));
            updateThisSprite(() => ({ size: Math.max(0, size) }));
            break;
        case BlockName.SOUND_PLAY:
            const sound = String(await resolveParam(params.sound, spriteId, currentScript));
            playSound(sound, false);
            break;
        case BlockName.SOUND_PLAY_UNTIL_DONE:
            const sound_until_done = String(await resolveParam(params.sound, spriteId, currentScript));
            await playSound(sound_until_done, true);
            break;
        case BlockName.SOUND_STOP_ALL:
            stopAllSounds();
            break;
        case BlockName.SENSING_ASK_AND_WAIT:
            const question = String(await resolveParam(params.question, spriteId, currentScript));
            updateThisSprite(() => ({ message: question }));
            
            const answer = await new Promise<string>((resolve) => {
                setAskingState({
                    question,
                    spriteId: spriteId,
                    resolve,
                });
            });

            if (executionRef.current.running) {
                setVariables(vars => ({ ...vars, answer }));
                updateThisSprite(() => ({ message: null }));
                setAskingState(null);
            }
            break;
        case BlockName.PEN_ERASE_ALL:
            if (canvasCtxRef.current) {
                const { canvas } = canvasCtxRef.current;
                canvasCtxRef.current.clearRect(0, 0, canvas.width, canvas.height);
            }
            break;
        case BlockName.PEN_DOWN:
            updateThisSprite(s => ({ penState: { ...s.penState, isDown: true } }));
            break;
        case BlockName.PEN_UP:
            updateThisSprite(s => ({ penState: { ...s.penState, isDown: false } }));
            break;
        case BlockName.PEN_SET_COLOR:
            const color = String(await resolveParam(params.color, spriteId, currentScript));
            updateThisSprite(s => ({ penState: { ...s.penState, color } }));
            break;
        case BlockName.PEN_SET_SIZE:
            const pen_size = Number(await resolveParam(params.size, spriteId, currentScript));
            updateThisSprite(s => ({ penState: { ...s.penState, size: Math.max(1, pen_size) } }));
            break;
        case BlockName.THREED_CREATE_OBJECT:
            const objectPrompt = String(await resolveParam(params.object, spriteId, currentScript));
            setIsGenerating(true);
            try {
                let objectType: 'floor' | 'box' = 'box';
                if (objectPrompt.toLowerCase().includes('floor')) {
                    objectType = 'floor';
                }
                
                let texturePrompt = `A seamless, tileable texture of ${objectPrompt}`;
                const textureMatch = objectPrompt.match(/(?:with|of|made of)\s(.*)/i);
                if (textureMatch && textureMatch[1]) {
                    texturePrompt = `A seamless, tileable texture of ${textureMatch[1]}`;
                }

                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const response = await ai.models.generateImages({
                    model: 'imagen-4.0-generate-001',
                    prompt: texturePrompt,
                    config: {
                        numberOfImages: 1,
                        outputMimeType: 'image/png',
                        aspectRatio: '1:1',
                    },
                });
                
                if (!response.generatedImages || response.generatedImages.length === 0 || !response.generatedImages[0].image) {
                    console.error("AI image generation failed. Response:", response);
                    throw new Error("AI did not return an image. The prompt may have been blocked or invalid.");
                }

                const base64ImageBytes = response.generatedImages[0].image.imageBytes;
                const imageUrl = `data:image/png;base64,${base64ImageBytes}`;

                const newObject: ThreeDObject = {
                    id: `3d-${Date.now()}`,
                    type: objectType,
                    prompt: objectPrompt,
                    textureData: imageUrl,
                };
                setThreeDObjects(prev => [...prev, newObject]);

            } catch (error) {
                console.error("Error generating 3D object:", error);
                updateThisSprite(() => ({ message: "Sorry, I couldn't make that." }));
                await new Promise(resolve => setTimeout(resolve, 2000));
                updateThisSprite((s) => (s.message === "Sorry, I couldn't make that." ? { message: null } : {}));
            } finally {
                setIsGenerating(false);
            }
            break;
    }
  };

  const TabButton: React.FC<{
      label: string;
      tabName: 'code' | 'costumes' | 'sounds';
  }> = ({ label, tabName }) => {
      const isActive = activeTab === tabName;
      return (
          <button
              onClick={() => setActiveTab(tabName)}
              className={`px-4 py-2 text-sm font-bold rounded-t-lg ${isActive ? 'bg-white text-blue-600 border-b-0' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
          >
              {label}
          </button>
      )
  };

  return (
    <div className="bg-gray-200 text-black font-sans h-screen w-screen flex flex-col overflow-hidden text-sm">
      {/* Header */}
      <header className="bg-scratch-blue flex-shrink-0 flex items-center justify-between px-4 py-1 text-white z-20">
        <h1 className="text-xl font-bold tracking-wide">THUNDER WARP</h1>
        <div className="flex items-center gap-4">
          <button onClick={runScript} disabled={isRunning} title="Go" className="disabled:opacity-50 disabled:cursor-not-allowed">
            <GreenFlagIcon />
          </button>
          <button onClick={stopScript} disabled={!isRunning} title="Stop" className="disabled:opacity-50 disabled:cursor-not-allowed">
            <StopSignIcon />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden p-2 gap-2">
        {/* Left Column: Block Palette */}
        <div className="w-1/4 max-w-xs flex-shrink-0">
            <BlockPalette 
                paletteBlocks={paletteBlocks} 
                onCreateVariable={createVariable}
                variableNames={Object.keys(variables)}
                definedScripts={definedScripts}
                costumes={COSTUMES}
                sounds={SOUNDS}
                onAddExtensionClick={() => setIsExtensionModalOpen(true)}
                monitors={monitors}
                onToggleMonitor={toggleMonitor}
                onBlockTouchStart={handleBlockTouchStart}
                activeExtensions={activeExtensions}
            />
        </div>
        {/* Center Column: Script Area with Tabs */}
        <div className="flex-1 flex flex-col">
          <div className="flex-shrink-0 flex items-end gap-1 px-2">
            <TabButton label="Code" tabName="code" />
            <TabButton label="Costumes" tabName="costumes" />
            <TabButton label="Sounds" tabName="sounds" />
          </div>
          <div className="flex-1 bg-white rounded-b-lg rounded-tr-lg border border-gray-300 overflow-hidden">
            {activeTab === 'code' && (
              <ScriptArea
                  scriptAreaRef={scriptAreaRef}
                  script={activeScript}
                  setScript={setActiveScript}
                  updateBlockParam={updateBlockParam}
                  variableNames={Object.keys(variables)}
                  definedScripts={definedScripts}
                  costumes={COSTUMES}
                  sounds={SOUNDS}
                  onBlockTouchStart={handleBlockTouchStart}
                  cBlockBodyHeights={cBlockBodyHeights}
              />
            )}
            {activeTab !== 'code' && (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                {activeTab === 'costumes' ? 'Costume editor coming soon!' : 'Sound editor coming soon!'}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Stage and Sprites */}
        <div className="w-1/3 max-w-md flex-shrink-0 flex flex-col gap-2">
            <Stage 
                sprites={sprites} 
                onReset={resetStage}
                variables={variables}
                monitors={monitors}
                onSpritePositionChange={updateSpriteState}
                setCanvasContext={ctx => canvasCtxRef.current = ctx}
                threeDObjects={threeDObjects}
                isGenerating={isGenerating}
                askingState={askingState}
                onAnswerSubmit={handleAnswerSubmit}
            />
            <div className="flex-1 bg-white rounded-lg border border-gray-300 overflow-hidden flex flex-col">
              {activeSprite && (
                  <SpriteEditor 
                      sprite={activeSprite} 
                      onUpdate={updateActiveSpriteState}
                      costumes={COSTUMES}
                  />
              )}
              <SpriteList 
                  sprites={sprites}
                  activeSpriteId={activeSpriteId}
                  onSelectSprite={setActiveSpriteId}
                  onAddSprite={addSprite}
                  onAddSpriteFromUpload={addSpriteFromUpload}
                  onDeleteSprite={deleteSprite}
              />
            </div>
        </div>
      </main>

      <ExtensionModal 
        isOpen={isExtensionModalOpen}
        onClose={() => setIsExtensionModalOpen(false)}
        availableExtensions={ALL_EXTENSIONS.filter(ext => !activeExtensions.find(ae => ae.id === ext.id))}
        onAddExtension={(ext) => {
            setActiveExtensions(prev => [...prev, ext]);
            setIsExtensionModalOpen(false);
        }}
      />
      {draggedBlockInfo && createPortal(
          <div
            className="absolute pointer-events-none z-50 opacity-80"
            style={{
                left: draggedBlockInfo.clientX - draggedBlockInfo.offsetX,
                top: draggedBlockInfo.clientY - draggedBlockInfo.offsetY,
            }}
          >
              <Block 
                block={draggedBlockInfo.block}
                onParamChange={() => {}}
                variableNames={Object.keys(variables)}
                definedScripts={definedScripts}
                costumes={COSTUMES}
                sounds={SOUNDS}
              />
          </div>,
          document.body
      )}
    </div>
  );
}

export default App;