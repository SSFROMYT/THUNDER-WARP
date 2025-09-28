
import React, { useRef, useCallback, useState } from 'react';
import { Block } from './Block';
import type { ScriptBlock, ParamValue, BlockTemplate } from '../types';
import { BlockName, BlockCategory } from '../types';
import { ALL_BLOCKS, VARIABLE_BLOCK_TEMPLATES, MY_BLOCKS_TEMPLATES } from '../constants';
import { ALL_EXTENSIONS } from '../extensions';

const BLOCK_HEIGHT = 40; // The height of the main block body.
const HAT_BLOCK_HEIGHT = 40; // Hat blocks have the same body height for stacking.
const C_BLOCK_HEADER_HEIGHT = 36;
const C_BLOCK_BOTTOM_HEIGHT = 16;
const C_BLOCK_MIN_BODY_HEIGHT = 24;
const C_BLOCK_INDENT = 20;

interface ScriptAreaProps {
  scriptAreaRef: React.RefObject<HTMLDivElement>;
  script: ScriptBlock[];
  onScriptChange: (updater: (prev: ScriptBlock[]) => ScriptBlock[]) => void;
  updateBlockParam: (blockId: string, paramName: string, value: ParamValue) => void;
  variableNames: string[];
  definedScripts: string[];
  costumes: string[];
  sounds: string[];
  onBlockTouchStart: (e: React.TouchEvent, block: ScriptBlock, isNew: boolean) => void;
  cBlockBodyHeights: Record<string, number>;
}

export const ScriptArea: React.FC<ScriptAreaProps> = ({ scriptAreaRef, script, onScriptChange, updateBlockParam, variableNames, definedScripts, costumes, sounds, onBlockTouchStart, cBlockBodyHeights }) => {
  const dragState = useRef<{
    type: 'new' | 'move';
    blockId?: string;
    blockName?: BlockName;
    offsetX: number;
    offsetY: number;
    draggedStack: ScriptBlock[];
  } | null>(null);
  
  const [snapPreview, setSnapPreview] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
  const snapTargetRef = useRef<{ blockId: string, position: 'bottom' | 'inside' } | null>(null);
  const [draggedStackIds, setDraggedStackIds] = useState<Set<string>>(new Set());

  const getBlockHeight = useCallback((block: ScriptBlock): number => {
    if (block.shape === 'c_block') {
        const bodyHeight = cBlockBodyHeights[block.id] || C_BLOCK_MIN_BODY_HEIGHT;
        return C_BLOCK_HEADER_HEIGHT + bodyHeight + C_BLOCK_BOTTOM_HEIGHT;
    }
    if (block.shape === 'hat') return HAT_BLOCK_HEIGHT;
    return BLOCK_HEIGHT;
  }, [cBlockBodyHeights]);
  
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
        (b.shape === 'stack' || b.shape === 'c_block') &&
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
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, block: ScriptBlock) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const stack = getStack(block, script);
      
      setDraggedStackIds(new Set(stack.map(b => b.id)));
      
      dragState.current = {
          type: 'move',
          blockId: block.id,
          offsetX: e.clientX - rect.left,
          offsetY: e.clientY - rect.top,
          draggedStack: stack,
      };
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', block.id);
      if (block.shape === 'reporter') {
        e.dataTransfer.setData('reporter-block-name', block.name);
      }
  };
  
  const handleDragEnd = () => {
    // Clean up state regardless of drop success
    dragState.current = null;
    setDraggedStackIds(new Set());
    setSnapPreview(null);
    snapTargetRef.current = null;
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setSnapPreview(null);
    if (!scriptAreaRef.current) return;
    
    const blockName = e.dataTransfer.getData('application/react-block-coder') as BlockName;
    const scriptAreaRect = scriptAreaRef.current.getBoundingClientRect();

    const finalX = e.clientX - scriptAreaRect.left + scriptAreaRef.current.scrollLeft;
    const finalY = e.clientY - scriptAreaRect.top + scriptAreaRef.current.scrollTop;

    const snapTarget = snapTargetRef.current;
    
    if (dragState.current?.type === 'move') { 
        const { offsetX, offsetY, draggedStack } = dragState.current;
        let newHeadX = finalX - offsetX;
        let newHeadY = finalY - offsetY;

        if (snapTarget) {
            const targetBlock = script.find(b => b.id === snapTarget.blockId);
            if (targetBlock) {
                if (snapTarget.position === 'bottom') {
                    newHeadX = targetBlock.x;
                    newHeadY = targetBlock.y + getBlockHeight(targetBlock);
                } else if (snapTarget.position === 'inside') {
                    newHeadX = targetBlock.x + C_BLOCK_INDENT;
                    newHeadY = targetBlock.y + C_BLOCK_HEADER_HEIGHT;
                }
            }
        }
        
        const deltaX = newHeadX - draggedStack[0].x;
        const deltaY = newHeadY - draggedStack[0].y;
        
        onScriptChange(currentScript => {
            const stackIds = new Set(draggedStack.map(b => b.id));
            return currentScript.map(b => {
                if (stackIds.has(b.id)) {
                    return { ...b, x: b.x + deltaX, y: b.y + deltaY };
                }
                return b;
            });
        });

    } else if (blockName) { // It's a new block
      const extensionBlocks = ALL_EXTENSIONS.flatMap(ext => ext.blocks);
      const allBlockTemplates = [...ALL_BLOCKS.flatMap(c => c.blocks), ...VARIABLE_BLOCK_TEMPLATES, ...MY_BLOCKS_TEMPLATES, ...extensionBlocks];
      const blockTemplate = allBlockTemplates.find(b => b.name === blockName);
      if (blockTemplate) {
          let defaultParams = blockTemplate.defaultParams ? { ...blockTemplate.defaultParams } : {};
          if (blockTemplate.category === BlockCategory.VARIABLES && variableNames.length > 0) {
              defaultParams.variable = variableNames[0];
          }
          if (blockTemplate.name === BlockName.MYBLOCKS_RUN && definedScripts.length > 0) {
              defaultParams.name = definedScripts[0];
          }
          if (blockTemplate.name === BlockName.LOOKS_SWITCH_COSTUME && costumes.length > 0) {
              defaultParams.costume = costumes[0];
          }
          if ((blockTemplate.name === BlockName.SOUND_PLAY || blockTemplate.name === BlockName.SOUND_PLAY_UNTIL_DONE) && sounds.length > 0) {
              defaultParams.sound = sounds[0];
          }
          
          let newBlockX = finalX - 20;
          let newBlockY = finalY - 20;

          if (snapTarget && blockTemplate.shape !== 'hat' && blockTemplate.shape !== 'reporter') {
                const targetBlock = script.find(b => b.id === snapTarget.blockId);
                if (targetBlock) {
                   if (snapTarget.position === 'bottom') {
                        newBlockX = targetBlock.x;
                        newBlockY = targetBlock.y + getBlockHeight(targetBlock);
                    } else if (snapTarget.position === 'inside') {
                        newBlockX = targetBlock.x + C_BLOCK_INDENT;
                        newBlockY = targetBlock.y + C_BLOCK_HEADER_HEIGHT;
                    }
                }
            }

          const newBlock: ScriptBlock = {
            ...blockTemplate,
            id: `${blockName}-${Date.now()}-${Math.random()}`,
            params: defaultParams,
            x: newBlockX,
            y: newBlockY,
          };
          onScriptChange(prev => [...prev, newBlock]);
      }
    }
    handleDragEnd();
  }, [script, getBlockHeight, onScriptChange, variableNames, definedScripts, costumes, sounds]);
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!scriptAreaRef.current || (!dragState.current && !e.dataTransfer.types.includes('application/react-block-coder'))) {
      return;
    }

    const scriptAreaRect = scriptAreaRef.current.getBoundingClientRect();
    const mouseX = e.clientX - scriptAreaRect.left + scriptAreaRef.current.scrollLeft;
    const mouseY = e.clientY - scriptAreaRect.top + scriptAreaRef.current.scrollTop;
    
    let headBlockShape: ScriptBlock['shape'] | undefined;
    if (dragState.current) {
        headBlockShape = dragState.current.draggedStack[0]?.shape;
    } else {
        const blockName = e.dataTransfer.getData('application/react-block-coder') as BlockName;
        const extensionBlocks = ALL_EXTENSIONS.flatMap(ext => ext.blocks);
        const allBlockTemplates = [...ALL_BLOCKS.flatMap(c => c.blocks), ...VARIABLE_BLOCK_TEMPLATES, ...MY_BLOCKS_TEMPLATES, ...extensionBlocks];
        headBlockShape = allBlockTemplates.find(b => b.name === blockName)?.shape;
    }

    if (!headBlockShape || headBlockShape === 'reporter' || headBlockShape === 'hat') {
      snapTargetRef.current = null;
      setSnapPreview(null);
      return;
    }
    
    let bestSnap: { blockId: string, position: 'bottom' | 'inside', x: number, y: number } | null = null;
    let minDistance = 40; // Snap threshold

    script.forEach(targetBlock => {
        if (draggedStackIds.has(targetBlock.id)) return; // Don't snap to self

        // Check for bottom snap
        if ((targetBlock.shape === 'stack' || targetBlock.shape === 'hat' || targetBlock.shape === 'c_block')) {
            const targetHeight = getBlockHeight(targetBlock);
            const snapX = targetBlock.x;
            const snapY = targetBlock.y + targetHeight;
            const distance = Math.sqrt(Math.pow(mouseX - (snapX + 40), 2) + Math.pow(mouseY - snapY, 2));

            if (distance < minDistance) {
                minDistance = distance;
                bestSnap = {
                    blockId: targetBlock.id,
                    position: 'bottom',
                    x: snapX,
                    y: snapY
                };
            }
        }

        // Check for inside snap (for C-blocks)
        if (targetBlock.shape === 'c_block') {
            const snapX = targetBlock.x + C_BLOCK_INDENT;
            const snapY = targetBlock.y + C_BLOCK_HEADER_HEIGHT;
            const distance = Math.sqrt(Math.pow(mouseX - (snapX + 40), 2) + Math.pow(mouseY - snapY, 2));
            
            const hasChild = script.some(b => 
                !draggedStackIds.has(b.id) &&
                Math.abs(b.x - snapX) < 10 && Math.abs(b.y - snapY) < 10
            );

            if (distance < minDistance && !hasChild) {
                minDistance = distance;
                bestSnap = {
                    blockId: targetBlock.id,
                    position: 'inside',
                    x: snapX,
                    y: snapY
                };
            }
        }
    });

    if (bestSnap) {
        snapTargetRef.current = { blockId: bestSnap.blockId, position: bestSnap.position };
        setSnapPreview({ x: bestSnap.x, y: bestSnap.y - 4, width: 80, height: 8 });
    } else {
        snapTargetRef.current = null;
        setSnapPreview(null);
    }
  }, [script, getBlockHeight, draggedStackIds]);

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (scriptAreaRef.current && !scriptAreaRef.current.contains(e.relatedTarget as Node)) {
        setSnapPreview(null);
        snapTargetRef.current = null;
    }
  };
  
  const removeBlock = (blockToRemove: ScriptBlock) => {
    const stackToRemove = getStack(blockToRemove, script);
    const idsToRemove = new Set(stackToRemove.map(b => b.id));
    onScriptChange(script => script.filter(b => !idsToRemove.has(b.id)));
  };

  return (
    <div
      ref={scriptAreaRef}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className="flex-1 bg-panel-light p-4 overflow-auto relative h-full w-full"
    >
      {script.length === 0 && (
        <div className="h-full flex items-center justify-center text-slate-500 select-none text-lg pointer-events-none">
          Drag blocks here to start coding!
        </div>
      )}
      {snapPreview && (
          <div 
            className="absolute bg-electric-yellow rounded-md pointer-events-none z-30"
            style={{ 
              left: snapPreview.x, 
              top: snapPreview.y, 
              width: snapPreview.width, 
              height: snapPreview.height 
            }}
          />
      )}
      {script.map((block) => (
        <div
          key={block.id}
          draggable
          onDragStart={(e) => handleDragStart(e, block)}
          onDragEnd={handleDragEnd}
          onTouchStart={(e) => onBlockTouchStart(e, block, false)}
          className={`absolute group cursor-grab transition-opacity ${draggedStackIds.has(block.id) ? 'opacity-40' : ''}`}
          style={{ left: block.x, top: block.y }}
        >
          <Block
            block={block}
            onParamChange={(paramName, value) => updateBlockParam(block.id, paramName, value)}
            variableNames={variableNames}
            definedScripts={definedScripts}
            costumes={costumes}
            sounds={sounds}
            cBlockBodyHeight={cBlockBodyHeights[block.id]}
          />
          <button
              onClick={() => removeBlock(block)}
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-400"
              aria-label="Remove block"
          >
              &times;
          </button>
        </div>
      ))}
    </div>
  );
};
