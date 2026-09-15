/**
 * askbot.js — a reusable OKF portfolio chat widget.
 *
 * Drop-in floating chat bubble (bottom-right) that answers questions about a
 * packed OKF bundle. Relevant OKF concepts are retrieved in-browser (keyword
 * search) and sent to a Cloudflare Worker LLM, which composes the answer. If
 * the Worker can't be reached it falls back to a plain keyword-search result.
 *
 * Usage (see web/index.html and web/README.md):
 *   <script>
 *     window.AskBotConfig = {
 *       bundleUrl: "bundle.portfolio.json",
 *       workerUrl: "https://ask-about-me.imelanthirayan.workers.dev",
 *       title: "Ask about Elanthirayan",
 *     };
 *   </script>
 *   <script type="module" src="askbot.js"></script>
 *
 * Anyone can reuse this: repack their own OKF bundle with pack_bundle.py, point
 * `bundleUrl` at it, deploy the Worker, and customize title/accent/greeting.
 */

import { OKFBundle } from "./okf-bundle.js";

const CDN = {
  marked: "https://esm.run/marked@12",
};

const DEFAULTS = {
  bundleUrl: "bundle.portfolio.json",
  markedUrl: CDN.marked,
  // Cloudflare Worker LLM endpoint. Receives { question, context } and returns
  // { answer }. The context is the top OKF concepts retrieved in-browser.
  workerUrl: "https://ask-about-me.imelanthirayan.workers.dev",
  title: "Ask about me",
  subtitle: "AI-powered portfolio assistant",
  accent: "#4f46e5",
  greeting:
    "Hi! I'm a portfolio assistant. Ask me anything about this portfolio — skills, experience, open source, research, or writing.",
  suggestions: [
    "Who is Elanthirayan?",
    "What open source has he built?",
    "What's his experience with AI and RAG?",
    "Where has he worked?",
  ],
  // OKF retrieval settings: ragTopK = how many concepts to include; ragMaxChars
  // = character budget for the assembled context (keeps the LLM payload small).
  ragTopK: 4,
  ragMaxChars: 4000,
};

// Appended to the user's question before sending to the Worker LLM. The small
// model tends to answer one-word or refuse on terse questions; this nudges it
// to synthesise a specific, complete answer grounded in the portfolio context.
const ANSWER_INSTRUCTION =
  "\n\nAnswer the question using only the portfolio context provided. If the " +
  "Frequently Asked Questions section contains a matching question, use its " +
  "answer directly. Be specific and complete; if several items apply, list " +
  "them. Refer to him by name or as \"he\". If the context has nothing " +
  "relevant, say so briefly.";

// Natural-language questions grounded in the portfolio's OKF concepts. Keyed by
// concept id, these power the "You might also ask" follow-ups after each answer
// so visitors can explore related content without typing.
const QUESTION_BANK = {
  "profile/about": ["Who is Elanthirayan?", "What is his background and expertise?"],
  "experience/shell": ["What does he do at Shell?", "What emerging tech has he worked on at Shell?"],
  "experience/asm-technologies": ["What was his role at ASM Technologies?"],
  "experience/axinovate": ["What did he build at Axinovate?"],
  "projects/ask-your-markdown": ["What is Ask Your Markdown?"],
  "projects/chatui": ["Tell me about the ChatUI project.", "How does ChatUI connect to different LLMs?"],
  "projects/ai-concepts-playground": ["What is the AI Concepts Playground?"],
  "projects/milvuslite-kit": ["What does milvuslite-kit do?"],
  "projects/filetracker": ["What is FileTracker?"],
  "projects/folderwatcher": ["What is FolderWatcher?"],
  "research/enterprise-rag": ["What's his research on enterprise RAG?", "How does he approach grounding and retrieval?"],
  "research/model-finetuning": ["How has he worked with LoRA and fine-tuning?"],
  "research/hpc-ai": ["How does he use HPC for large-scale AI?"],
  "research/spatial-computing": ["What's his research in spatial computing and Digital Twins?"],
  "research/reinforcement-learning-robotics": ["What's his research on reinforcement learning for robotics?"],
  "skills/artificial-intelligence": ["What are his core AI skills?", "What does he know about agentic AI?"],
  "skills/cloud-devops": ["What cloud and DevOps skills does he have?"],
  "skills/software-engineering": ["What's his software engineering experience?"],
  "skills/spatial-computing": ["What XR and spatial-computing skills does he have?"],
  "skills/hpc": ["What HPC experience does he have?"],
  "blogs/mlflow-series": ["What has he written about MLflow?"],
  "blogs/docker-series": ["What's his Docker from Scratch series about?"],
  "blogs/mcp-series": ["What has he written about Model Context Protocol?"],
  "blogs/rag-vector": ["What has he written about RAG and vector databases?"],
  "blogs/xr-spatial": ["What has he written about XR and spatial computing?"],
  "blogs/ai-fundamentals": ["What AI fundamentals has he explained?"],
  "blogs/data-sql": ["What has he written about SQL and databases?"],
  "blogs/python-fastapi": ["What has he written about Python and FastAPI?"],
  "blogs/cloud-devops": ["What cloud and DevOps articles has he written?"],
  "blogs/graphics-3d": ["What has he written about 3D and web graphics?"],
  "blogs/unity-gamedev": ["What has he written about Unity and game development?"],
  "blogs/okf-vector-database": ["Do you always need a vector database for an AI chatbot?"],
};

// Cross-portfolio prompts used to seed the greeting and to top up related
// questions when the retrieved concepts don't yield enough follow-ups.
const DISCOVERY = [
  "Who is Elanthirayan?",
  "What open source has he built?",
  "What are his strongest AI skills?",
  "What is his research focused on?",
  "Where has he worked?",
  "What has he written about?",
];

class AskBot {
  constructor(config) {
    this.cfg = { ...DEFAULTS, ...(config || {}) };
    this.bundle = null;
    this.marked = null;
    this.mode = null; // null/"ai" => Worker LLM; "search" => keyword-only
    this.history = []; // [{role, content}] of user questions + final answers
    this.busy = false;
    this._buildUI();
  }

  // ---- lifecycle -----------------------------------------------------
  async _ensureBundle() {
    if (!this.bundle) this.bundle = await OKFBundle.load(this.cfg.bundleUrl);
    return this.bundle;
  }

  async _ensureMarked() {
    if (!this.marked) {
      const mod = await import(this.cfg.markedUrl);
      this.marked = mod.marked || mod.default || mod;
    }
    return this.marked;
  }

  // ---- answering (dispatch by chosen mode) --------------------------
  async ask(question) {
    if (this.mode === "search") return this._askSearch(question);
    return this._askWorker(question);
  }

  // Keyword-search fallback: no model, just rank concepts by term overlap.
  async _askSearch(question) {
    await this._ensureBundle();
    const hits = this.bundle.search(question, 3);
    if (!hits.length) {
      return {
        text: "I couldn't find anything about that in the portfolio. Try different keywords.",
        sources: [],
      };
    }
    const top = hits[0];
    const parts = [`**${top.title}**`];
    if (top.description) parts.push(`_${top.description}_`);
    if (top.snippet) parts.push(top.snippet);
    const others = hits.slice(1);
    if (others.length) {
      parts.push("**Related:** " + others.map((h) => h.title).join(" · "));
    }
    return { text: parts.join("\n\n"), sources: hits.map((h) => h.concept_id) };
  }

  // ---- LLM answer via the Cloudflare Worker -------------------------
  // OKF-native retrieval: select only the relevant concepts (via OKF
  // title/description/tags/concept-id scoring + curated FAQ answers) and send
  // that compact context to the Worker's LLM. This keeps the payload small and
  // scales past the model's context window as the portfolio grows. Falls back
  // to the full bundle if retrieval finds nothing, and to keyword search if the
  // Worker can't be reached.
  async _askWorker(question) {
    await this._ensureBundle();
    let { context, sources } = this.bundle.retrieveContext(
      question,
      this.cfg.ragTopK,
      this.cfg.ragMaxChars
    );
    if (!context) {
      ({ context, sources } = this.bundle.fullContext());
    }
    // The Worker uses a small LLM that answers tersely (or refuses) for short
    // questions. Nudge it to synthesise a specific, complete answer from the
    // context. The user still sees their original question in the transcript.
    const prompt = `${question}${ANSWER_INSTRUCTION}`;
    try {
      const res = await fetch(this.cfg.workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: prompt, context }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const answer = String(data?.answer ?? data?.response ?? data?.text ?? "").trim();
      if (!answer) throw new Error("empty response");
      return { text: answer, sources };
    } catch (err) {
      const fallback = await this._askSearch(question);
      fallback.text =
        `⚠️ Couldn't reach the AI service (${err.message || err}). Here's a keyword-search result instead:\n\n` +
        fallback.text;
      return fallback;
    }
  }

  // ---- UI ------------------------------------------------------------
  _buildUI() {
    injectStyles(this.cfg.accent);
    const root = document.createElement("div");
    root.className = "askbot";
    root.innerHTML = `
      <button class="askbot-bubble" aria-label="Open chat" title="${escapeAttr(this.cfg.title)}">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
          <path d="M12 3C6.48 3 2 6.94 2 11.5c0 2.4 1.25 4.55 3.24 6.06-.14.98-.6 2.3-1.6 3.44-.2.23-.05.6.25.57 1.9-.2 3.5-.86 4.63-1.62.77.18 1.6.28 2.48.28 5.52 0 10-3.94 10-8.5S17.52 3 12 3z"/>
        </svg>
      </button>
      <section class="askbot-panel" role="dialog" aria-label="Portfolio chat" hidden>
        <header class="askbot-header">
          <div class="askbot-titles">
            <strong>${escapeHtml(this.cfg.title)}</strong>
            <span>${escapeHtml(this.cfg.subtitle)}</span>
          </div>
          <button class="askbot-close" aria-label="Close chat">&times;</button>
        </header>
        <div class="askbot-messages"></div>
        <div class="askbot-status" hidden></div>
        <form class="askbot-input">
          <input type="text" placeholder="Ask a question…" autocomplete="off" />
          <button type="submit" aria-label="Send">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
          </button>
        </form>
      </section>`;
    document.body.appendChild(root);

    this.el = {
      root,
      bubble: root.querySelector(".askbot-bubble"),
      panel: root.querySelector(".askbot-panel"),
      close: root.querySelector(".askbot-close"),
      messages: root.querySelector(".askbot-messages"),
      status: root.querySelector(".askbot-status"),
      form: root.querySelector(".askbot-input"),
      input: root.querySelector(".askbot-input input"),
    };

    this.el.bubble.addEventListener("click", () => this._toggle(true));
    this.el.close.addEventListener("click", () => this._toggle(false));
    this.el.form.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = this.el.input.value.trim();
      if (q) this._onSubmit(q);
    });

    this._greeting();
  }

  _greeting() {
    this._addMessage("bot", this.cfg.greeting);
    this._renderChips(this.cfg.suggestions, "Try asking:");
  }

  // Render a labelled row of clickable question chips at the bottom of the
  // conversation. Only one chip block exists at a time (the newest one).
  _renderChips(questions, label) {
    const list = (questions || []).filter(Boolean);
    if (!list.length) return;
    this._removeSuggestions();
    const wrap = document.createElement("div");
    wrap.className = "askbot-suggestions";
    if (label) {
      const l = document.createElement("div");
      l.className = "askbot-chips-label";
      l.textContent = label;
      wrap.appendChild(l);
    }
    const row = document.createElement("div");
    row.className = "askbot-chip-row";
    for (const s of list) {
      const chip = document.createElement("button");
      chip.className = "askbot-chip";
      chip.textContent = s;
      chip.addEventListener("click", () => this._onSubmit(s));
      row.appendChild(chip);
    }
    wrap.appendChild(row);
    this.el.messages.appendChild(wrap);
    this._scroll();
  }

  // Build up to `max` follow-up questions related to the concepts that were
  // retrieved for the last answer, then top up with cross-portfolio prompts.
  // Anything already asked (or the exact question just asked) is skipped.
  _relatedQuestions(sources, max = 3) {
    const asked = new Set(
      this.history.filter((h) => h.role === "user").map((h) => this._normQ(h.content))
    );
    const out = [];
    const add = (candidates) => {
      for (const q of candidates || []) {
        if (out.length >= max) break;
        if (!q) continue;
        const n = this._normQ(q);
        if (asked.has(n) || out.some((o) => this._normQ(o) === n)) continue;
        out.push(q);
      }
    };
    // Prefer the secondary sources first so follow-ups explore adjacent topics
    // rather than re-asking about the concept the visitor just read about.
    const src = sources || [];
    const ordered = [...src.slice(1), ...src.slice(0, 1)];
    for (const cid of ordered) {
      if (out.length >= max) break;
      add(QUESTION_BANK[cid]);
    }
    if (out.length < max) add(DISCOVERY);
    return out.slice(0, max);
  }

  _normQ(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }

  _toggle(open) {
    this.el.panel.hidden = !open;
    this.el.root.classList.toggle("askbot-open", open);
    if (open) setTimeout(() => this.el.input.focus(), 50);
  }

  async _onSubmit(question) {
    if (this.busy) return;
    this.busy = true;
    this.el.input.value = "";
    this._removeSuggestions();
    this._addMessage("user", question);
    const typing = this._addTyping();
    this._setStatus(this.mode === "search" ? "Searching…" : "Thinking…");

    try {
      const { text, sources } = await this.ask(question);
      typing.remove();
      await this._addMessage("bot", text, sources);
      this.history.push({ role: "user", content: question });
      this.history.push({ role: "assistant", content: text });
      if (this.history.length > 8) this.history = this.history.slice(-8);
      this._renderChips(this._relatedQuestions(sources), "You might also ask:");
    } catch (err) {
      typing.remove();
      this._addMessage("bot", `⚠️ ${err.message || err}`);
    } finally {
      this._setStatus("");
      this.busy = false;
      this.el.input.focus();
    }
  }

  async _addMessage(who, text, sources) {
    const row = document.createElement("div");
    row.className = `askbot-msg askbot-${who}`;
    const bubble = document.createElement("div");
    bubble.className = "askbot-bubble-msg";
    if (who === "bot") {
      const marked = await this._ensureMarked();
      bubble.innerHTML = marked.parse(String(text));
      bubble.querySelectorAll("a").forEach((a) => (a.target = "_blank"));
      if (sources && sources.length) {
        const src = document.createElement("div");
        src.className = "askbot-sources";
        src.textContent = "Sources: " + sources.join(", ");
        bubble.appendChild(src);
      }
    } else {
      bubble.textContent = text;
    }
    row.appendChild(bubble);
    this.el.messages.appendChild(row);
    this._scroll();
    return row;
  }

  _addTyping() {
    const row = document.createElement("div");
    row.className = "askbot-msg askbot-bot";
    row.innerHTML = `<div class="askbot-bubble-msg askbot-typing"><span></span><span></span><span></span></div>`;
    this.el.messages.appendChild(row);
    this._scroll();
    return row;
  }

  _removeSuggestions() {
    this.el.messages.querySelector(".askbot-suggestions")?.remove();
  }

  _setStatus(text) {
    this.el.status.textContent = text || "";
    this.el.status.hidden = !text;
  }

  _scroll() {
    this.el.messages.scrollTop = this.el.messages.scrollHeight;
  }
}

// ---- small helpers -------------------------------------------------
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function escapeAttr(s) {
  return escapeHtml(s);
}

function injectStyles(accent) {
  if (document.getElementById("askbot-styles")) return;
  const css = `
  .askbot { --askbot-accent: ${accent}; position: fixed; right: 20px; bottom: 20px; z-index: 2147483000;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  .askbot-bubble { width: 58px; height: 58px; border-radius: 50%; border: none; cursor: pointer;
    background: var(--askbot-accent); color: #fff; box-shadow: 0 6px 20px rgba(0,0,0,.25);
    display: flex; align-items: center; justify-content: center; transition: transform .15s ease; }
  .askbot-bubble:hover { transform: scale(1.06); }
  .askbot-open .askbot-bubble { display: none; }
  .askbot-panel { position: absolute; right: 0; bottom: 0; width: 370px; max-width: calc(100vw - 32px);
    height: 540px; max-height: calc(100vh - 40px); background: #fff; border-radius: 16px;
    box-shadow: 0 12px 40px rgba(0,0,0,.28); display: flex; flex-direction: column; overflow: hidden; }
  .askbot-panel[hidden] { display: none; }
  .askbot-header { background: var(--askbot-accent); color: #fff; padding: 14px 16px; display: flex;
    align-items: center; justify-content: space-between; }
  .askbot-titles { display: flex; flex-direction: column; line-height: 1.25; }
  .askbot-titles strong { font-size: 15px; }
  .askbot-titles span { font-size: 11px; opacity: .85; }
  .askbot-close { background: transparent; border: none; color: #fff; font-size: 24px; cursor: pointer; line-height: 1; }
  .askbot-messages { flex: 1; overflow-y: auto; padding: 14px; background: #f7f7f9; display: flex; flex-direction: column; gap: 10px; }
  .askbot-msg { display: flex; }
  .askbot-user { justify-content: flex-end; }
  .askbot-bubble-msg { max-width: 84%; padding: 9px 12px; border-radius: 14px; font-size: 14px; line-height: 1.45;
    word-wrap: break-word; overflow-wrap: anywhere; }
  .askbot-bot .askbot-bubble-msg { background: #fff; color: #1f2330; border: 1px solid #e6e6ee; border-bottom-left-radius: 4px; }
  .askbot-user .askbot-bubble-msg { background: var(--askbot-accent); color: #fff; border-bottom-right-radius: 4px; }
  .askbot-bubble-msg p { margin: 0 0 8px; } .askbot-bubble-msg p:last-child { margin-bottom: 0; }
  .askbot-bubble-msg ul, .askbot-bubble-msg ol { margin: 4px 0 8px; padding-left: 18px; }
  .askbot-bubble-msg a { color: var(--askbot-accent); }
  .askbot-user .askbot-bubble-msg a { color: #fff; text-decoration: underline; }
  .askbot-sources { margin-top: 8px; padding-top: 6px; border-top: 1px dashed #d8d8e2; font-size: 11px; color: #7a7a8c; }
  .askbot-suggestions { display: flex; flex-direction: column; gap: 5px; padding: 2px 2px 4px; }
  .askbot-chips-label { font-size: 11px; color: #7a7a8c; font-weight: 600; }
  .askbot-chip-row { display: flex; flex-wrap: wrap; gap: 6px; }
  .askbot-chip { background: #fff; border: 1px solid var(--askbot-accent); color: var(--askbot-accent);
    border-radius: 14px; padding: 6px 10px; font-size: 12px; cursor: pointer; }
  .askbot-chip:hover { background: var(--askbot-accent); color: #fff; }
  .askbot-status { font-size: 11px; color: #7a7a8c; padding: 4px 14px; background: #f7f7f9; }
  .askbot-input { display: flex; gap: 8px; padding: 10px; border-top: 1px solid #ececf2; background: #fff; }
  .askbot-input input { flex: 1; border: 1px solid #d9d9e3; border-radius: 20px; padding: 9px 14px; font-size: 14px; outline: none; }
  .askbot-input input:focus { border-color: var(--askbot-accent); }
  .askbot-input button { background: var(--askbot-accent); color: #fff; border: none; border-radius: 50%;
    width: 38px; height: 38px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .askbot-typing { display: flex; gap: 4px; align-items: center; }
  .askbot-typing span { width: 7px; height: 7px; background: #b8b8c6; border-radius: 50%; animation: askbot-blink 1.2s infinite both; }
  .askbot-typing span:nth-child(2) { animation-delay: .2s; } .askbot-typing span:nth-child(3) { animation-delay: .4s; }
  @keyframes askbot-blink { 0%, 80%, 100% { opacity: .25; } 40% { opacity: 1; } }
  @media (max-width: 480px) { .askbot-panel { width: calc(100vw - 24px); height: calc(100vh - 90px); } }
  `;
  const style = document.createElement("style");
  style.id = "askbot-styles";
  style.textContent = css;
  document.head.appendChild(style);
}

// ---- auto-init -----------------------------------------------------
function boot() {
  const bot = new AskBot(window.AskBotConfig || {});
  window.AskBot = bot;
}
if (!(typeof window !== "undefined" && window.ASKBOT_NO_AUTOBOOT)) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
}

export { AskBot, boot };
