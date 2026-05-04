import { useState } from "react";
import {
  Key, Eye, EyeOff, CheckCircle2, Shield, Zap,
  Database, Save, RotateCcw, ExternalLink, FolderOpen,
  Brain, Globe, ToggleLeft, ToggleRight
} from "lucide-react";
import type { AIConfig, AIProvider } from "@/lib/ai";
import { PROVIDER_MODELS, PROVIDER_LABELS, PROVIDER_KEY_HINTS, detectProvider, defaultModelFor } from "@/lib/ai";
import { loadSystemPrompt, saveSystemPrompt, type KeySlot } from "@/lib/storage";

interface Props {
  slots: KeySlot[];
  activeSlot: number;
  onSaveSlots: (slots: KeySlot[]) => void;
  onSetActiveSlot: (idx: number) => void;
}

const ALL_PROVIDERS: AIProvider[] = ["openai", "anthropic", "perplexity", "gemini", "groq", "mistral", "openrouter"];

const PROVIDER_URLS: Record<AIProvider, string> = {
  openai: "https://platform.openai.com/api-keys",
  anthropic: "https://console.anthropic.com/keys",
  perplexity: "https://www.perplexity.ai/settings/api",
  gemini: "https://aistudio.google.com/app/apikey",
  groq: "https://console.groq.com/keys",
  mistral: "https://console.mistral.ai/api-keys",
  openrouter: "https://openrouter.ai/keys",
};

export function SettingsPage({ slots, activeSlot, onSaveSlots, onSetActiveSlot }: Props) {
  const [localSlots, setLocalSlots] = useState<KeySlot[]>(slots.map((s) => ({ ...s })));
  const [editingSlot, setEditingSlot] = useState(0);
  const [showKeys, setShowKeys] = useState<boolean[]>(slots.map(() => false));
  const [systemPrompt, setSystemPrompt] = useState(() => loadSystemPrompt());
  const [neonDb, setNeonDb] = useState(() => localStorage.getItem("juridico_neon_db") ?? "");
  const [driveKey, setDriveKey] = useState(() => localStorage.getItem("juridico_drive_key") ?? "");
  const [autoBrain, setAutoBrain] = useState(() => localStorage.getItem("chat_auto_brain") === "1");
  const [webSearch, setWebSearch] = useState(() => localStorage.getItem("chat_web_search") === "1");
  const [saved, setSaved] = useState(false);

  const slot = localSlots[editingSlot];

  const updateSlot = (field: keyof KeySlot, value: string) => {
    const updated = localSlots.map((s, i) =>
      i === editingSlot ? { ...s, [field]: value } : s
    );
    setLocalSlots(updated);
  };

  const handleKeyChange = (val: string) => {
    updateSlot("apiKey", val);
    const detected = detectProvider(val);
    if (detected && detected !== slot.provider) {
      const updated = localSlots.map((s, i) =>
        i === editingSlot
          ? { ...s, apiKey: val, provider: detected, model: defaultModelFor(detected) }
          : s
      );
      setLocalSlots(updated);
    }
  };

  const handleProviderChange = (p: AIProvider) => {
    const updated = localSlots.map((s, i) =>
      i === editingSlot ? { ...s, provider: p, model: defaultModelFor(p) } : s
    );
    setLocalSlots(updated);
  };

  const handleSave = () => {
    onSaveSlots(localSlots);
    saveSystemPrompt(systemPrompt);
    localStorage.setItem("juridico_neon_db", neonDb);
    localStorage.setItem("juridico_drive_key", driveKey);
    localStorage.setItem("chat_auto_brain", autoBrain ? "1" : "0");
    localStorage.setItem("chat_web_search", webSearch ? "1" : "0");
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    if (confirm("Limpar todos os dados salvos (chaves, conversas, arquivos)? Esta aÃ§Ã£o nÃ£o pode ser desfeita.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const toggleShow = (i: number) => {
    setShowKeys((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  };

  const models = PROVIDER_MODELS[slot.provider] ?? [];
  const detected = slot.apiKey ? detectProvider(slot.apiKey) : null;

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#0d1520]" style={{ scrollbarWidth: "thin", scrollbarColor: "#ffffff28 transparent" }}>
      <div className="max-w-2xl mx-auto w-full px-4 py-6 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-white">ConfiguraÃ§Ãµes</h1>
          <p className="text-sm text-white/40 mt-1">Gerencie suas chaves de API, banco de dados e preferÃªncias.</p>
        </div>

        {/* Key slot tabs */}
        <section className="bg-[#111d2e] border border-white/15 rounded-2xl overflow-hidden">
          <div className="flex border-b border-white/15">
            {localSlots.map((s, i) => (
              <button
                key={i}
                onClick={() => setEditingSlot(i)}
                className={`flex-1 py-3 text-sm font-medium transition-all relative ${
                  editingSlot === i
                    ? "text-violet-300 bg-violet-600/10"
                    : "text-white/40 hover:text-white/60 hover:bg-white/3"
                }`}
              >
                <span className="block text-xs font-bold">{i + 1}</span>
                <span className="block text-[10px] truncate px-1">{s.label || `Chave ${i + 1}`}</span>
                {s.apiKey && <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-green-400" />}
              </button>
            ))}
          </div>

          <div className="p-5 space-y-4">
            {/* Label */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-white/30 mb-1.5">Nome desta chave</label>
              <input
                value={slot.label}
                onChange={(e) => updateSlot("label", e.target.value)}
                placeholder="Ex: Groq Gratuito, OpenAI Trabalho..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
              />
            </div>

            {/* API Key */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-white/30">Chave de API</label>
                <a
                  href={PROVIDER_URLS[slot.provider]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Obter chave <ExternalLink size={10} />
                </a>
              </div>
              <div className="relative">
                <input
                  type={showKeys[editingSlot] ? "text" : "password"}
                  value={slot.apiKey}
                  onChange={(e) => handleKeyChange(e.target.value)}
                  placeholder="Cole aqui (sk-..., sk-ant-..., pplx-..., AIza..., gsk_...)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder:text-white/15 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                  autoComplete="off"
                />
                <button onClick={() => toggleShow(editingSlot)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60">
                  {showKeys[editingSlot] ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {detected && (
                <div className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <CheckCircle2 size={13} className="text-green-400" />
                  <p className="text-xs text-green-400">Detectado: <strong>{PROVIDER_LABELS[detected]}</strong></p>
                </div>
              )}
            </div>

            {/* Provider */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-white/30 mb-1.5">Provedor</label>
              <div className="grid grid-cols-2 gap-1.5">
                {ALL_PROVIDERS.map((p) => (
                  <button
                    key={p}
                    onClick={() => handleProviderChange(p)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all text-left ${
                      slot.provider === p
                        ? "bg-violet-600/20 text-violet-300 border-violet-500/50"
                        : "bg-white/5 text-white/40 border-white/10 hover:border-white/20 hover:text-white/60"
                    }`}
                  >
                    <span className="block">{PROVIDER_LABELS[p]}</span>
                    <span className="block text-[9px] opacity-50 font-mono">{PROVIDER_KEY_HINTS[p]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Model */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-white/30 mb-1.5">Modelo</label>
              <select
                value={slot.model}
                onChange={(e) => updateSlot("model", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id} className="bg-[#141414]">{m.label}</option>
                ))}
              </select>
            </div>

            {/* Set as active */}
            <button
              onClick={() => onSetActiveSlot(editingSlot)}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                activeSlot === editingSlot
                  ? "bg-violet-600/20 text-violet-300 border-violet-500/40"
                  : "bg-white/5 text-white/50 border-white/10 hover:border-violet-500/30 hover:text-violet-300"
              }`}
            >
              {activeSlot === editingSlot ? "â Chave ativa no chat" : "Usar esta chave no chat"}
            </button>

            {slot.provider === "openrouter" && (
              <div className="flex items-start gap-2.5 bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3">
                <Zap size={13} className="text-violet-400 shrink-0 mt-0.5" />
                <p className="text-xs text-violet-300 leading-relaxed">
                  <strong>OpenRouter</strong> â acesse GPT-4o, Claude, Gemini, Perplexity e +100 modelos com <strong>uma chave sÃ³</strong>. Crie grÃ¡tis em openrouter.ai
                </p>
              </div>
            )}
          </div>
        </section>

        {/* System Prompt */}
        <section className="bg-[#111d2e] border border-white/15 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Key size={15} className="text-violet-400" />
            <h2 className="text-sm font-semibold text-white">InstruÃ§Ã£o padrÃ£o da IA</h2>
          </div>
          <p className="text-xs text-white/40">Define o comportamento padrÃ£o da IA em todas as conversas.</p>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="Ex: VocÃª Ã© uma advogada especialista em direito trabalhista brasileiro. Sempre cite artigos de lei quando relevante. Responda de forma objetiva e tÃ©cnica em portuguÃªs do Brasil..."
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-violet-500/50 resize-none"
          />
        </section>

        {/* Funcionalidades inteligentes */}
        <section className="bg-[#111d2e] border border-white/15 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Brain size={15} className="text-violet-400" />
            <h2 className="text-sm font-semibold text-white">MemÃ³ria e busca na web</h2>
          </div>

          {/* Auto-brain toggle */}
          <div className="flex items-center justify-between gap-4 px-4 py-3 bg-white/4 rounded-xl border border-white/8">
            <div className="flex-1">
              <p className="text-sm font-medium text-white/80">ð§  Auto-memÃ³ria</p>
              <p className="text-xs text-white/40 mt-0.5">Salva automaticamente o resumo da conversa apÃ³s cada resposta da IA. DisponÃ­vel no botÃ£o de exportar.</p>
            </div>
            <button onClick={() => setAutoBrain((p) => !p)}
              className="shrink-0 transition-colors">
              {autoBrain
                ? <ToggleRight size={32} className="text-violet-400" />
                : <ToggleLeft size={32} className="text-white/25" />}
            </button>
          </div>

          {/* Web search toggle */}
          <div className="flex items-center justify-between gap-4 px-4 py-3 bg-white/4 rounded-xl border border-white/8">
            <div className="flex-1">
              <p className="text-sm font-medium text-white/80">ð Busca na web (Ã­cone ð no chat)</p>
              <p className="text-xs text-white/40 mt-0.5">Instrui a IA a incluir links de fontes reais. Use Perplexity para internet de verdade.</p>
            </div>
            <button onClick={() => setWebSearch((p) => !p)}
              className="shrink-0 transition-colors">
              {webSearch
                ? <ToggleRight size={32} className="text-blue-400" />
                : <ToggleLeft size={32} className="text-white/25" />}
            </button>
          </div>

          {/* Perplexity hint */}
          <div className="flex items-start gap-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
            <Globe size={13} className="text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-blue-300 font-semibold mb-0.5">Acesso real Ã  internet â use Perplexity</p>
              <p className="text-xs text-blue-200/60 leading-relaxed">
                Crie chave gratuita em <a href="https://www.perplexity.ai/settings/api" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-300">perplexity.ai/settings/api</a> (<code className="font-mono text-blue-300">pplx-...</code>). Selecione <strong>"Sonar Large (com internet)"</strong> como modelo. A IA vai pesquisar na web de verdade.
              </p>
            </div>
          </div>
        </section>

        {/* Banco de dados Neon */}
        <section className="bg-[#111d2e] border border-white/15 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Database size={15} className="text-violet-400" />
            <h2 className="text-sm font-semibold text-white">Banco de dados (Neon PostgreSQL)</h2>
          </div>
          <p className="text-xs text-white/40">
            Opcional. Cole a URL de conexÃ£o do Neon para salvar conversas na nuvem.<br />
            Crie grÃ¡tis em <a href="https://neon.tech" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">neon.tech</a>
          </p>
          <div className="relative">
            <input
              type="password"
              value={neonDb}
              onChange={(e) => setNeonDb(e.target.value)}
              placeholder="postgresql://user:pass@host/dbname"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/15 focus:outline-none focus:ring-1 focus:ring-violet-500/50 font-mono"
              autoComplete="off"
            />
          </div>
        </section>

        {/* Google Drive */}
        <section className="bg-[#111d2e] border border-white/15 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <FolderOpen size={15} className="text-violet-400" />
            <h2 className="text-sm font-semibold text-white">Google Drive (exportar conversas)</h2>
          </div>
          <p className="text-xs text-white/40">
            Opcional. Cole sua chave de API do Google para exportar conversas diretamente ao Drive.<br />
            Gere em <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">console.cloud.google.com</a>
          </p>
          <input
            type="password"
            value={driveKey}
            onChange={(e) => setDriveKey(e.target.value)}
            placeholder="AIza..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/15 focus:outline-none focus:ring-1 focus:ring-violet-500/50 font-mono"
            autoComplete="off"
          />
        </section>

        {/* Security note */}
        <div className="flex items-start gap-2.5 bg-white/3 border border-white/8 rounded-xl px-4 py-3">
          <Shield size={13} className="text-violet-400 shrink-0 mt-0.5" />
          <p className="text-xs text-white/35 leading-relaxed">
            Todas as chaves ficam salvas <strong className="text-white/50">apenas no seu dispositivo</strong> (localStorage do navegador). Nenhum servidor armazena seus dados.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pb-6">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-500/20 text-red-400 text-sm hover:bg-red-500/10 transition-all"
          >
            <RotateCcw size={14} />
            Limpar tudo
          </button>
          <button
            onClick={handleSave}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all shadow-lg ${
              saved
                ? "bg-green-600 text-white shadow-green-600/20"
                : "bg-violet-600 text-white hover:bg-violet-500 shadow-violet-600/20"
            }`}
          >
            <Save size={15} />
            {saved ? "â Salvo!" : "Salvar configuraÃ§Ãµes"}
          </button>
        </div>
      </div>
    </div>
  );
}
