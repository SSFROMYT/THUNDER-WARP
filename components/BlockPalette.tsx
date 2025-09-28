import React, { useState, useMemo } from 'react';
import { Block } from './Block';
import { VARIABLE_BLOCK_TEMPLATES, MY_BLOCKS_TEMPLATES, CATEGORY_COLORS } from '../constants';
import { BlockName, BlockCategory, BlockTemplate } from '../types';
import { ExtensionIcon } from './Icons';
import { Extension } from '../extensions';

interface PaletteCategory {
    category: BlockCategory;
    blocks: BlockTemplate[];
}

interface BlockPaletteProps {
  paletteBlocks: PaletteCategory[];
  onCreateVariable: (name: string) => void;
  variableNames: string[];
  definedScripts: string[];
  costumes: string[];
  sounds: string[];
  onAddExtensionClick: () => void;
  monitors: Record<string, boolean>;
  onToggleMonitor: (name: string) => void;
  onBlockTouchStart: (e: React.TouchEvent, block: BlockTemplate, isNew: boolean) => void;
  activeExtensions: Extension[];
}

export const BlockPalette: React.FC<BlockPaletteProps> = ({ paletteBlocks, onCreateVariable, variableNames, definedScripts, costumes, sounds, onAddExtensionClick, monitors, onToggleMonitor, onBlockTouchStart, activeExtensions }) => {
  const [newVarName, setNewVarName] = useState('');
  
  const allCategories = useMemo(() => [
    ...paletteBlocks,
    { category: BlockCategory.VARIABLES, blocks: [] },
    { category: BlockCategory.MY_BLOCKS, blocks: [] },
  ], [paletteBlocks]);

  const categoryOrder = useMemo(() => {
      const base = [
          BlockCategory.MOTION, BlockCategory.LOOKS, BlockCategory.SOUND, BlockCategory.EVENTS,
          BlockCategory.CONTROL, BlockCategory.SENSING, BlockCategory.OPERATORS, BlockCategory.VARIABLES,
          BlockCategory.MY_BLOCKS,
      ];
      const extensionCategories = activeExtensions.map(ext => ext.category);
      return [...base, ...extensionCategories];
  }, [activeExtensions]);
  
  const [activeCategory, setActiveCategory] = useState<BlockCategory>(BlockCategory.MOTION);


  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, block: BlockTemplate) => {
    e.dataTransfer.setData('application/react-block-coder', block.name);
    if (block.shape === 'reporter') {
      e.dataTransfer.setData('reporter-block-name', block.name);
    }
  };
  
  const handleCreateVariable = () => {
    if (newVarName.trim()) {
        onCreateVariable(newVarName);
        setNewVarName('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          handleCreateVariable();
      }
  };

  const hasVariables = variableNames.length > 0;
  const firstVar = hasVariables ? variableNames[0] : '';
  const hasDefinedScripts = definedScripts.length > 0;
  const firstScript = hasDefinedScripts ? definedScripts[0] : '';
  
  const activeCategoryData = allCategories.find(c => c.category === activeCategory);

  const renderBlocks = () => {
    if (!activeCategoryData) return null;

    if (activeCategory === BlockCategory.VARIABLES) {
        return (
            <div className="flex flex-col gap-2 items-start">
                <button 
                    onClick={handleCreateVariable}
                    className="w-full bg-panel-light hover:bg-slate-500 text-white text-sm font-bold py-2 px-4 rounded-lg text-center transition-colors"
                >
                    Make a Variable
                </button>
                <input 
                    type="text" 
                    placeholder="New variable name..." 
                    value={newVarName}
                    onChange={e => setNewVarName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-slate-800 border border-slate-600 rounded-md px-2 py-1.5 text-sm text-white placeholder-slate-400 focus:ring-2 focus:ring-electric-yellow focus:outline-none"
                />
                {hasVariables && (
                    <div className="w-full mt-4">
                        <div className="flex flex-col gap-2 mb-4">
                            {variableNames.map(varName => (
                                <div key={varName} className="flex items-center gap-2">
                                    <input 
                                        type="checkbox"
                                        checked={monitors[varName] ?? false}
                                        onChange={() => onToggleMonitor(varName)}
                                        className="w-4 h-4 rounded-sm"
                                        style={{ accentColor: CATEGORY_COLORS[BlockCategory.VARIABLES].dark }}
                                    />
                                    <div
                                        draggable
                                        onDragStart={e => {
                                            e.dataTransfer.setData('variable-reporter', varName);
                                            e.dataTransfer.effectAllowed = 'copy';
                                        }}
                                        className="cursor-grab"
                                    >
                                        <div className="bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow">
                                            {varName}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-2">
                            {VARIABLE_BLOCK_TEMPLATES.map(template => {
                                const blockForPalette = { ...template, params: { ...template.defaultParams, variable: firstVar }};
                                return (
                                    <div key={template.name} draggable onDragStart={e => handleDragStart(e, blockForPalette)} onTouchStart={(e) => onBlockTouchStart(e, blockForPalette, true)} className="cursor-grab">
                                        <Block block={blockForPalette} onParamChange={() => {}} variableNames={variableNames} costumes={costumes} sounds={sounds} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        )
    }

    if (activeCategory === BlockCategory.MY_BLOCKS) {
        return (
            <div className="space-y-2">
                {MY_BLOCKS_TEMPLATES.filter(t => t.name === BlockName.MYBLOCKS_DEFINE || hasDefinedScripts).map(template => {
                    const blockForPalette = { ...template, params: { ...template.defaultParams, ...(template.name === BlockName.MYBLOCKS_RUN && { name: firstScript }) }};
                    return (
                        <div key={template.name} draggable onDragStart={e => handleDragStart(e, blockForPalette)} onTouchStart={(e) => onBlockTouchStart(e, blockForPalette, true)} className="cursor-grab">
                            <Block block={blockForPalette} onParamChange={() => {}} variableNames={[]} definedScripts={definedScripts} costumes={costumes} sounds={sounds} />
                        </div>
                    );
                })}
            </div>
        )
    }

    return activeCategoryData.blocks.map(block => {
      // Special case for 'answer' monitor checkbox
      if (block.name === BlockName.SENSING_ANSWER) {
        return (
          <div key={block.name} className="flex items-center gap-2">
              <input type="checkbox" checked={monitors['answer'] ?? false} onChange={() => onToggleMonitor('answer')} className="w-4 h-4" style={{ accentColor: CATEGORY_COLORS[BlockCategory.SENSING].dark }} />
              <div draggable onTouchStart={(e) => onBlockTouchStart(e, block, true)} onDragStart={e => { e.dataTransfer.setData('reporter-block-name', block.name); e.dataTransfer.effectAllowed = 'copy'; }} className="cursor-grab">
                <Block block={block} onParamChange={() => {}} variableNames={[]} costumes={costumes} sounds={sounds} />
              </div>
          </div>
        );
      }
      return (
        <div key={block.name} draggable onDragStart={e => handleDragStart(e, block)} onTouchStart={(e) => onBlockTouchStart(e, block, true)} className="cursor-grab">
          <Block block={block} onParamChange={() => {}} variableNames={[]} costumes={costumes} sounds={sounds} />
        </div>
      );
    })
  }

  return (
    <div className="w-full h-full bg-panel-dark rounded-lg shadow-2xl flex overflow-hidden border border-slate-700">
      {/* Category selectors */}
      <div className="w-24 flex-shrink-0 border-r border-slate-700 flex flex-col items-center py-2 gap-2">
        {categoryOrder.map(category => (
          <button 
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`w-full flex flex-col items-center justify-center text-xs font-bold p-1 rounded-md transition-colors ${activeCategory === category ? 'text-electric-yellow' : 'text-slate-300 hover:bg-slate-700'}`}
          >
            <div className="w-6 h-6 rounded-full mb-1" style={{backgroundColor: CATEGORY_COLORS[category]?.dark || '#ccc' }}></div>
            {category}
          </button>
        ))}
        <div className="mt-auto pt-2 border-t border-slate-700 w-full flex justify-center">
            <button
                onClick={onAddExtensionClick}
                className="p-2 bg-panel-light text-electric-yellow rounded-full hover:bg-slate-600 transition-colors"
                title="Add Extension"
            >
                <ExtensionIcon />
            </button>
        </div>
      </div>
      
      {/* Block List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <h3 className="font-bold text-lg text-electric-yellow">{activeCategory}</h3>
          {renderBlocks()}
      </div>
    </div>
  );
};