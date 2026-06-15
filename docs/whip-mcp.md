---
id: whip-mcp
title: MCP & Agent Skills
sidebar_label: 🤖 MCP & Agent
sidebar_position: 8
---

# MCP & Agent Skills

> Cái làm Whip "agentic": agent không *gợi ý* — agent *thực thi* trực tiếp trên semantic layer.
> Không phải "AI click thay user". Là "AI hiểu video và ra quyết định editorial như editor người thật".

---

## Kiến Trúc Agent — SOTA 2026 (Anthropic Multi-Agent Pattern)

```
┌─ MCP Server (SharedWorker — chạy trong browser) ──────────────────┐
│  Tất cả tab Whip connect vào cùng 1 MCP session                   │
│  Agent và user cùng nhìn 1 OntologyGraph, thay đổi realtime       │
│                                                                    │
│  Orchestrator Agent                                                │
│      │                                                             │
│      ├── Analyzer Agent                                            │
│      │     Input: OntologyGraph slice (typed JSON, minimal)        │
│      │     Tools: get_temporal_spans(), get_span_detail()          │
│      │     Output: semantic understanding — readable, reviewable   │
│      │                                                             │
│      ├── Editor Agent                                              │
│      │     Input: Analyzer output + Creator Style Graph            │
│      │     Output: BehaviorNode[] với editorial intents            │
│      │     Pattern: propose → evaluate → refine (self-iterate)     │
│      │                                                             │
│      └── Validator Agent                                           │
│            Input: BehaviorNode[] + project constraints             │
│            Output: approve / conflict flags / alternatives         │
└────────────────────────────────────────────────────────────────────┘
```

**Không RAG.** Agent dùng typed tools query OntologyGraph. Data là structured, relationships là explicit — không cần vector similarity. Theo Karpathy pattern: `project.whip` JSON fit trong 200K context window; typed tools expose slice cho large projects.

---

## Hai Chế Độ Chạy

```
┌─ Chế độ A: Browser (live editing) ─────────────────────────────┐
│  Whip đang mở → MCP server chạy trong SharedWorker             │
│  Claude Code / agent attach qua stdio hoặc WebSocket           │
│  → agent và user cùng nhìn 1 OntologyGraph, thay đổi realtime  │
└─────────────────────────────────────────────────────────────────┘

┌─ Chế độ B: Headless (batch / CI) ──────────────────────────────┐
│  Engine chạy không UI (Node + headless WebCodecs/canvas)       │
│  load .whip → semantic actions → render() → mp4               │
│  → "ingest + edit 100 video từ 100 transcript" tự động        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tool Surface — Semantic Actions (Không Phải UI Operations)

### Tầng 1 — Summary (bắt đầu mọi agent session)

```
whip.get_project_summary()
  → { duration, spanCount, totalWords, hasVisualAnalysis,
      creatorStyleId, ingestionStatus }
  → Agent bắt đầu từ đây, không nhận full JSON

whip.get_ingestion_status(assetId)
  → { audio: "done" | "processing", visual: "done" | "processing",
      wordsCount, visualEventsCount, behaviorsGenerated }
```

### Tầng 2 — Semantic Layer (agent drill down)

```
whip.get_temporal_spans({ range?, minEnergy?, type?, speaker? })
  → TemporalSpan[] với audioSummary + visualSummary
  → KHÔNG trả raw Word[] hay FaceEvent[] — chỉ summary
  → { id, label, start, end, energy,
      audioSummary: { pace, tone, keywords, dominantSpeaker },
      visualSummary: { gesture, expression, motionIntensity } }

whip.get_span_detail(spanId)
  → words[], visualEvents[], existingBehaviors[], neighborSpans[]
  → Chỉ gọi khi cần detail — không bao giờ gọi trước get_temporal_spans()

whip.get_creator_style()
  → CreatorStyleGraph: { cutRhythm, motionSignature, captionVoice, energyCurve }
  → Agent dùng như prior khi synthesize behaviors
```

### Tầng 3 — Semantic Actions (agent thực thi)

```
whip.analyze_audio(assetId)
  → trigger Ingestion Worker (audio pipeline)
  → returns: { jobId } — async, poll get_ingestion_status()

whip.analyze_visual(assetId)
  → trigger Ingestion Worker (video pipeline: MediaPipe)
  → returns: { jobId }

whip.synthesize_behaviors(spanId, { creatorStyleId?, intent? })
  → Editor Agent chạy: read span → generate BehaviorNode[]
  → Agent self-iterate (propose → evaluate → refine)
  → returns: { behaviors: BehaviorNode[], confidence: 0–1 }

whip.cut_at_word(wordId)
  → semantic cut: mark words[wordId...].visible = false
  → propagate: update TemporalSpan, recompile active behaviors
  → KHÔNG nhận timestamp — word_id stable, cut-proof

whip.compile_render({ range? })
  → compute RenderInstruction[] từ active BehaviorNodes
  → returns: keyframe diff (không phải full state)

whip.apply_creator_style(creatorStyleId?)
  → calibrate tất cả BehaviorNodes theo Style Graph
  → auto-adjust: zoom intensity, ease profile, caption energy

whip.get_transcript(clipId)
  → { words: Word[], blocks: CaptionBlock[], speakers: Speaker[] }
  → Agent dùng để hiểu nội dung trước khi synthesize

whip.validate_behaviors(behaviorIds[])
  → Validator Agent: check conflicts, timing overlaps, style consistency
  → returns: { valid: bool, issues: [], suggestions: [] }
```

### Tầng 4 — Asset & Composition Actions

```
whip.generate_asset({ description, style?, type: "raster"|"vector" })
  → Seedream 5.0 (raster) / Recraft (vector)
  → returns: { assetId, previewUrl }

whip.remove_background(assetId)
  → RMBG WebGPU (local, $0)
  → returns: { assetId }

whip.magic_mask(clipId, { x, y, frameT })
  → SAM2: segment + track
  → returns: { maskId }

whip.apply_composition(compositionBrief[])
  → apply CompositionBrief → create overlay clips với behaviors

whip.render({ range?, out, preset, watermark? })
  → WebCodecs export → mp4
  → returns: { outputPath, duration, size }
```

---

## Agent Skills — Composite Workflows

Skills = compose nhiều semantic actions. Agent không rải lệnh đơn lẻ — dùng skill.

### Skills Short-Form Viral

| Skill | Làm gì |
|---|---|
| `whip_it_viral(recipe?)` | Full pipeline: analyze → synthesize behaviors → apply style → compositions |
| `auto_cut_silence()` | VAD → cut_at_word() loại dead air |
| `auto_reframe_916()` | MediaPipe face track → reframe 16:9 → 9:16 |
| `beat_sync(musicClipId)` | DSP beat map → anchor caption/zoom behaviors to beats |
| `auto_duck(musicClipId)` | VAD + Web Audio → music automation keyframes |

### Skills Production Complex

| Skill | Làm gì |
|---|---|
| `analyze_and_segment()` | analyze_audio + analyze_visual → synthesize_behaviors cho toàn clip |
| `apply_look(recipeId)` | apply color/effects preset từ Creator Style Graph |
| `callout_tracker(clipId, x, y)` | magic_mask → pin callout overlay to mask |
| `virtual_background(clipId)` | magic_mask(speaker) → replace_background |
| `multi_clip_export(clips[])` | batch render N clips headless |

---

## Progressive Disclosure — Không Dump Full JSON

```
Agent Session điển hình:

1. get_project_summary()
   → { duration: 1842s, spanCount: 12, creatorStyleId: "phong_editorial" }

2. get_temporal_spans({ minEnergy: 0.7 })
   → 4 high-energy spans với summary
   → Agent hiểu structure mà không nhận 50MB OntologyGraph

3. get_span_detail("span_003")
   → words[], visualEvents[] cho span cụ thể
   → Chỉ khi cần, chỉ span đó

4. synthesize_behaviors("span_003", { creatorStyleId: "phong_editorial" })
   → BehaviorNode[] tailored theo creator style

5. validate_behaviors([...])
   → conflicts? suggestions?

6. compile_render({ range: [span_003.start, span_003.end] })
   → keyframe diff

7. render({ out: "clip_003.mp4" })
```

Agent không bao giờ nhận raw `FaceEvent[]` (30fps × video duration = massive). Nhận **aggregated summaries** tại tầng TemporalSpan.

---

## Phân Tầng: Client vs Server (Ontos)

```
CLIENT — free, local, realtime              SERVER (Ontos) — async, có credit
────────────────────────────────            ──────────────────────────────────
analyze_visual (MediaPipe local)            auto_captions (Deepgram API)
analyze_audio (Whisper ONNX local)          whip_it full pipeline (LLM heavy)
beat_sync (DSP local)                       render_cloud (4K GPU farm)
auto_duck (Web Audio local)                 translate_captions (LLM)
remove_background (RMBG WebGPU)             magic_mask_batch (SAM2 server)
compile_render (compute, no inference)      generate_asset (Seedream/Recraft)
apply_creator_style (Style Graph local)     collab_sync (Elixir/Phoenix)
```

Ranh giới này đảm bảo UI luôn 60fps. Skill nhẹ/realtime → client (free). Skill nặng/AI cost → Ontos action (credit + audit).

---

## Whip Là "Video API" Cho Toàn Cầu

MCP không chỉ là giao diện cho Claude. Nó là **standard interface cho mọi AI agent muốn làm việc với video**.

```
Developer muốn build:
  "AI agent tự động edit podcast → viral clip"    → dùng Whip MCP
  "Marketing tool generate ad từ product video"  → dùng Whip MCP
  "Education tool tạo explainer video từ script" → dùng Whip MCP
  "News tool clip highlight từ press conference" → dùng Whip MCP

Tất cả: không phải build video engine từ đầu.
        Dùng Whip như "video OS", gọi semantic actions.
        Whip là "Stripe cho video" — infrastructure layer.
```

**Platform play:** Mỗi developer dùng Whip MCP → thêm data về editing patterns → Creator Style Graph aggregate pool lớn hơn → Moat 4 mạnh hơn → loop.

---

## Command Registry — Auto-Gen MCP Tools

```
command registry (Zod schema)
        │
        ├─→ TypeScript types     (GUI autocomplete)
        ├─→ JSON Schema          ──▶  MCP tool list (auto)
        ├─→ REST API             ──▶  HTTP endpoint (auto)
        └─→ Ontos Action         ──▶  credit-tracked workflow (auto)
```

Thêm 1 command → tự có MCP tool + REST endpoint + UI action. Không maintain 3 nơi. Cùng triết lý "1 schema → MCP + REST + UI" của Ontos platform.
