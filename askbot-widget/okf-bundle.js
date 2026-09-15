/**
 * okf-bundle.js — client-side OKF bundle navigation.
 *
 * A faithful JavaScript port of the repo's `okf_bundle.Bundle` reader. It
 * operates over the JSON produced by `web/pack_bundle.py` (frontmatter already
 * parsed) so the browser needs no YAML parser. The navigation surface mirrors
 * the Python tools exposed to the LLM: readIndex, readConcept, readMetadata,
 * metadataFacets, findConcepts, readSection.
 */

const RESERVED = new Set(["index.md", "log.md"]);

// Mirror of retrieval/tokenizer.py: lowercase, split on non-alphanumerics
// (keep underscores), drop short tokens and a small English stopword set.
const STOPWORDS = new Set(
  ("a an and are as at be but by for from has have how i in is it its of on or " +
    "that the their this to was were what when where which who will with you your " +
    "do does did done can could should would about into over under then than")
    .split(/\s+/)
);
const TOKEN_RE = /[a-z0-9_]+/g;

function tokenize(text, minLen = 2) {
  const out = [];
  const matches = String(text || "").toLowerCase().match(TOKEN_RE) || [];
  for (const tok of matches) {
    if (tok.length >= minLen && !STOPWORDS.has(tok)) out.push(tok);
  }
  return out;
}

// Weighted token-frequency map for a piece of text (term -> count * weight).
function tokenizeCounts(text, weight, into) {
  for (const tok of tokenize(text)) into.set(tok, (into.get(tok) || 0) + weight);
  return into;
}

export class OKFBundle {
  /** @param {{name:string, files:Object<string,{raw:string,frontmatter:Object,body:string}>}} manifest */
  constructor(manifest) {
    this.name = manifest.name || "bundle";
    this.files = manifest.files || {};
    this.paths = Object.keys(this.files);
  }

  static async load(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load bundle: ${url} (${res.status})`);
    return new OKFBundle(await res.json());
  }

  // -- helpers ---------------------------------------------------------
  _norm(p) {
    return String(p || "").trim().replace(/^\/+/, "");
  }

  conceptIds() {
    const ids = [];
    for (const path of this.paths) {
      const base = path.split("/").pop();
      if (!path.endsWith(".md") || RESERVED.has(base)) continue;
      ids.push(path.slice(0, -3));
    }
    return ids.sort();
  }

  _dirExists(dir) {
    if (dir === "") return true;
    const prefix = dir + "/";
    return this.paths.some((p) => p.startsWith(prefix));
  }

  _immediateChildren(dir) {
    const prefix = dir === "" ? "" : dir + "/";
    const subdirs = new Set();
    const concepts = [];
    for (const path of this.paths) {
      if (!path.startsWith(prefix)) continue;
      const rest = path.slice(prefix.length);
      if (rest.includes("/")) {
        subdirs.add(rest.split("/")[0]);
      } else {
        const base = rest;
        if (base.endsWith(".md") && !RESERVED.has(base)) {
          const fm = this.files[path].frontmatter || {};
          concepts.push([base, fm.description || ""]);
        }
      }
    }
    return { subdirs: [...subdirs].sort(), concepts: concepts.sort() };
  }

  // -- reads exposed to the agent -------------------------------------
  readIndex(dirPath = "") {
    const dir = this._norm(dirPath).replace(/\/+$/, "");
    if (!this._dirExists(dir)) throw new Error(`Not a directory: '${dirPath}'`);
    const indexPath = dir === "" ? "index.md" : `${dir}/index.md`;
    if (this.files[indexPath]) return this.files[indexPath].raw;
    return this._synthesizeIndex(dir);
  }

  _conceptPath(conceptId) {
    let cid = this._norm(conceptId);
    if (!cid.endsWith(".md")) cid += ".md";
    return cid;
  }

  readConcept(conceptId, maxChars = null) {
    const path = this._conceptPath(conceptId);
    const entry = this.files[path];
    if (!entry) throw new Error(`No such concept: '${conceptId}'`);
    const text = entry.raw;
    if (maxChars && text.length > maxChars) {
      const headings = this._headings(text);
      const note =
        `\n\n[TRUNCATED: showed ${maxChars} of ${text.length} chars. ` +
        `Use read_section(concept_id, heading) for a specific section. ` +
        `Headings: ${headings.join(", ") || "(none)"}]`;
      return text.slice(0, maxChars) + note;
    }
    return text;
  }

  _headings(text) {
    return text
      .split("\n")
      .filter((ln) => ln.trimStart().startsWith("#"))
      .map((ln) => ln.replace(/^#+/, "").trim());
  }

  readMetadata(conceptId) {
    const path = this._conceptPath(conceptId);
    const entry = this.files[path];
    if (!entry) throw new Error(`No such concept: '${conceptId}'`);
    return entry.frontmatter || {};
  }

  _fmMatches(frontmatter, filters) {
    const lower = {};
    for (const [k, v] of Object.entries(frontmatter || {})) lower[String(k).toLowerCase()] = v;
    for (const [key, want] of Object.entries(filters || {})) {
      const val = lower[String(key).toLowerCase()];
      const wantL = String(want).trim().toLowerCase();
      if (Array.isArray(val)) {
        const items = val.map((v) => String(v).toLowerCase());
        if (!items.some((it) => wantL === it || it.includes(wantL))) return false;
      } else {
        const have = String(val == null ? "" : val).toLowerCase();
        if (wantL !== have && !have.includes(wantL)) return false;
      }
    }
    return true;
  }

  findConcepts(filters) {
    const results = [];
    for (const cid of this.conceptIds()) {
      const fm = this.files[cid + ".md"].frontmatter || {};
      if (this._fmMatches(fm, filters || {})) {
        results.push({ concept_id: cid, title: fm.title || cid, metadata: fm });
      }
    }
    return results;
  }

  metadataFacets(maxValues = 25) {
    const facets = {};
    for (const cid of this.conceptIds()) {
      const fm = this.files[cid + ".md"].frontmatter || {};
      for (const [key, val] of Object.entries(fm)) {
        const vals = Array.isArray(val) ? val : [val];
        const bucket = (facets[key] = facets[key] || new Set());
        for (const v of vals) {
          if (v != null && bucket.size < maxValues) bucket.add(String(v));
        }
      }
    }
    const out = {};
    for (const k of Object.keys(facets).sort()) out[k] = [...facets[k]].sort();
    return out;
  }

  readSection(conceptId, heading) {
    const path = this._conceptPath(conceptId);
    const entry = this.files[path];
    if (!entry) throw new Error(`No such concept: '${conceptId}'`);
    const fm = entry.frontmatter || {};
    const body = entry.body || "";
    const target = String(heading).replace(/^#+/, "").trim().toLowerCase();
    const lines = body.split("\n");
    let start = null;
    let level = null;
    for (let i = 0; i < lines.length; i++) {
      const s = lines[i].trimStart();
      if (s.startsWith("#")) {
        const lvl = s.length - s.replace(/^#+/, "").length;
        if (s.replace(/^#+/, "").trim().toLowerCase() === target) {
          start = i;
          level = lvl;
          break;
        }
      }
    }
    if (start === null) {
      const avail = this._headings(body).join(", ") || "(none)";
      throw new Error(`No section '${heading}'. Available: ${avail}`);
    }
    let end = lines.length;
    for (let j = start + 1; j < lines.length; j++) {
      const s = lines[j].trimStart();
      if (s.startsWith("#")) {
        const lvl = s.length - s.replace(/^#+/, "").length;
        if (lvl <= level) {
          end = j;
          break;
        }
      }
    }
    const section = lines.slice(start, end).join("\n").trim();
    const title = fm.title || conceptId;
    return `# (section of ${title})\n\n${section}\n`;
  }

  _synthesizeIndex(dir) {
    const header = dir === "" ? "root" : dir;
    const { subdirs, concepts } = this._immediateChildren(dir);
    const out = [`# ${header} (synthesized index)\n`];
    if (subdirs.length) {
      out.push("# Subdirectories\n");
      for (const s of subdirs) out.push(`* [${s}](${s}/index.md)`);
      out.push("");
    }
    if (concepts.length) {
      out.push("# Concepts\n");
      for (const [n, d] of concepts) out.push(`* [${n.slice(0, -3)}](${n}) - ${d}`);
    }
    return out.join("\n") + "\n";
  }

  /**
   * Keyword-overlap search over concept text (a JS port of
   * retrieval/keyword.py): rank concepts by the number of distinct query terms
   * they contain. Used as a no-LLM fallback.
   * @returns {{concept_id:string, title:string, description:string, score:number, snippet:string}[]}
   */
  search(query, topK = 3) {
    this._buildSearchIndex();
    const idx = this._searchIndex;
    const q = new Set(tokenize(query));
    if (!q.size || !idx.ids.length) return [];
    // Expand query terms: use exact matches when the term exists in the
    // vocabulary, otherwise fall back to prefix matches (so "ela" -> the token
    // "elanthirayan"). Each resolved term keeps its IDF weight.
    const resolved = [];
    for (const t of q) {
      if (idx.idf.has(t)) {
        resolved.push(t);
      } else if (t.length >= 3) {
        for (const v of idx.idf.keys()) {
          if (v.length > t.length && v.startsWith(t)) resolved.push(v);
        }
      }
    }
    if (!resolved.length) return [];
    const hits = [];
    for (let i = 0; i < idx.ids.length; i++) {
      let score = 0;
      const doc = idx.docs[i];
      for (const t of resolved) {
        const w = idx.idf.get(t) || 0;
        if (!w) continue;
        let field = 0;
        if (doc.titleTerms.has(t)) field += 3;
        if (doc.tagTerms.has(t)) field += 3;
        if (doc.pathTerms.has(t)) field += 2;
        if (doc.descTerms.has(t)) field += 2;
        const bt = doc.bodyTf.get(t);
        if (bt) field += 1 + Math.log(bt); // sublinear: repetition has diminishing returns
        if (field) score += field * w;
      }
      if (score > 0) hits.push({ i, score });
    }
    hits.sort((a, z) => z.score - a.score || (idx.ids[a.i] < idx.ids[z.i] ? -1 : 1));
    return hits.slice(0, topK).map(({ i, score }) => {
      const cid = idx.ids[i];
      const fm = this.files[cid + ".md"].frontmatter || {};
      return {
        concept_id: cid,
        title: fm.title || cid,
        description: fm.description || "",
        score: Math.round(score * 100) / 100,
        snippet: this._snippet(idx.bodies[i], q),
      };
    });
  }

  /**
   * Build a single context block containing EVERY concept in the bundle
   * (title + description + body), capped at maxChars. Because the portfolio is
   * small (~9K tokens), we can send the whole thing to the LLM and let it pick
   * what's relevant — this avoids keyword-retrieval ranking mistakes entirely.
   * @returns {{context:string, sources:string[]}}
   */
  fullContext(maxChars = 60000) {
    const sources = [];
    const parts = [];
    let used = 0;
    for (const cid of this.conceptIds()) {
      const entry = this.files[cid + ".md"];
      if (!entry) continue;
      const fm = entry.frontmatter || {};
      const body = String(entry.body || entry.raw || "").replace(/\s+/g, " ").trim();
      const title = fm.title || cid;
      const desc = fm.description ? `_${fm.description}_\n` : "";
      const block = `## ${title}\n${desc}${body}`.trim();
      if (!block) continue;
      const remaining = maxChars - used;
      if (remaining <= 0) break;
      const clipped = block.length > remaining ? block.slice(0, remaining) + "…" : block;
      parts.push(clipped);
      sources.push(cid);
      used += clipped.length + 2;
    }
    return { context: parts.join("\n\n"), sources };
  }

  /**
   * Parse the FAQ concept (questions.md) into individual question/answer pairs.
   * Cached. Returns [{q, a}]. This lets us match a visitor's question directly
   * against curated, authoritative answers.
   */
  _faqPairs() {
    if (this._faq) return this._faq;
    const pairs = [];
    const entry = this.files["questions.md"];
    if (entry) {
      const body = String(entry.body || entry.raw || "");
      const re = /\*\*Q:\s*([\s\S]+?)\*\*\s*\n\s*A:\s*([\s\S]*?)(?=\n\s*\*\*Q:|\n##\s|$)/g;
      let m;
      while ((m = re.exec(body))) {
        const q = m[1].replace(/\s+/g, " ").trim();
        const a = m[2].replace(/\s+/g, " ").trim();
        if (q && a) pairs.push({ q, a });
      }
    }
    this._faq = pairs;
    return pairs;
  }

  /**
   * OKF-native retrieval: select only the concepts relevant to the query using
   * OKF structure (title/description/tags/concept-id scoring) plus curated FAQ
   * answers, and return a compact context block — NOT the whole bundle. This is
   * what lets the assistant scale past the LLM's context window.
   * @returns {{context:string, sources:string[]}}
   */
  retrieveContext(query, topK = 4, maxChars = 4000) {
    this._buildSearchIndex();
    const qTokens = new Set(tokenize(query));
    const parts = [];
    const sources = [];
    let used = 0;
    const push = (heading, text, sourceId) => {
      if (!text) return;
      const remaining = maxChars - used;
      if (remaining <= 0) return;
      const block = `${heading}\n${text}`;
      const clipped = block.length > remaining ? block.slice(0, remaining) + "…" : block;
      parts.push(clipped);
      if (sourceId && !sources.includes(sourceId)) sources.push(sourceId);
      used += clipped.length + 2;
    };

    // 1. Curated FAQ answers whose question overlaps the visitor's question.
    const faq = [];
    for (const pair of this._faqPairs()) {
      const pt = new Set(tokenize(pair.q));
      if (!pt.size) continue;
      let overlap = 0;
      for (const t of qTokens) if (pt.has(t)) overlap++;
      const ratio = overlap / Math.max(1, Math.min(qTokens.size, pt.size));
      if (overlap >= 2 || ratio >= 0.5) faq.push({ pair, overlap, ratio });
    }
    faq.sort((a, z) => z.ratio - a.ratio || z.overlap - a.overlap);
    if (faq.length) {
      const lines = faq.slice(0, 3).map((f) => `Q: ${f.pair.q}\nA: ${f.pair.a}`);
      push("## Frequently Asked Questions (curated answers)", lines.join("\n\n"), "questions");
    }

    // 2. Top concepts by OKF metadata-weighted score.
    const idx = this._searchIndex;
    for (const hit of this.search(query, topK)) {
      if (hit.concept_id === "questions") continue; // already covered by FAQ block
      const i = idx.ids.indexOf(hit.concept_id);
      const m = idx.meta[i] || {};
      const body = String(idx.bodies[i] || "").replace(/\s+/g, " ").trim();
      const tagLine = m.tags ? ` — tags: ${m.tags}` : "";
      const typeLine = m.type ? ` [${m.type}]` : "";
      push(`## ${hit.title}${typeLine}${tagLine}`, body, hit.concept_id);
    }

    return { context: parts.join("\n\n"), sources };
  }

  _buildSearchIndex() {
    if (this._searchIndex) return;
    const ids = [];
    const docs = [];
    const bodies = [];
    const meta = [];
    const df = new Map();
    for (const cid of this.conceptIds()) {
      const entry = this.files[cid + ".md"];
      const fm = entry.frontmatter || {};
      const body = entry.body || entry.raw || "";
      const tags = Array.isArray(fm.tags) ? fm.tags.join(" ") : String(fm.tags || "");
      // OKF metadata fields are scored separately from the body: a match in the
      // title, tags, or concept-id path is a much stronger signal of relevance
      // than the same word buried in prose.
      const titleTerms = new Set(tokenize(fm.title || ""));
      const descTerms = new Set(tokenize(fm.description || ""));
      const tagTerms = new Set(tokenize(tags));
      // Concept-id path tokens (e.g. "skills/artificial-intelligence" ->
      // skills, artificial, intelligence) so category words match their folder.
      const pathTerms = new Set(tokenize(cid.replace(/[\/_-]+/g, " ")));
      const bodyTf = tokenizeCounts(body, 1, new Map());
      docs.push({ titleTerms, descTerms, tagTerms, pathTerms, bodyTf });
      ids.push(cid);
      bodies.push(body);
      meta.push({ title: fm.title || cid, type: fm.type || "", tags });
      const seen = new Set([
        ...titleTerms, ...descTerms, ...tagTerms, ...pathTerms, ...bodyTf.keys(),
      ]);
      for (const t of seen) df.set(t, (df.get(t) || 0) + 1);
    }
    // IDF downweights ubiquitous terms (e.g. the author's own name that appears
    // in every concept), so identity queries rank concise/relevant pages higher.
    const N = ids.length || 1;
    const idf = new Map();
    for (const [t, d] of df) idf.set(t, Math.log(1 + N / d));
    this._searchIndex = { ids, docs, bodies, meta, idf };
  }

  _snippet(body, queryTerms, radius = 220) {
    const text = String(body || "").replace(/\s+/g, " ").trim();
    if (!text) return "";
    const lower = text.toLowerCase();
    let at = -1;
    for (const t of queryTerms) {
      const p = lower.indexOf(t);
      if (p !== -1 && (at === -1 || p < at)) at = p;
    }
    if (at === -1) return text.slice(0, radius * 2);
    const start = Math.max(0, at - radius);
    const end = Math.min(text.length, at + radius);
    return (start > 0 ? "…" : "") + text.slice(start, end).trim() + (end < text.length ? "…" : "");
  }

  /** Execute a tool call by name and return a string result (mirrors tools.dispatch). */
  dispatch(name, args, maxChars) {
    try {
      switch (name) {
        case "read_index":
          return this.readIndex(args?.dir_path ?? "");
        case "read_concept":
          return this.readConcept(args.concept_id, maxChars);
        case "read_metadata":
          return JSON.stringify(this.readMetadata(args.concept_id));
        case "metadata_facets":
          return JSON.stringify(this.metadataFacets());
        case "find_concepts":
          return JSON.stringify(this.findConcepts(args?.filters || {}));
        case "read_section":
          return this.readSection(args.concept_id, args.heading);
        default:
          return `ERROR: unknown tool '${name}'`;
      }
    } catch (e) {
      return `ERROR: ${e.message}`;
    }
  }
}
