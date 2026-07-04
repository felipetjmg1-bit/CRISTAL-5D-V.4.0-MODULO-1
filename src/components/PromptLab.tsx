import { useState } from 'react';
import { StorageScene } from '../types';
import { SCENES_DATA } from '../data/scenesData';
import { Copy, Check, Sparkles, Sliders, FileText, Image } from 'lucide-react';
import { playClickSfx } from '../utils/audio';

interface PromptLabProps {
  currentScene: StorageScene;
}

export default function PromptLab({ currentScene }: PromptLabProps) {
  const [copiedScene, setCopiedScene] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  
  // Prompt customizer parameters
  const [lens, setLens] = useState('macro-100mm');
  const [camera, setCamera] = useState('arri-alexa');
  const [lighting, setLighting] = useState('volumetric-cinematic');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeSceneData = SCENES_DATA[currentScene];

  // Map of suffix strings based on parameters selected
  const getCameraSuffix = () => {
    let suffix = '';
    if (camera === 'arri-alexa') suffix += ', gravado com Arri Alexa LF';
    if (camera === 'red-v-raptor') suffix += ', capturado com RED V-Raptor 8K';
    if (camera === 'hasselblad') suffix += ', visual de médio formato Hasselblad';

    if (lens === 'macro-100mm') suffix += ', lente macro extrema de 100mm';
    if (lens === 'anamorphic') suffix += ', flares de lente de cinema anamórfica';
    if (lens === 'wide-angle') suffix += ', lente grande angular de 18mm com profundidade de campo';

    if (lighting === 'volumetric-cinematic') suffix += ', iluminação de laboratório volumétrica, claroscuro de alto contraste';
    if (lighting === 'neon-ambient') suffix += ', brilhos em neon ciano e violeta profundo, iluminação de fundo de laboratório';
    if (lighting === 'sterile-cleanroom') suffix += ', iluminação clínica branca brilhante de sala limpa estéril';

    return suffix;
  };

  const getCustomizedPrompt = (prompt: string) => {
    // Append customized camera modifiers nicely before style note
    const styleIndex = prompt.indexOf('Style:');
    if (styleIndex !== -1) {
      return prompt.slice(0, styleIndex) + getCameraSuffix() + '. ' + prompt.slice(styleIndex);
    }
    return prompt + getCameraSuffix();
  };

  const handleCopyScenePrompt = (id: string, text: string) => {
    playClickSfx();
    navigator.clipboard.writeText(text);
    setCopiedScene(id);
    setTimeout(() => setCopiedScene(null), 2000);
  };

  const handleCopyFullScript = () => {
    playClickSfx();
    const fullScript = Object.values(StorageScene).map(sceneId => {
      const s = SCENES_DATA[sceneId];
      return `[CENA ${s.number}: ${s.title.toUpperCase()}]\n${getCustomizedPrompt(s.promptText)}\n\nVOZ DO NARRADOR:\n"${s.narration}"\n--------------------`;
    }).join('\n\n');

    navigator.clipboard.writeText(fullScript);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#070E1B]/80 border border-cyan-950/40 rounded-xl overflow-hidden backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0A162B] border-b border-cyan-950/40">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h3 className="font-mono text-xs font-bold text-gray-200 tracking-wide">
            GERADOR DE PROMPTS CINEMATOGRÁFICOS
          </h3>
        </div>
        <button
          onClick={() => { playClickSfx(); setShowAdvanced(!showAdvanced); }}
          className="font-mono text-[9px] text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1.5 px-2 py-0.5 bg-cyan-950/40 rounded border border-cyan-500/20"
        >
          <Sliders className="w-3 h-3" />
          {showAdvanced ? 'Ocultar Filtros' : 'Customizar Prompt'}
        </button>
      </div>

      {/* Advanced Modifiers Control Drawer */}
      {showAdvanced && (
        <div className="p-3 bg-[#050A14] border-b border-cyan-950/60 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="font-mono text-[8px] text-gray-400 uppercase tracking-widest block">Seleção de Lente / Óptica</label>
            <select
              value={lens}
              onChange={(e) => { playClickSfx(); setLens(e.target.value); }}
              className="w-full bg-[#081123] border border-cyan-950 rounded p-1 text-[10px] font-mono text-cyan-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="macro-100mm">Macro Extrema de 100mm f/2.8</option>
              <option value="anamorphic">Lente Anamórfica Cine (Cinema Scope)</option>
              <option value="wide-angle">Ultra-Grande Angular de 18mm</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-mono text-[8px] text-gray-400 uppercase tracking-widest block">Sensor / Corpo de Câmera</label>
            <select
              value={camera}
              onChange={(e) => { playClickSfx(); setCamera(e.target.value); }}
              className="w-full bg-[#081123] border border-cyan-950 rounded p-1 text-[10px] font-mono text-cyan-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="arri-alexa">Arri Alexa LF Grande Formato</option>
              <option value="red-v-raptor">RED V-Raptor 8K Cinema</option>
              <option value="hasselblad">Hasselblad 100MP Médio Formato</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-mono text-[8px] text-gray-400 uppercase tracking-widest block">Iluminação da Sala Limpa</label>
            <select
              value={lighting}
              onChange={(e) => { playClickSfx(); setLighting(e.target.value); }}
              className="w-full bg-[#081123] border border-cyan-950 rounded p-1 text-[10px] font-mono text-cyan-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="volumetric-cinematic">Volumétrica Cinematográfica (Claroscuro)</option>
              <option value="neon-ambient">Brilho de Neon Cobalto e Violeta</option>
              <option value="sterile-cleanroom">Luz Estéril Branca Clínica</option>
            </select>
          </div>
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[340px]">
        
        {/* Active Scene Prompt Container */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5" />
              Prompt da Cena Ativa (Cena {activeSceneData.number})
            </span>
            <button
              onClick={() => handleCopyScenePrompt(activeSceneData.id, getCustomizedPrompt(activeSceneData.promptText))}
              className="flex items-center gap-1 font-mono text-[9px] text-gray-400 hover:text-cyan-400 transition-colors"
            >
              {copiedScene === activeSceneData.id ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copiar Prompt</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-[#03070E] rounded-lg border border-cyan-950/60 p-3 relative group">
            <p className="font-mono text-[10px] text-gray-300 leading-relaxed break-words select-all">
              {getCustomizedPrompt(activeSceneData.promptText)}
            </p>
          </div>
        </div>

        {/* Master Screenplay Action bar */}
        <div className="bg-cyan-950/10 rounded-lg border border-cyan-500/15 p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="flex flex-col">
              <span className="font-sans text-[11px] font-bold text-gray-200">
                Roteiro Cinematográfico Completo
              </span>
              <span className="font-sans text-[10px] text-gray-400">
                Exporta as 5 cenas com modificadores de câmera e narrações na íntegra.
              </span>
            </div>
          </div>

          <button
            onClick={handleCopyFullScript}
            className="font-mono text-[10px] font-semibold flex items-center gap-1.5 py-1.5 px-3 bg-[#0B172E] border border-cyan-500/20 hover:border-cyan-500/60 hover:text-cyan-400 rounded-lg text-gray-300 transition-all shadow-md shrink-0 w-full md:w-auto justify-center"
          >
            {copiedAll ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Roteiro Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Roteiro Completo</span>
              </>
            )}
          </button>
        </div>

        {/* Science Notes & Style Checklist */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="font-mono text-[9px] text-cyan-400 uppercase tracking-widest block">
              Checklist de Estilo Cinematográfico
            </span>
            <ul className="bg-[#050A14]/60 p-3 rounded-lg border border-cyan-950/40 space-y-1.5">
              {activeSceneData.styleNotes.map((note, idx) => (
                <li key={idx} className="font-mono text-[9px] text-gray-400 flex items-start gap-1.5">
                  <span className="text-cyan-400 shrink-0">■</span>
                  {note}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <span className="font-mono text-[9px] text-teal-400 uppercase tracking-widest block">
              Constantes Científicas de Base
            </span>
            <div className="bg-[#050A14]/60 p-3 rounded-lg border border-cyan-950/40 space-y-2">
              <span className="font-sans font-bold text-[10px] text-gray-200 block leading-tight">
                {activeSceneData.scientificBase.title}
              </span>
              <p className="font-sans text-[9px] text-gray-400 leading-normal">
                {activeSceneData.scientificBase.description}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
