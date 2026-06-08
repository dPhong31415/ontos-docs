---
id: whip-onboarding
title: Onboarding & Landing (interactive)
sidebar_label: 🎓 Onboarding
sidebar_position: 16
---

# Whip — Landing SPA + Interactive Onboarding

> Landing kiểu Weavr (dark, hero + feature card isometric) → vào app → **onboarding tương tác**:
> mock UI + chữ to + infographic chuột line-mỏng, **highlight con lăn nhấp nháy tím**, user PHẢI
> làm đúng thao tác mới `next`. Phases: Navigation → Edit → **Caption** (killer #1) → **Whip It** (killer #2) → Animate → Export.
>
> Liên quan: [GTM & Launch](./whip-gtm-launch) · [Tính năng](./whip-features) · [AI Pipelines](./whip-auto-viral-pipeline)

---

## 1. Landing SPA (đã có `landing/index.html` — nâng cấp theo Weavr)

Style tham khảo (ảnh Weavr): nền đen, hero chữ rất to, dòng metric (10K+ / 250+ / 1.2M), **hàng 6 card feature** mỗi card 1 **infographic isometric line-art** + nhãn (Ideate/Design/…).

Map cho Whip — 6 card = 6 bước workflow:
| Card | Nhãn | Infographic |
|---|---|---|
| 1 | **Import** | clip kéo vào |
| 2 | **Caption** | chữ viral word-by-word ← killer feature |
| 3 | **Whip It** | 1 nút → AI editorial ← WOW moment #2 |
| 4 | **Animate** | zoom punch tự động theo lời nói |
| 5 | **Effects** | glow / glitch / cinematic |
| 6 | **Export** | file mp4 local, không upload |

- Hero: *"Boring talking-head → editorial reel trong 5 phút. Không cần AE. Không cần design skill."* + nút **Try free** → `/app` (Clerk sign-in).
- Sub-hero: *"Auto-caption • Auto punch-in zoom • Whip It AI editorial • Export local không upload"*
- Metric thật khi có: số video tạo, creators, exports.
- Tech: giữ `landing/index.html` static (đã dựng), thêm 6 card + isometric SVG line-art. Có thể nâng lên Next.js sau nếu cần blog/SEO.

---

## 2. Onboarding tương tác — kiến trúc

**Mục tiêu:** user mới KHÔNG xem video dài; họ **làm thật từng thao tác** trên 1 mini-project mock, mỗi bước chỉ next khi làm đúng → "learn by doing", giữ chân.

### Component
- `OnboardingOverlay` — full-screen overlay, chạy đè lên app thật (hoặc 1 project mock load sẵn).
- **Spotlight**: tô tối toàn màn, "khoét" 1 vùng sáng quanh UI target (timeline / viewport / nút).
- **Coach card** (bên phải): chữ TO + mô tả + infographic chuột line-mỏng SVG, **con lăn/nút active nhấp nháy tím** (`@keyframes pulse` màu accent).
- **Gating**: bước chỉ hoàn thành khi user thực hiện đúng (vd: pan viewport, kéo clip, bấm export). Lắng event store/DOM → `step.complete()` → nút Next bật.

### Data — định nghĩa bước (declarative)
```ts
interface OnboStep {
  id: string;
  phase: "nav" | "edit" | "effect" | "caption" | "export";
  title: string;            // chữ to
  body: string;             // mô tả ngắn
  target: string;           // CSS selector vùng spotlight
  mouse?: "wheel" | "middle" | "drag" | "click"; // infographic chuột nào highlight
  done: () => boolean;      // điều kiện hoàn thành (poll store/event)
}
```

### Phases & steps (MVP)
1. **Navigation**
   - Pan viewport: *"Giữ CHUỘT GIỮA kéo để di chuyển khung nhìn"* — infographic chuột, nút giữa nhấp nháy tím. Done = `viewport.x/y đổi`.
   - Zoom: *"Lăn chuột để phóng to/thu nhỏ"* — con lăn nhấp nháy. Done = `viewport.zoom đổi`.
   - Scrub timeline: *"Kéo thanh thời gian / phím cách để play"*. Done = playhead đổi.
2. **Edit basic**
   - Import: kéo media vào timeline. Done = có clip.
   - Cut: bấm Split / phím B. Done = số clip tăng.
   - Move: kéo clip. Done = clip.start đổi.
3. **Caption (killer feature #1)**
   - Tab Caption → "Tự tạo caption". Done = captionTrack.blocks > 0.
   - Đổi Style Pack. Done = style đổi.
   - *Wow moment: chữ nhảy đúng miệng, không cần làm tay*
4. **Whip It (killer feature #2 — chỉ hiện sau khi có caption)**
   - Nút `✨ Whip It` → chọn recipe hoặc skip. Done = compositions[] > 0.
   - Review graphic suggestions trong Content View. Done = ít nhất 1 accepted.
   - *Wow moment: video có editorial graphics tự động*
5. **Animate**
   - Apply behavior (Smooth Punch In). Done = clip có behavior.
   - *Wow moment: animation tự dời khi cắt lại clip*
5. **Export**
   - Bấm Export → ra file. Done = export xong.

→ Hoàn thành → confetti + "Bạn đã sẵn sàng làm reel viral 🎉" + gợi ý nâng Pro.

### Visual spec (khớp ảnh ref)
- Coach card nền tối, bo góc lớn, chữ title ~28px đậm.
- **Chuột line-art SVG**: outline mỏng 1.5px màu xám; bộ phận cần dùng (wheel/middle/left) tô **tím `--accent` + animation pulse** (opacity 0.4↔1, 0.8s).
- Spotlight: `box-shadow: 0 0 0 9999px rgba(0,0,0,.72)` quanh lỗ khoét + viền tím phát sáng.
- Nút Next mờ (disabled) tới khi `done()` true → sáng + nảy nhẹ.

### Triển khai gọn
- State: `onboarding: { active, stepIndex }` trong store (persist `onboarded: true` để không hiện lại).
- Poll `done()` mỗi 300ms hoặc subscribe store; nhiều điều kiện đọc thẳng `useStore.getState()`.
- Skip-all + "làm lại onboarding" trong menu Help.
- Mock project: nút Demo (✨) đã có → onboarding có thể load project mock này để có sẵn clip/caption thao tác.

---

## 3. Thứ tự build onboarding
1. `OnboardingOverlay` + spotlight + coach card + mouse SVG (1 step "pan" để chốt cảm giác).
2. Khai báo full steps (declarative array) + gating đọc store.
3. Confetti + Help menu replay.
→ Làm SAU khi editor + deploy ổn (đây là retention layer, không chặn launch test nội bộ).
