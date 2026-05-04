import { useState, useRef, useCallback, useEffect } from "react";
import JSZip from "jszip";
import {
  Play, Download, Save, Trash2, Maximize2, Minimize2,
  FolderOpen, Code2, ChevronRight, ChevronDown,
  File, Folder, Upload, Github, ExternalLink, X,
  Copy, FilePlus, FolderPlus, Edit2, Check, RefreshCw,
  BookOpen, List
} from "lucide-react";
import { loadPlaygroundSaves, savePlayground, type PlaygroundSave } from "@/lib/storage";

// âââ Types ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
interface FileNode { name: string; path: string; content: string; type: "file"; }
interface FolderNode { name: string; path: string; type: "folder"; children: TreeNode[]; expanded: boolean; }
type TreeNode = FileNode | FolderNode;

// âââ Helpers ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
function buildTree(files: Record<string, string>): TreeNode[] {
  const root: FolderNode = { name: "", path: "", type: "folder", children: [], expanded: true };
  for (const [path, content] of Object.entries(files)) {
    const parts = path.split("/");
    let current = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const name = parts[i];
      const folderPath = parts.slice(0, i + 1).join("/");
      let node = current.children.find((n) => n.name === name && n.type === "folder") as FolderNode | undefined;
      if (!node) { node = { name, path: folderPath, type: "folder", children: [], expanded: true }; current.children.push(node); }
      current = node;
    }
    current.children.push({ name: parts[parts.length - 1], path, content, type: "file" });
  }
  return root.children;
}

function getLanguage(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    html: "HTML", css: "CSS", js: "JavaScript", ts: "TypeScript",
    jsx: "JSX", tsx: "TSX", json: "JSON", py: "Python",
    md: "Markdown", txt: "Texto", xml: "XML", sql: "SQL",
    sh: "Shell", yaml: "YAML", yml: "YAML", toml: "TOML",
    rs: "Rust", go: "Go", java: "Java", kt: "Kotlin", swift: "Swift",
    php: "PHP", rb: "Ruby", cs: "C#", cpp: "C++", c: "C",
  };
  return map[ext] ?? (ext ? ext.toUpperCase() : "Arquivo");
}

// Binary extensions â open as base64/info instead of text
const BINARY_EXTS = new Set(["png","jpg","jpeg","gif","webp","svg","ico","bmp","tiff","woff","woff2","ttf","otf","eot","mp4","mp3","wav","ogg","pdf","zip","gz","tar","rar","7z","exe","dll","so","dylib"]);
function isBinary(filename: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return BINARY_EXTS.has(ext);
}

const STARTER_FILES: Record<string, string> = {
  "index.html": `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Meu Projeto</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <h1>OlÃ¡, Mundo!</h1>
  <p>Edite os arquivos e clique em <strong>Visualizar</strong>.</p>
  <script src="main.js"></script>
</body>
</html>`,
  "style.css": `body {
  font-family: sans-serif;
  padding: 2rem;
  background: #0f0f0f;
  color: #fff;
}
h1 { color: #7c3aed; }`,
  "main.js": `// JavaScript do projeto
console.log("Projeto carregado!");`,
};

// âââ FileTree component âââââââââââââââââââââââââââââââââââââââââââââââââââââââ
function FileTreeItem({
  node, depth, activeFile, onSelect, onDelete, onRename, onToggle,
}: {
  node: TreeNode; depth: number; activeFile: string;
  onSelect: (path: string) => void;
  onDelete: (path: string, type: "file" | "folder") => void;
  onRename: (oldPath: string, newName: string) => void;
  onToggle: (path: string) => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(node.name);
  const [hovered, setHovered] = useState(false);

  const confirmRename = () => {
    if (newName.trim() && newName !== node.name) onRename(node.path, newName.trim());
    setRenaming(false);
  };

  const isActive = node.type === "file" && activeFile === node.path;
  const bin = node.type === "file" && isBinary(node.name);

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1 px-1 rounded-lg cursor-pointer group transition-all select-none ${
          isActive ? "bg-violet-600/20 text-violet-300" : "hover:bg-white/5 text-white/60 hover:text-white/90"
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => node.type === "file" ? onSelect(node.path) : onToggle(node.path)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {node.type === "folder" ? (
          <>
            {node.expanded ? <ChevronDown size={12} className="shrink-0" /> : <ChevronRight size={12} className="shrink-0" />}
            <Folder size={13} className="shrink-0 text-yellow-400/70" />
          </>
        ) : (
          <>
            <span className="w-3" />
            <File size={13} className={`shrink-0 ${bin ? "text-orange-400/50" : "text-blue-400/70"}`} />
          </>
        )}

        {renaming ? (
          <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") confirmRename(); if (e.key === "Escape") setRenaming(false); }}
            onBlur={confirmRename} onClick={(e) => e.stopPropagation()}
            className="flex-1 bg-white/10 rounded px-1 text-xs text-white focus:outline-none" />
        ) : (
          <span className={`flex-1 text-xs truncate ${bin ? "text-white/35 italic" : ""}`}>{node.name}</span>
        )}

        {hovered && !renaming && (
          <div className="flex items-center gap-0.5 ml-auto shrink-0" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { setRenaming(true); setNewName(node.name); }} className="p-0.5 rounded hover:bg-white/10 text-white/30 hover:text-white/70" title="Renomear"><Edit2 size={10} /></button>
            <button onClick={() => onDelete(node.path, node.type)} className="p-0.5 rounded hover:bg-red-500/20 text-white/30 hover:text-red-400" title="Excluir"><Trash2 size={10} /></button>
          </div>
        )}
      </div>

      {node.type === "folder" && node.expanded && node.children.map((child) => (
        <FileTreeItem key={child.path} node={child} depth={depth + 1} activeFile={activeFile}
          onSelect={onSelect} onDelete={onDelete} onRename={onRename} onToggle={onToggle} />
      ))}
    </div>
  );
}

// âââ Main Component âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
interface PlaygroundProps {
  pendingImport?: boolean;
  onImportDone?: () => void;
}

export function PlaygroundPage({ pendingImport, onImportDone }: PlaygroundProps) {
  const [files, setFiles] = useState<Record<string, string>>(STARTER_FILES);
  const [activeFile, setActiveFile] = useState("index.html");
  const [tree, setTree] = useState<TreeNode[]>(() => buildTree(STARTER_FILES));
  const [preview, setPreview] = useState("");
  const [projectName, setProjectName] = useState("meu-projeto");
  const [saves, setSaves] = useState<PlaygroundSave[]>(() => loadPlaygroundSaves());
  const [showSaves, setShowSaves] = useState(false);
  const [fullPreview, setFullPreview] = useState(false);
  const [githubToken, setGithubToken] = useState(() => localStorage.getItem("juridico_github_token") ?? "");
  const [githubRepo, setGithubRepo] = useState(() => localStorage.getItem("juridico_github_repo") ?? "");
  const [showGithub, setShowGithub] = useState(false);
  const [githubStatus, setGithubStatus] = useState("");
  const [importStatus, setImportStatus] = useState("");
  const [copied, setCopied] = useState(false);
  const [chatImport, setChatImport] = useState<{ code: string; lang: string; filename: string } | null>(null);
  const zipRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const rebuildTree = useCallback((f: Record<string, string>) => { setTree(buildTree(f)); }, []);

  // ââ Check for code sent from Chat âââââââââââââââââââââââââââââââââââââââââ
  useEffect(() => {
    if (pendingImport) {
      const raw = localStorage.getItem("chat_code_import");
      if (raw) {
        try {
          const data = JSON.parse(raw) as { code: string; lang: string; filename: string; ts: number };
          setChatImport(data);
        } catch { /* ignore */ }
      }
      onImportDone?.();
    }
  }, [pendingImport, onImportDone]);

  const applyChatImport = () => {
    if (!chatImport) return;
    const fname = chatImport.filename || `codigo.${chatImport.lang || "txt"}`;
    const newFiles = { ...files, [fname]: chatImport.code };
    updateFiles(newFiles);
    setActiveFile(fname);
    localStorage.removeItem("chat_code_import");
    setChatImport(null);
    setImportStatus(`â Arquivo "${fname}" importado do chat!`);
    setTimeout(() => setImportStatus(""), 3000);
  };
  const updateFiles = (newFiles: Record<string, string>) => { setFiles(newFiles); rebuildTree(newFiles); };

  // ââ File editing ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  const handleEditorChange = (val: string) => { setFiles((prev) => ({ ...prev, [activeFile]: val })); };
  const handleSelectFile = (path: string) => { setActiveFile(path); setPreview(""); };

  // ââ Tree mutations ââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  const handleToggle = (folderPath: string) => {
    const toggle = (nodes: TreeNode[]): TreeNode[] =>
      nodes.map((n) => n.path === folderPath && n.type === "folder" ? { ...n, expanded: !n.expanded }
        : n.type === "folder" ? { ...n, children: toggle(n.children) } : n);
    setTree((prev) => toggle(prev));
  };

  const handleDelete = (path: string, type: "file" | "folder") => {
    if (!confirm(`Excluir ${type === "folder" ? "pasta" : "arquivo"} "${path}"?`)) return;
    const newFiles = { ...files };
    if (type === "file") {
      delete newFiles[path];
      if (activeFile === path) setActiveFile(Object.keys(newFiles)[0] ?? "");
    } else {
      Object.keys(newFiles).forEach((k) => { if (k.startsWith(path + "/") || k === path) delete newFiles[k]; });
      if (activeFile.startsWith(path)) setActiveFile(Object.keys(newFiles)[0] ?? "");
    }
    updateFiles(newFiles);
  };

  const handleRename = (oldPath: string, newName: string) => {
    const parts = oldPath.split("/"); parts[parts.length - 1] = newName;
    const newPath = parts.join("/");
    const newFiles: Record<string, string> = {};
    for (const [k, v] of Object.entries(files)) {
      if (k === oldPath) newFiles[newPath] = v;
      else if (k.startsWith(oldPath + "/")) newFiles[newPath + k.slice(oldPath.length)] = v;
      else newFiles[k] = v;
    }
    if (activeFile === oldPath) setActiveFile(newPath);
    updateFiles(newFiles);
  };

  const handleNewFile = () => {
    const name = prompt("Nome do novo arquivo (ex: pagina.html):") ?? "";
    if (!name.trim()) return;
    updateFiles({ ...files, [name.trim()]: "" });
    setActiveFile(name.trim());
  };

  const handleNewFolder = () => {
    const name = prompt("Nome da pasta:") ?? "";
    if (!name.trim()) return;
    updateFiles({ ...files, [`${name.trim()}/.gitkeep`]: "" });
  };

  const handleCopyContent = () => {
    navigator.clipboard.writeText(files[activeFile] ?? "");
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  // ââ Import ZIP â sem limite de tamanho ââââââââââââââââââââââââââââââââââââ
  const handleImportZip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus(`Descompactando ${file.name}...`);
    try {
      const zip = await JSZip.loadAsync(file);
      const newFiles: Record<string, string> = {};
      let skippedBinary = 0;
      let total = 0;

      for (const [zipPath, zipEntry] of Object.entries(zip.files)) {
        if (zipEntry.dir) continue;
        // Strip leading root folder (common in GitHub downloads)
        const cleanPath = zipPath.replace(/^[^/]+\//, "") || zipPath;
        if (!cleanPath) continue;
        total++;

        if (isBinary(cleanPath)) {
          // Store binary as a placeholder note
          newFiles[cleanPath] = `[arquivo binÃ¡rio â ${file.name}]`;
          skippedBinary++;
        } else {
          const text = await zipEntry.async("text").catch(() => "");
          newFiles[cleanPath] = text;
        }
      }

      if (Object.keys(newFiles).length > 0) {
        updateFiles(newFiles);
        const first = Object.keys(newFiles).find((k) => !isBinary(k)) ?? Object.keys(newFiles)[0];
        setActiveFile(first);
        setProjectName(file.name.replace(/\.zip$/i, ""));
        setImportStatus(`â ${total - skippedBinary} arquivo(s) importado(s)${skippedBinary > 0 ? ` (${skippedBinary} binÃ¡rio(s) ignorado(s))` : ""}`);
      } else {
        setImportStatus("ZIP vazio ou sem arquivos de texto.");
      }
    } catch (err) {
      setImportStatus(`Erro ao abrir ZIP: ${err instanceof Error ? err.message : "falha"}`);
    }
    e.target.value = "";
    setTimeout(() => setImportStatus(""), 5000);
  };

  // ââ Import file (any type) ââââââââââââââââââââââââââââââââââââââââââââââââ
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (isBinary(file.name)) {
      updateFiles({ ...files, [file.name]: `[arquivo binÃ¡rio: ${file.name} (${(file.size / 1024).toFixed(1)} KB)]` });
      setActiveFile(file.name);
      e.target.value = ""; return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string ?? "";
      updateFiles({ ...files, [file.name]: content });
      setActiveFile(file.name);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ââ Export ZIP ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  const handleExportZip = async () => {
    const zip = new JSZip();
    const folder = zip.folder(projectName) ?? zip;
    for (const [path, content] of Object.entries(files)) {
      if (!content.startsWith("[arquivo binÃ¡rio")) {
        folder.file(path, content);
      }
    }
    const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${projectName}.zip`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // ââ Visualize âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  const handleVisualize = () => {
    const htmlKey = Object.keys(files).find((k) => k === "index.html") ?? Object.keys(files).find((k) => k.endsWith(".html")) ?? "";
    const html = files[htmlKey] ?? "";
    if (!html) { alert("Nenhum arquivo .html encontrado."); return; }
    let result = html;
    // Inline all CSS files
    const cssKeys = Object.keys(files).filter((k) => k.endsWith(".css"));
    for (const k of cssKeys) {
      const fname = k.split("/").pop() ?? k;
      result = result.replace(new RegExp(`<link[^>]+href=["']([^"']*${fname})["'][^>]*>`, "gi"), `<style>${files[k]}</style>`);
    }
    // Inline all JS files
    const jsKeys = Object.keys(files).filter((k) => k.endsWith(".js") && !k.endsWith(".min.js"));
    for (const k of jsKeys) {
      const fname = k.split("/").pop() ?? k;
      result = result.replace(new RegExp(`<script[^>]+src=["']([^"']*${fname})["'][^>]*></script>`, "gi"), `<script>${files[k]}</script>`);
    }
    setPreview(result);
    setFullPreview(false);
  };

  // ââ VS Code âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  const handleOpenVSCode = () => {
    if (githubRepo) {
      window.open(`https://vscode.dev/github/${githubRepo}`, "_blank");
    } else {
      // Use StackBlitz for HTML/CSS/JS projects
      const hasHtml = Object.keys(files).some((k) => k.endsWith(".html"));
      if (hasHtml) {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = "https://stackblitz.com/run";
        form.target = "_blank";
        const addField = (name: string, val: string) => {
          const input = document.createElement("input");
          input.type = "hidden"; input.name = name; input.value = val;
          form.appendChild(input);
        };
        addField("project[title]", projectName);
        addField("project[description]", "Projeto do Playground");
        addField("project[template]", "html");
        Object.entries(files).forEach(([path, content]) => {
          if (!content.startsWith("[arquivo binÃ¡rio")) {
            addField(`project[files][${path}]`, content);
          }
        });
        document.body.appendChild(form); form.submit(); document.body.removeChild(form);
      } else {
        window.open("https://vscode.dev/", "_blank");
        setTimeout(() => {
          navigator.clipboard.writeText(files[activeFile] ?? "");
          alert("VS Code aberto! Cole o conteÃºdo com Ctrl+V.");
        }, 800);
      }
    }
  };

  // ââ Save/Load âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  const handleSaveProject = () => {
    const updated = [
      { id: crypto.randomUUID(), name: projectName, code: JSON.stringify(files), savedAt: Date.now() },
      ...saves.filter((s) => s.name !== projectName),
    ].slice(0, 30);
    setSaves(updated); savePlayground(updated);
  };

  const handleLoadProject = (s: PlaygroundSave) => {
    try {
      const loaded = JSON.parse(s.code) as Record<string, string>;
      updateFiles(loaded);
      setActiveFile(Object.keys(loaded)[0] ?? "");
      setProjectName(s.name);
      setPreview(""); setShowSaves(false);
    } catch { alert("Erro ao carregar projeto."); }
  };

  // ââ GitHub ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  const handleGithubPull = async () => {
    if (!githubToken || !githubRepo) { alert("Configure o token e repositÃ³rio."); return; }
    setGithubStatus("Buscando arquivos...");
    try {
      const [owner, repo] = githubRepo.split("/");
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`, {
        headers: { Authorization: `Bearer ${githubToken}` },
      });
      const data = await res.json() as { tree?: { path: string; type: string; sha: string }[] };
      if (!data.tree) throw new Error(JSON.stringify(data));
      const newFiles: Record<string, string> = {};
      const blobs = data.tree.filter((t) => t.type === "blob" && !isBinary(t.path));
      setGithubStatus(`Baixando ${blobs.length} arquivo(s)...`);
      // Batch requests in groups of 10 to avoid rate limits
      for (let i = 0; i < blobs.length; i += 10) {
        await Promise.all(blobs.slice(i, i + 10).map(async (t) => {
          const blobRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs/${t.sha}`, {
            headers: { Authorization: `Bearer ${githubToken}` },
          });
          const blob = await blobRes.json() as { content?: string; encoding?: string };
          if (blob.encoding === "base64" && blob.content) {
            try { newFiles[t.path] = atob(blob.content.replace(/\n/g, "")); } catch { newFiles[t.path] = ""; }
          }
        }));
      }
      // Mark binary files as placeholders
      data.tree.filter((t) => t.type === "blob" && isBinary(t.path)).forEach((t) => {
        newFiles[t.path] = `[arquivo binÃ¡rio: ${t.path}]`;
      });
      updateFiles(newFiles);
      setActiveFile(Object.keys(newFiles).find((k) => !isBinary(k)) ?? Object.keys(newFiles)[0] ?? "");
      setProjectName(repo);
      setGithubStatus(`â ${blobs.length} arquivo(s) de texto importado(s) de ${githubRepo}`);
    } catch (e) { setGithubStatus(`Erro: ${e instanceof Error ? e.message : "falha"}`); }
  };

  const handleGithubPush = async () => {
    if (!githubToken || !githubRepo) { alert("Configure o token e repositÃ³rio."); return; }
    setGithubStatus("Enviando para GitHub...");
    try {
      const [owner, repo] = githubRepo.split("/");
      const headers = { Authorization: `Bearer ${githubToken}`, "Content-Type": "application/json" };
      const refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/main`, { headers });
      const refData = await refRes.json() as { object?: { sha: string } };
      const latestSha = refData.object?.sha;
      if (!latestSha) throw new Error("Branch 'main' nÃ£o encontrada.");
      const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits/${latestSha}`, { headers });
      const commitData = await commitRes.json() as { tree?: { sha: string } };
      const baseTreeSha = commitData.tree?.sha;
      const textFiles = Object.entries(files).filter(([, v]) => v !== "" && !v.startsWith("[arquivo binÃ¡rio"));
      const treeItems = await Promise.all(textFiles.map(async ([path, content]) => {
        const blobRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
          method: "POST", headers,
          body: JSON.stringify({ content: btoa(unescape(encodeURIComponent(content))), encoding: "base64" }),
        });
        const blobData = await blobRes.json() as { sha: string };
        return { path, mode: "100644", type: "blob", sha: blobData.sha };
      }));
      const newTreeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
        method: "POST", headers, body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems }),
      });
      const newTree = await newTreeRes.json() as { sha: string };
      const newCommitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
        method: "POST", headers,
        body: JSON.stringify({ message: `Update via Assistente IA â ${new Date().toLocaleString("pt-BR")}`, tree: newTree.sha, parents: [latestSha] }),
      });
      const newCommit = await newCommitRes.json() as { sha: string };
      await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/main`, {
        method: "PATCH", headers, body: JSON.stringify({ sha: newCommit.sha }),
      });
      setGithubStatus(`â ${treeItems.length} arquivo(s) enviado(s) para ${githubRepo}!`);
    } catch (e) { setGithubStatus(`Erro: ${e instanceof Error ? e.message : "falha"}`); }
  };

  const handleOpenVSCodeGithub = () => {
    if (githubRepo) window.open(`https://vscode.dev/github/${githubRepo}`, "_blank");
    else alert("Configure o repositÃ³rio GitHub primeiro.");
  };

  const currentContent = files[activeFile] ?? "";
  const fileCount = Object.keys(files).length;
  const isActiveBinary = isBinary(activeFile);

  return (
    <div className="flex flex-col h-full bg-[#0f0f0f]">
      {/* ââ Toolbar âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/10 bg-[#111111] shrink-0 flex-wrap gap-y-1.5">
        <div className="flex items-center gap-1.5 mr-1">
          <Code2 size={15} className="text-violet-400" />
          <input value={projectName} onChange={(e) => setProjectName(e.target.value)}
            className="bg-transparent text-sm font-semibold text-white/70 focus:outline-none w-32 border-b border-transparent focus:border-violet-500/50" />
          <span className="text-[10px] text-white/25">{fileCount} arq.</span>
        </div>

        <button onClick={handleVisualize} className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white text-xs font-bold rounded-lg hover:bg-violet-500 transition-all shadow shadow-violet-600/30">
          <Play size={12} /> Visualizar
        </button>

        <div className="flex items-center gap-0.5 flex-wrap">
          {/* Import ZIP â no size limit */}
          <label className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:bg-white/5 hover:text-violet-400 cursor-pointer transition-all" title="Importar ZIP (sem limite de tamanho)">
            <Upload size={14} />
            <input ref={zipRef} type="file" accept=".zip,.gz,.tar" className="hidden" onChange={handleImportZip} />
          </label>

          {/* Import single file */}
          <label className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:bg-white/5 hover:text-white/70 cursor-pointer transition-all" title="Importar arquivo">
            <FilePlus size={14} />
            <input ref={fileRef} type="file" className="hidden" onChange={handleImportFile} />
          </label>

          {/* Export ZIP */}
          <button onClick={handleExportZip} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:bg-white/5 hover:text-white/70 transition-all" title="Exportar projeto como ZIP">
            <Download size={14} />
          </button>

          {/* New file */}
          <button onClick={handleNewFile} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:bg-white/5 hover:text-green-400 transition-all" title="Novo arquivo">
            <FilePlus size={14} />
          </button>

          {/* New folder */}
          <button onClick={handleNewFolder} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:bg-white/5 hover:text-yellow-400 transition-all" title="Nova pasta">
            <FolderPlus size={14} />
          </button>

          {/* Save */}
          <button onClick={handleSaveProject} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:bg-white/5 hover:text-violet-400 transition-all" title="Salvar projeto (atÃ© 30)">
            <Save size={14} />
          </button>

          {/* Load saved */}
          <button onClick={() => setShowSaves(!showSaves)} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${showSaves ? "bg-white/10 text-white/70" : "text-white/30 hover:bg-white/5 hover:text-white/70"}`} title="Projetos salvos">
            <FolderOpen size={14} />
          </button>

          {/* GitHub */}
          <button onClick={() => setShowGithub(!showGithub)} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${showGithub ? "bg-white/10 text-white/70" : "text-white/30 hover:bg-white/5 hover:text-white/70"}`} title="GitHub â importar/exportar">
            <Github size={14} />
          </button>

          {/* Open in StackBlitz/VS Code */}
          <button onClick={handleOpenVSCode} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:bg-white/5 hover:text-blue-400 transition-all" title="Abrir no StackBlitz / VS Code Web">
            <ExternalLink size={14} />
          </button>

          {/* Fullscreen preview */}
          <button onClick={() => setFullPreview(!fullPreview)} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:bg-white/5 hover:text-white/70 transition-all" title="Preview em tela cheia">
            {fullPreview ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* ââ Chat import banner âââââââââââââââââââââââââââââââââââââââââââââââââ */}
      {chatImport && (
        <div className="px-4 py-2.5 bg-violet-600/15 border-b border-violet-500/25 shrink-0 flex items-center gap-3">
          <Code2 size={13} className="text-violet-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-violet-300">CÃ³digo recebido do Chat</p>
            <p className="text-[10px] text-violet-400/60 truncate">{chatImport.filename} â {chatImport.lang || "texto"}</p>
          </div>
          <button onClick={applyChatImport}
            className="px-3 py-1 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-500 transition-all shrink-0">
            Importar
          </button>
          <button onClick={() => { setChatImport(null); localStorage.removeItem("chat_code_import"); }}
            className="text-violet-400/40 hover:text-violet-300 shrink-0">
            <X size={13} />
          </button>
        </div>
      )}

      {/* ââ Import status ââââââââââââââââââââââââââââââââââââââââââââââââââââââ */}
      {importStatus && (
        <div className={`px-4 py-2 text-xs shrink-0 flex items-center gap-2 ${importStatus.startsWith("â") ? "bg-green-500/10 text-green-400" : importStatus.startsWith("Erro") ? "bg-red-500/10 text-red-400" : "bg-white/5 text-white/50"}`}>
          <RefreshCw size={11} className={importStatus.startsWith("Descompact") ? "animate-spin" : ""} />
          {importStatus}
        </div>
      )}

      {/* ââ GitHub panel âââââââââââââââââââââââââââââââââââââââââââââââââââââââ */}
      {showGithub && (
        <div className="px-4 py-3 border-b border-white/10 bg-[#0d0d0d] shrink-0 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-white/50">GitHub â Importar / Exportar</p>
            <div className="flex items-center gap-2">
              <button onClick={handleOpenVSCodeGithub} className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300">
                <ExternalLink size={10} /> VS Code Web
              </button>
              <button onClick={() => setShowGithub(false)}><X size={13} className="text-white/30 hover:text-white/70" /></button>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <input value={githubToken} onChange={(e) => { setGithubToken(e.target.value); localStorage.setItem("juridico_github_token", e.target.value); }}
              placeholder="Token GitHub (ghp_...)" type="password"
              className="flex-1 min-w-40 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-violet-500/40 font-mono" />
            <input value={githubRepo} onChange={(e) => { setGithubRepo(e.target.value); localStorage.setItem("juridico_github_repo", e.target.value); }}
              placeholder="usuario/repositorio"
              className="flex-1 min-w-40 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-violet-500/40" />
            <button onClick={handleGithubPull} className="px-3 py-2 text-xs font-bold rounded-lg bg-green-600/20 text-green-300 border border-green-500/30 hover:bg-green-600/30 transition-all">â Importar</button>
            <button onClick={handleGithubPush} className="px-3 py-2 text-xs font-bold rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 transition-all">â Enviar</button>
          </div>
          {githubStatus && (
            <p className={`text-xs px-3 py-2 rounded-lg ${githubStatus.startsWith("â") ? "bg-green-500/10 text-green-400" : githubStatus.startsWith("Erro") ? "bg-red-500/10 text-red-400" : "bg-white/5 text-white/50"}`}>
              {githubStatus}
            </p>
          )}
          <p className="text-[10px] text-white/25">Gere o token em: github.com â Settings â Developer settings â Personal access tokens (escopo: repo)</p>
        </div>
      )}

      {/* ââ Saved projects âââââââââââââââââââââââââââââââââââââââââââââââââââââ */}
      {showSaves && (
        <div className="border-b border-white/10 bg-[#0d0d0d] px-4 py-3 shrink-0 max-h-44 overflow-y-auto">
          <p className="text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-2">Projetos salvos ({saves.length}/30)</p>
          {saves.length === 0 && <p className="text-xs text-white/30">Nenhum projeto salvo ainda.</p>}
          <div className="flex flex-col gap-1">
            {saves.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 group">
                <button className="flex-1 text-left" onClick={() => handleLoadProject(s)}>
                  <p className="text-xs text-white/70">{s.name}</p>
                  <p className="text-[10px] text-white/30">{new Date(s.savedAt).toLocaleString("pt-BR")}</p>
                </button>
                <button onClick={() => { setSaves((p) => { const n = p.filter((x) => x.id !== s.id); savePlayground(n); return n; }); }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-red-400/50 hover:text-red-400 hover:bg-red-500/10">
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ââ Main editor area âââââââââââââââââââââââââââââââââââââââââââââââââââ */}
      <div className="flex flex-1 min-h-0">
        {/* File tree */}
        {!fullPreview && (
          <div className="w-44 sm:w-52 shrink-0 border-r border-white/10 bg-[#0a0a0a] overflow-y-auto flex flex-col" style={{ scrollbarWidth: "thin", scrollbarColor: "#ffffff10 transparent" }}>
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
              <span className="text-[9px] uppercase tracking-widest text-white/25 font-semibold">Arquivos</span>
              <div className="flex gap-0.5">
                <button onClick={handleNewFile} className="p-0.5 rounded hover:bg-white/5 text-white/25 hover:text-green-400" title="Novo arquivo"><FilePlus size={11} /></button>
                <button onClick={handleNewFolder} className="p-0.5 rounded hover:bg-white/5 text-white/25 hover:text-yellow-400" title="Nova pasta"><FolderPlus size={11} /></button>
              </div>
            </div>
            <div className="flex-1 px-1 py-1">
              {tree.map((node) => (
                <FileTreeItem key={node.path} node={node} depth={0} activeFile={activeFile}
                  onSelect={handleSelectFile} onDelete={handleDelete} onRename={handleRename} onToggle={handleToggle} />
              ))}
            </div>
          </div>
        )}

        {/* Editor */}
        {!fullPreview && (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Tab bar */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10 bg-[#111111] shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] text-white/30 font-mono truncate">{activeFile}</span>
                <span className="text-[9px] bg-white/5 text-white/25 px-1.5 py-0.5 rounded-full">{getLanguage(activeFile)}</span>
                {isActiveBinary && <span className="text-[9px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full">binÃ¡rio</span>}
              </div>
              <button onClick={handleCopyContent} className="flex items-center gap-1 text-[10px] text-white/25 hover:text-white/60 px-2 py-1 rounded hover:bg-white/5">
                {copied ? <><Check size={10} className="text-green-400" /><span className="text-green-400">Copiado</span></> : <><Copy size={10} />Copiar</>}
              </button>
            </div>

            {isActiveBinary ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-white/30 text-sm mb-1">Arquivo binÃ¡rio</p>
                  <p className="text-white/20 text-xs">{activeFile}</p>
                  <p className="text-white/15 text-[10px] mt-2">Arquivos de imagem, fonte, vÃ­deo, etc. nÃ£o sÃ£o editÃ¡veis aqui.</p>
                </div>
              </div>
            ) : (
              <textarea
                value={currentContent}
                onChange={(e) => handleEditorChange(e.target.value)}
                spellCheck={false}
                className="flex-1 bg-[#0c0c0c] text-emerald-200 font-mono text-xs resize-none p-4 focus:outline-none leading-relaxed"
                style={{ scrollbarWidth: "thin", scrollbarColor: "#ffffff10 transparent", tabSize: 2 }}
                onKeyDown={(e) => {
                  if (e.key === "Tab") {
                    e.preventDefault();
                    const start = e.currentTarget.selectionStart;
                    const end = e.currentTarget.selectionEnd;
                    const val = e.currentTarget.value;
                    const next = val.substring(0, start) + "  " + val.substring(end);
                    handleEditorChange(next);
                    setTimeout(() => { e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2; }, 0);
                  }
                }}
              />
            )}
          </div>
        )}

        {/* Preview */}
        {preview && (
          <div className={`flex flex-col border-l border-white/10 ${fullPreview ? "flex-1" : "w-1/2"}`}>
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#111111] border-b border-white/10 shrink-0">
              <span className="text-[10px] text-white/30">VisualizaÃ§Ã£o</span>
              <div className="flex gap-1">
                <button onClick={() => setFullPreview(!fullPreview)} className="p-1 rounded text-white/25 hover:text-white/60 hover:bg-white/5">
                  {fullPreview ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
                </button>
                <button onClick={() => setPreview("")} className="p-1 rounded text-white/25 hover:text-red-400 hover:bg-red-500/10">
                  <X size={11} />
                </button>
              </div>
            </div>
            <iframe
              srcDoc={preview}
              sandbox="allow-scripts allow-forms allow-modals"
              className="flex-1 bg-white border-0"
              title="preview"
            />
          </div>
        )}
      </div>
    </div>
  );
}
