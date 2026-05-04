import { useState } from "react";
import {
  Smartphone, Search, CheckCircle2, XCircle, AlertCircle,
  Download, ExternalLink, ChevronDown, ChevronRight,
  Wand2, Copy, Check, FileCode2, Star, Zap, Code2, Package
} from "lucide-react";

interface CheckResult {
  label: string;
  ok: boolean;
  warn?: boolean;
  detail: string;
  fix?: string;
}

// âââ Generated PWA files ââââââââââââââââââââââââââââââââââââââââââââââââââââââ
function generateManifest(name: string, color: string, basePath: string) {
  return JSON.stringify({
    name,
    short_name: name.split(" ")[0],
    description: `Aplicativo ${name}`,
    start_url: basePath || "/",
    scope: basePath || "/",
    display: "standalone",
    orientation: "any",
    background_color: color,
    theme_color: color,
    lang: "pt-BR",
    icons: [
      { src: `${basePath}icon-192.png`, sizes: "192x192", type: "image/png", purpose: "any maskable" },
      { src: `${basePath}icon-512.png`, sizes: "512x512", type: "image/png", purpose: "any maskable" },
    ],
  }, null, 2);
}

function generateSW(basePath: string) {
  return `const CACHE = "app-cache-v2";
const BASE = "${basePath || "/"}";

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll([BASE, BASE + "index.html"]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.url.includes("/api/")) return;
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request).catch(() => caches.match(BASE + "index.html")));
    return;
  }
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(e.request);
      const fresh = fetch(e.request).then((r) => { if (r.ok) cache.put(e.request, r.clone()); return r; }).catch(() => cached);
      return cached || fresh;
    })
  );
});`;
}

function generateIndexSnippet(basePath: string) {
  return `<!-- Cole no <head> do seu index.html -->
<link rel="manifest" href="manifest.webmanifest" />
<meta name="theme-color" content="#0f0f0f" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Meu App" />
<link rel="apple-touch-icon" href="icon-192.png" />

<!-- Cole antes do </body> -->
<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('${basePath || "/"}sw.js').catch(() => {});
    });
  }
</script>`;
}

function generateCapacitorConfig(appName: string) {
  const id = "com." + appName.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "") + ".app";
  return `// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: '${id}',
  appName: '${appName}',
  webDir: 'dist',       // pasta do seu build (dist/ ou build/ ou public/)
  server: {
    // Para usar URL externa em vez dos arquivos locais:
    // url: 'https://meuapp.netlify.app',
    // cleartext: false,
  },
};

export default config;`;
}

function generateTWAManifest(appName: string, url: string) {
  const pkg = "com." + appName.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "") + ".twa";
  return `// twa-manifest.json â usado com Bubblewrap
{
  "packageId": "${pkg}",
  "host": "${url.replace(/https?:\/\//, "").split("/")[0]}",
  "name": "${appName}",
  "launcherName": "${appName.split(" ")[0]}",
  "display": "standalone",
  "themeColor": "#0f0f0f",
  "navigationColor": "#0f0f0f",
  "backgroundColor": "#0f0f0f",
  "startUrl": "${url || "https://meuapp.netlify.app"}",
  "iconUrl": "${url || "https://meuapp.netlify.app"}/icon-512.png",
  "maskableIconUrl": "${url || "https://meuapp.netlify.app"}/icon-512.png",
  "appVersion": "1.0.0",
  "appVersionCode": 1,
  "signingMode": "none",
  "generatorApp": "bubblewrap-cli"
}`;
}

// âââ Analyzer âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
async function analyzeUrl(url: string): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const isHttps = url.startsWith("https://");
  results.push({
    label: "HTTPS",
    ok: isHttps,
    detail: isHttps ? "Site usa HTTPS â obrigatÃ³rio para PWA." : "Site precisa de HTTPS para funcionar como PWA.",
    fix: isHttps ? undefined : "Use Netlify, Vercel ou Cloudflare Pages â todos jÃ¡ vÃªm com HTTPS gratuito.",
  });

  let html = "";
  try {
    const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
    const data = await res.json() as { contents?: string };
    html = data.contents ?? "";
  } catch {
    results.push({ label: "Acesso Ã  pÃ¡gina", ok: false, detail: "NÃ£o foi possÃ­vel acessar a URL.", fix: "Verifique se o site estÃ¡ no ar." });
    return results;
  }

  results.push({
    label: "Manifest (manifest.webmanifest)",
    ok: /manifest\.webmanifest|manifest\.json/i.test(html),
    detail: /manifest\.webmanifest|manifest\.json/i.test(html) ? "Manifest encontrado." : "Nenhum manifest encontrado.",
    fix: /manifest\.webmanifest|manifest\.json/i.test(html) ? undefined : 'Adicione <link rel="manifest" href="manifest.webmanifest" /> no <head> e crie o arquivo.',
  });
  results.push({
    label: "Service Worker",
    ok: /serviceWorker|sw\.js/i.test(html),
    detail: /serviceWorker|sw\.js/i.test(html) ? "Service Worker encontrado." : "Service Worker nÃ£o encontrado.",
    fix: /serviceWorker|sw\.js/i.test(html) ? undefined : "Crie sw.js e registre com navigator.serviceWorker.register('sw.js').",
  });
  results.push({
    label: 'meta theme-color',
    ok: /theme-color/i.test(html),
    warn: !/theme-color/i.test(html),
    detail: /theme-color/i.test(html) ? "theme-color definido." : "theme-color nÃ£o encontrado (recomendado).",
    fix: /theme-color/i.test(html) ? undefined : 'Adicione <meta name="theme-color" content="#000000" />.',
  });
  results.push({
    label: 'Apple PWA (apple-mobile-web-app-capable)',
    ok: /apple-mobile-web-app-capable/i.test(html),
    warn: !/apple-mobile-web-app-capable/i.test(html),
    detail: /apple-mobile-web-app-capable/i.test(html) ? "Suporte Apple configurado." : "Suporte Apple nÃ£o configurado.",
    fix: /apple-mobile-web-app-capable/i.test(html) ? undefined : 'Adicione <meta name="apple-mobile-web-app-capable" content="yes" />.',
  });
  results.push({
    label: "Viewport responsivo",
    ok: /viewport/i.test(html),
    detail: /viewport/i.test(html) ? "Viewport configurado." : "Viewport nÃ£o encontrado.",
    fix: /viewport/i.test(html) ? undefined : 'Adicione <meta name="viewport" content="width=device-width, initial-scale=1.0" />.',
  });
  return results;
}

// âââ Shared UI ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
function CodeBlock({ code, title }: { code: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const dl = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([code], { type: "text/plain" }));
    a.download = title; a.click();
  };
  return (
    <div className="rounded-xl overflow-hidden border border-white/10 bg-[#0a0a0a]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#0e1828] border-b border-white/15">
        <div className="flex items-center gap-2"><FileCode2 size={13} className="text-violet-400" /><span className="text-xs text-white/50 font-mono">{title}</span></div>
        <div className="flex gap-2">
          <button onClick={dl} className="text-[10px] text-white/30 hover:text-white/60 px-2 py-1 rounded hover:bg-white/5"><Download size={10} className="inline mr-1" />Baixar</button>
          <button onClick={copy} className="text-[10px] text-white/30 hover:text-white/60 px-2 py-1 rounded hover:bg-white/5">
            {copied ? <><Check size={10} className="inline mr-1 text-green-400" /><span className="text-green-400">Copiado!</span></> : <><Copy size={10} className="inline mr-1" />Copiar</>}
          </button>
        </div>
      </div>
      <pre className="p-4 text-xs text-emerald-300 font-mono overflow-x-auto whitespace-pre-wrap" style={{ maxHeight: 240, overflowY: "auto" }}>{code}</pre>
    </div>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3].map((i) => <Star key={i} size={10} className={i <= n ? "text-yellow-400 fill-yellow-400" : "text-white/15"} />)}
    </div>
  );
}

// âââ APK Tools data ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const APK_TOOLS = [
  {
    id: "pwabuilder",
    name: "PWABuilder",
    badge: "Gratuito",
    badgeColor: "green",
    ease: 2,
    url: "https://pwabuilder.com",
    desc: "Ferramenta oficial da Microsoft. Analisa o PWA e gera o APK completo com assinatura digital. TambÃ©m permite enviar Ã  Play Store.",
    steps: [
      "Acesse pwabuilder.com",
      "Cole o link do seu app publicado",
      "Clique em Start â aguarde anÃ¡lise",
      "Clique em Android â Store package",
      "Baixe o arquivo .zip com o APK dentro",
      "Mande o APK pelo WhatsApp para instalar",
    ],
    tip: "Se o site travar na anÃ¡lise, recarregue a pÃ¡gina e tente novamente. Use o Chrome.",
    tipColor: "yellow",
  },
  {
    id: "median",
    name: "Median.co",
    badge: "Pago ($)",
    badgeColor: "orange",
    ease: 3,
    url: "https://median.co",
    desc: "O mais simples de todos. Cole a URL, configure o Ã­cone, nome e cores, e em minutos vocÃª baixa o APK ou publica na Play Store. NÃ£o precisa saber programar.",
    steps: [
      "Acesse median.co e crie uma conta",
      "Clique em New App â Cole a URL do seu app",
      "Configure nome, Ã­cone e cores",
      "Clique em Build Android",
      "Baixe o APK gerado (plano pago)",
    ],
    tip: "Plano mais barato a partir de ~$25/mÃªs. Melhor opÃ§Ã£o se quiser publicar na Play Store profissionalmente.",
    tipColor: "blue",
  },
  {
    id: "gonative",
    name: "GoNative.io",
    badge: "Pago ($)",
    badgeColor: "orange",
    ease: 3,
    url: "https://gonative.io",
    desc: "Similar ao Median. Cole a URL do seu site e receba um app nativo para Android e iOS. Interface visual, sem cÃ³digo.",
    steps: [
      "Acesse gonative.io",
      "Cole a URL do seu app",
      "Personalize aparÃªncia e funcionalidades",
      "Solicite o build e baixe os arquivos",
    ],
    tip: "Tem versÃ£o de teste gratuita para testar antes de pagar.",
    tipColor: "blue",
  },
  {
    id: "capacitor",
    name: "Capacitor (Ionic)",
    badge: "Gratuito",
    badgeColor: "green",
    ease: 1,
    url: "https://capacitorjs.com",
    desc: "Converte qualquer app web (React, Vue, HTML puro) em APK Android/iOS. Requer Node.js e Android Studio instalados no computador. DÃ¡ controle total.",
    steps: [
      "Instale Node.js no seu PC",
      "Na pasta do projeto: npm install @capacitor/core @capacitor/cli @capacitor/android",
      "Execute: npx cap init",
      "FaÃ§a o build do projeto: npm run build",
      "Execute: npx cap add android",
      "Execute: npx cap open android (abre Android Studio)",
      "No Android Studio: Build â Generate Signed APK",
    ],
    codeHint: "capacitor.config.ts",
    tip: "Instale o Android Studio em developer.android.com/studio â Ã© gratuito.",
    tipColor: "violet",
  },
  {
    id: "bubblewrap",
    name: "Bubblewrap (Google)",
    badge: "Gratuito",
    badgeColor: "green",
    ease: 1,
    url: "https://github.com/GoogleChromeLabs/bubblewrap",
    desc: "Ferramenta oficial do Google para criar Trusted Web Activity (TWA) â APK que abre o PWA sem barra de navegador. Requer Node.js e Android Studio.",
    steps: [
      "Instale Node.js e Android Studio no PC",
      "No terminal: npm install -g @bubblewrap/cli",
      "Execute: bubblewrap init --manifest https://meuapp.com/manifest.webmanifest",
      "Execute: bubblewrap build",
      "O APK serÃ¡ gerado na pasta app-release-signed.apk",
    ],
    codeHint: "twa-manifest.json",
    tip: "Bubblewrap exige que o manifest.webmanifest tenha todos os campos preenchidos corretamente.",
    tipColor: "yellow",
  },
  {
    id: "expo",
    name: "Expo EAS Build (App Mobile)",
    badge: "Gratuito",
    badgeColor: "green",
    ease: 2,
    url: "https://expo.dev/eas",
    desc: "Se o seu app foi feito com Expo/React Native (como o app mobile deste projeto), use o EAS Build para gerar o APK na nuvem sem Android Studio.",
    steps: [
      "Crie uma conta gratuita em expo.dev",
      "No terminal: npm install -g eas-cli",
      "Execute: eas login",
      "Na pasta do projeto Expo: eas build:configure",
      "Execute: eas build -p android --profile preview",
      "Aguarde o build na nuvem (~10 min)",
      "Baixe o APK gerado no painel do expo.dev",
    ],
    tip: "O plano gratuito do EAS Build inclui 30 builds/mÃªs. Perfeito para apps pessoais.",
    tipColor: "green",
  },
];

// âââ Main âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
export function PwaPage() {
  const [url, setUrl] = useState("");
  const [appName, setAppName] = useState("Meu App");
  const [themeColor, setThemeColor] = useState("#0f0f0f");
  const [basePath, setBasePath] = useState("/");
  const [results, setResults] = useState<CheckResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [section, setSection] = useState<"analyze" | "generate" | "apk" | "expo">("analyze");
  const [openTool, setOpenTool] = useState<string | null>("pwabuilder");

  const analyze = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setResults(null);
    try { setResults(await analyzeUrl(url.trim())); } catch { setResults([]); }
    setLoading(false);
  };

  const score = results ? results.filter((r) => r.ok).length : 0;
  const total = results?.length ?? 0;
  const pwaReady = results ? results.filter((r) => !r.warn).every((r) => r.ok) : false;

  const navSections = [
    { id: "analyze" as const, label: "ð Analisar URL", desc: "Verifica se seu app Ã© PWA" },
    { id: "generate" as const, label: "â¡ Gerar arquivos PWA", desc: "manifest, sw.js e HTML prontos" },
    { id: "apk" as const, label: "ð± Gerar APK â 6 ferramentas", desc: "Do mais fÃ¡cil ao mais completo" },
    { id: "expo" as const, label: "ð App Mobile â APK (Expo)", desc: "Para apps React Native / Expo" },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#0d1520]" style={{ scrollbarWidth: "thin", scrollbarColor: "#ffffff28 transparent" }}>
      <div className="max-w-2xl mx-auto w-full px-4 py-5 space-y-4">

        <div>
          <div className="flex items-center gap-2 mb-1">
            <Smartphone size={20} className="text-violet-400" />
            <h1 className="text-lg font-bold text-white">PWA â APK</h1>
          </div>
          <p className="text-xs text-white/40">Analise, gere arquivos PWA e transforme qualquer site em app instalÃ¡vel â 6 ferramentas diferentes.</p>
        </div>

        {navSections.map((s) => (
          <div key={s.id} className="bg-[#111d2e] border border-white/15 rounded-2xl overflow-hidden">
            <button
              onClick={() => setSection(section === s.id ? "analyze" : s.id)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/3 transition-all"
            >
              <div>
                <p className="text-sm font-semibold text-white">{s.label}</p>
                <p className="text-xs text-white/40">{s.desc}</p>
              </div>
              {section === s.id
                ? <ChevronDown size={16} className="text-violet-400 shrink-0" />
                : <ChevronRight size={16} className="text-white/30 shrink-0" />}
            </button>

            {section === s.id && (
              <div className="px-5 pb-5 pt-1 border-t border-white/15">

                {/* ââ ANALYZE ââ */}
                {s.id === "analyze" && (
                  <div className="space-y-4 mt-3">
                    <div className="flex gap-2">
                      <input value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && analyze()}
                        placeholder="https://meuapp.netlify.app"
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-violet-500/50" />
                      <button onClick={analyze} disabled={loading || !url.trim()} className="px-4 py-2.5 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-500 disabled:opacity-40 transition-all flex items-center gap-2">
                        {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search size={15} />} Analisar
                      </button>
                    </div>

                    {results && (
                      <div className="space-y-2">
                        <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${pwaReady ? "bg-green-500/10 border-green-500/30" : "bg-yellow-500/10 border-yellow-500/30"}`}>
                          <div>
                            <p className={`text-sm font-bold ${pwaReady ? "text-green-300" : "text-yellow-300"}`}>
                              {pwaReady ? "â App pronto para PWA!" : `â  ${total - score} item(ns) precisam de atenÃ§Ã£o`}
                            </p>
                            <p className="text-xs text-white/40">{score}/{total} verificaÃ§Ãµes passando</p>
                          </div>
                          {pwaReady && <button onClick={() => setSection("apk")} className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-500">â Gerar APK</button>}
                        </div>
                        {results.map((r, i) => (
                          <div key={i} className={`flex gap-3 px-4 py-3 rounded-xl border ${r.ok ? "bg-green-500/5 border-green-500/20" : r.warn ? "bg-yellow-500/5 border-yellow-500/20" : "bg-red-500/5 border-red-500/20"}`}>
                            <div className="shrink-0 mt-0.5">
                              {r.ok ? <CheckCircle2 size={15} className="text-green-400" /> : r.warn ? <AlertCircle size={15} className="text-yellow-400" /> : <XCircle size={15} className="text-red-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-white/70 font-mono">{r.label}</p>
                              <p className="text-xs text-white/40 mt-0.5">{r.detail}</p>
                              {r.fix && !r.ok && <div className="mt-2 p-2 bg-white/5 rounded-lg"><p className="text-[10px] text-violet-300 font-semibold mb-0.5">Como corrigir:</p><p className="text-[10px] text-white/50">{r.fix}</p></div>}
                            </div>
                          </div>
                        ))}
                        {!pwaReady && (
                          <button onClick={() => setSection("generate")} className="w-full py-2.5 rounded-xl bg-violet-600/20 text-violet-300 text-sm font-semibold border border-violet-500/30 hover:bg-violet-600/30 transition-all">
                            <Wand2 size={14} className="inline mr-2" />Gerar arquivos PWA automaticamente
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ââ GENERATE ââ */}
                {s.id === "generate" && (
                  <div className="space-y-4 mt-3">
                    <p className="text-xs text-white/50">Preencha as informaÃ§Ãµes e baixe os arquivos prontos para colar no seu projeto.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-1.5">Nome do App</label>
                        <input value={appName} onChange={(e) => setAppName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500/40" />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-1.5">Cor principal</label>
                        <div className="flex gap-2">
                          <input type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="w-10 h-10 rounded-lg border border-white/10 bg-white/5 cursor-pointer" />
                          <input value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-violet-500/40" />
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-1.5">Caminho base</label>
                        <input value={basePath} onChange={(e) => setBasePath(e.target.value)} placeholder="/" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500/40" />
                        <p className="text-[10px] text-white/25 mt-1">Use / para apps na raiz, /assistente/ para subrotas.</p>
                      </div>
                    </div>
                    <CodeBlock title="manifest.webmanifest" code={generateManifest(appName, themeColor, basePath)} />
                    <CodeBlock title="sw.js" code={generateSW(basePath)} />
                    <CodeBlock title="snippet para index.html" code={generateIndexSnippet(basePath)} />
                    <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3">
                      <p className="text-xs text-violet-300 font-semibold mb-2">PrÃ³ximos passos:</p>
                      <ol className="text-xs text-violet-200/60 space-y-1 list-decimal list-inside">
                        <li>Baixe os 3 arquivos acima</li>
                        <li>Cole <code className="bg-violet-500/20 px-1 rounded">manifest.webmanifest</code> e <code className="bg-violet-500/20 px-1 rounded">sw.js</code> na raiz do projeto</li>
                        <li>Cole o snippet no seu <code className="bg-violet-500/20 px-1 rounded">index.html</code></li>
                        <li>Publique no Netlify (app.netlify.com/drop) e vÃ¡ para "Gerar APK"</li>
                      </ol>
                    </div>
                    <button onClick={() => setSection("apk")} className="w-full py-3 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-500 transition-all shadow-lg shadow-violet-600/20">
                      PrÃ³ximo: Gerar APK â
                    </button>
                  </div>
                )}

                {/* ââ APK TOOLS ââ */}
                {s.id === "apk" && (
                  <div className="space-y-3 mt-3">
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-white/40 bg-[#091525] rounded-xl p-3">
                      <div><Stars n={3} /><p className="mt-1">FÃ¡cil</p></div>
                      <div><Stars n={2} /><p className="mt-1">MÃ©dio</p></div>
                      <div><Stars n={1} /><p className="mt-1">AvanÃ§ado</p></div>
                    </div>

                    {APK_TOOLS.filter((t) => t.id !== "expo").map((tool) => (
                      <div key={tool.id} className="bg-[#0e1a2d] border border-white/15 rounded-2xl overflow-hidden">
                        <button
                          onClick={() => setOpenTool(openTool === tool.id ? null : tool.id)}
                          className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/3 transition-all"
                        >
                          <Stars n={tool.ease} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-white/80">{tool.name}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${tool.badgeColor === "green" ? "bg-green-500/20 text-green-400" : "bg-orange-500/20 text-orange-400"}`}>
                                {tool.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-white/35 truncate">{tool.desc.split(".")[0]}.</p>
                          </div>
                          {openTool === tool.id ? <ChevronDown size={14} className="text-violet-400 shrink-0" /> : <ChevronRight size={14} className="text-white/30 shrink-0" />}
                        </button>

                        {openTool === tool.id && (
                          <div className="px-4 pb-4 border-t border-white/5 space-y-3 pt-3">
                            <p className="text-xs text-white/50 leading-relaxed">{tool.desc}</p>

                            <div>
                              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2">Passo a passo:</p>
                              <div className="space-y-1.5">
                                {tool.steps.map((step, i) => (
                                  <div key={i} className="flex items-start gap-2.5 text-xs text-white/50">
                                    <span className="w-4 h-4 rounded-full bg-violet-600/30 text-violet-300 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">{i+1}</span>
                                    <span>{step}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {tool.codeHint === "capacitor.config.ts" && (
                              <CodeBlock title="capacitor.config.ts" code={generateCapacitorConfig(appName || "Meu App")} />
                            )}
                            {tool.codeHint === "twa-manifest.json" && (
                              <CodeBlock title="twa-manifest.json" code={generateTWAManifest(appName || "Meu App", url || "https://meuapp.netlify.app")} />
                            )}

                            <div className={`flex items-start gap-2 px-3 py-2.5 rounded-xl border text-xs ${
                              tool.tipColor === "yellow" ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-200/70"
                              : tool.tipColor === "blue" ? "bg-blue-500/10 border-blue-500/20 text-blue-200/70"
                              : tool.tipColor === "violet" ? "bg-violet-500/10 border-violet-500/20 text-violet-200/70"
                              : "bg-green-500/10 border-green-500/20 text-green-200/70"
                            }`}>
                              <Zap size={12} className="shrink-0 mt-0.5" />
                              <span>{tool.tip}</span>
                            </div>

                            <a href={tool.url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-violet-600/20 text-violet-300 text-xs font-bold border border-violet-500/30 hover:bg-violet-600/30 transition-all">
                              <ExternalLink size={13} /> Abrir {tool.name}
                            </a>
                          </div>
                        )}
                      </div>
                    ))}

                    <div className="bg-white/3 border border-white/8 rounded-xl px-4 py-3">
                      <p className="text-xs text-white/50 leading-relaxed">
                        <strong className="text-white/70">Qual escolher?</strong> Para uso pessoal sem gastar: <strong className="text-violet-300">PWABuilder</strong>. Para publicar na Play Store profissionalmente: <strong className="text-orange-300">Median.co</strong>. Para controle total e offline: <strong className="text-blue-300">Capacitor</strong>.
                      </p>
                    </div>

                    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4">
                      <p className="text-xs font-bold text-white/70 mb-3">Instalar APK no celular Android</p>
                      {["Mande o arquivo .apk para o celular (WhatsApp funciona)", "Toque no arquivo .apk no celular", "AparecerÃ¡ aviso de seguranÃ§a â toque em ConfiguraÃ§Ãµes", "Ative 'Permitir desta fonte' e volte", "Toque em Instalar â"].map((s2, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-xs text-white/45 mb-2">
                          <span className="w-4 h-4 rounded-full bg-green-600/20 text-green-400 flex items-center justify-center text-[9px] shrink-0 mt-0.5">{i+1}</span>
                          {s2}
                        </div>
                      ))}
                    </div>

                    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4">
                      <p className="text-xs font-bold text-white/70 mb-2">iPhone (iOS) â sem APK</p>
                      <p className="text-xs text-white/40 leading-relaxed">
                        iPhone nÃ£o aceita APK. Para instalar no iOS, abra o link no <strong className="text-white/60">Safari</strong> â botÃ£o Compartilhar (quadrado com seta) â <strong className="text-white/60">Adicionar Ã  Tela de InÃ­cio</strong>. O app aparece como Ã­cone nativo.
                      </p>
                    </div>
                  </div>
                )}

                {/* ââ EXPO APK ââ */}
                {s.id === "expo" && (
                  <div className="space-y-4 mt-3">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
                      <p className="text-xs text-blue-300 font-semibold mb-1">Para apps feitos com Expo / React Native</p>
                      <p className="text-xs text-blue-200/60">O app mobile deste projeto foi criado com Expo. Para gerar o APK, use o EAS Build â serviÃ§o gratuito do Expo que compila na nuvem sem precisar do Android Studio.</p>
                    </div>

                    <div className="space-y-2">
                      {[
                        { n: 1, title: "Crie conta no Expo", desc: "Acesse expo.dev e crie uma conta gratuita", link: "https://expo.dev", linkLabel: "expo.dev" },
                        { n: 2, title: "Instale Node.js + EAS CLI", desc: "Baixe Node.js em nodejs.org, depois no terminal execute:", code: "npm install -g eas-cli" },
                        { n: 3, title: "FaÃ§a login", desc: "No terminal, dentro da pasta do projeto:", code: "eas login" },
                        { n: 4, title: "Configure o EAS", desc: "Na pasta do projeto Expo:", code: "eas build:configure" },
                        { n: 5, title: "Inicie o build APK", desc: "Execute o build para Android:", code: "eas build -p android --profile preview" },
                        { n: 6, title: "Baixe o APK", desc: "Aguarde ~10 minutos. Acesse expo.dev/accounts/[usuario]/builds e baixe o arquivo .apk gerado.", link: "https://expo.dev", linkLabel: "Acessar painel Expo" },
                      ].map((step) => (
                        <div key={step.n} className="bg-[#0a0a0a] border border-white/8 rounded-xl p-3">
                          <div className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-violet-600/30 text-violet-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{step.n}</span>
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-white/70">{step.title}</p>
                              <p className="text-[11px] text-white/40 mt-0.5">{step.desc}</p>
                              {step.code && <code className="block mt-1.5 px-3 py-1.5 bg-black/40 rounded-lg text-emerald-300 text-[11px] font-mono">{step.code}</code>}
                              {step.link && (
                                <a href={step.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1.5 text-[11px] text-violet-400 hover:underline">
                                  <ExternalLink size={10} /> {step.linkLabel}
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                      <p className="text-xs text-green-300 font-semibold mb-1">Plano gratuito: 30 builds/mÃªs</p>
                      <p className="text-xs text-green-200/60">Mais que suficiente para uso pessoal. O APK gerado pode ser instalado diretamente no Android ou publicado na Play Store.</p>
                    </div>

                    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4">
                      <p className="text-xs font-bold text-white/60 mb-2">eas.json â configuraÃ§Ã£o do build</p>
                      <CodeBlock title="eas.json" code={`{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}`} />
                      <p className="text-[10px] text-white/30 mt-2">O profile "preview" gera APK direto. O "production" gera AAB para a Play Store.</p>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        ))}

        {/* Publish hint */}
        <div className="bg-[#141414] border border-white/8 rounded-2xl px-5 py-4">
          <div className="flex items-start gap-3">
            <Package size={16} className="text-violet-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-white/60 mb-1">Onde publicar o app para ter o link HTTPS?</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                {[
                  { name: "Netlify Drop", url: "https://app.netlify.com/drop", desc: "Arrasta a pasta", free: true },
                  { name: "Vercel", url: "https://vercel.com", desc: "Git ou upload", free: true },
                  { name: "GitHub Pages", url: "https://pages.github.com", desc: "Via repositÃ³rio", free: true },
                ].map((h) => (
                  <a key={h.name} href={h.url} target="_blank" rel="noopener noreferrer"
                    className="flex flex-col px-3 py-2.5 rounded-xl bg-white/3 border border-white/8 hover:bg-white/6 transition-all">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-semibold text-white/70">{h.name}</span>
                      <span className="text-[9px] bg-green-500/20 text-green-400 px-1 rounded-full">grÃ¡tis</span>
                    </div>
                    <span className="text-[10px] text-white/35">{h.desc}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
