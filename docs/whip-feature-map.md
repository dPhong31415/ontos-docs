---
id: whip-feature-map
title: Feature Map — Tính năng ↔ UI ↔ Component ↔ Engine
sidebar_label: 🗺 Feature Map
sidebar_position: 6
---

# Feature Map — bản đồ liên kết hệ thống

> **Mục đích:** 1 bảng duy nhất map mỗi tính năng → vị trí UI → component → engine module → trạng thái.
> Đây là **index chống drift**: trước khi viết logic mới, tra bảng này để REUSE thay vì viết lại (xem nguyên tắc
> *systematic-reuse*). Cột **Trạng thái** phơi luôn dup/dead để dọn.
>
> **Quy tắc sống:** thêm/sửa tính năng → cập nhật 1 dòng ở đây CÙNG phiên. Doc lệch code = nợ kỹ thuật.
>
> Ký hiệu trạng thái: ✅ ổn · 🟡 dở/chưa xong · ♻️ TRÙNG (có bản tốt hơn) · 💀 CHẾT (0 caller) · 🧱 god-component.

## Bản đồ UI (vị trí tham chiếu cột "UI")
```
┌─ Topbar: WhipItButton · PerfHud(overlay) · Tamagotchi ────────────────┐
│ Left panel        │      Viewport (center)        │  Right panel       │
│  tabs:            │  SceneView + ViewportGizmo    │   tabs:            │
│  Media/Assets/    │  Transport (dưới viewport)    │   Properties/      │
│  Caption/Presets/ │                               │   Effects/Actions/ │
│  Graph            │                               │   Semantic         │
├───────────────────┴─ Timeline (đáy, full width) ──┴────────────────────┤
└─ Modals: StoryReview · StyleGraph · Export · Paywall ──────────────────┘
```

---

## C1 — Timeline & Editing (NLE core)
| Tính năng | Mục đích | UI | Component | Engine | TT |
|---|---|---|---|---|---|
| Multi-track timeline | Dựng/sắp clip nhiều track | Timeline (đáy) | `Timeline`, `TimelinePill` | `presets`, `audio` | ✅ |
| Transport / playback | Play/seek/playhead | Dưới viewport | `Transport` | render loop (App.tsx) + `audio` | ✅ |
| Viewport gizmo (transform) | Kéo scale/move/rotate trực tiếp | Viewport | `ViewportGizmo` | `compositor`, `interpolate` | ✅ |
| Clip properties | Chỉnh property/keyframe clip chọn | Right › Properties | `ClipPanel` | `interpolate` | ✅ |
| Compositor render | Vẽ frame (PixiJS) | Viewport canvas | — | `compositor` | 🟡 boot-lag: setProject dựng đồng loạt N video decoder |

## C2 — Media & Assets
| Tính năng | Mục đích | UI | Component | Engine | TT |
|---|---|---|---|---|---|
| Media pool import | Nạp file (FS handle, 0-copy), proxy, thumb | Left › Media | `MediaPool` | `assetHandles`, `assetStore`, `proxyTranscode`, `analyzeReference` | ✅ |
| Proxy 540p | Preview/scrub mượt video nặng | nền (badge %) | — | `proxyTranscode` | ✅ |
| Source preview | Xem nhanh asset trước khi kéo | Media card | `SourcePreview` | `audio` | ✅ |
| Shapes/assets | Chèn shape/text asset | Left › Assets | `AssetsPanel`, `Gallery` | — | ✅ |
| Cloud content (TwelveLabs) | Tìm video theo nghĩa (cloud) | `ContentView` | `ContentView` | `twelvelabs`, `sceneVlm` | 🟡 cloud — cân moat #2 |

## C3 — Captions
| Tính năng | Mục đích | UI | Component | Engine | TT |
|---|---|---|---|---|---|
| Auto-caption (tay) | Transcribe → caption clip | Left › Caption | `CaptionPanel` | `captionService` → **Deepgram cloud** + LLM; no-endpoint→demo | ⚠️ **CLOUD, có upload audio** — lệch moat #2 (privacy). Cân cho dùng Whisper local |
| Caption list edit | Sửa lời/timing | Left › Caption | `CaptionListEditor` | `captions` | ✅ |
| Caption style / packs | Style karaoke | Left › Caption | `CaptionStyle`, `CaptionBlockPanel`, `StylePicker` | `stylePacks`, `whipStyles` | ✅ |

## C4 — Behaviors · Effects · Presets
| Tính năng | Mục đích | UI | Component | Engine | TT |
|---|---|---|---|---|---|
| Behaviors (motion) | Anim compiled theo ngữ nghĩa | Right › Actions | `BehaviorPanel` | `behaviors`, `presets`, `prosody`, `semanticGraph` | ✅ |
| Effects (filters) | Blur/màu… | Right › Effects | `EffectPanel`, `EffectsPanel` | `effects` | ✅ |
| Presets browser | Thư viện preset motion | Left › Presets | `PresetBrowser`, `ParamControls` | `presets` | ✅ |
| Easing editor | Sửa đường cong ease | Properties | `EasingEditor`, `GraphPanel` | `ease` | ✅ |
| Text effects | Stagger/glyph reveal | Effects | `TextEffects` | `presets` | ✅ |

## C5 — Whip It (agentic auto-edit pipeline) 🧱
> Orchestrator hiện nằm TRONG `WhipItButton.tsx` (908 dòng, import 20+ engine) — cần rút ra engine thuần.
| Tính năng | Mục đích | UI | Component | Engine | TT |
|---|---|---|---|---|---|
| Whip It trigger + orchestration | Chạy cả pipeline 1 nút | Topbar nút Whip It | `WhipItButton` 🧱 | (điều phối) | 🟡 god-component |
| Transcribe (Whip It) | Lời → word-timestamps | nền | — | `captionService` **Deepgram cloud** → demo fallback | ✅ (Whisper local đã gỡ 16/06) |
| Ingest talking-head | Tách section ngữ nghĩa từ transcript | nền | — | `ingest` | ✅ |
| Editorial cut | Cắt redundancy/silence trên graph | nền | — | `editorialCut` (`editorialCutOnGraph` → `planEditorialCut`) | ✅ |
| MCP agent tools | Expose pipeline cho agent (moat #3) | scripts/mcp | `whip-mcp.mjs` | `editorialPipeline.runEditorial`, `scenarios.buildGadzhiTalkingHead` | ✅ (KHÔNG phải dead code) |
| Long footage index + realtime cut | Index 26′ + cắt scene lên timeline | nền + Timeline | — | `longFootageIndex` → `sceneCutSeek` | ✅ (16/06: dùng core chung) |
| **Scene-cut detection** | Tìm ranh giới cảnh (DaVinci-style) | nền | — | `sceneCutCore` (THUẦN) · frame-source: `analyzeReference` rVFC \| `sceneCutSeek` seek 2-pha | ✅ HỢP NHẤT 1 thuật toán (16/06); `detectHardCuts` xoá; selftest:scenecut 8/8 |
| Broll deep-index + match | Index broll + gán theo nghĩa | nền | — | `brollDeepIndex`, `brollIntent`, `brollMatch`, `temporalGround` | ♻️ 4 matcher phân mảnh |
| Match assignment (tối ưu) | Gán beat↔scene tối ưu (DP/greedy) | nền | — | `matchAssignment`, `scriptMatch` | ✅ |
| Story plan | Lên sườn narrative + role | review | `StoryReviewModal`, `BuildStoryBanner` | `storyPlan`, `footageStory`, `director`, `whipGaps` | 🟡 3 story-step builder cùng sống |
| Assembly | Ghép spine speech/montage | nền | — | `director.planAssembly` | ✅ · `scenarios` 💀 |
| Pipeline trace | Log realtime cho user | overlay | `WhipTrace`, `CutVideoPreview` | `pipelineLog` | ✅ |

## C6 — Style Graph (creator lock-in, moat #4)
| Tính năng | Mục đích | UI | Component | Engine | TT |
|---|---|---|---|---|---|
| Analyze mẫu | Đọc fingerprint editing từ video mẫu | StyleGraph modal | `StyleGraphModal` | `analyzeReference`, `sceneVlm` | ✅ |
| Apply style | Áp recipe lên project | Whip It setup | (WhipItButton) | `styleGraphApply`, `whipStyles` | ✅ |

## C7 — Semantic Graph view (moat #1)
| Tính năng | Mục đích | UI | Component | Engine | TT |
|---|---|---|---|---|---|
| Graph inspector | Xem graph ngữ nghĩa của media | Right › Semantic | `GraphInspector` | `semanticGraph` | ✅ |
| Scene view | Xem scene/shot | Viewport mode | `SceneView` | `semanticGraph` | ✅ |
| Energy/property graph | Đường cong giá trị theo thời gian | Left › Graph | `GraphPanel` | `ease` | ✅ |

## C8 — Export · Perf · Debug · Monetization
| Tính năng | Mục đích | UI | Component | Engine | TT |
|---|---|---|---|---|---|
| Export | Render H.264 (WebCodecs) | Export modal | `ExportModal` | `export` | ✅ |
| Perf HUD | Đo fps always-on (moat #5) | overlay | `PerfHud` | `perfMonitor` | ✅ |
| Debug panel | Observe/log/OPFS | Debug | `DebugPanel` | `observe`, `pipelineLog`, `assetStore` | ✅ |
| Paywall / license | Pro gating | modal | `Paywall`, `AdminDashboard` | `license`, `cloud` | ✅ |
| Mascot | HOJO mascot (sync jobradar) | overlay | `Tamagotchi` | — | ✅ |

---

## Đã làm (16/06/2026)
- ✅ **Gỡ Whisper local** (`whisperLocal.ts` + `whisperWorker.ts` xoá; WhipItButton transcribe → CLOUD Deepgram + demo fallback). Bỏ moat local-first transcribe. tsc 0, selftest 13/13.
- ✅ **Hợp nhất scene-cut (P1)**: `sceneCutCore.ts` (THUẦN, Pha B/C/D + classify + camera) + `histogram.ts` (helper chung). 2 frame-source: `analyzeReference` rVFC (mẫu/clip ngắn) + `sceneCutSeek` seek 2-pha coarse+refine (footage dài). Xoá `detectHardCuts.ts` (bản dở seek-4s) + dup histOf/histDiff. selftest:scenecut 8/8, tsc 0, mcp 13/13. ⏳ Phong cần test footage thật trên browser (seek timing).

## Nợ kỹ thuật rút ra (CẢNH BÁO audit cũ 15/06 sai phần "dead code")
- ⚠️ **KHÔNG có code chết** như audit 15/06 nói. `runEditorial` + `scenarios.ts` (`buildGadzhiTalkingHead`) = **MCP agent tool** (scripts/whip-mcp.mjs + run-real-sample.ts — moat #3); `planEditorialCut` = `editorialCutOnGraph` gọi cùng file. Audit cũ chỉ grep `src/`, sót `scripts/`+MCP build → suýt xoá nhầm (selftest cứu). **Bài học: dead-code check phải grep cả `scripts/` + `api/` + `mcp/`.**
- ♻️ **Hợp nhất scene-cut:** tách `sceneCutCore` (Pha B/C/D + classify) thuần; frame-source = rVFC playback (clip ngắn) | WebCodecs decode (footage dài). Xoá `detectHardCuts.ts`. Gom `histOf/histDiff` → `histogram.ts`.
- ♻️ **Frame-sampling:** gom 6 chỗ tự dựng `<video>+canvas` về `frameGrab.ts` (đã có) / frame-source layer.
- ♻️ **Match:** hợp nhất 4 matcher broll; chuẩn hoá 3 story-step builder còn 1 + adapter.
- 🧱 **Rút orchestration khỏi `WhipItButton`** (908 dòng) về engine thuần testable.
