import { useState, useEffect, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./Invitation.css";

// Helper untuk menyingkat nama:
// 1. Awalan Muhammad / Mohammad otomatis disingkat menjadi "M." (misal: "Muhammad Dzikri Fauzan" -> "M. Dzikri Fauzan")
// 2. Jika nama memiliki lebih dari 2 kata, kata ke-3 dan seterusnya otomatis disingkat (misal: "Breza Artha Medico" -> "Breza Artha M.")
const formatGuestName = (rawName) => {
  if (!rawName) return "Tamu Undangan";
  const trimmed = rawName.trim();
  if (!trimmed) return "Tamu Undangan";

  const words = trimmed.split(/\s+/);
  if (words.length === 0) return "Tamu Undangan";

  // Cek apakah kata pertama adalah variasi dari Muhammad / Mohammad
  const muhammadRegex = /^(muhammad|mohammad|muhamad|mohamad|mochammad|mochamad|muh\.?|moh\.?)$/i;
  const startsWithMuhammad = muhammadRegex.test(words[0]);

  if (startsWithMuhammad && words.length > 1) {
    const remainingWords = words.slice(1);
    if (remainingWords.length <= 2) {
      return `M. ${remainingWords.join(" ")}`.trim();
    }
    const firstTwo = remainingWords.slice(0, 2).join(" ");
    const abbreviated = remainingWords
      .slice(2)
      .map((w) => {
        const clean = w.replace(/[^a-zA-Z0-9]/g, "");
        return clean ? `${clean.charAt(0).toUpperCase()}.` : "";
      })
      .filter(Boolean)
      .join(" ");
    return `M. ${firstTwo} ${abbreviated}`.trim();
  }

  // Aturan standar: jika lebih dari 2 kata, kata ke-3 dan seterusnya disingkat
  if (words.length <= 2) return trimmed;

  const firstTwo = words.slice(0, 2).join(" ");
  const abbreviated = words
    .slice(2)
    .map((w) => {
      const clean = w.replace(/[^a-zA-Z0-9]/g, "");
      return clean ? `${clean.charAt(0).toUpperCase()}.` : "";
    })
    .filter(Boolean)
    .join(" ");

  return `${firstTwo} ${abbreviated}`.trim();
};

export default function Invitation() {
  const { slug } = useParams();
  const [guestName, setGuestName] = useState("Tamu Undangan");
  const [isLoadingGuest, setIsLoadingGuest] = useState(Boolean(slug));

  // State Animasi Amplop
  const [isSealFaded, setIsSealFaded] = useState(false);
  const [isFlapOpen, setIsFlapOpen] = useState(false);
  const [flapZIndex, setFlapZIndex] = useState(5);
  const [isPaperUp, setIsPaperUp] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [hideEnvelopeScreen, setHideEnvelopeScreen] = useState(false);
  const [showMainContent, setShowMainContent] = useState(false);

  // State Music Player
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // State Countdown Timer
  const [timeLeft, setTimeLeft] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  // State Form RSVP ke Backend
  const [rsvpName, setRsvpName] = useState("");
  const [attendance, setAttendance] = useState("Hadir");
  const [guestCount, setGuestCount] = useState(1);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data Rekening
  const giftAccounts = [
    {
      id: "dzikri",
      label: "BSI - Muhamad Dzikri Fauzan",
      bankName: "Bank Syariah Indonesia (BSI)",
      accountNumber: "8507123620",
      accountHolder: "Muhamad Dzikri Fauzan",
      logo: "/images/bsi.png"
    },
    {
      id: "resa",
      label: "BSI - Resa Erviana",
      bankName: "Bank Syariah Indonesia (BSI)",
      accountNumber: "7264748938",
      accountHolder: "Resa Erviana",
      logo: "/images/bsi.png"
    }
  ];

  // State untuk notifikasi "Berhasil Disalin" pada Wedding Gift
  const [copiedTarget, setCopiedTarget] = useState("");
  const [showGiftDetails, setShowGiftDetails] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleCopyText = (text, target) => {
    navigator.clipboard.writeText(text);
    setCopiedTarget(target);
    setTimeout(() => setCopiedTarget(""), 2500); // Teks kembali normal setelah 2.5 detik
  };

  // State Komentar / Buku Tamu
  const [showAllComments, setShowAllComments] = useState(false);
  const [comments, setComments] = useState([]);

  const flowers = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => ({
      id: i,
      left: `${(i * 7.5 + Math.random() * 5) % 95}%`,
      duration: `${10 + (i % 3) * 3}s`,
      delay: `${(i * 1.5) % 6}s`,
      size: `${18 + (i % 3) * 4}px`, // Ukuran bunga
    }));
  }, []);

  // 1. Fetch Data & Komentar dari Database Backend
  useEffect(() => {
    const fetchData = async () => {
      if (slug) {
        setIsLoadingGuest(true);
        try {
          const resGuest = await axios.get(
            `http://localhost:5000/api/guests/${slug}`,
          );
          if (resGuest.data?.name) {
            setGuestName(resGuest.data.name);
            setRsvpName(resGuest.data.name);
          }
        } catch (error) {
          console.error("Gagal load tamu.");
        } finally {
          // Berikan jeda halus agar transisi loading terasa mulus & tidak berkedip instan
          setTimeout(() => {
            setIsLoadingGuest(false);
          }, 350);
        }
      } else {
        setIsLoadingGuest(false);
      }

      try {
        const resComments = await axios.get(`http://localhost:5000/api/rsvp`);
        setComments(resComments.data);
      } catch (error) {
        console.log("Menunggu backend dijalankan untuk load data komentar...");
      }
    };
    fetchData();
  }, [slug]);

  const sortedComments = useMemo(() => {
    return [...comments].sort((a, b) => {
      const wordsA = a.message ? a.message.split(" ").length : 0;
      const wordsB = b.message ? b.message.split(" ").length : 0;
      return wordsB - wordsA;
    });
  }, [comments]);

  const displayedComments = showAllComments
    ? sortedComments
    : sortedComments.slice(0, 4);

  // 2. Logika Countdown Timer
  useEffect(() => {
    const targetDate = new Date("2026-08-30T08:00:00").getTime();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = targetDate - now;

      if (diff > 0) {
        setTimeLeft({
          days: String(Math.floor(diff / (1000 * 60 * 60 * 24))).padStart(
            2,
            "0",
          ),
          hours: String(
            Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          ).padStart(2, "0"),
          minutes: String(
            Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          ).padStart(2, "0"),
          seconds: String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(
            2,
            "0",
          ),
        });
      } else clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 3. Efek Animasi Scroll
  useEffect(() => {
    if (!showMainContent) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible-scroll");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    const elements = document.querySelectorAll(".reveal-on-scroll");
    elements.forEach((el) => observer.observe(el));
    return () => elements.forEach((el) => observer.unobserve(el));
  }, [showMainContent, comments]);

  // 4. Control Musik
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play().catch((e) => console.log(e));
    setIsPlaying(!isPlaying);
  };
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };
  const handleSeek = (e) => {
    const seekTime = (e.target.value / 100) * duration;
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };
  const formatTime = (time) => {
    if (isNaN(time)) return "00:00";
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // 5. Buka Amplop & Autoplay Music
  const handleOpenEnvelope = () => {
    if (isSealFaded) return;
    setIsSealFaded(true);
    if (audioRef.current)
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.log(e));
    setTimeout(() => setIsFlapOpen(true), 300);
    setTimeout(() => setFlapZIndex(1), 1300);
    setTimeout(() => setIsPaperUp(true), 1350);
    setTimeout(() => {
      setIsZoomed(true);
      setShowOverlay(true);
    }, 3000);
    setTimeout(() => {
      setHideEnvelopeScreen(true);
      setTimeout(() => setShowMainContent(true), 50);
    }, 4500);
  };

  // 6. Handle Submit Form ke Database
  const handleSubmitRSVP = async (e) => {
    e.preventDefault();
    if (!rsvpName.trim() || !message.trim()) {
      alert("Mohon lengkapi Nama dan Pesan/Ucapan.");
      return;
    }

    setIsSubmitting(true);
    const finalGuestCount = attendance === "Hadir" ? guestCount : 0;
    const payload = {
      name: rsvpName,
      attendance,
      guestCount: finalGuestCount,
      message,
    };

    try {
      const response = await axios.post(
        `http://localhost:5000/api/rsvp`,
        payload,
      );
      setComments((prev) => [
        { id: response.data.id || Date.now(), ...payload },
        ...prev,
      ]);
      setMessage("");
      alert("Terima kasih! Konfirmasi dan ucapan Anda berhasil disimpan.");
    } catch (error) {
      console.error(error);
      setComments((prev) => [{ id: Date.now(), ...payload }, ...prev]);
      setMessage("");
      alert("Tersimpan (Mode Offline).");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="invitation-wrapper">
      <audio
        ref={audioRef}
        src="/music/wedding-song.mp3"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        loop
      />

      {/* ANIMASI BUNGA JATUH */}
      <div className="falling-leaves-container">
        {flowers.map((flower) => (
          <div
            key={flower.id}
            className="leaf-item"
            style={{
              left: flower.left,
              animationDuration: flower.duration,
              animationDelay: flower.delay,
              width: flower.size,
              height: flower.size,
            }}
          >
            {/* SVG Bunga Kelopak 4 */}
            <svg viewBox="0 0 24 24" fill="#c29b62" opacity="0.6">
              <path d="M12,2 C15,2 16,5 16,8 C19,8 22,9 22,12 C22,15 19,16 16,16 C16,19 15,22 12,22 C9,22 8,19 8,16 C5,16 2,15 2,12 C2,9 5,8 8,8 C8,5 9,2 12,2 Z" />
            </svg>
          </div>
        ))}
      </div>

      <div id="app-container">
        {!hideEnvelopeScreen && (
          <div id="envelope-screen">
            <div className="perspective-container">
              <div id="envelope" className={isZoomed ? "zoom-in" : ""}>
                <div id="envelope-back"></div>
                <div id="paper" className={isPaperUp ? "slide-up-paper" : ""}>
                  <div className="paper-content">
                    <h2>Simpan Tanggalnya</h2>
                    <p>Minggu, 30 Agustus 2026</p>
                  </div>
                </div>
                <img
                  src="/images/flap.png"
                  id="flap"
                  alt="Flap Amplop"
                  className={isFlapOpen ? "open-flap" : ""}
                  style={{ zIndex: flapZIndex }}
                />
                <div id="body-container">
                  <img src="/images/body.png" id="body" alt="Tubuh Amplop" />
                  <div
                    id="guest-info"
                    className={isSealFaded ? "fade-out" : ""}
                  >
                    <p className="guest-to">Kepada Yth:</p>
                    {isLoadingGuest ? (
                      <div className="guest-name-loading-wrapper" title="Memuat nama tamu...">
                        <div className="guest-name-skeleton"></div>
                      </div>
                    ) : (
                      <p id="guest-name" className="guest-name-fade-in">
                        {formatGuestName(guestName)}
                      </p>
                    )}
                  </div>
                </div>
                <img
                  src="/images/seal.png"
                  id="seal"
                  alt="Segel Lilin"
                  className={isSealFaded ? "fade-out" : ""}
                  onClick={handleOpenEnvelope}
                />
              </div>
            </div>
            <div
              className={`bottom-envelope-hint ${isSealFaded ? "fade-out" : ""}`}
            >
              Ketuk Segel Untuk Membuka
            </div>
            <div
              id="white-overlay"
              className={showOverlay ? "show-overlay" : ""}
            ></div>
          </div>
        )}

        <div
          id="main-content"
          className={`${hideEnvelopeScreen ? "" : "hidden"} ${showMainContent ? "visible" : ""}`}
        >
          {/* 1. HERO SECTION (Nama yang nikah) */}
          <section className="hero-section">
            <div className="hero-badge animate-fade-down">Pernikahan</div>
            <h1 className="hero-names animate-title">
              M. Dzikri Fauzan <span className="ampersand">&</span> Resa Erviana
            </h1>
            <div className="scroll-indicator animate-bounce">
              <span>Gulir Ke Bawah</span>
              <div className="arrow-down">↓</div>
            </div>
          </section>

          {/* BACKGROUND MOTIF BERULANG DI BAWAH JUMBOTRON & GRADASI */}
          <div className="invitation-body-pattern">
            {/* 1b. QURAN VERSE SECTION (Kutipan QS. Ar-Rum: 21) */}
            <section className="quote-section reveal-on-scroll">
            <div className="quote-container">
              <h2 className="section-title">Tentang Cinta yang Menenangkan</h2>
              <p className="quote-text">
                "Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu isteri-isteri dari jenismu sendiri, supaya kamu cenderung dan merasa tenteram kepadanya, dan dijadikan-Nya diantaramu rasa kasih dan sayang. Sesungguhnya pada yang demikian itu benar-benar terdapat tanda-tanda bagi kaum yang berfikir."
              </p>
              <div className="quote-source">
                (QS. Ar-Rum Ayat 21)
              </div>
            </div>
          </section>

          {/* 2. FLIP CLOCK (Hitung mundur) */}
          <section className="section-padding reveal-on-scroll">
            <div className="save-the-date-container">
              <img
                src="/images/flower-branch.png"
                className="flower-decor top-right"
                alt="Bunga Hiasan"
              />

              <div className="flip-clock-card">
                <h2 className="section-title">Simpan Tanggalnya</h2>
                <div className="date-highlight">Minggu, 30 Agustus 2026</div>
                <div className="flip-clock-board">
                  {["days", "hours", "minutes", "seconds"].map((unit) => (
                    <div key={unit} className="flip-group">
                      <div className="flip-pair">
                        <div className="flip-card-digit">
                          <span>{timeLeft[unit][0]}</span>
                          <div className="card-line"></div>
                          <div className="pin left"></div>
                          <div className="pin right"></div>
                        </div>
                        <div className="flip-card-digit">
                          <span>{timeLeft[unit][1]}</span>
                          <div className="card-line"></div>
                          <div className="pin left"></div>
                          <div className="pin right"></div>
                        </div>
                      </div>
                      <div className="clock-label">
                        {unit === "days"
                          ? "HARI"
                          : unit === "hours"
                            ? "JAM"
                            : unit === "minutes"
                              ? "MENIT"
                              : "DETIK"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <img
                src="/images/flower-branch.png"
                className="flower-decor bottom-left"
                alt="Bunga Hiasan"
              />
            </div>
          </section>
          {/* 4. LOKASI ACARA (Maps) */}
          <section className="section-padding reveal-on-scroll">
            <div className="location-card">
              <h2 className="section-title" style={{ marginTop: "20px" }}>
                Lokasi Acara
              </h2>
              <div className="map-responsive">
                <iframe
                  title="Google Maps Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.521260322283!2d106.81956135000001!3d-6.194741399999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f5390917b759%3A0x6b45e6782db50a81!2sGrand%20Hyatt%20Jakarta!5e0!3m2!1sid!2sid!4v1700000000000!5m2!1sid!2sid"
                  width="100%"
                  height="240"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                ></iframe>
              </div>
              <div className="address-details">
                <h3>Grand Ballroom Hotel</h3>
                <p>
                  Jl. M.H. Thamrin No.28-30, Gondangdia, Kec. Menteng, Jakarta
                  Pusat
                </p>
              </div>
            </div>
          </section>

          {/* 5. OUR LOVE STORY TIMELINE */}
          <section className="section-padding timeline-section">
            <h2 className="section-title reveal-on-scroll">Our Love Story</h2>
            <div className="timeline-container">
              <div className="timeline-item reveal-on-scroll timeline-anim">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <div className="timeline-date">2024</div>
                  <h3 className="timeline-title">Pertemuan Pertama</h3>
                  <p className="timeline-text">Satu tempat kerja yang sama</p>
                </div>
              </div>

              <div className="timeline-item reveal-on-scroll timeline-anim">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <div className="timeline-date">DESEMBER 2025</div>
                  <h3 className="timeline-title">Tunangan</h3>
                  <p className="timeline-text">
                    Dengan restu kedua orang tua, tukar cincin dan komitmen
                    resmi pernikahan.
                  </p>
                </div>
              </div>

              <div className="timeline-item reveal-on-scroll timeline-anim">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <div className="timeline-date">AGUSTUS 2026</div>
                  <h3 className="timeline-title">Lamaran</h3>
                  <p className="timeline-text">
                    Dengan restu kedua orang tua, kami memutuskan untuk
                    melangkah ke jenjang yang lebih serius.
                  </p>
                </div>
              </div>

              <div className="timeline-item reveal-on-scroll timeline-anim">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <div className="timeline-date">2026</div>
                  <h3 className="timeline-title">Pernikahan</h3>
                  <p className="timeline-text">
                    Insyallah 26 September 2026 Alhamdulillah, kami siap memulai
                    kehidupan baru bersama dalam ikatan suci pernikahan.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* SISA KONTEN SAMA DI BAWAHNYA */}

          {/* FORM RSVP */}
          <section className="section-padding rsvp-section reveal-on-scroll">
            <div className="modern-rsvp-card">
              <div className="rsvp-header">
                <span className="rsvp-tag">RSVP & Kehadiran</span>
                <h2>Konfirmasi Kehadiran</h2>
                <p>
                  Silakan isi form di bawah ini untuk konfirmasi kehadiran Anda.
                </p>
              </div>

              <form className="rsvp-form" onSubmit={handleSubmitRSVP}>
                <div className="form-group">
                  <label>Nama Tamu</label>
                  <input
                    type="text"
                    className="form-input"
                    value={rsvpName}
                    onChange={(e) => setRsvpName(e.target.value)}
                    placeholder="Masukkan Nama Anda..."
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Status Kehadiran</label>
                  <div className="radio-pills">
                    <button
                      type="button"
                      className={`pill-btn ${attendance === "Hadir" ? "active" : ""}`}
                      onClick={() => setAttendance("Hadir")}
                    >
                      ✓ Hadir
                    </button>
                    <button
                      type="button"
                      className={`pill-btn ${attendance === "Tidak Bisa Hadir" ? "active" : ""}`}
                      onClick={() => setAttendance("Tidak Bisa Hadir")}
                    >
                      ✕ Maaf Tidak Bisa
                    </button>
                  </div>
                </div>

                {attendance === "Hadir" && (
                  <div className="form-group">
                    <label>Jumlah Tamu yang Hadir</label>
                    <div className="counter-container">
                      <button
                        type="button"
                        className="counter-btn"
                        onClick={() =>
                          setGuestCount(Math.max(1, guestCount - 1))
                        }
                      >
                        −
                      </button>
                      <span className="counter-value">{guestCount}</span>
                      <button
                        type="button"
                        className="counter-btn"
                        onClick={() => setGuestCount(guestCount + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Pesan / Doa Ucapan</label>
                  <textarea
                    className="form-input textarea"
                    rows="3"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tuliskan ucapan selamat untuk kedua mempelai..."
                    required
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Menyimpan ke Database..." : "Kirim"}
                </button>
              </form>
            </div>
          </section>

          {/* WEDDING GIFT */}
          <section className="section-padding reveal-on-scroll">
            <div className="gift-card-mini">
              <div className="gift-icon-wrap">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <rect x="3" y="8" width="18" height="13" rx="1.5" />
                  <path d="M3 12h18" />
                  <path d="M12 8v13" />
                  <path d="M12 8c-1.8 0-3.2-1.4-3.2-3.2S10.2 1.6 12 3.4c1.8-1.8 3.2-1.4 3.2 1.4S13.8 8 12 8Z" />
                </svg>
              </div>

              <h2 className="section-title" style={{ marginBottom: "6px" }}>
                Tanda Kasih
              </h2>
              <p className="gift-teaser-text">
                Doa restu Anda sudah menjadi hadiah terindah bagi kami. Namun
                bila ingin memberi lebih, kami dengan senang hati menerimanya.
              </p>

              <button
                className={`gift-toggle-btn ${showGiftDetails ? "is-open" : ""}`}
                onClick={() => setShowGiftDetails((prev) => !prev)}
              >
                {showGiftDetails ? "Tutup" : "Kirim Hadiah"}
                <svg
                  className="gift-toggle-arrow"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              <div
                className={`gift-accounts-reveal ${showGiftDetails ? "open" : ""}`}
              >
                <div className="gift-accounts-inner">
                  {/* Custom Dropdown Selector */}
                  <div className="gift-dropdown-container">
                    <label className="gift-dropdown-label">Pilih Rekening:</label>
                    <div className="gift-dropdown">
                      <button
                        type="button"
                        className={`gift-dropdown-trigger ${isDropdownOpen ? "active" : ""}`}
                        onClick={() => setIsDropdownOpen((prev) => !prev)}
                      >
                        <span className="gift-dropdown-selected-wrap">
                          {selectedAccountId ? (
                            <>
                              <img
                                src={giftAccounts.find((acc) => acc.id === selectedAccountId)?.logo}
                                alt="Logo"
                                className="gift-item-logo-mini"
                              />
                              <span className="gift-dropdown-selected-text">
                                {giftAccounts.find((acc) => acc.id === selectedAccountId)?.label}
                              </span>
                            </>
                          ) : (
                            <span className="gift-dropdown-selected-text">
                              — Pilih Rekening —
                            </span>
                          )}
                        </span>
                        <svg
                          className={`gift-dropdown-arrow ${isDropdownOpen ? "is-open" : ""}`}
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </button>

                      {isDropdownOpen && (
                        <div className="gift-dropdown-menu">
                          {giftAccounts.map((acc) => (
                            <button
                              key={acc.id}
                              type="button"
                              className={`gift-dropdown-item ${selectedAccountId === acc.id ? "selected" : ""}`}
                              onClick={() => {
                                setSelectedAccountId(acc.id);
                                setIsDropdownOpen(false);
                                setCopiedTarget(""); // reset status salin
                              }}
                            >
                              <img src={acc.logo} alt="BSI" className="gift-item-logo-mini" />
                              <span className="gift-item-label">{acc.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Detil Rekening yang Terpilih */}
                  {selectedAccountId && (() => {
                    const activeAcc = giftAccounts.find((acc) => acc.id === selectedAccountId);
                    if (!activeAcc) return null;
                    return (
                      <div className="gift-detail-card" key={activeAcc.id}>
                        <div className="gift-detail-header">
                          <div className="gift-detail-header-left">
                            <img src={activeAcc.logo} alt="BSI Logo" className="gift-bank-logo" />
                            <span className="gift-detail-bank">{activeAcc.bankName}</span>
                          </div>
                        </div>
                        
                        <div className="gift-detail-body">
                          <p className="gift-detail-label">Nomor Rekening:</p>
                          <div className="gift-number-row">
                            <span className="gift-detail-value number-style">
                              {activeAcc.accountNumber}
                            </span>
                            <button
                              type="button"
                              className={`gift-copy-btn-compact ${copiedTarget === activeAcc.id ? "copied" : ""}`}
                              onClick={() => handleCopyText(activeAcc.accountNumber, activeAcc.id)}
                            >
                              {copiedTarget === activeAcc.id ? "Tersalin ✓" : "Salin"}
                            </button>
                          </div>
                          <p className="gift-detail-holder">
                            Atas Nama: <strong className="holder-name">{activeAcc.accountHolder}</strong>
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION KOMENTAR DENGAN GRADASI FADE */}
          {comments.length > 0 && (
            <section className="section-padding reveal-on-scroll">
              <div className="guestbook-container">
                <h2 className="section-title">Ucapan & Doa</h2>
                <p className="guestbook-subtitle">
                  {comments.length} Pesan dari kerabat & sahabat
                </p>

                <div
                  className={`comments-wrapper ${!showAllComments && comments.length > 3 ? "has-gradient" : ""}`}
                >
                  <div className="comments-list">
                    {displayedComments.map((comment) => (
                      <div key={comment.id} className="comment-card">
                        <div className="comment-header">
                          <div className="comment-avatar">
                            {comment.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="comment-info">
                            <h4>{comment.name}</h4>
                            <span
                              className={`attendance-badge ${comment.attendance === "Hadir" ? "hadir" : "absen"}`}
                            >
                              {comment.attendance === "Hadir"
                                ? "✓ Hadir"
                                : "✕ Tidak Hadir"}
                            </span>
                          </div>
                        </div>
                        <p className="comment-message">"{comment.message}"</p>
                      </div>
                    ))}
                  </div>
                </div>

                {comments.length > 3 && (
                  <button
                    className="show-more-btn"
                    onClick={() => setShowAllComments(!showAllComments)}
                  >
                    {showAllComments ? "Sembunyikan Sebagian" : "Lihat Semua"}
                  </button>
                )}
              </div>
            </section>
          )}

          <footer className="wedding-footer">
            <p>M. Dzikri Fauzan & Resa Erviana © 2026</p>
          </footer>
          </div>

          {/* Floating Vinyl Music Player */}
          <div
            className={`floating-music-player ${isPlaying ? "playing" : ""}`}
            onClick={togglePlay}
            title={isPlaying ? "Klik untuk jeda musik" : "Klik untuk putar musik"}
          >
            <div className="floating-vinyl-record">
              <img
                src="/images/Tulus.jpg"
                onError={(e) => {
                  e.target.src = "/images/bg.jpg";
                }}
                alt="Music Cover"
                className="floating-vinyl-cover"
              />
              <div className="floating-vinyl-center"></div>
            </div>
            <div className="floating-vinyl-icon">
              {isPlaying ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
