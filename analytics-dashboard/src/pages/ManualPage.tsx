import { useState } from "react";
import { BookOpen, Search, ChevronDown, ChevronRight, Copy, Check, Terminal } from "lucide-react";

interface Command {
  cmd: string;
  desc: string;
}

interface Section {
  id: string;
  title: string;
  emoji: string;
  commands?: Command[];
  content?: React.ReactNode;
}

function CmdBlock({ cmd, desc }: Command) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-[#0a0a0a] border border-white/5 group">
      <div className="flex-1 min-w-0">
        <code className="text-emerald-300 font-mono text-xs block">{cmd}</code>
        <p className="text-[11px] text-white/40 mt-0.5">{desc}</p>
      </div>
      <button
        onClick={() => { navigator.clipboard.writeText(cmd); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        className="opacity-0 group-hover:opacity-100 p-1 rounded text-white/30 hover:text-white/70 shrink-0 mt-0.5 transition-all"
      >
        {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
      </button>
    </div>
  );
}

const SECTIONS: Section[] = [
  {
    id: "git",
    title: "Git â Controle de versÃ£o",
    emoji: "ð¦",
    commands: [
      { cmd: "git init", desc: "Inicia um repositÃ³rio Git na pasta atual" },
      { cmd: "git clone https://github.com/user/repo.git", desc: "Clona um repositÃ³rio do GitHub" },
      { cmd: "git status", desc: "Mostra arquivos modificados e pendentes" },
      { cmd: "git add .", desc: "Adiciona todos os arquivos para commit" },
      { cmd: "git commit -m \"mensagem\"", desc: "Salva as mudanÃ§as com uma descriÃ§Ã£o" },
      { cmd: "git push origin main", desc: "Envia commits para o GitHub (branch main)" },
      { cmd: "git pull", desc: "Baixa e aplica mudanÃ§as do repositÃ³rio remoto" },
      { cmd: "git branch nome-branch", desc: "Cria uma nova branch" },
      { cmd: "git checkout nome-branch", desc: "Muda para outra branch" },
      { cmd: "git merge nome-branch", desc: "Mescla uma branch na branch atual" },
      { cmd: "git log --oneline", desc: "HistÃ³rico resumido de commits" },
      { cmd: "git diff", desc: "Mostra diferenÃ§as entre arquivos modificados" },
    ],
  },
  {
    id: "npm",
    title: "npm / pnpm â Pacotes Node.js",
    emoji: "ð¦",
    commands: [
      { cmd: "npm init -y", desc: "Cria um package.json padrÃ£o" },
      { cmd: "npm install", desc: "Instala todas as dependÃªncias do package.json" },
      { cmd: "npm install nome-pacote", desc: "Instala um pacote especÃ­fico" },
      { cmd: "npm install -D nome-pacote", desc: "Instala como dependÃªncia de desenvolvimento" },
      { cmd: "npm run dev", desc: "Executa o script 'dev' (servidor de desenvolvimento)" },
      { cmd: "npm run build", desc: "Gera os arquivos de produÃ§Ã£o" },
      { cmd: "npm run start", desc: "Inicia o servidor em produÃ§Ã£o" },
      { cmd: "pnpm install", desc: "Instala dependÃªncias (mais rÃ¡pido que npm)" },
      { cmd: "pnpm add nome-pacote", desc: "Adiciona pacote com pnpm" },
      { cmd: "pnpm dlx create-vite meu-app", desc: "Cria um novo projeto Vite" },
    ],
  },
  {
    id: "terminal",
    title: "Terminal â Comandos do sistema",
    emoji: "ð»",
    commands: [
      { cmd: "ls", desc: "Lista arquivos e pastas (Linux/Mac)" },
      { cmd: "dir", desc: "Lista arquivos e pastas (Windows)" },
      { cmd: "cd nome-pasta", desc: "Entra em uma pasta" },
      { cmd: "cd ..", desc: "Volta uma pasta" },
      { cmd: "mkdir nome-pasta", desc: "Cria uma nova pasta" },
      { cmd: "rm -rf nome-pasta", desc: "Remove pasta e todo o conteÃºdo (CUIDADO!)" },
      { cmd: "cp arquivo destino", desc: "Copia arquivo para outro local" },
      { cmd: "mv arquivo destino", desc: "Move ou renomeia arquivo" },
      { cmd: "cat arquivo.txt", desc: "Exibe o conteÃºdo de um arquivo" },
      { cmd: "clear", desc: "Limpa o terminal" },
      { cmd: "pwd", desc: "Mostra o caminho da pasta atual" },
      { cmd: "which node", desc: "Mostra onde o Node.js estÃ¡ instalado" },
      { cmd: "node --version", desc: "VersÃ£o do Node.js instalada" },
    ],
  },
  {
    id: "pwa",
    title: "PWA â Progressive Web App",
    emoji: "ð±",
    commands: [
      { cmd: "pwabuilder.com", desc: "Gera APK a partir de qualquer URL de PWA" },
      { cmd: "app.netlify.com/drop", desc: "Publica site arrastando a pasta (grÃ¡tis)" },
      { cmd: "lighthouse --view https://meuapp.com", desc: "Analisa PWA, performance e acessibilidade" },
      { cmd: "npx serve .", desc: "Servidor local para testar o app (porta 3000)" },
      { cmd: "npx http-server . -p 8080", desc: "Servidor local alternativo" },
    ],
  },
  {
    id: "vite",
    title: "Vite / React â Frontend",
    emoji: "â¡",
    commands: [
      { cmd: "pnpm dlx create-vite meu-app --template react-ts", desc: "Cria projeto React + TypeScript com Vite" },
      { cmd: "npm run dev", desc: "Inicia servidor de desenvolvimento (hot reload)" },
      { cmd: "npm run build", desc: "Gera build de produÃ§Ã£o em dist/" },
      { cmd: "npm run preview", desc: "PrÃ©-visualiza o build de produÃ§Ã£o localmente" },
      { cmd: "npm install tailwindcss @tailwindcss/vite", desc: "Instala Tailwind CSS" },
      { cmd: "npm install lucide-react", desc: "Instala Ã­cones Lucide para React" },
      { cmd: "npm install wouter", desc: "Router leve para React (alternativa ao react-router)" },
    ],
  },
  {
    id: "github",
    title: "GitHub â Publicar projetos",
    emoji: "ð",
    commands: [
      { cmd: "git remote add origin https://github.com/user/repo.git", desc: "Conecta pasta local ao GitHub" },
      { cmd: "git push -u origin main", desc: "Envia cÃ³digo para o GitHub pela primeira vez" },
      { cmd: "gh repo create meu-repo --public", desc: "Cria repositÃ³rio via GitHub CLI" },
      { cmd: "gh auth login", desc: "Faz login no GitHub pelo terminal" },
    ],
  },
  {
    id: "db",
    title: "Banco de dados â PostgreSQL / Neon",
    emoji: "ðï¸",
    commands: [
      { cmd: "psql -h host -U user -d database", desc: "Conecta ao banco PostgreSQL pelo terminal" },
      { cmd: "\\l", desc: "Lista todos os bancos de dados (dentro do psql)" },
      { cmd: "\\dt", desc: "Lista tabelas do banco atual" },
      { cmd: "SELECT * FROM tabela LIMIT 10;", desc: "Mostra 10 primeiras linhas de uma tabela" },
      { cmd: "CREATE TABLE nome (id SERIAL PRIMARY KEY, campo TEXT);", desc: "Cria tabela bÃ¡sica" },
      { cmd: "INSERT INTO tabela (campo) VALUES ('valor');", desc: "Insere registro" },
      { cmd: "UPDATE tabela SET campo='valor' WHERE id=1;", desc: "Atualiza registro" },
      { cmd: "DELETE FROM tabela WHERE id=1;", desc: "Remove registro" },
    ],
  },
  {
    id: "api",
    title: "APIs de IA â Provedores",
    emoji: "ð¤",
    content: (
      <div className="space-y-3 text-xs text-white/60">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { name: "OpenAI", key: "sk-...", url: "platform.openai.com/api-keys", model: "gpt-4o", free: false },
            { name: "Groq", key: "gsk_...", url: "console.groq.com/keys", model: "llama-3.3-70b", free: true },
            { name: "Anthropic", key: "sk-ant-...", url: "console.anthropic.com", model: "claude-3.5-sonnet", free: false },
            { name: "Google Gemini", key: "AIza...", url: "aistudio.google.com", model: "gemini-2.0-flash", free: true },
            { name: "Perplexity", key: "pplx-...", url: "perplexity.ai/settings/api", model: "sonar-large (internet)", free: false },
            { name: "OpenRouter", key: "sk-or-...", url: "openrouter.ai/keys", model: "todos os modelos", free: true },
          ].map((p) => (
            <div key={p.name} className="bg-[#0a0a0a] border border-white/5 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-white/70">{p.name}</span>
                {p.free && <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-bold">GRÃTIS</span>}
              </div>
              <code className="text-emerald-300 text-[10px] block">{p.key}</code>
              <p className="text-[10px] text-white/30 mt-1">{p.model}</p>
              <a href={`https://${p.url}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-violet-400 hover:underline">{p.url}</a>
            </div>
          ))}
        </div>
        <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3">
          <p className="text-violet-300 font-semibold mb-1">ð¡ Dica: comece pelo OpenRouter</p>
          <p className="text-violet-200/60">Uma chave sÃ³ dÃ¡ acesso a todos os modelos. Plano gratuito disponÃ­vel. Ideal para testar antes de pagar.</p>
        </div>
      </div>
    ),
  },
  {
    id: "deploy",
    title: "Deploy â Publicar aplicaÃ§Ãµes",
    emoji: "ð",
    commands: [
      { cmd: "app.netlify.com/drop", desc: "Arrasta a pasta â link imediato (estÃ¡tico)" },
      { cmd: "vercel deploy", desc: "Publica com Vercel CLI (frontend + serverless)" },
      { cmd: "railway up", desc: "Publica backend + banco com Railway CLI" },
      { cmd: "npx wrangler pages deploy dist/", desc: "Publica no Cloudflare Pages" },
      { cmd: "gh-pages -d dist", desc: "Publica no GitHub Pages (pacote npm gh-pages)" },
      { cmd: "fly deploy", desc: "Publica containers Docker no Fly.io" },
    ],
  },
];

export function ManualPage() {
  const [search, setSearch] = useState("");
  const [openSection, setOpenSection] = useState<string | null>("git");

  const filtered = SECTIONS.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    if (s.title.toLowerCase().includes(q)) return true;
    if (s.commands?.some((c) => c.cmd.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q))) return true;
    return false;
  }).map((s) => ({
    ...s,
    commands: search
      ? s.commands?.filter((c) => c.cmd.toLowerCase().includes(search.toLowerCase()) || c.desc.toLowerCase().includes(search.toLowerCase()))
      : s.commands,
  }));

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#0f0f0f]" style={{ scrollbarWidth: "thin", scrollbarColor: "#ffffff18 transparent" }}>
      <div className="max-w-2xl mx-auto w-full px-4 py-5 space-y-4">

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={20} className="text-violet-400" />
            <h1 className="text-lg font-bold text-white">Manual do Desenvolvedor</h1>
          </div>
          <p className="text-xs text-white/40">ReferÃªncia rÃ¡pida de comandos, ferramentas e APIs. Clique em qualquer comando para copiar.</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar comando ou ferramenta..."
            className="w-full bg-[#141414] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
          />
        </div>

        {/* Sections */}
        {filtered.map((s) => (
          <div key={s.id} className="bg-[#141414] border border-white/10 rounded-2xl overflow-hidden">
            <button
              onClick={() => setOpenSection(openSection === s.id ? null : s.id)}
              className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-white/3 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">{s.emoji}</span>
                <span className="text-sm font-semibold text-white/80">{s.title}</span>
                {s.commands && <span className="text-[10px] bg-white/5 text-white/30 px-1.5 py-0.5 rounded-full">{s.commands.length}</span>}
              </div>
              {openSection === s.id ? <ChevronDown size={15} className="text-violet-400" /> : <ChevronRight size={15} className="text-white/30" />}
            </button>

            {(openSection === s.id || !!search) && (
              <div className="px-4 pb-4 pt-1 border-t border-white/5 space-y-1.5">
                {s.content ?? s.commands?.map((c) => <CmdBlock key={c.cmd} {...c} />)}
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Terminal size={32} className="text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm">Nenhum resultado para "<strong>{search}</strong>"</p>
          </div>
        )}
      </div>
    </div>
  );
}
