import { Router } from "express";

const router = Router();

type Provider = "openai" | "anthropic" | "perplexity" | "gemini" | "groq" | "mistral" | "openrouter";

interface ChatMsg { role: string; content: string }

// OpenAI-compatible streaming (OpenAI, Perplexity, Groq, Mistral, OpenRouter all use same format)
async function streamOpenAICompat(
  url: string,
  headers: Record<string, string>,
  body: object,
  send: (t: string) => void,
  done: () => void,
  fail: (m: string) => void,
) {
  const upstream = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    let msg = text;
    try { msg = JSON.parse(text).error?.message ?? text; } catch {}
    fail(msg);
    return;
  }

  const reader = upstream.body?.getReader();
  if (!reader) { fail("Sem resposta do servidor"); return; }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done: doneReading, value } = await reader.read();
    if (doneReading) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6).trim();
        if (data === "[DONE]") continue;
        try {
          const json = JSON.parse(data);
          const content = json.choices?.[0]?.delta?.content ?? "";
          if (content) send(content);
        } catch {}
      }
    }
  }
  done();
}

router.post("/ai/chat", async (req, res) => {
  const { provider, apiKey, model, systemPrompt, messages } = req.body as {
    provider: Provider;
    apiKey: string;
    model: string;
    systemPrompt: string;
    messages: ChatMsg[];
  };

  if (!apiKey || !provider || !model || !messages) {
    res.status(400).json({ error: "Campos obrigatÃ³rios: provider, apiKey, model, messages" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (text: string) => res.write(`data: ${JSON.stringify({ text })}\n\n`);
  const done = () => { res.write("data: [DONE]\n\n"); res.end(); };
  const fail = (msg: string) => {
    res.write(`data: ${JSON.stringify({ text: `\n\n**Erro:** ${msg}` })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  };

  const sysMessages = systemPrompt ? [{ role: "system", content: systemPrompt }] : [];

  try {
    switch (provider) {
      case "openai":
        await streamOpenAICompat(
          "https://api.openai.com/v1/chat/completions",
          { Authorization: `Bearer ${apiKey}` },
          { model, stream: true, messages: [...sysMessages, ...messages] },
          send, done, fail,
        );
        break;

      case "perplexity":
        await streamOpenAICompat(
          "https://api.perplexity.ai/chat/completions",
          { Authorization: `Bearer ${apiKey}` },
          { model, stream: true, messages: [...sysMessages, ...messages] },
          send, done, fail,
        );
        break;

      case "groq":
        await streamOpenAICompat(
          "https://api.groq.com/openai/v1/chat/completions",
          { Authorization: `Bearer ${apiKey}` },
          { model, stream: true, messages: [...sysMessages, ...messages] },
          send, done, fail,
        );
        break;

      case "mistral":
        await streamOpenAICompat(
          "https://api.mistral.ai/v1/chat/completions",
          { Authorization: `Bearer ${apiKey}` },
          { model, stream: true, messages: [...sysMessages, ...messages] },
          send, done, fail,
        );
        break;

      case "openrouter":
        await streamOpenAICompat(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": "https://assistente-ia.replit.app",
            "X-Title": "Assistente IA JurÃ­dico",
          },
          { model, stream: true, messages: [...sysMessages, ...messages] },
          send, done, fail,
        );
        break;

      case "anthropic": {
        const body = {
          model,
          max_tokens: 8192,
          stream: true,
          ...(systemPrompt ? { system: systemPrompt } : {}),
          messages,
        };
        const upstream = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify(body),
        });

        if (!upstream.ok) {
          const text = await upstream.text();
          let msg = text;
          try { msg = JSON.parse(text).error?.message ?? text; } catch {}
          fail(msg); return;
        }

        const reader = upstream.body?.getReader();
        if (!reader) { fail("Sem resposta"); return; }

        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done: doneReading, value } = await reader.read();
          if (doneReading) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              try {
                const json = JSON.parse(data);
                if (json.type === "content_block_delta" && json.delta?.type === "text_delta") {
                  send(json.delta.text);
                }
              } catch {}
            }
          }
        }
        done();
        break;
      }

      case "gemini": {
        // Gemini uses a different non-streaming-friendly API; we use generateContent
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const geminiMessages = messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));
        const body: Record<string, unknown> = { contents: geminiMessages };
        if (systemPrompt) {
          body.systemInstruction = { parts: [{ text: systemPrompt }] };
        }

        const upstream = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!upstream.ok) {
          const text = await upstream.text();
          let msg = text;
          try { msg = JSON.parse(text).error?.message ?? text; } catch {}
          fail(msg); return;
        }

        const data = await upstream.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        send(text);
        done();
        break;
      }

      default:
        fail(`Provedor desconhecido: ${provider}`);
    }
  } catch (e: unknown) {
    fail(e instanceof Error ? e.message : "Erro interno");
  }
});

export default router;
