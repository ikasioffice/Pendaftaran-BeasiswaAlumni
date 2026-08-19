/* === MAIN.JS - Shared Utilities === */

// ⚠️ GANTI dengan URL Web App Apps Script kamu setelah deploy (lihat PANDUAN_PUBLISH.md)
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyzZ5B-tjw8zdZjkNWOSD99ZnTtJSocamoBH9dM4bvFYz9vKvd_zlJoE60nqxw9oW6H/exec';
// ⚠️ Harus SAMA PERSIS dengan ADMIN_TOKEN di Code.gs
const ADMIN_API_TOKEN = 'beasiswa2026';

let _pendaftarCache = JSON.parse(localStorage.getItem('beasiswa_pendaftar') || '[]');

const DB = {
    getPendaftar: () => _pendaftarCache,
    setPendaftar: (d) => { _pendaftarCache = d; localStorage.setItem('beasiswa_pendaftar', JSON.stringify(d)); },

    // Ambil data pendaftar terbaru dari Google Sheets (dipakai di dashboard admin)
    async syncPendaftarFromServer() {
        try {
            const url = `${APPS_SCRIPT_URL}?action=list&token=${encodeURIComponent(ADMIN_API_TOKEN)}`;
            const res = await fetch(url);
            const json = await res.json();
            if (json.ok) {
                DB.setPendaftar(json.data);
                return { ok: true };
            }
            return { ok: false, error: json.error };
        } catch (err) {
            return { ok: false, error: 'Gagal terhubung ke server. Cek koneksi internet / URL Apps Script.' };
        }
    },

    // Kirim data pendaftaran baru ke Google Sheets (dipakai di halaman pendaftaran)
    async submitPendaftarToServer(data) {
        try {
            const res = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'submit', data })
            });
            const json = await res.json();
            return json;
        } catch (err) {
            return { ok: false, error: 'Gagal mengirim data. Cek koneksi internet.' };
        }
    },

    async updateStatusOnServer(id, status, pesan) {
        try {
            const res = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'updateStatus', id, status, pesan, token: ADMIN_API_TOKEN })
            });
            return await res.json();
        } catch (err) {
            return { ok: false, error: 'Gagal terhubung ke server.' };
        }
    },

    async deletePendaftarOnServer(id) {
        try {
            const res = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'delete', id, token: ADMIN_API_TOKEN })
            });
            return await res.json();
        } catch (err) {
            return { ok: false, error: 'Gagal terhubung ke server.' };
        }
    },

    getPengumuman: () => JSON.parse(localStorage.getItem('beasiswa_pengumuman') || '[]'),
    setPengumuman: (d) => localStorage.setItem('beasiswa_pengumuman', JSON.stringify(d)),
    getTimeline: () => JSON.parse(localStorage.getItem('beasiswa_timeline') || '[]'),
    setTimeline: (d) => localStorage.setItem('beasiswa_timeline', JSON.stringify(d)),
    getDeadline: () => localStorage.getItem('beasiswa_deadline') || '',
    setDeadline: (d) => localStorage.setItem('beasiswa_deadline', d),

    // Deadline global (dari Google Sheets, berlaku untuk semua pengunjung)
    async syncDeadlineFromServer() {
        try {
            const res = await fetch(`${APPS_SCRIPT_URL}?action=getDeadline`);
            const json = await res.json();
            if (json.ok && json.deadline) {
                DB.setDeadline(json.deadline);
                return { ok: true, deadline: json.deadline };
            }
            return { ok: false };
        } catch (err) {
            return { ok: false };
        }
    },

    async setDeadlineOnServer(value) {
        try {
            const res = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'setDeadline', value, token: ADMIN_API_TOKEN })
            });
            return await res.json();
        } catch (err) {
            return { ok: false, error: 'Gagal terhubung ke server.' };
        }
    },
    getHeroCards: () => {
        const raw = JSON.parse(localStorage.getItem('beasiswa_herocards') || 'null');
        if (!raw) return null;
        if (Array.isArray(raw)) return raw;
        const migrated = [
            { id: 'HC-1', icon: raw.card1.icon, judul: raw.card1.judul, sub: raw.card1.sub, urutan: 1 },
            { id: 'HC-2', icon: raw.card2.icon, judul: raw.card2.judul, sub: raw.card2.sub, urutan: 2 }
        ];
        localStorage.setItem('beasiswa_herocards', JSON.stringify(migrated));
        return migrated;
    },
    setHeroCards: (d) => localStorage.setItem('beasiswa_herocards', JSON.stringify(d)),
    isLoggedIn: () => sessionStorage.getItem('beasiswa_admin') === 'true',
    login: () => sessionStorage.setItem('beasiswa_admin', 'true'),
    logout: () => sessionStorage.removeItem('beasiswa_admin')
};

const ADMIN_CREDS = { user: 'admin', pass: 'beasiswa2025' };

function formatDate(s) {
    if (!s) return '-';
    return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateShort(s) {
    if (!s) return '-';
    return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function generateId() {
    const yr = new Date().getFullYear();
    const n = String(Math.floor(Math.random() * 9000) + 1000);
    return `BPI-${yr}-${n}`;
}

function showToast(msg, type = 'success') {
    let t = document.getElementById('globalToast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'globalToast';
        t.className = 'toast';
        document.body.appendChild(t);
    }
    const icons = { success: '<i class="fas fa-check-circle"></i>', error: '<i class="fas fa-times-circle"></i>', info: '<i class="fas fa-info-circle"></i>' };
    t.className = `toast ${type}`;
    t.innerHTML = `${icons[type] || icons.success} ${msg}`;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 3500);
}

/* Navbar */
const navbar = document.getElementById('navbar');
if (navbar) {
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 60);
    });
}

const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('open');
        document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });
    navLinks.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('open');
            document.body.style.overflow = '';
        });
    });
}

/* Active nav */
(function () {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(a => {
        if (a.getAttribute('href') === page) a.classList.add('active');
    });
})();

/* Countdown */
let _countdownInterval = null;
function startCountdown(targetDate) {
    const el = document.getElementById('countdown');
    if (!el) return;
    if (_countdownInterval) clearInterval(_countdownInterval);
    const ids = ['days', 'hours', 'minutes', 'seconds'];
    function tick() {
        const diff = new Date(targetDate) - Date.now();
        if (diff <= 0) { ids.forEach(id => { const el = document.getElementById(id); if(el) el.textContent = '00'; }); return; }
        const vals = [
            Math.floor(diff / 86400000),
            Math.floor((diff % 86400000) / 3600000),
            Math.floor((diff % 3600000) / 60000),
            Math.floor((diff % 60000) / 1000)
        ];
        ids.forEach((id, i) => { const el = document.getElementById(id); if(el) el.textContent = String(vals[i]).padStart(2, '0'); });
    }
    tick();
    _countdownInterval = setInterval(tick, 1000);
}
if (document.getElementById('countdown')) {
    if (!DB.getDeadline()) DB.setDeadline('2025-03-31T23:59:59');
    startCountdown(DB.getDeadline());
    const deadlineEl = document.getElementById('ctaDeadlineText');
    if (deadlineEl) deadlineEl.textContent = formatDate(DB.getDeadline());

    // Tarik deadline terbaru dari server (Google Sheets), lalu restart countdown kalau berubah
    DB.syncDeadlineFromServer().then(result => {
        if (result.ok) {
            startCountdown(DB.getDeadline());
            if (deadlineEl) deadlineEl.textContent = formatDate(DB.getDeadline());
        }
    });
}

/* Tema Siang / Malam */
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
        btn.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        btn.classList.toggle('is-on', theme === 'dark');
        btn.setAttribute('aria-label', theme === 'dark' ? 'Mode Terang' : 'Mode Gelap');
    });
}
function toggleTheme() {
    const next = (localStorage.getItem('beasiswa_theme') || 'light') === 'dark' ? 'light' : 'dark';
    localStorage.setItem('beasiswa_theme', next);
    applyTheme(next);
}
applyTheme(localStorage.getItem('beasiswa_theme') || 'light');

/* Musik Latar (YouTube) */
const YT_VIDEO_ID = 'zbPt9LkPT4c';
const YT_START_SECONDS = 1;
let ytPlayer = null;
let ytReady = false;
let musicWantsPlay = false;

function applyMusicIcon(on) {
    document.querySelectorAll('.music-toggle-btn').forEach(btn => {
        btn.innerHTML = on ? '<i class="fas fa-volume-up"></i>' : '<i class="fas fa-volume-mute"></i>';
        btn.classList.toggle('is-on', on);
        btn.setAttribute('aria-label', on ? 'Matikan Musik' : 'Putar Musik');
    });
}

function createYtPlayer() {
    const el = document.getElementById('ytAudioPlayer');
    if (!el || !window.YT || !window.YT.Player) return;
    ytPlayer = new YT.Player('ytAudioPlayer', {
        height: '0', width: '0', videoId: YT_VIDEO_ID,
        playerVars: { autoplay: 0, controls: 0, start: YT_START_SECONDS, loop: 1, playlist: YT_VIDEO_ID },
        events: { onReady: () => { ytReady = true; if (musicWantsPlay) ytPlayer.playVideo(); } }
    });
}

function loadYouTubeAPI() {
    if (window.YT && window.YT.Player) { createYtPlayer(); return; }
    if (document.getElementById('ytIframeApi')) return;
    const tag = document.createElement('script');
    tag.id = 'ytIframeApi';
    tag.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(tag);
    window.onYouTubeIframeAPIReady = createYtPlayer;
}

function toggleMusic() {
    const next = localStorage.getItem('beasiswa_music') !== 'on';
    localStorage.setItem('beasiswa_music', next ? 'on' : 'off');
    musicWantsPlay = next;
    applyMusicIcon(next);
    if (!ytReady) { loadYouTubeAPI(); return; }
    if (next) ytPlayer.playVideo(); else ytPlayer.pauseVideo();
}

(function initMusic() {
    if (!document.getElementById('ytAudioPlayer')) return;
    const on = localStorage.getItem('beasiswa_music') === 'on';
    musicWantsPlay = on;
    applyMusicIcon(on);
    if (on) loadYouTubeAPI();
})();

/* Sample Data Init */
function initSampleData() {
    // Catatan: data Pendaftar sekarang datang dari Google Sheets (lihat DB.syncPendaftarFromServer),
    // jadi tidak lagi diisi contoh di sini.
    if (DB.getPengumuman().length > 0 && DB.getTimeline().length > 0 && DB.getHeroCards()) return;

    if (DB.getPengumuman().length === 0) {
        DB.setPengumuman([
            { id:'ANN-001', judul:'Pembukaan Pendaftaran Beasiswa Alumni Indonesia 2025', isi:'Program Beasiswa Alumni Indonesia resmi membuka pendaftaran untuk tahun akademik 2025/2026. Pendaftaran dibuka mulai 1 Januari hingga 31 Maret 2025. Pastikan Anda memenuhi semua persyaratan yang telah ditetapkan dan melengkapi dokumen pendaftaran sebelum batas waktu yang telah ditentukan. Kami menyediakan beasiswa bagi 50 mahasiswa berprestasi terpilih dari seluruh Indonesia.', tipe:'umum', tanggal:'2025-01-01T07:00:00Z', dibuat:'2024-12-28T10:00:00Z' },
            { id:'ANN-002', judul:'Pengumuman Hasil Seleksi Administrasi Tahap 1', isi:'Setelah melalui proses seleksi administrasi yang ketat, kami mengumumkan bahwa sebanyak 247 pendaftar dinyatakan lolos ke tahap wawancara. Daftar lengkap dapat dilihat dengan memasukkan Nomor ID Pendaftaran Anda di halaman ini. Bagi yang belum lolos, kami ucapkan terima kasih atas partisipasinya dan dapat mendaftar kembali pada periode berikutnya.', tipe:'seleksi', tanggal:'2025-04-20T09:00:00Z', dibuat:'2025-04-19T20:00:00Z' },
            { id:'ANN-003', judul:'Jadwal dan Petunjuk Wawancara Online', isi:'Wawancara akan dilaksanakan secara online via Zoom pada 1–10 Mei 2025. Peserta yang lolos seleksi administrasi akan menerima email konfirmasi jadwal wawancara masing-masing. Harap memastikan koneksi internet stabil dan berpakaian formal. Link Zoom akan dikirimkan H-1 sebelum jadwal wawancara Anda. Wawancara berlangsung sekitar 30 menit.', tipe:'wawancara', tanggal:'2025-04-22T09:00:00Z', dibuat:'2025-04-21T15:00:00Z' },
            { id:'ANN-004', judul:'Pengumuman Resmi Penerima Beasiswa 2025/2026', isi:'Dengan bangga kami mengumumkan 50 penerima Beasiswa Alumni Indonesia untuk tahun akademik 2025/2026. Selamat kepada seluruh penerima beasiswa! Proses administrasi penerimaan dan pencairan dana beasiswa akan dimulai pada Juni 2025. Mohon periksa email Anda untuk informasi langkah-langkah selanjutnya termasuk penandatanganan MoU dan pengisian data rekening.', tipe:'penerima', tanggal:'2025-05-20T09:00:00Z', dibuat:'2025-05-19T20:00:00Z' }
        ]);
    }

    if (!DB.getHeroCards()) {
        DB.setHeroCards([
            { id: 'HC-1', icon: '📚', judul: 'Pendaftaran Dibuka', sub: '1 Jan – 31 Mar 2025', urutan: 1 },
            { id: 'HC-2', icon: '✅', judul: 'Pendaftar Aktif', sub: '10 mahasiswa', urutan: 2 }
        ]);
    }

    if (DB.getTimeline().length === 0) {
        DB.setTimeline([
            { id:'TL-001', tanggal:'1 Jan – 31 Mar 2025', judul:'Pendaftaran Online', deskripsi:'Periode pendaftaran dan pengumpulan berkas dokumen melalui website resmi ini.', aktif:true, urutan:1 },
            { id:'TL-002', tanggal:'1 – 15 Apr 2025', judul:'Seleksi Administrasi', deskripsi:'Verifikasi kelengkapan dan keabsahan dokumen yang telah dikirimkan oleh calon penerima beasiswa.', aktif:false, urutan:2 },
            { id:'TL-003', tanggal:'20 Apr 2025', judul:'Pengumuman Seleksi Berkas', deskripsi:'Pengumuman hasil seleksi administrasi bagi pendaftar yang lolos ke tahap wawancara.', aktif:false, urutan:3 },
            { id:'TL-004', tanggal:'1 – 10 Mei 2025', judul:'Wawancara Online', deskripsi:'Sesi wawancara dengan tim seleksi untuk menilai motivasi, prestasi, dan potensi calon penerima.', aktif:false, urutan:4 },
            { id:'TL-005', tanggal:'20 Mei 2025', judul:'Pengumuman Penerima', deskripsi:'Pengumuman resmi penerima Beasiswa Alumni IKASI tahun akademik 2025/2026.', aktif:false, urutan:5 },
            { id:'TL-006', tanggal:'1 Jun 2025', judul:'Pencairan Dana', deskripsi:'Proses pencairan dana beasiswa ke rekening penerima yang telah terdaftar dan terverifikasi.', aktif:false, urutan:6 }
        ]);
    }
}

initSampleData();

/* ===== Maskot (bisa dipindahkan dengan drag & drop / sentuh) ===== */
(function initMascot() {
    const page = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (page === 'admin.html' || page === 'dashboard.html') return; // jangan tampil di halaman admin

    const img = document.createElement('img');
    img.src = 'maskot.png';
    img.alt = 'Maskot Beasiswa Alumni';
    img.className = 'mascot-float';
    img.draggable = false;
    document.body.appendChild(img);

    let dragging = false;
    let offsetX = 0, offsetY = 0;

    function clampAndSet(x, y) {
        const maxX = window.innerWidth - img.offsetWidth;
        const maxY = window.innerHeight - img.offsetHeight;
        const clampedX = Math.min(Math.max(x, 0), Math.max(maxX, 0));
        const clampedY = Math.min(Math.max(y, 0), Math.max(maxY, 0));
        img.style.left = clampedX + 'px';
        img.style.top = clampedY + 'px';
        img.style.right = 'auto';
        img.style.bottom = 'auto';
    }

    img.addEventListener('pointerdown', (e) => {
        dragging = true;
        img.setPointerCapture(e.pointerId);
        const rect = img.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
    });

    img.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        clampAndSet(e.clientX - offsetX, e.clientY - offsetY);
    });

    function stopDrag() { dragging = false; }
    img.addEventListener('pointerup', stopDrag);
    img.addEventListener('pointercancel', stopDrag);

    // Jaga posisi tetap di dalam layar kalau ukuran jendela berubah
    window.addEventListener('resize', () => {
        if (img.style.left) {
            const rect = img.getBoundingClientRect();
            clampAndSet(rect.left, rect.top);
        }
    });
})();
