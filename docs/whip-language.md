---
id: whip-language
title: Whip Script — Ngôn Ngữ Lập Trình Cho Video
sidebar_label: 🧬 Whip Script
sidebar_position: 7
---

# Whip Script — Ngôn Ngữ Lập Trình Cho Video

> **Video là medium. Code là ngôn ngữ.** Whip Script biến ý đồ editorial thành chương trình — input là code, output là video. Semantic như Elixir: pattern matching trên nội dung, pipeline operator, supervisor cho render, actor model cho từng segment.

---

## Tại Sao Cần Một Ngôn Ngữ Lập Trình?

Mọi tool hiện tại (Remotion, MoviePy, FFmpeg, CapCut) giải quyết **thao tác kỹ thuật** — crop, scale, encode. Không ai giải quyết **ý đồ semantic**.

```
Hiện tại (Remotion, FFmpeg, MoviePy):
  "Scale từ 1.0 đến 1.15 trong 0.12s, ease expo-out"
  → Developer phải tự dịch: "đây là chỗ tôi muốn nhấn mạnh"
  → Không có concept "nhấn mạnh" trong tool

Whip Script:
  behavior :punch_in when energy > 0.8 and gesture == "pointing"
  → Machine hiểu: nhấn mạnh là gì, khi nào áp dụng, cường độ bao nhiêu
  → Nội dung thay đổi → behavior tự adapt
```

**Ngôn ngữ lập trình cho video = nói với máy "video này cần thể hiện ý gì" thay vì "frame thứ 315 trông như này".**

---

## Tại Sao Elixir — Không Phải Python?

Elixir "thông minh" không phải vì syntax — mà vì **triết lý thiết kế** phù hợp tự nhiên với video pipeline:

| Triết lý Elixir | Áp dụng trong Whip Script |
|---|---|
| Actor model (mỗi process isolated, lightweight) | Mỗi TemporalSpan xử lý độc lập, crash 1 không ảnh hưởng cái khác |
| Supervisor trees (fault-tolerant restart) | Render pipeline không crash toàn bộ nếu 1 segment fail |
| Pattern matching trên data | Match trên semantic content (energy, gesture, keywords) — không phải timestamp |
| `\|>` pipe operator | Video pipeline tự nhiên: source → analyze → edit → render |
| Immutable data | OntologyGraph là append-only, không mutate history |
| GenServer (stateful process) | Stateful decoder / encoder state |
| Hot code reload | Preview reload mà không re-render toàn bộ |
| Preemptive scheduling | Render worker không block UI thread |
| Distributed multi-node | Parallel render trên nhiều worker / cloud node |
| Binary pattern matching | Parse binary container (MP4 box, MPEG-TS) |

**Python = script chạy một lần. Elixir = system chạy mãi.** Whip Script hướng đến system-level thinking: fault-tolerant, concurrent, long-running.

So sánh với những gì tồn tại:
- **Remotion**: React JSX → video. Tốt cho generative content, nhưng frame-level abstraction, không semantic.
- **Manim**: Python → animation. Tốt cho toán học, không có video understanding.
- **MoviePy**: Python → video manipulation. Numpy arrays, không semantic.
- **FFmpeg filtergraph**: DSL tốt nhất hiện tại nhưng technical-only, không có "ý đồ".

**Không tool nào có semantic pattern matching.** Đó là gap Whip Script lấp đầy.

---

## Whip Script — Language Spec v0.1

### Tổng quan Syntax

```whip
defproject :viral_clip do
  source "interview.mp4"
  format :mp4_9x16
  fps    30
  style  creator(:phong_editorial)

  pipeline do
    analyze(:audio, :visual)
    |> cut_silence(min: 0.3)
    |> reframe(:portrait, track: :face_center)
    |> behaviors(from: :ontology_graph)
    |> compose(captions: :auto, music: "bg.mp3")
    |> render(preset: :h264_fast)
  end
end
```

### Pattern Matching Trên Nội Dung — Khác Biệt Cốt Lõi

Match không phải trên timestamp hay frame index — match trên **ý nghĩa** của đoạn video:

```whip
# on_segment: áp dụng cho mỗi TemporalSpan trong OntologyGraph
on_segment match do

  # Cross-modal: audio energy cao VÀ đang chỉ tay → punch in mạnh
  %{audio: %{energy: e, pace: p}, visual: %{gesture: "pointing"}}
    when e > 0.8 and p > 3.5 ->
      behavior :punch_in, intensity: 1.18, ease: :expo_out
      behavior :caption_highlight, weight: 900, rgb_split: true

  # Keyword anchor: từ quan trọng xuất hiện → zoom + caption pop
  %{audio: %{keywords: kw, energy: e}}
    when "quan trọng" in kw or "phải biết" in kw ->
      behavior :zoom_word, word: match_keyword, scale: 1.15
      behavior :caption_pop, duration: 0.8

  # Biểu cảm emphatic + giọng bình tĩnh → gentle build
  %{visual: %{expression: "emphatic"}, audio: %{tone: "calm"}} ->
      behavior :slow_zoom, scale: 1.06, duration: :span
      behavior :caption_calm, pack: :clean

  # Silence → cut semantic (không phải frame cut)
  %{silence: s} when s > 0.4 ->
      cut()

  # Default → pass through, giữ baseline style
  _ ->
      pass()
end
```

### Pipeline Operator — Video Như Data Flow

```whip
# Mỗi stage nhận và trả TemporalGraph
pipeline :podcast_to_viral do
  source("raw_interview.mp4")              # Asset → TemporalGraph
  |> analyze(:whisper_onnx, :mediapipe)    # Graph + Word[] + FaceEvent[]
  |> filter(energy: :high, top_n: 3)       # Lấy top 3 high-energy spans
  |> cut_silence(threshold: 0.3)           # Loại dead air
  |> reframe(:portrait)                    # 16:9 → 9:16 với face tracking
  |> behaviors(style: creator(:phong))     # Apply creator style graph
  |> compose(                              # Thêm các layer
       captions: [style: :loud, track: :speaker],
       music:    [src: "bg.mp3", duck: :auto],
       overlay:  [logo: "logo.svg", anchor: :bottom_right]
     )
  |> render(format: :mp4, out: "clip.mp4")
end
```

### defstyle — Module Style Tái Sử Dụng

```whip
# Như defmodule trong Elixir — define editorial style
defstyle :phong_editorial do
  cut_rhythm do
    offset    -0.08   # Cut 80ms trước beat, không phải đúng beat
    silence   0.3     # Loại dead air > 300ms
    pace      2.8     # Mục tiêu 2.8 cuts/giây
  end

  motion do
    zoom  1.10        # Subtle, không 1.2x
    ease  :expo_out
    drift 0.008       # Handheld drift nhẹ
  end

  captions do
    pack      :loud
    mode      :word   # Word-by-word timing
    weight    900
    threshold 0.72    # Energy threshold để highlight
  end

  energy_curve do
    build   0.28      # 28% đầu build up
    peak    0.65      # Peak ở 65% video
    release :gradual
  end
end

# Inherit và override
defstyle :phong_intense, extends: :phong_editorial do
  motion   zoom: 1.18           # Override: mạnh hơn
  captions pack: :bold_explosive
end
```

### defsupervise — Render Pipeline Fault-Tolerant

```whip
# Supervisor tree giống OTP — không crash toàn bộ nếu 1 stage fail
defsupervise :render_pipeline do
  strategy  :rest_for_one   # Restart từ stage fail trở đi, giữ stage trước

  workers [
    {Decoder,   asset: "interview.mp4", format: :h264},
    {Analyzer,  audio: :whisper_onnx, visual: :mediapipe},
    {Processor, behaviors: :active_behaviors},
    {Encoder,   format: :h264, preset: :fast, crf: 23},
    {Muxer,     container: :mp4, audio: :aac}
  ]

  on_fail    :retry
  max_retry  3
  checkpoint :per_segment    # Resume từ segment cuối nếu crash
  timeout    300_000         # 5 phút timeout toàn pipeline
end
```

### Parallel Analysis — Giống Task.async

```whip
# Audio và visual analyze song song, merge vào 1 OntologyGraph
defanalyze :full_ingestion do
  parallel do
    audio    :whisper_onnx, model: :base, language: :vi
    visual   :mediapipe, tasks: [:face, :gesture, :pose]
    acoustic :web_audio_api, resolution: 10   # ms
  end
  |> aggregate(:temporal_spans)              # Merge → TemporalNode[]
  |> synthesize(:claude_haiku, text_only: true)
  |> update_style_graph(creator: :current_user)
end
```

### Hot Reload Preview

```whip
# Thay đổi behavior/style → preview ngay, không re-ingest
defwatch :live_preview do
  on_change [:behaviors, :style, :captions] ->
    recompile(:affected_segments)
    |> preview(:timeline_scrubber)

  on_change [:cut, :trim] ->
    recompile(:from_change_point)
    |> preview(:timeline_scrubber)
end
```

---

## Whip Script Là "API Cho Video"

Khi chạy headless (không UI), Whip Script trở thành **video API**:

```bash
# CLI
whip run viral_clip.ws --input interview.mp4 --out clips/
whip run --batch "inputs/*.mp4" --script viral.ws
whip serve --port 4000   # HTTP API mode
```

```http
# HTTP API — Whip Script over REST
POST /api/run
Content-Type: application/json

{
  "script": "defproject :viral_short do ...",
  "inputs": { "source": "s3://bucket/interview.mp4" },
  "outputs": { "destination": "s3://bucket/out/" }
}
```

```
# Agent gọi qua MCP
whip.run_script(script: "...", inputs: {...})
→ { jobId, status, outputs: [...] }
```

**Mọi AI agent muốn produce video đều có thể generate Whip Script và gọi runtime.** Không ai phải tự build video engine. Whip là "Stripe cho video" — infrastructure layer mà mọi người xây trên đó.

---

## So Sánh Với Những Gì Tồn Tại

| Tool | Input | Semantic? | Pattern match trên nội dung? | Pipeline? | Headless? |
|---|---|---|---|---|---|
| **Whip Script** | Code | ✅ sâu | ✅ có | ✅ native | ✅ |
| Remotion | React JSX | ❌ frame-only | ❌ | ✅ | ✅ (Chromium) |
| Manim | Python | ❌ math only | ❌ | Partial | ✅ |
| MoviePy | Python | ❌ pixel level | ❌ | ❌ | ✅ |
| FFmpeg filtergraph | DSL | ❌ technical | ❌ | ✅ | ✅ |
| MLT XML | XML | ❌ | ❌ | ✅ | ✅ |

**Gap không ai fill:** Không tool nào match trên "zoom khi người đang nói từ quan trọng và chỉ tay". Đó chính xác là những gì Whip Script làm.

---

## Runtime Architecture

```
Whip Script source
        │ parse
        ▼
    AST (Abstract Syntax Tree)
        │ typecheck + semantic validate
        ▼
    Execution Plan (DAG)
        │
        ├─── Ingestion DAG  → Ingestion Worker (MediaPipe + Whisper)
        │         ↓ OntologyGraph
        ├─── Behavior DAG   → AI Worker (Claude Haiku synthesis)
        │         ↓ BehaviorNode[]
        ├─── Compile DAG    → State Worker (IntentCompiler)
        │         ↓ RenderInstruction[]
        └─── Render DAG     → Render Worker (WebGPU / headless)
                  ↓ mp4
```

Supervisor tree bao quanh toàn bộ DAG. Mỗi stage là actor độc lập. Crash 1 stage → restart từ stage đó, không mất progress.

---

## Roadmap Whip Script

| Phase | Milestone | Nội dung |
|---|---|---|
| **v0.1** | Script panel trong GUI | Viết script, thấy preview realtime |
| **v0.2** | CLI runner | `whip run` — headless render từ .ws file |
| **v0.3** | HTTP API | `POST /api/run` — async job queue |
| **v0.4** | Pattern matching | `on_segment match` với semantic predicates |
| **v0.5** | Parallel analysis | `parallel do` với isolated workers |
| **v1.0** | Supervisor trees | `defsupervise` — OTP-style restart |
| **v1.5** | Language server | IDE plugin: autocomplete, type check, semantic errors |
| **v2.0** | Standard library | Curated `defstyle` library từ cộng đồng creator |
| **v3.0** | Distributed runtime | Render phân tán trên nhiều node (creator góp idle GPU) |
