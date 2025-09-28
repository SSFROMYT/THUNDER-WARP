import React, { useState } from 'react';
import type { BlockTemplate, ScriptBlock, ParamValue } from '../types';
import { BlockName } from '../types';
import { CATEGORY_COLORS, VARIABLE_BLOCK_TEMPLATES, ALL_BLOCKS } from '../constants';
import { ALL_EXTENSIONS } from '../extensions';
import { MY_BLOCKS_TEMPLATES } from '../constants';


const ParamInput: React.FC<{
    value: string | number;
    type: 'text' | 'number';
    onChange: (newValue: string | number) => void;
    onDropVariable: (variableName: string) => void;
    onDropNewReporter: (blockName: BlockName) => void;
}> = ({ value, type, onChange, onDropVariable, onDropNewReporter }) => {
    const [isDraggedOver, setIsDraggedOver] = useState(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggedOver(false);
        
        const varName = e.dataTransfer.getData('variable-reporter');
        if (varName) {
            onDropVariable(varName);
            return;
        }

        const reporterBlockName = e.dataTransfer.getData('reporter-block-name') as BlockName;
        if (reporterBlockName) {
            onDropNewReporter(reporterBlockName);
            return;
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        const types = Array.from(e.dataTransfer.types);
        if (types.includes('variable-reporter') || types.includes('reporter-block-name')) {
            e.dataTransfer.dropEffect = 'copy';
            e.stopPropagation();
        } else {
            e.dataTransfer.dropEffect = 'none';
        }
    };

    const handleDragEnter = (e: React.DragEvent) => {
        const types = Array.from(e.dataTransfer.types);
        if (types.includes('variable-reporter') || types.includes('reporter-block-name')) {
            setIsDraggedOver(true);
            e.stopPropagation();
        }
    };
    
    const handleDragLeave = () => {
        setIsDraggedOver(false);
    };

    const baseClasses = "bg-slate-800 text-white rounded-md border border-slate-600 focus:ring-2 focus:ring-electric-yellow focus:outline-none z-10";
    const sizeClasses = type === 'number' ? "w-12 text-center" : "w-24 px-1";
    const dragOverClasses = isDraggedOver ? "ring-2 ring-electric-yellow ring-offset-0" : "";

    return (
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            className={`${baseClasses} ${sizeClasses} ${dragOverClasses} transition-shadow`}
            onClick={(e) => e.stopPropagation()}
        />
    );
};


interface BlockProps {
    block: BlockTemplate | ScriptBlock;
    onParamChange: (paramName: string, value: ParamValue) => void;
    variableNames: string[];
    definedScripts?: string[];
    costumes?: string[];
    sounds?: string[];
    cBlockBodyHeight?: number;
}

const Notch: React.FC = () => <div className="absolute bottom-0 left-[10px] h-[4px] w-[34px] bg-panel-light" style={{ clipPath: 'polygon(0% 0%, 100% 0%, calc(100% - 7px) 100%, 7px 100%)' }} />;
const Bump: React.FC<{color: string}> = ({color}) => <div className="absolute -top-[4px] left-[10px] h-[4px] w-[34px]" style={{ backgroundColor: color, clipPath: 'polygon(7px 0%, calc(100% - 7px) 0%, 100% 100%, 0% 100%)' }} />;

const CBlock: React.FC<{
    block: BlockTemplate | ScriptBlock;
    colors: { bg: string; text: string; dark: string; };
    bodyHeight: number;
    children: React.ReactNode;
}> = ({ block, colors, bodyHeight, children }) => {
    return (
        <div className="w-fit">
            {/* Top part */}
            <div className={`relative ${colors.bg} ${colors.text} flex items-center gap-2 p-2 text-sm font-semibold rounded-t-md min-h-[36px]`}>
                 <div className="relative z-10 flex items-center gap-2">{children}</div>
                 <div className={`absolute bottom-0 left-0 right-0 h-[4px] ${colors.bg}`}></div>
                 <Notch />
            </div>
            {/* Middle part */}
            <div className={`flex`} style={{ minHeight: bodyHeight }}>
                <div className={`${colors.bg} w-[20px] rounded-bl-md`}></div>
                <div className="flex-grow"></div>
            </div>
            {/* Bottom part */}
            <div className={`relative ${colors.bg} h-[16px] rounded-b-md`}>
                <Bump color={colors.dark} />
                 <div className={`absolute bottom-0 left-0 right-0 h-[4px] ${colors.bg}`}></div>
            </div>
        </div>
    )
};


export const Block: React.FC<BlockProps> = ({ block, onParamChange, variableNames, definedScripts = [], costumes = [], sounds = [], cBlockBodyHeight = 24 }) => {
    const { label, category, paramDefs = [], shape } = block;
    const colors = CATEGORY_COLORS[category];

    const parts = label.split(/(\{\w+\})/);

    const isReporter = shape === 'reporter';
    
    const renderParams = () => parts.map((part, index) => {
        const paramNameMatch = part.match(/\{(\w+)\}/);
        if (paramNameMatch) {
            const paramName = paramNameMatch[1];
            
            if (isReporter && paramName === 'variable') {
                return <span key={index}>{'params' in block && (block.params.variable as string || 'variable')}</span>;
            }

            const paramDef = paramDefs.find(p => p.name === paramName);
            const value = 'params' in block ? block.params[paramName] : paramDef?.defaultValue;

            if (typeof value === 'object' && value !== null) {
                if ('variable' in value) {
                    const variableReporterTemplate = VARIABLE_BLOCK_TEMPLATES.find(b => b.name === BlockName.VARIABLES_REPORTER);
                    if (!variableReporterTemplate) return null;
                    const reporterBlock: ScriptBlock = {
                        ...variableReporterTemplate,
                        id: `reporter-${value.variable}`,
                        params: { variable: value.variable },
                        x: 0, y: 0,
                    };
                    return <Block key={index} block={reporterBlock} onParamChange={() => {}} variableNames={[]} />
                }
                if ('shape' in value && (value as ScriptBlock).shape === 'reporter') {
                    return <Block key={index} block={value as ScriptBlock} onParamChange={() => {}} variableNames={variableNames} costumes={costumes} sounds={sounds} />
                }
            }


            if (paramDef?.type === 'variable_dropdown') {
                return (
                    <select
                        key={index}
                        value={value as string}
                        onChange={(e) => onParamChange(paramName, e.target.value)}
                        className="bg-slate-800 text-white border border-slate-600 rounded-md focus:ring-2 focus:ring-electric-yellow focus:outline-none px-1 py-0.5 text-xs"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {variableNames.map(varName => (
                            <option key={varName} value={varName}>{varName}</option>
                        ))}
                    </select>
                );
            }

             if (paramDef?.type === 'script_dropdown') {
                return (
                    <select
                        key={index}
                        value={value as string}
                        onChange={(e) => onParamChange(paramName, e.target.value)}
                        className="bg-slate-800 text-white border border-slate-600 rounded-md focus:ring-2 focus:ring-electric-yellow focus:outline-none px-1 py-0.5 text-xs"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {definedScripts.map(scriptName => (
                            <option key={scriptName} value={scriptName}>{scriptName}</option>
                        ))}
                    </select>
                );
            }
            
            if (paramDef?.type === 'costume_dropdown') {
                return (
                    <select
                        key={index}
                        value={value as string}
                        onChange={(e) => onParamChange(paramName, e.target.value)}
                        className="bg-slate-800 text-white border border-slate-600 rounded-md focus:ring-2 focus:ring-electric-yellow focus:outline-none px-1 py-0.5 text-xs"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {costumes.map(costume => (
                            <option key={costume} value={costume}>{costume}</option>
                        ))}
                    </select>
                );
            }

            if (paramDef?.type === 'sound_dropdown') {
                return (
                    <select
                        key={index}
                        value={value as string}
                        onChange={(e) => onParamChange(paramName, e.target.value)}
                        className="bg-slate-800 text-white border border-slate-600 rounded-md focus:ring-2 focus:ring-electric-yellow focus:outline-none px-1 py-0.5 text-xs"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {sounds.map(sound => (
                            <option key={sound} value={sound}>{sound}</option>
                        ))}
                    </select>
                );
            }

            if (paramDef?.type === 'color') {
                return (
                    <input
                        key={index}
                        type="color"
                        value={value as string}
                        onChange={(e) => onParamChange(paramName, e.target.value)}
                        className="bg-transparent border-none rounded-md cursor-pointer w-8 h-6"
                        onClick={(e) => e.stopPropagation()}
                        style={{ padding: '2px' }}
                    />
                );
            }
            
            if (paramDef?.type === 'number' || paramDef?.type === 'text') {
                return (
                    <ParamInput
                        key={index}
                        value={value as string | number}
                        type={paramDef.type}
                        onChange={(newValue) => onParamChange(paramName, newValue)}
                        onDropVariable={(variableName) => onParamChange(paramName, { variable: variableName })}
                        onDropNewReporter={(blockName) => {
                            const extensionBlocks = ALL_EXTENSIONS.flatMap(ext => ext.blocks);
                            const allBlockTemplates = [...ALL_BLOCKS.flatMap(c => c.blocks), ...VARIABLE_BLOCK_TEMPLATES, ...MY_BLOCKS_TEMPLATES, ...extensionBlocks];
                            const blockTemplate = allBlockTemplates.find(b => b.name === blockName);

                            if (blockTemplate) {
                                const newBlock: ScriptBlock = {
                                    ...blockTemplate,
                                    id: `${blockName}-${Date.now()}-${Math.random()}`,
                                    params: blockTemplate.defaultParams || {},
                                    x: 0, y: 0,
                                };
                                onParamChange(paramName, newBlock);
                            }
                        }}
                    />
                )
            }
        }
        return <span key={index}>{part}</span>;
    });

    if (shape === 'c_block') {
        return (
            <CBlock block={block} colors={colors} bodyHeight={cBlockBodyHeight}>
                {renderParams()}
            </CBlock>
        )
    }

    const containerClasses = [
        'relative flex items-center gap-2 p-2 text-xs font-semibold min-h-[40px] w-fit',
        colors.bg,
        colors.text,
        isReporter ? 'rounded-full px-3' : (shape === 'hat' ? 'rounded-t-2xl rounded-b-md' : 'rounded-md'),
    ].join(' ');

    const blockStyles: React.CSSProperties = {};
    if (shape === 'stack') {
        blockStyles.paddingTop = '6px';
    }

    return (
        <div className={containerClasses} style={blockStyles}>
            {shape === 'stack' && <Bump color={colors.dark} />}
            {shape !== 'reporter' && <div className={`absolute bottom-0 left-0 right-0 h-[4px] ${colors.bg}`}></div>}
            {(shape === 'stack' || shape === 'hat') && <Notch />}
            
            <div className="relative z-10 flex items-center gap-2">
                {renderParams()}
            </div>
        </div>
    );
};