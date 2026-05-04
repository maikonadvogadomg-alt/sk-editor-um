import { useState } from "react";
import {
  Settings, Key, Eye, EyeOff, Database, Save, RotateCcw,
  ExternalLink, CheckCircle2, Shield, Zap, Github,
  AlertTriangle, RefreshCw
} from "lucide-react";

interface ApiKey {
  label: string;
  key: string;
  hint: string;
  url: string;
  free?: boolean;
}

const DEFAULT_KEYS: ApiKey[] = [
  { label: "OpenAI", key: "", hint: "sk-...", url: "platform.openai.com/api-keys" },
  { label: "Groq (Gratuito)", key: "", hint: "gsk_...", url: "console.groq.com/keys", free: true },
  { label: "Anthropic / Claude", key: "", hint: "sk-ant-...", url: "console.anthropic.com" },
  { label: "Google Gemini", key: "", hint: "AIza...", url: "aistudio.google.com/app/apikey", free: true },
  { label: "Perplexity (internet)", key: "", hint: "pplx-...", url: "perplexity.ai/settings/api" },
  { label: "OpenRouter (todos em 1)", key: "", hint: "sk-or-...", url: "openrouter.ai/keys", free: true },
];

function loadKeys(): ApiKey[] {
  try {
    const raw = localStorage.getItem("devtools_api_keys");
    if (!raw) return DEFAULT_KEYS;
    const saved = JSON.parse(raw) as { label: string; key: string }[];
    return DEFAULT_KEYS.map((d) => ({ ...d, key: saved.find((s) => s.label === d.label)?.key ?? "" }));
  } catch { return DEFAULT_KEYS; }
}

interface EnvCheck { name: string; ok: boolean; value?: string; note: string; }

function checkEnvironment(): EnvCheck[] {
  const checks: EnvCheck[] = [];
  checks.push({ name: "HTTPS / Contexto seguro", ok: location.protocol === "https:" || location.hostname === "localhost", note: location.protocol === "https:" ? "Ambiente seguro â" : "HTTP detectado â algumas APIs nÃ£o funcionarÃ£o." });
  checks.push({ name: "Service Worker API", ok: "serviceWorker" in navigator, note: "serviceWorker" in navigator ? "DisponÃ­vel â" : "NÃ£o suportado neste navegador." });
  checks.push({ name: "IndexedDB", ok: !!window.indexedDB, note: window.indexedDB ? "DisponÃ­vel â" : "NÃ£o suportado." });
  checks.push({ name: "Web Speech API (voz)", ok: !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition), note: (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition ? "DisponÃ­vel â" : "NÃ£o suportado (use Chrome)." });
  checks.push({ name: "Clipboard API", ok: !!navigator.clipboard, note: navigator.clipboard ? "DisponÃ­vel â" : "Sem acesso ao clipboard." });
  checks.push({ name: "localStorage", ok: !!window.localStorage, note: window.localStorage ? `DisponÃ­vel â ${Object.keys(localStorage).length} itens armazenados` : "NÃ£o disponÃ­vel." });
  return checks;
}

export function ConfigPage() {
  const [keys, setKeys] = useState<ApiKey[]>(loadKeys);
  const [showKeys, setShowKeys] = useState<boolean[]>(DEFAULT_KEYS.map(() => false));
  const [neonDb, setNeonDb] = useState(() => localStorage.getItem("devtools_neon_db") ?? "");
  const [githubToken, setGithubToken] = useState(() => localStorage.getItem("devtools_github_token") ?? "");
  const [savedMsg, setSavedMsg] = useState("");
  const [envChecks] = useState(checkEnvironment);
  const [openSection, setOpenSection] = useState<string>("keys");

  const updateKey = (i: number, val: string) => {
    setKeys((prev) => prev.map((k, idx) => idx === i ? { ...k, key: val } : k));
  };

  const toggleShow = (i: number) => {
    setShowKeys((prev) => prev.map((v, idx) => idx === i ? !v : v));
  };

  const handleSave = () => {
    localStorage.setItem("devtools_api_keys", JSON.stringify(keys.map((k) => ({ label: k.label, key: k.key }))));
    localStorage.setItem("devtools_neon_db", neonDb);
    localStorage.setItem("devtools_github_token", githubToken);
    setSavedMsg("â Salvo!");
    setTimeout(() => setSavedMsg(""), 2500);
  };

  const handleReset = () => {
    if (!confirm("Limpar TODOS os dados salvos (chaves, projetos, configuraÃ§Ãµes)? NÃ£o pode ser desfeito.")) return;
    localStorage.clear();
    window.location.reload();
  };

  const testKey = async (k: ApiKey) => {
    if (!k.key) { alert("Cole a chave antes de testar."); return; }
    alert(`Testando ${k.label}... (verifique o console do navegador)`);
  };

  const sections = [
    { id: "keys", label: "ð Chaves de API" },
    { id: "db", label: "ðï¸ Banco de dados" },
    { id: "github", label: "ð GitHub" },
    { id: "env", label: "ð DiagnÃ³stico do ambiente" },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#0f0f0f]" style={{ scrollbarWidth: "thin", scrollbarColor: "#ffffff18 transparent" }}>
      <div className="max-w-2xl mx-auto w-full px-4 py-5 space-y-4">

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings size={20} className="text-violet-400" />
            <h1 className="text-lg font-bold text-white">ConfiguraÃ§Ãµes</h1>
          </div>
          <p className="text-xs text-white/40">Chaves de API, banco de dados, GitHub e diagnÃ³stico do ambiente.</p>
        </div>

        {sections.map((s) => (
          <div key={s.id} className="bg-[#141414] border border-white/10 rounded-2xl overflow-hidden">
            <button
              onClick={() => setOpenSection(openSection === s.id ? "" : s.id)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/3 transition-all"
            >
              <span className="text-sm font-semibold text-white/80">{s.label}</span>
              {openSection === s.id
                ? <span className="text-violet-400 text-xs">â² fechar</span>
                : <span className="text-white/30 text-xs">â¼ abrir</span>}
            </button>

            {openSection === s.id && (
              <div className="px-5 pb-5 pt-2 border-t border-white/10 space-y-3">

                {/* ââ API KEYS ââ */}
                {s.id === "keys" && (
                  <>
                    <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3">
                      <div className="flex items-start gap-2">
                        <Zap size={13} className="text-violet-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-violet-300">
                          <strong>Dica:</strong> Use o <strong>OpenRouter</strong> (<code>sk-or-...</code>) para acessar GPT-4o, Claude, Gemini e +100 modelos com <strong>uma chave sÃ³</strong>. Crie grÃ¡tis em openrouter.ai
                        </p>
                      </div>
                    </div>

                    {keys.map((k, i) => (
                      <div key={k.label} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-white/35 flex items-center gap-1.5">
                            {k.label}
                            {k.free && <span className="bg-green-500/20 text-green-400 text-[9px] px-1.5 py-0.5 rounded-full font-bold">GRÃTIS</span>}
                          </label>
                          <a href={`https://${k.url}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300">
                            Obter chave <ExternalLink size={9} />
                          </a>
                        </div>
                        <div className="relative">
                          <input
                            type={showKeys[i] ? "text" : "password"}
                            value={k.key}
                            onChange={(e) => updateKey(i, e.target.value)}
                            placeholder={k.hint}
                            autoComplete="off"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder:text-white/15 focus:outline-none focus:ring-1 focus:ring-violet-500/50 font-mono"
                          />
                          <button onClick={() => toggleShow(i)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60">
                            {showKeys[i] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                        {k.key && (
                          <div className="flex items-center gap-1.5 text-[10px] text-green-400">
                            <CheckCircle2 size={11} /> Chave preenchida
                          </div>
                        )}
                      </div>
                    ))}

                    <div className="flex items-start gap-2 bg-white/3 border border-white/8 rounded-xl px-4 py-3">
                      <Shield size={13} className="text-violet-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-white/35">Suas chaves ficam salvas <strong className="text-white/50">apenas neste navegador</strong>. Nenhum servidor as acessa.</p>
                    </div>
                  </>
                )}

                {/* ââ DB ââ */}
                {s.id === "db" && (
                  <div className="space-y-3">
                    <p className="text-xs text-white/40">Configure a URL de conexÃ£o do banco de dados PostgreSQL (Neon, Supabase, Railway, etc.)</p>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-white/35">URL de ConexÃ£o</label>
                        <a href="https://neon.tech" target="_blank" rel="noopener noreferrer" className="text-[10px] text-violet-400 hover:underline flex items-center gap-1">Criar banco gratuito no Neon <ExternalLink size={9} /></a>
                      </div>
                      <input
                        type="password"
                        value={neonDb}
                        onChange={(e) => setNeonDb(e.target.value)}
                        placeholder="postgresql://user:pass@host.neon.tech/dbname"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/15 focus:outline-none focus:ring-1 focus:ring-violet-500/50 font-mono"
                      />
                    </div>
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4 space-y-2">
                      <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Como criar um banco gratuito no Neon</p>
                      {["Acesse neon.tech e crie uma conta gratuita", "Clique em 'Create project'", "Escolha a regiÃ£o mais prÃ³xima (ex: us-east-1)", "Copie a 'Connection string' e cole acima", "Pronto â 0.5 GB gratuito para sempre"].map((step, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-white/40">
                          <span className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center text-[10px] shrink-0 mt-0.5">{i + 1}</span>
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ââ GITHUB ââ */}
                {s.id === "github" && (
                  <div className="space-y-3">
                    <p className="text-xs text-white/40">Configure seu token para importar e exportar projetos diretamente do GitHub.</p>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-white/35">Personal Access Token</label>
                        <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener noreferrer" className="text-[10px] text-violet-400 hover:underline flex items-center gap-1">Gerar token <ExternalLink size={9} /></a>
                      </div>
                      <input
                        type="password"
                        value={githubToken}
                        onChange={(e) => setGithubToken(e.target.value)}
                        placeholder="ghp_..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/15 focus:outline-none focus:ring-1 focus:ring-violet-500/50 font-mono"
                      />
                    </div>
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4 space-y-2">
                      <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Como gerar o token</p>
                      {[
                        "GitHub â foto do perfil â Settings",
                        "Developer settings â Personal access tokens â Tokens (classic)",
                        "Generate new token â selecione escopo 'repo'",
                        "Copie o token (ghp_...) e cole acima",
                        "Use no Playground para importar/exportar repositÃ³rios"
                      ].map((step, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-white/40">
                          <span className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center text-[10px] shrink-0 mt-0.5">{i + 1}</span>
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ââ ENV CHECK ââ */}
                {s.id === "env" && (
                  <div className="space-y-2">
                    <p className="text-xs text-white/40 mb-3">Verifica se este dispositivo e navegador suportam todos os recursos necessÃ¡rios.</p>
                    {envChecks.map((c, i) => (
                      <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${c.ok ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}`}>
                        {c.ok ? <CheckCircle2 size={14} className="text-green-400 shrink-0 mt-0.5" /> : <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />}
                        <div>
                          <p className="text-xs font-semibold text-white/70">{c.name}</p>
                          <p className="text-[11px] text-white/40 mt-0.5">{c.note}</p>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => window.location.reload()} className="flex items-center gap-2 text-xs text-white/30 hover:text-white/60 mt-2">
                      <RefreshCw size={12} /> Atualizar diagnÃ³stico
                    </button>
                  </div>
                )}

              </div>
            )}
          </div>
        ))}

        {/* Save + Reset */}
        <div className="flex gap-3 pb-6">
          <button onClick={handleReset} className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-500/20 text-red-400 text-sm hover:bg-red-500/10 transition-all">
            <RotateCcw size={14} /> Limpar tudo
          </button>
          <button
            onClick={handleSave}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${savedMsg ? "bg-green-600 text-white shadow-green-600/20" : "bg-violet-600 text-white hover:bg-violet-500 shadow-violet-600/20"}`}
          >
            <Save size={15} />
            {savedMsg || "Salvar configuraÃ§Ãµes"}
          </button>
        </div>
      </div>
    </div>
  );
}
