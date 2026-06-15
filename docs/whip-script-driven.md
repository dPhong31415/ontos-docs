# Whip — Script-Driven / Footage-Selection Mode

> Design doc. Status: **proposed** (15/06/2026). Trigger: test brief @kittyboyandfriends "Scrunch" —
> 26′ raw vertical footage (no speech) + script 9 nhịp cho sẵn + reference YouTube short rescue.
> Phơi bày: pipeline hiện tại (`whip-auto-viral-pipeline.md`) giả định **main = talking-head có transcript**.
> Job này shape khác → cần mode thứ 2. Đây là use-case "compile footage dài → arc có script", cực phổ biến
> với editor YouTube, và ép Whip nâng đúng **Moat #1 (semantic VISUAL temporal graph)**.

---

## 1. Hai shape input — vì sao cần mode mới

| | **Talking-head mode** (hiện có) | **Script-driven mode** (doc này) |
|---|---|---|
| Spine | Transcript lời nói (Deepgram) | **Script tác giả cung cấp** (hoặc VO) |
| Cắt | Trim filler/silence trên talking-head | **Tuyển chọn** đoạn từ footage dài theo nghĩa |
| Footage | B-roll ngắn rời, lấp theo điều đang nói | 1 (hoặc N) file dài = **kho cảnh cần index + chọn** |
| Audio bed | Giọng nói gốc + nhạc | **VO (TTS/record) + nhạc**, footage thường mute |
| Ví dụ | Hormozi/Ali talking-head + b-roll | Rescue arc, travel montage, "day in my life", product story |

Gốc rễ khác biệt: talking-head coi *spine = transcript*. Script-driven coi *spine = script/VO*, footage là
**candidate pool cần SELECT**, không phải clip để trim. Cùng substrate semantic graph — chỉ đảo chiều luồng.

---

## 2. Pipeline (tái dùng tối đa primitive đã có)

```
Reference short ──▶ analyzeReference ──▶ StyleGraph (arc, nhịp, caption, look, nhạc)   [ĐÃ CÓ]
                                              │
Script 9 nhịp ───▶ ScriptBeat[]  ◀───────────┘ (style graph gợi ý nhịp/độ dài/tone)
   │                   │
   │                   ├─▶ VO synth (TTS)  ──▶ vo clip/beat ──▶ ĐỘ DÀI mỗi beat   [MỚI: TTS]
   │                   │
   ▼                   ▼
Footage 26′ ──▶ deepIndexBroll (dense frame VLM) ──▶ Scene[] {label,keywords,start,end}  [ĐÃ CÓ, mở rộng]
                                              │
ScriptBeat[] × Scene[] ──▶ matchBroll  ──▶ chọn 1–N đoạn footage / beat            [ĐÃ CÓ, đảo chiều]
                                              │
                                              ▼
              Assemble: footage theo VO timeline + caption(script) + look + nhạc + gen-card cho beat thiếu hình
```

### Mapping cụ thể về code hiện tại
- **Reference → StyleGraph**: `engine/analyzeReference.ts` — chạy nguyên si trên YouTube short. ✅
- **ScriptBeat[]**: cấu trúc MỚI, nhưng đồng dạng `SemanticSection` (`{start,end,label,type,footage}`).
  Khác biệt: `start/end` ban đầu CHƯA biết (chưa có VO) → fill sau khi synth VO. `footage` = hypothesis
  ("kitten one eye", "snuggle in lap", "vet nebulizer") trở thành **query** cho match.
- **Index footage**: `engine/brollDeepIndex.ts::deepIndexBroll` đã làm dense-frame VLM (7–11s/broll sau optimize
  15/06). Trên 1 file 26′ → cần **cap + sampling thưa hơn** (vd 1 frame/4–6s = ~260–390 frame → quá nhiều VLM
  call). Giải: **2 pass** — (a) coarse 1 frame/15s để phân vùng chủ đề, (b) fine chỉ ở vùng beat cần. Xem §4.
- **Match beat → scene**: `engine/brollMatch.ts::matchBroll(intents, scenes)` — `InsertionIntent` đã có
  `query[]/concept/priority`. ScriptBeat → InsertionIntent (srcStart/End = vị trí trên VO timeline). ✅ đảo chiều:
  hiện match "intent talking-head → b-roll ngắn"; giờ "beat script → đoạn trong footage dài". Cùng hàm.
- **Gen-card cho beat thiếu hình**: feature vừa build (15/06, `GenSuggestionPanel` + `api/gen-image`). ✅
- **Caption/look/nhạc**: từ StyleGraph (`captionMeasured`, `look`, `audio`). ✅

### GAP phải xây mới
1. **TTS / VO** — Whip CHƯA có (xác nhận: không `speechSynthesis`/api tts). v0 = `window.speechSynthesis`
   (free, local, Moat #2 — KHÔNG rời máy) để ra timing nháp; v1 = giọng chất lượng (BytePlus TTS nếu có, else
   ElevenLabs qua edge — đánh đổi Moat #2, chỉ audio narration ko phải video gốc → chấp nhận). VO clip set độ dài beat.
2. **Script ingest UI** — ô nhập/paste 9 nhịp (hoặc auto từ brief). Mỗi nhịp = 1 ScriptBeat editable.
3. **Long-footage 2-pass index** — coarse→fine để không đốt 300+ VLM call cho 26′ (§4).
4. **"Moment quality" scoring** — brief Quick Tip: eye-contact/reaction/intimate khớp tốt nhất. VLM label thêm
   cờ `eyeContact|reaction|intimate|funny` → match ưu tiên (đây là "storytelling instinct" được chấm điểm).

---

## 3. Vì sao đây là MOAT, không phải clone CapCut
- CapCut/Premiere: editor phải tự xem 26′, tự log, tự kéo. Descript: transcript-first → vô dụng khi footage ko thoại.
- Whip: **semantic VISUAL temporal graph** đọc 26′ → biết "đoạn nào mèo nhìn camera / cuộn trong lòng / thở khó ở vet"
  → map thẳng vào arc script. Đây đúng note moat: *gap lớn nhất = visual understanding*. Job Scrunch = bằng chứng sống.
- Đòn bẩy: cùng script + cùng footage, **style-graph khác** (đổi reference) → ra bản dựng khác phong cách, 1 click.

---

## 4. Long-footage indexing — chi phí & cách (Moat #5: ko treo tab)
- 26′ @ 1 frame/5s = 312 frame VLM → quá đắt/chậm. **2-pass:**
  - **Pass A (coarse map):** 1 frame/15s (~104 frame) → cluster theo nhãn → phân vùng chủ đề thô
    (shelter / home-snuggle / sick / vet / recovery). Rẻ, cho "bản đồ" 26′.
  - **Pass B (fine, demand-driven):** chỉ index dày (1 frame/2s) trong các vùng mà ScriptBeat cần
    (giống `MAX_GROUND_PER_RUN` budget cho b-roll) → fine chỉ ~5–9 vùng ngắn.
- Decode gate + CONCURRENCY≤2 như hiện tại. Cache scene theo `sceneSig` (đã có) → re-run không index lại.
- Đo bằng `perfMonitor` + spike-guard; back-off nếu mem trend tăng.

---

## 5. Build plan (phân pha — làm chuẩn 1 lần, không vá lẻ)
- **P0 — Mode skeleton + Script ingest:** toggle "Talking-head | Script-driven" ở Whip It; UI nhập ScriptBeat[];
  store `scriptBeats` + `whipMode2`. (Không đụng talking-head path.)
- **P1 — Long-footage 2-pass index:** mở rộng `deepIndexBroll` → `indexLongFootage(assetId, {coarse, fine})`.
  Output Scene[] vào cùng store như b-roll scenes.
- **P2 — Beat↔scene match + assemble (no VO):** ScriptBeat→InsertionIntent→`matchBroll`→đặt đoạn footage lên main
  track theo thứ tự arc; caption = text script; độ dài beat tạm = ước lượng đọc (≈ wordcount/2.5 wps).
- **P3 — VO:** speechSynthesis v0 → VO clip set độ dài beat thật → re-time footage. (v1 giọng đẹp sau.)
- **P4 — Moment-quality scoring + gen-card:** VLM cờ eyeContact/reaction/intimate → ưu tiên match; beat thiếu hình → gen-card.
- **P5 — Music/look polish** từ StyleGraph.

MVP demo Scrunch = P0→P3 (đủ ra bản 60–120s có nghĩa). P4–P5 nâng chất lượng "được chấm điểm".

---

## 6. Rủi ro / quyết định mở
- VO chất lượng vs Moat #2 (local-first): v0 local speechSynthesis giữ moat; giọng đẹp cần cloud → flag khi tới P3.
- Aspect: footage đã 9:16 → khỏi reframe (job khác có thể cần auto-reframe — ngoài scope doc này).
- Match sai đoạn (VLM nhãn lệch) → cần UX sửa nhanh: click beat → thấy 2–3 candidate, swap. (P2 nên có sẵn.)
- 26′/6GB: import qua File System Access handle (Moat #2, đã có `importFromHandle`) — KHÔNG copy OPFS.
