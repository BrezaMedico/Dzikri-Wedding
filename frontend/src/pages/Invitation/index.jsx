import { useState, useEffect, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./Invitation.css";
import { formatGuestName } from "../../lib/formatGuestName";

// Komponen Kartu Digit Animasi 3D Flip (Angka Utuh, Jelas & Tanpa Garis Pembatas Tengah)
function FlipDigit({ digit }) {
  const [displayDigit, setDisplayDigit] = useState(digit);
  const [nextDigit, setNextDigit] = useState(digit);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (digit !== displayDigit) {
      setNextDigit(digit);
      setIsFlipping(true);

      const timer = setTimeout(() => {
        setDisplayDigit(digit);
        setIsFlipping(false);
      }, 380);

      return () => clearTimeout(timer);
    }
  }, [digit, displayDigit]);

  return (
    <div className="flip-card-digit">
      <div className={`digit-face ${isFlipping ? "flip-out" : ""}`}>
        {displayDigit}
      </div>
      {isFlipping && (
        <div className="digit-face flip-in">
          {nextDigit}
        </div>
      )}
    </div>
  );
}

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

  // Data Profil Kedua Mempelai (Nama Lengkap, Gelar & Nama Orang Tua)
  const coupleInfo = {
    bride: {
      fullName: "Resa Erviana, S.Pd.",
      role: "Mempelai Wanita",
      photo: "/images/resa.png",
      instagram: "ressaerv",
      relation: "Putri terakhir dari",
      fatherName: "Bapak H. Abdul Hamid, S.Pd.I. (Almarhum)",
      motherName: "Ibu Hj. Iom Romsyah",
    },
    groom: {
      fullName: "Muhamad Dzikri Fauzan, S.Kom., Gr.",
      role: "Mempelai Pria",
      photo: "/images/dzikri.png",
      instagram: "dzikri_fauzan11",
      relation: "Putra ketiga dari",
      fatherName: "Bapak Drs. Yayan Royani (Almarhum)",
      motherName: "Ibu E. Nurjanah",
    },
  };

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

  // Data 4 Slot Foto Galeri
  const galleryPhotos = useMemo(
    () => [
      { id: 1, src: "/images/gallery-1.jpg", alt: "Momen Bahagia 1 - M. Dzikri Fauzan & Resa Erviana" },
      { id: 2, src: "/images/gallery-2.jpg", alt: "Momen Bahagia 2 - M. Dzikri Fauzan & Resa Erviana" },
      { id: 3, src: "/images/gallery-3.jpg", alt: "Momen Bahagia 3 - M. Dzikri Fauzan & Resa Erviana" },
      { id: 4, src: "/images/gallery-4.jpg", alt: "Momen Bahagia 4 - M. Dzikri Fauzan & Resa Erviana" },
    ],
    [],
  );

  // State 3D Photo Card Viewer Modal
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, rotX: 0, rotY: 0 });

  const handleOpen3DCard = (index) => {
    setSelectedPhotoIndex(index);
    setRotX(0);
    setRotY(0);
  };

  const handleClose3DCard = () => {
    setSelectedPhotoIndex(null);
    setRotX(0);
    setRotY(0);
    setIsDragging(false);
  };

  const handleFlipCard = (e) => {
    if (e) e.stopPropagation();
    setRotY((prev) => {
      const normalized = Math.round(prev / 180) * 180;
      return normalized % 360 === 0 ? normalized + 180 : normalized - 180;
    });
  };

  const handleNextPhoto = (e) => {
    if (e) e.stopPropagation();
    setRotX(0);
    setRotY(0);
    setSelectedPhotoIndex((prev) =>
      prev !== null ? (prev + 1) % galleryPhotos.length : null,
    );
  };

  const handlePrevPhoto = (e) => {
    if (e) e.stopPropagation();
    setRotX(0);
    setRotY(0);
    setSelectedPhotoIndex((prev) =>
      prev !== null
        ? (prev - 1 + galleryPhotos.length) % galleryPhotos.length
        : null,
    );
  };

  const handlePointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      rotX,
      rotY,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    const newRotY = dragStartRef.current.rotY + deltaX * 0.55;
    const newRotX = Math.max(
      -60,
      Math.min(60, dragStartRef.current.rotX - deltaY * 0.55)
    );
    setRotY(newRotY);
    setRotX(newRotX);
  };

  const handlePointerUp = (e) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedPhotoIndex === null) return;
      if (e.key === "Escape") handleClose3DCard();
      if (e.key === "ArrowRight") handleNextPhoto();
      if (e.key === "ArrowLeft") handlePrevPhoto();
      if (e.key === " " || e.key === "Enter") handleFlipCard();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPhotoIndex]);

  // State Komentar / Buku Tamu
  const [showAllComments, setShowAllComments] = useState(false);
  const [comments, setComments] = useState([]);

  const flowers = useMemo(() => {
    // Variasi ukuran bunga bervariasi dari 10px (kecil halus) hingga 36px (besar anggun)
    const sizes = [10, 14, 18, 22, 26, 32, 12, 16, 20, 24, 30, 36];
    const opacities = [0.4, 0.55, 0.65, 0.75, 0.5, 0.6, 0.7];

    return Array.from({ length: 32 }).map((_, i) => ({
      id: i,
      left: `${(i * 3.125 + (i % 5) * 1.8) % 96}%`,
      duration: `${8 + (i % 6) * 2}s`,
      delay: `${(i * 0.45) % 9}s`,
      size: `${sizes[i % sizes.length]}px`,
      opacity: opacities[i % opacities.length],
      swayClass: i % 2 === 0 ? "sway-left" : "sway-right",
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
    const targetDate = new Date("2026-09-26T09:00:00").getTime();
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

      {/* ANIMASI BUNGA JATUH — Fixed di viewport di luar main-content sehingga tidak mengikuti scroll */}
      {showMainContent && (
        <div className="falling-leaves-container">
          {flowers.map((flower) => (
            <div
              key={flower.id}
              className={`leaf-item ${flower.swayClass}`}
              style={{
                left: flower.left,
                animationDuration: flower.duration,
                animationDelay: flower.delay,
                width: flower.size,
                height: flower.size,
              }}
            >
              {/* SVG Bunga Kelopak 4 */}
              <svg viewBox="0 0 24 24" fill="#c29b62" opacity={flower.opacity}>
                <path d="M12,2 C15,2 16,5 16,8 C19,8 22,9 22,12 C22,15 19,16 16,16 C16,19 15,22 12,22 C9,22 8,19 8,16 C5,16 2,15 2,12 C2,9 5,8 8,8 C8,5 9,2 12,2 Z" />
              </svg>
            </div>
          ))}
        </div>
      )}

      <div id="app-container">
        {!hideEnvelopeScreen && (
          <div id="envelope-screen">
            <div className="perspective-container">
              <div id="envelope" className={isZoomed ? "zoom-in" : ""}>
                <div id="envelope-back"></div>
                <div id="paper" className={isPaperUp ? "slide-up-paper" : ""}>
                  <div className="paper-content">
                    <h2>Simpan Tanggalnya</h2>
                    <p>Sabtu, 26 September 2026</p>
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
            {/* 1b. QURAN VERSE & INFORMASI KEDUA MEMPELAI (CONTAINER TERSATU) */}
            <section className="section-padding couple-section reveal-on-scroll">
              <div className="couple-card-container">
                {/* Bagian Ayat QS. Ar-Rum: 21 (Rapi, Anggun & Bersih) */}
                <div className="quote-block">
                  <div className="quote-badge">QS. Ar-Rum : 21</div>
                  <h2 className="section-title quote-title">Tentang Cinta yang Menenangkan</h2>
                  
                  <div className="quote-text-wrapper">
                    <span className="quote-mark open">“</span>
                    <p className="quote-text">
                      Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu isteri-isteri dari jenismu sendiri, supaya kamu cenderung dan merasa tenteram kepadanya, dan dijadikan-Nya diantaramu rasa kasih dan sayang. Sesungguhnya pada yang demikian itu benar-benar terdapat tanda-tanda bagi kaum yang berfikir.
                    </p>
                    <span className="quote-mark close">”</span>
                  </div>
                </div>

                {/* Ornamen Pemisah Menuju Profil Mempelai */}
                <div className="section-divider-ornament">
                  <div className="section-divider-line"></div>
                  <div className="divider-diamond">✦</div>
                  <div className="section-divider-line"></div>
                </div>

                {/* Header Mempelai */}
                <div className="couple-header">
                  <h2 className="section-title couple-title">Kedua Mempelai</h2>
                </div>

                {/* Grid Profil Mempelai */}
                <div className="couple-grid">
                  {/* Mempelai Pria */}
                  <div className="profile-card groom-card">
                    <div className="profile-photo-wrapper">
                      <div className="profile-photo-frame">
                        <img
                          src={coupleInfo.groom.photo}
                          alt={coupleInfo.groom.fullName}
                          className="profile-photo"
                        />
                      </div>
                      <span className="role-pill">{coupleInfo.groom.role}</span>
                    </div>

                    <div className="profile-details">
                      <h3 className="profile-name">{coupleInfo.groom.fullName}</h3>
                      <div className="lineage-box">
                        <span className="lineage-relation">{coupleInfo.groom.relation}</span>
                        <div className="lineage-parents">
                          <p className="parent-line">{coupleInfo.groom.fatherName}</p>
                          <p className="parent-line">dan {coupleInfo.groom.motherName}</p>
                        </div>
                      </div>

                      {coupleInfo.groom.instagram && (
                        <a
                          href={`https://instagram.com/${coupleInfo.groom.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="profile-ig-btn"
                          title={`Instagram ${coupleInfo.groom.fullName}`}
                        >
                          <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                          <span>@{coupleInfo.groom.instagram}</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Ornamen Penghubung Tengah Romantis */}
                  <div className="couple-center-divider">
                    <div className="divider-ornament-line"></div>
                    <div className="couple-ampersand-badge">
                      <span className="ampersand-char">&</span>
                    </div>
                    <div className="divider-ornament-line"></div>
                  </div>

                  {/* Mempelai Wanita */}
                  <div className="profile-card bride-card">
                    <div className="profile-photo-wrapper">
                      <div className="profile-photo-frame">
                        <img
                          src={coupleInfo.bride.photo}
                          alt={coupleInfo.bride.fullName}
                          className="profile-photo"
                        />
                      </div>
                      <span className="role-pill">{coupleInfo.bride.role}</span>
                    </div>

                    <div className="profile-details">
                      <h3 className="profile-name">{coupleInfo.bride.fullName}</h3>
                      <div className="lineage-box">
                        <span className="lineage-relation">{coupleInfo.bride.relation}</span>
                        <div className="lineage-parents">
                          <p className="parent-line">{coupleInfo.bride.fatherName}</p>
                          <p className="parent-line">dan {coupleInfo.bride.motherName}</p>
                        </div>
                      </div>

                      {coupleInfo.bride.instagram && (
                        <a
                          href={`https://instagram.com/${coupleInfo.bride.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="profile-ig-btn"
                          title={`Instagram ${coupleInfo.bride.fullName}`}
                        >
                          <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                          <span>@{coupleInfo.bride.instagram}</span>
                        </a>
                      )}
                    </div>
                  </div>
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
                <div className="date-highlight">Sabtu, 26 September 2026</div>
                <div className="flip-clock-board">
                  {["days", "hours", "minutes", "seconds"].map((unit) => (
                    <div key={unit} className="flip-group">
                      <div className="flip-pair">
                        <FlipDigit digit={timeLeft[unit][0]} />
                        <FlipDigit digit={timeLeft[unit][1]} />
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

                {/* Jadwal Rangkaian Acara (Akad & Resepsi) */}
                <div className="event-schedule-container">
                  <div className="schedule-divider">
                    <div className="schedule-divider-line"></div>
                    <div className="schedule-divider-diamond">✦</div>
                    <div className="schedule-divider-line"></div>
                  </div>

                  <div className="schedule-grid">
                    {/* Akad Nikah */}
                    <div className="schedule-item">
                      <div className="schedule-badge">Akad Nikah</div>
                      <div className="schedule-time">
                        <svg className="schedule-clock-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>09:00 WIB - SELESAI</span>
                      </div>
                    </div>

                    {/* Resepsi Nikah */}
                    <div className="schedule-item">
                      <div className="schedule-badge">Resepsi Nikah</div>
                      <div className="schedule-time">
                        <svg className="schedule-clock-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>11:00 WIB - 17:00 WIB</span>
                      </div>
                    </div>
                  </div>
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
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3963.6429368232684!2d106.62292377499327!3d-6.566671893426604!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69d9b63b711aeb%3A0x8088d78f2ceee1b7!2sSaung%20Abah%20BTN!5e0!3m2!1sid!2sid!4v1789050302248!5m2!1sid!2sid"
                  width="100%"
                  height="260"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                ></iframe>
              </div>
              <div className="address-details">
                <h3>Saung Abah BTN</h3>
                <p>
                  Cibeber I, Kec. Leuwiliang, Kabupaten Bogor, Jawa Barat
                </p>
                <a
                  href="https://maps.google.com/?q=Saung+Abah+BTN"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="open-map-btn"
                  title="Buka Rute di Google Maps"
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <span>Buka Google Maps</span>
                </a>
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

          {/* GALERI FOTO (4 SLOT FOTO AESTHETIC DENGAN LIGHTBOX) */}
          <section className="section-padding reveal-on-scroll">
            <div className="gallery-section-card">
              <div className="gallery-header">
                <span className="gallery-tag">Galeri Cinta</span>
                <h2 className="section-title">Momen Bahagia</h2>
                <p className="gallery-subtitle">
                  Setiap detik mengabadikan ketulusan dan kehangatan rasa kami berdua
                </p>
              </div>

              <div className="gallery-grid">
                {galleryPhotos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="gallery-item"
                    onClick={() => handleOpen3DCard(index)}
                  >
                    <div className="gallery-frame-outer">
                      <div className="gallery-img-wrapper">
                        <img
                          src={photo.src}
                          alt={photo.alt}
                          className="gallery-img"
                          loading="lazy"
                        />
                        <div className="gallery-overlay">
                          <div className="gallery-zoom-icon">
                            <svg
                              width="22"
                              height="22"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                              <line x1="12" y1="22.08" x2="12" y2="12" />
                            </svg>
                          </div>
                          <span className="gallery-view-hint">Sentuh untuk 3D</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 3D PARALLAX PHOTO CARD MODAL */}
          {selectedPhotoIndex !== null && (
            <div
              className="gallery-3d-backdrop"
              onClick={handleClose3DCard}
            >
              {/* Top Navigation Bar with Prominent Back Button */}
              <div
                className="gallery-3d-topbar"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="gallery-3d-back-btn"
                  onClick={handleClose3DCard}
                  title="Kembali ke Halaman Undangan"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                  <span>Kembali</span>
                </button>

                <div className="gallery-3d-hint-badge">
                  <span className="hint-hand-icon">🖐️</span>
                  <span>Seret foto untuk putar 3D</span>
                </div>

                <div className="gallery-3d-top-actions">
                  <button
                    type="button"
                    className="gallery-3d-btn-pill flip-btn"
                    onClick={handleFlipCard}
                    title="Balik Sisi Depan / Belakang"
                  >
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                    </svg>
                    <span>Balik Kartu</span>
                  </button>
                  <button
                    type="button"
                    className="gallery-3d-close-btn"
                    onClick={handleClose3DCard}
                    title="Tutup (Esc)"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* 3D Interactive Stage */}
              <div
                className="gallery-3d-stage"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                <div
                  className={`gallery-3d-card ${isDragging ? "is-dragging" : ""}`}
                  style={{
                    transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
                  }}
                >
                  {/* SISI DEPAN (FOTO PERNIKAHAN DENGAN BINGKAI KERTAS ARTISTIK) */}
                  <div className="gallery-card-face card-front">
                    <div className="card-front-inner">
                      <div className="card-photo-box">
                        <img
                          src={galleryPhotos[selectedPhotoIndex].src}
                          alt={galleryPhotos[selectedPhotoIndex].alt}
                          className="card-photo-img"
                          draggable="false"
                        />
                        <div className="card-sheen-highlight"></div>
                      </div>
                      <div className="card-front-caption">
                        <div className="card-caption-decor">✦ • ✤ • ✦</div>
                        <div className="card-caption-names">M. Dzikri Fauzan &amp; Resa Erviana</div>
                        <div className="card-caption-sub">The Wedding • 26 September 2026</div>
                      </div>
                    </div>
                  </div>

                  {/* SISI BELAKANG (TULISAN SAMBUNG ELEGAN NAMA KEDUA MEMPELAI) */}
                  <div className="gallery-card-face card-back">
                    <div className="card-back-texture">
                      <div className="card-back-inner-frame">
                        <div className="card-back-corner tl">❧</div>
                        <div className="card-back-corner tr">❧</div>
                        <div className="card-back-corner bl">❧</div>
                        <div className="card-back-corner br">❧</div>

                        <div className="card-back-subhead">The Wedding of</div>

                        {/* TULISAN SAMBUNG BESAR & ANGGUN */}
                        <div className="card-back-cursive-title">
                          M. Dzikri Fauzan
                        </div>
                        <div className="card-back-cursive-amp">&amp;</div>
                        <div className="card-back-cursive-title">
                          Resa Erviana
                        </div>

                        <div className="card-back-quote-divider">
                          <span className="card-divider-line"></span>
                          <span className="card-divider-gem">✦</span>
                          <span className="card-divider-line"></span>
                        </div>

                        <p className="card-back-quote-text">
                          “Setiap kisah cinta itu indah, namun kisah cinta kami adalah yang paling kami syukuri.”
                        </p>

                        <div className="card-back-monogram-seal">
                          <div className="monogram-wax">
                            <span className="monogram-initials">D &amp; R</span>
                          </div>
                        </div>

                        <div className="card-back-date-text">
                          26 • 09 • 2026
                        </div>

                        <div className="card-back-drag-tip">
                          ↺ Seret kembali untuk melihat foto
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Photo Navigation & Counter */}
              <div
                className="gallery-3d-bottom-controls"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="gallery-3d-nav-btn prev"
                  onClick={handlePrevPhoto}
                  title="Foto Sebelumnya (←)"
                >
                  ‹
                </button>

                <div className="gallery-3d-counter">
                  {selectedPhotoIndex + 1} / {galleryPhotos.length}
                </div>

                <button
                  type="button"
                  className="gallery-3d-nav-btn next"
                  onClick={handleNextPhoto}
                  title="Foto Selanjutnya (→)"
                >
                  ›
                </button>
              </div>
            </div>
          )}

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
                src="/images/bermuara.jpg"
                onError={(e) => {
                  e.target.src = "/images/bg.jpg";
                }}
                alt="Music Cover Bermuara"
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
