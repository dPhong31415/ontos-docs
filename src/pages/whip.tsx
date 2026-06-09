import React from "react";
import Head from "@docusaurus/Head";
import styles from "./whip.module.css";

const features = [
  {
    icon: "🎬",
    title: "Chỉnh sửa thông minh",
    items: [
      "Cắt im lặng tự động — loại bỏ đoạn ngừng nghỉ, ầm ừ chỉ một nút",
      "Reframe tự động 9:16 / 1:1 — nhận diện khuôn mặt, tự điều chỉnh tỉ lệ",
      "Animation theo lời nói — zoom, caption tự khớp nội dung; cắt clip không bao giờ vỡ layout",
      "Đồng bộ nhạc — tự phát hiện nhịp, khớp cắt và hiệu ứng theo beat",
    ],
  },
  {
    icon: "🤖",
    title: "AI hiểu nội dung",
    items: [
      "Phân tích đa chiều — AI đọc đồng thời giọng nói, biểu cảm, cử chỉ từng khoảnh khắc",
      "Hiệu ứng mở — không bị giới hạn bởi preset cứng; AI sinh hiệu ứng phù hợp từng đoạn",
      "Whip It — một nút: AI tự phân tích và đề xuất edit hoàn chỉnh",
    ],
  },
  {
    icon: "🎨",
    title: "Caption & Visual",
    items: [
      "Caption tự động — phiên âm chính xác, xuất hiện đúng từng từ",
      "Nhiều phong cách — Loud, Clean, Minimal, Cinematic, Bold...",
      "Tách nền tự động — loại bỏ background, giữ lại người nói",
      "Overlay & logo — ghim cố định vào vị trí",
    ],
  },
  {
    icon: "🎵",
    title: "Âm thanh",
    items: [
      "Tự giảm nhạc nền — nhạc tự fade khi có lời, tự to lại khi im lặng",
      "Khóa pitch — tăng/giảm tốc độ mà giọng không thay đổi",
    ],
  },
  {
    icon: "📤",
    title: "Xuất bản",
    items: [
      "Xuất nhiều định dạng — 16:9, 9:16, 1:1 cùng lúc",
      "Preset platform — TikTok, YouTube Shorts, Instagram Reels, LinkedIn",
      "Batch export — xuất nhiều clip cùng lúc",
    ],
  },
  {
    icon: "🔒",
    title: "Bảo mật & Hiệu năng",
    items: [
      "Video không rời máy — mọi xử lý AI diễn ra trực tiếp trên thiết bị của bạn",
      "Không giới hạn dung lượng — file 4K, 50GB vẫn chạy mượt",
      "Giao diện luôn mượt 60fps — dù AI đang xử lý nền",
    ],
  },
];

const comparison = [
  { label: "AI hiểu nội dung thật sự", whip: "✅", capcut: "❌ preset", descript: "Chỉ văn bản", ae: "❌" },
  { label: "Video xử lý trên máy (không upload)", whip: "✅", capcut: "❌", descript: "❌", ae: "✅" },
  { label: "Animation không vỡ khi cắt", whip: "✅", capcut: "❌", descript: "Partial", ae: "❌" },
  { label: "Nhớ phong cách creator", whip: "✅", capcut: "❌", descript: "❌", ae: "❌" },
  { label: "Chạy trên web", whip: "✅", capcut: "✅", descript: "✅", ae: "❌" },
  { label: "Không giới hạn dung lượng file", whip: "✅", capcut: "❌", descript: "❌", ae: "❌" },
  { label: "Giá", whip: "Free + $30/tháng", capcut: "Free + $8/tháng", descript: "$24–$40/tháng", ae: "$600+/năm" },
];

const usecases = [
  {
    icon: "📱",
    who: "Creator nội dung ngắn",
    quote: "Quay xong, Whip It, xuất — xong trong 10 phút.",
    for: "TikTok, Reels, Shorts, podcast clip, talking-head, review sản phẩm",
  },
  {
    icon: "📊",
    who: "Marketer & Brand",
    quote: "Một video gốc → 5 định dạng platform, đã có caption và nhạc.",
    for: "Social campaign, product video, employer branding",
  },
  {
    icon: "🏢",
    who: "Agency & Freelancer",
    quote: "Batch edit nhiều video cùng cấu trúc mà không làm lại từ đầu.",
    for: "Podcast repurposing, event recap, client deliverables",
  },
  {
    icon: "🇻🇳",
    who: "Creator tiếng Việt",
    quote: "Caption tiếng Việt chính xác. Không lo video lên server ByteDance.",
    for: "Creator muốn alternative cho CapCut với privacy tốt hơn",
  },
];

const plans = [
  { name: "Free", price: "$0", desc: "Dùng thử, dự án cá nhân nhỏ", highlight: false },
  { name: "Creator", price: "$30/tháng", desc: "Creator full-time, agency nhỏ", highlight: true },
  { name: "Team", price: "Liên hệ", desc: "Agency, brand team, doanh nghiệp", highlight: false },
];

export default function WhipMarketing() {
  return (
    <>
      <Head>
        <title>Whip — AI Video Editor</title>
        <meta name="description" content="Trình chỉnh sửa video AI-native. Animation không vỡ khi cắt. Video không rời máy. Càng dùng càng thông minh." />
      </Head>

      <div className={styles.page}>

        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.badge}>AI-Native Video Editor</div>
          <h1 className={styles.heroTitle}>
            Edit video trong vài phút.<br />
            <span className={styles.accent}>Không keyframe. Không vỡ layout.<br />Không lo privacy.</span>
          </h1>
          <p className={styles.heroSub}>
            Whip là trình chỉnh sửa video đầu tiên <strong>hiểu nội dung</strong> — không chỉ thao tác khung hình.
            AI đọc giọng nói, biểu cảm, cử chỉ rồi tự sinh hiệu ứng phù hợp từng khoảnh khắc.
          </p>
          <div className={styles.heroCta}>
            <a className={styles.btnPrimary} href="https://whip.ontos.app" target="_blank" rel="noopener noreferrer">Dùng miễn phí</a>
            <a className={styles.btnSecondary} href="mailto:d.phongnguyen31415@gmail.com">Liên hệ team</a>
          </div>
        </section>

        {/* 3 pillars */}
        <section className={styles.section}>
          <div className={styles.pillars}>
            <div className={styles.pillar}>
              <div className={styles.pillarNum}>01</div>
              <h3>Animation không bao giờ vỡ</h3>
              <p>Dù bạn cắt, sửa, đảo thứ tự — hiệu ứng tự theo nội dung, không theo giây cụ thể.</p>
            </div>
            <div className={styles.pillar}>
              <div className={styles.pillarNum}>02</div>
              <h3>Video không rời máy</h3>
              <p>AI xử lý ngay trên thiết bị của bạn. Không upload lên bất kỳ server nào.</p>
            </div>
            <div className={styles.pillar}>
              <div className={styles.pillarNum}>03</div>
              <h3>Càng dùng càng thông minh</h3>
              <p>Whip học phong cách của bạn qua từng dự án. Tự áp dụng vào video tiếp theo.</p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Tính Năng</h2>
          <div className={styles.featureGrid}>
            {features.map((f) => (
              <div key={f.title} className={styles.featureCard}>
                <div className={styles.featureIcon}>{f.icon}</div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <ul className={styles.featureList}>
                  {f.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Style Memory */}
        <section className={styles.sectionAlt}>
          <div className={styles.inner}>
            <h2 className={styles.sectionTitle}>Phong Cách Creator — Whip Nhớ Cách Bạn Edit</h2>
            <p className={styles.sectionDesc}>
              Whip học từ mỗi dự án: bạn hay zoom nhẹ hay mạnh? Caption từng từ hay từng câu?
              Cắt trước hay sau beat? Sau vài dự án, Whip tự áp dụng phong cách của bạn vào mọi video mới —
              không cần cài đặt lại.
            </p>
            <div className={styles.styleItems}>
              {["Cường độ zoom & ease", "Nhịp cắt & tốc độ", "Phong cách caption", "Đường năng lượng video", "Màu sắc & tone"].map((s) => (
                <span key={s} className={styles.styleTag}>{s}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>So Với Công Cụ Hiện Tại</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Tính năng</th>
                  <th className={styles.colWhip}>Whip</th>
                  <th>CapCut</th>
                  <th>Descript</th>
                  <th>After Effects</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td className={styles.colWhip}>{row.whip}</td>
                    <td>{row.capcut}</td>
                    <td>{row.descript}</td>
                    <td>{row.ae}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Use cases */}
        <section className={styles.sectionAlt}>
          <div className={styles.inner}>
            <h2 className={styles.sectionTitle}>Ai Dùng Whip?</h2>
            <div className={styles.usecaseGrid}>
              {usecases.map((u) => (
                <div key={u.who} className={styles.usecaseCard}>
                  <div className={styles.usecaseIcon}>{u.icon}</div>
                  <h3>{u.who}</h3>
                  <blockquote className={styles.usecaseQuote}>"{u.quote}"</blockquote>
                  <p className={styles.usecaseFor}>{u.for}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Messaging */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Thông Điệp Chính</h2>
          <div className={styles.msgGrid}>
            <div className={styles.msgCard}>
              <div className={styles.msgLabel}>Landing page</div>
              <p>"Edit video trong vài phút. Không keyframe. Không vỡ layout. Không lo privacy."</p>
            </div>
            <div className={styles.msgCard}>
              <div className={styles.msgLabel}>TikTok / Reels hook</div>
              <p>"Tôi edit video 30 phút trong 8 phút — đây là cách tôi làm"</p>
            </div>
            <div className={styles.msgCard}>
              <div className={styles.msgLabel}>So sánh CapCut</div>
              <p>"Như CapCut nhưng AI hiểu nội dung thật sự — và video không lên server Trung Quốc."</p>
            </div>
            <div className={styles.msgCard}>
              <div className={styles.msgLabel}>So sánh After Effects</div>
              <p>"4 tiếng keyframe tay trong AE → 30 giây với Whip. Cùng chất lượng, khác tốc độ."</p>
            </div>
            <div className={styles.msgCard}>
              <div className={styles.msgLabel}>LinkedIn / B2B</div>
              <p>"Whip giúp team marketing xuất nội dung video nhanh hơn 3× — không cần thuê editor."</p>
            </div>
            <div className={styles.msgCard}>
              <div className={styles.msgLabel}>Creator tiếng Việt</div>
              <p>"Caption tiếng Việt chính xác. Không lo video lên ByteDance."</p>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className={styles.sectionAlt}>
          <div className={styles.inner}>
            <h2 className={styles.sectionTitle}>Giá</h2>
            <div className={styles.planGrid}>
              {plans.map((p) => (
                <div key={p.name} className={`${styles.planCard} ${p.highlight ? styles.planHighlight : ""}`}>
                  <div className={styles.planName}>{p.name}</div>
                  <div className={styles.planPrice}>{p.price}</div>
                  <div className={styles.planDesc}>{p.desc}</div>
                </div>
              ))}
            </div>
            <p className={styles.planNote}>
              Tất cả gói: không giới hạn dung lượng file · video không upload cloud · xuất không watermark (Creator trở lên)
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className={styles.footer}>
          <p>© 2026 Whip · <a href="mailto:d.phongnguyen31415@gmail.com">Liên hệ</a></p>
        </footer>

      </div>
    </>
  );
}
