import React from "react";
import Head from "@docusaurus/Head";

const s: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: "system-ui, -apple-system, sans-serif",
    background: "#0f0f13",
    color: "#e8e8f0",
    minHeight: "100vh",
    padding: "0",
    margin: "0",
  },
  header: {
    background: "#1a1a24",
    borderBottom: "1px solid #2a2a3a",
    padding: "16px 40px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logo: {
    fontSize: "20px",
    fontWeight: 700,
    color: "#a78bfa",
    letterSpacing: "-0.5px",
  },
  badge: {
    fontSize: "11px",
    background: "#2a1f4a",
    color: "#a78bfa",
    border: "1px solid #4c3680",
    borderRadius: "4px",
    padding: "2px 8px",
    fontWeight: 500,
  },
  body: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "48px 40px 80px",
  },
  h1: {
    fontSize: "28px",
    fontWeight: 700,
    color: "#f0f0ff",
    marginBottom: "8px",
    marginTop: "0",
  },
  subtitle: {
    color: "#888",
    fontSize: "14px",
    marginBottom: "48px",
  },
  h2: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#c4b5fd",
    borderBottom: "1px solid #2a2a3a",
    paddingBottom: "8px",
    marginTop: "48px",
    marginBottom: "20px",
  },
  h3: {
    fontSize: "15px",
    fontWeight: 600,
    color: "#e8e8f0",
    marginTop: "28px",
    marginBottom: "10px",
  },
  p: {
    lineHeight: 1.7,
    color: "#ccc",
    marginBottom: "12px",
  },
  strong: { color: "#f0f0ff" },
  blockquote: {
    borderLeft: "3px solid #4c3680",
    paddingLeft: "16px",
    color: "#999",
    margin: "16px 0",
    fontStyle: "italic",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: "14px",
    marginBottom: "20px",
  },
  th: {
    background: "#1e1e2e",
    color: "#a78bfa",
    padding: "10px 14px",
    textAlign: "left" as const,
    borderBottom: "1px solid #2a2a3a",
    fontWeight: 600,
  },
  td: {
    padding: "9px 14px",
    borderBottom: "1px solid #1e1e2e",
    color: "#ccc",
    verticalAlign: "top" as const,
  },
  ul: { paddingLeft: "20px", color: "#ccc", lineHeight: 1.8 },
  li: { marginBottom: "4px" },
  checkbox: { marginRight: "8px" },
  separator: { border: "none", borderTop: "1px solid #2a2a3a", margin: "40px 0" },
  tag: {
    display: "inline-block",
    background: "#1e1e2e",
    border: "1px solid #2a2a3a",
    borderRadius: "4px",
    padding: "2px 8px",
    fontSize: "13px",
    color: "#aaa",
    marginRight: "6px",
  },
};

function Td({ children }: { children: React.ReactNode }) {
  return <td style={s.td}>{children}</td>;
}
function Th({ children }: { children: React.ReactNode }) {
  return <th style={s.th}>{children}</th>;
}

export default function WhipMarketing() {
  return (
    <div style={s.page}>
      <Head>
        <title>Whip — Marketing Reference</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div style={s.header}>
        <span style={s.logo}>✂️ Whip</span>
        <span style={s.badge}>Marketing Reference</span>
      </div>

      <div style={s.body}>
        <h1 style={s.h1}>Tài Liệu Tham Khảo Cho Team Marketing</h1>
        <p style={s.subtitle}>Nội dung nội bộ — dùng cho landing page, deck, social post.</p>

        <hr style={s.separator} />

        {/* ── Định nghĩa sản phẩm ── */}
        <h2 style={s.h2}>Whip Là Gì — Định Nghĩa Sản Phẩm</h2>
        <p style={s.p}><strong style={s.strong}>Một câu:</strong> Whip là trình chỉnh sửa video AI-native đầu tiên hiểu nội dung — không chỉ thao tác khung hình.</p>
        <p style={s.p}><strong style={s.strong}>Ba câu:</strong> Mọi editor hiện tại (Premiere, CapCut, DaVinci) lưu video như mảng thời gian — cắt một chỗ là animation vỡ chỗ khác. Whip hiểu video theo ngữ nghĩa: ai đang nói gì, biểu cảm ra sao, cử chỉ thế nào — rồi tự sinh hiệu ứng phù hợp từng khoảnh khắc. Creator chỉnh sửa xong trong vài phút thay vì vài tiếng.</p>

        <hr style={s.separator} />

        {/* ── 5 Moats ── */}
        <h2 style={s.h2}>5 Điểm Khác Biệt Cốt Lõi</h2>
        <p style={s.p}>5 thứ không đối thủ nào có — mỗi điểm là lý do kiến trúc, không phải feature bề mặt:</p>

        <h3 style={s.h3}>Moat 1 — Animation Không Vỡ Khi Cắt</h3>
        <p style={s.p}>Premiere, CapCut, DaVinci lưu video như mảng timestamp. Cắt → vỡ. Đây là vấn đề 30 năm của After Effects.</p>
        <p style={s.p}>Whip lưu video theo ngữ nghĩa: mỗi từ, cử chỉ, biểu cảm đều có ID ổn định. Behaviors anchor vào ID đó — cắt 10 từ → behaviors tự recompute, không vỡ bao giờ.</p>
        <div style={s.blockquote}><em>Demo: cắt audio → AE vỡ vs Whip giữ nguyên</em></div>

        <h3 style={s.h3}>Moat 2 — Xử Lý AI Hoàn Toàn Trên Máy</h3>
        <p style={s.p}>Mọi AI editor hiện tại: upload video lên cloud → server xử lý → download kết quả. TwelveLabs (tốt nhất hiện tại): $12/30 phút.</p>
        <p style={s.p}>Whip extract tất cả signals ngay trên máy, 1 lần khi import: phiên âm từng từ, biểu cảm khuôn mặt, nhận diện cử chỉ. Chi phí: $0. Video không upload đi đâu.</p>
        <div style={s.blockquote}><em>Demo: import 30 phút video, xem ingestion chạy local</em></div>

        <h3 style={s.h3}>Moat 3 — AI Agent Điều Khiển Được</h3>
        <p style={s.p}>Các AI editor khác là pipeline: upload → chờ → download preset. Agent không điều khiển được thật sự.</p>
        <p style={s.p}>Whip có ngôn ngữ lập trình cho video (Whip Script). Agent điều khiển qua semantic intent — không phải timecode. Input là code, output là video.</p>
        <div style={s.blockquote}><em>Demo: Claude viết Whip Script → chạy headless → ra 5 format platform</em></div>

        <h3 style={s.h3}>Moat 4 — Nhớ Phong Cách Creator</h3>
        <p style={s.p}>Lock-in của CapCut/Premiere = định dạng file. Creator export video là xong — không mang được gì.</p>
        <p style={s.p}>Whip học phong cách editing của creator qua từng dự án: nhịp cắt, cường độ zoom, cách highlight caption. Project sau tự áp dụng, ngày càng ít cần chỉnh lại.</p>
        <div style={s.blockquote}><em>Demo: project thứ 5 tự match style của creator từ 4 project trước</em></div>

        <h3 style={s.h3}>Moat 5 — Giao Diện Không Bao Giờ Đơ</h3>
        <p style={s.p}>Browser thông thường: 1 thread xử lý tất cả — UI, AI, render. CapCut web lag khi cắt video dài. Descript đơ khi AI đang xử lý.</p>
        <p style={s.p}>Whip chạy 5 luồng hoàn toàn độc lập. AI đang phân tích 30 phút video phía sau — creator kéo keyframe vẫn mượt 60fps.</p>
        <div style={s.blockquote}><em>Demo: bật ingestion + edit cùng lúc, quan sát framerate</em></div>

        <hr style={s.separator} />

        {/* ── Tính năng ── */}
        <h2 style={s.h2}>Tính Năng — Theo Nhóm</h2>

        <h3 style={s.h3}>Chỉnh Sửa</h3>
        <table style={s.table}>
          <thead><tr><Th>Tính năng</Th><Th>Mô tả ngắn cho marketing</Th></tr></thead>
          <tbody>
            <tr><Td>Cắt im lặng tự động</Td><Td>Loại bỏ đoạn ngừng nghỉ, ầm ừ chỉ một nút</Td></tr>
            <tr><Td>Reframe 9:16 / 1:1 tự động</Td><Td>Nhận diện khuôn mặt, tự điều chỉnh tỉ lệ cho từng platform</Td></tr>
            <tr><Td>Animation theo lời nói</Td><Td>Zoom, caption tự khớp nội dung — cắt clip không bao giờ vỡ layout</Td></tr>
            <tr><Td>Đồng bộ nhạc theo beat</Td><Td>Tự phát hiện nhịp, khớp cắt và hiệu ứng theo beat</Td></tr>
            <tr><Td>Batch export</Td><Td>Xuất nhiều clip cùng lúc</Td></tr>
            <tr><Td>Preset platform</Td><Td>TikTok, YouTube Shorts, Instagram Reels, LinkedIn — xuất đúng spec</Td></tr>
          </tbody>
        </table>

        <h3 style={s.h3}>AI & Phân Tích</h3>
        <table style={s.table}>
          <thead><tr><Th>Tính năng</Th><Th>Mô tả ngắn cho marketing</Th></tr></thead>
          <tbody>
            <tr><Td>Phân tích đa chiều</Td><Td>AI đọc đồng thời giọng nói, biểu cảm, cử chỉ từng khoảnh khắc</Td></tr>
            <tr><Td>Hiệu ứng mở (không preset cứng)</Td><Td>AI sinh hiệu ứng phù hợp từng đoạn — nhấn mạnh, dẫn dắt, cao trào...</Td></tr>
            <tr><Td>Whip It</Td><Td>Một nút: AI tự phân tích toàn bộ video và đề xuất edit hoàn chỉnh</Td></tr>
            <tr><Td>Style Memory</Td><Td>Nhớ phong cách chỉnh sửa của creator, tự áp dụng vào dự án tiếp theo</Td></tr>
          </tbody>
        </table>

        <h3 style={s.h3}>Caption & Visual</h3>
        <table style={s.table}>
          <thead><tr><Th>Tính năng</Th><Th>Mô tả ngắn cho marketing</Th></tr></thead>
          <tbody>
            <tr><Td>Caption tự động</Td><Td>Phiên âm chính xác, xuất hiện đúng từng từ</Td></tr>
            <tr><Td>Nhiều phong cách caption</Td><Td>Loud, Clean, Minimal, Cinematic, Bold — có thể tùy chỉnh hoàn toàn</Td></tr>
            <tr><Td>Tách nền tự động</Td><Td>Loại bỏ background, giữ lại người nói</Td></tr>
            <tr><Td>Overlay & logo</Td><Td>Thêm thành phần hình ảnh, ghim cố định vào vị trí trong clip</Td></tr>
          </tbody>
        </table>

        <h3 style={s.h3}>Âm Thanh</h3>
        <table style={s.table}>
          <thead><tr><Th>Tính năng</Th><Th>Mô tả ngắn cho marketing</Th></tr></thead>
          <tbody>
            <tr><Td>Tự giảm nhạc nền (auto duck)</Td><Td>Nhạc tự fade khi có lời, tự to lại khi im lặng</Td></tr>
            <tr><Td>Khóa pitch</Td><Td>Tăng/giảm tốc độ clip mà giọng không bị biến dạng</Td></tr>
          </tbody>
        </table>

        <h3 style={s.h3}>Hiệu Năng</h3>
        <table style={s.table}>
          <thead><tr><Th>Tính năng</Th><Th>Mô tả ngắn cho marketing</Th></tr></thead>
          <tbody>
            <tr><Td>Không giới hạn dung lượng</Td><Td>File 4K, 50GB vẫn chạy mượt trên web</Td></tr>
            <tr><Td>Giao diện luôn mượt</Td><Td>AI đang xử lý nền — UI không bao giờ đơ, không bao giờ chờ</Td></tr>
            <tr><Td>Xử lý AI tốc độ cao</Td><Td>Transcribe + face tracking + pose — hoàn thành trong giây, không phải phút</Td></tr>
          </tbody>
        </table>

        <hr style={s.separator} />

        {/* ── Đối tượng ── */}
        <h2 style={s.h2}>Đối Tượng Mục Tiêu</h2>

        <h3 style={s.h3}>Creator nội dung ngắn (TikTok, Reels, Shorts)</h3>
        <ul style={s.ul}>
          <li style={s.li}><strong style={s.strong}>Pain point:</strong> Quay xong mất 4–6 tiếng edit, mỗi lần cắt là animation vỡ</li>
          <li style={s.li}><strong style={s.strong}>Value prop:</strong> Từ raw footage → viral clip trong dưới 15 phút</li>
        </ul>

        <h3 style={s.h3}>Marketer & Brand team</h3>
        <ul style={s.ul}>
          <li style={s.li}><strong style={s.strong}>Pain point:</strong> Cần nhiều format, nhiều platform, không có editor riêng</li>
          <li style={s.li}><strong style={s.strong}>Value prop:</strong> Một video gốc → 5 format platform, có caption và nhạc, tự động</li>
        </ul>

        <h3 style={s.h3}>Agency & Freelancer</h3>
        <ul style={s.ul}>
          <li style={s.li}><strong style={s.strong}>Pain point:</strong> Batch edit nhiều video cùng cấu trúc mất thời gian lặp lại</li>
          <li style={s.li}><strong style={s.strong}>Value prop:</strong> Style nhất quán trên toàn bộ batch, xuất tự động</li>
        </ul>

        <h3 style={s.h3}>Creator tiếng Việt</h3>
        <ul style={s.ul}>
          <li style={s.li}><strong style={s.strong}>Pain point:</strong> CapCut dominant nhưng AI không hiểu nội dung thật sự, caption tiếng Việt sai nhiều</li>
          <li style={s.li}><strong style={s.strong}>Value prop:</strong> AI hiểu từng khoảnh khắc, caption tiếng Việt chính xác, tool học phong cách của mình</li>
        </ul>

        <hr style={s.separator} />

        {/* ── So sánh đối thủ ── */}
        <h2 style={s.h2}>So Sánh Với Đối Thủ</h2>
        <p style={s.p} style={{...s.p, color: "#888", fontSize: "13px"}}>Dùng cho landing page, deck, social post. Không dùng số liệu kỹ thuật nội bộ.</p>

        <table style={s.table}>
          <thead>
            <tr>
              <Th>Tiêu chí</Th>
              <Th>Whip</Th>
              <Th>CapCut</Th>
              <Th>Descript</Th>
              <Th>After Effects</Th>
            </tr>
          </thead>
          <tbody>
            <tr><Td>AI hiểu nội dung thật sự</Td><Td>✅</Td><Td>❌ preset có sẵn</Td><Td>Chỉ văn bản</Td><Td>❌</Td></tr>
            <tr><Td>Animation không vỡ khi cắt</Td><Td>✅</Td><Td>❌</Td><Td>Một phần</Td><Td>❌</Td></tr>
            <tr><Td>AI agent / lập trình video</Td><Td>✅ Whip Script</Td><Td>❌</Td><Td>❌</Td><Td>❌</Td></tr>
            <tr><Td>Nhớ phong cách creator</Td><Td>✅</Td><Td>❌</Td><Td>❌</Td><Td>❌</Td></tr>
            <tr><Td>Chạy trên web, không giới hạn file</Td><Td>✅</Td><Td>Giới hạn</Td><Td>Giới hạn</Td><Td>❌ desktop</Td></tr>
            <tr><Td>Giá</Td><Td>Free + $30/tháng</Td><Td>Free + $8/tháng</Td><Td>$24–$40/tháng</Td><Td>$600+/năm</Td></tr>
          </tbody>
        </table>

        <h3 style={s.h3}>Góc độ so sánh theo từng đối thủ</h3>
        <p style={s.p}><strong style={s.strong}>vs CapCut:</strong> "Như CapCut nhưng AI thật sự hiểu video của bạn"</p>
        <p style={s.p}><strong style={s.strong}>vs After Effects:</strong> "4 tiếng keyframe tay trong AE → 30 giây với Whip"</p>
        <p style={s.p}><strong style={s.strong}>vs Descript:</strong> "Descript hiểu lời nói. Whip hiểu cả biểu cảm và cử chỉ"</p>

        <hr style={s.separator} />

        {/* ── Giá ── */}
        <h2 style={s.h2}>Giá — Thông Tin Công Khai</h2>

        <table style={s.table}>
          <thead><tr><Th>Gói</Th><Th>Giá</Th><Th>Dành cho</Th></tr></thead>
          <tbody>
            <tr><Td><strong style={s.strong}>Free</strong></Td><Td>$0/tháng</Td><Td>Dùng thử, dự án cá nhân nhỏ</Td></tr>
            <tr><Td><strong style={s.strong}>Creator</strong></Td><Td>$30/tháng</Td><Td>Creator full-time, freelancer, agency nhỏ</Td></tr>
            <tr><Td><strong style={s.strong}>Team</strong></Td><Td>Liên hệ</Td><Td>Agency, brand team, doanh nghiệp</Td></tr>
          </tbody>
        </table>

        <ul style={s.ul}>
          <li style={s.li}>Tất cả gói: video không upload cloud, không giới hạn dung lượng file</li>
          <li style={s.li}>Creator trở lên: xuất không watermark</li>
          <li style={s.li}>So với AE $600+/năm → Whip $360/năm với AI tự động</li>
        </ul>

        <hr style={s.separator} />

        {/* ── Assets checklist ── */}
        <h2 style={s.h2}>Assets Cần Chuẩn Bị</h2>
        <ul style={s.ul}>
          <li style={s.li}>☐ Demo video: raw 30 phút → clip 3 phút viral, toàn bộ quá trình</li>
          <li style={s.li}>☐ Demo video: cắt audio → AE vỡ vs Whip giữ nguyên (side-by-side)</li>
          <li style={s.li}>☐ Screenshot: giao diện chính với caption tiếng Việt</li>
          <li style={s.li}>☐ Screenshot: Whip It button + kết quả</li>
          <li style={s.li}>☐ Logo Whip (SVG, PNG trắng/đen/màu)</li>
          <li style={s.li}><span style={s.tag}>Brand color</span> #6c47ff (tím)</li>
          <li style={s.li}>☐ Bộ caption style showcase (Loud, Clean, Minimal, Cinematic)</li>
        </ul>
      </div>
    </div>
  );
}
