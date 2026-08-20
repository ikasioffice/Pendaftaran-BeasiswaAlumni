/* === PENGUMUMAN.JS === */

let currentFilter = 'semua';

const tipeLabel = {
    umum: 'Umum',
    seleksi: 'Hasil Seleksi',
    wawancara: 'Wawancara',
    penerima: 'Penerima'
};

const tipeIcon = {
    umum: 'fa-info-circle',
    seleksi: 'fa-clipboard-check',
    wawancara: 'fa-video',
    penerima: 'fa-trophy'
};

function filterAnn(tipe, btn) {
    currentFilter = tipe;
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    renderAnn();
}

function renderAnn() {
    const list = DB.getPengumuman();
    const keyword = (document.getElementById('searchAnn')?.value || '').toLowerCase();

    let filtered = list.filter(a => {
        const matchTipe = currentFilter === 'semua' || a.tipe === currentFilter;
        const matchKw = !keyword || a.judul.toLowerCase().includes(keyword) || a.isi.toLowerCase().includes(keyword);
        return matchTipe && matchKw;
    });

    // Sort by date desc
    filtered.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

    const grid = document.getElementById('annGrid');
    const empty = document.getElementById('annEmpty');

    if (filtered.length === 0) {
        grid.innerHTML = '';
        grid.style.display = 'none';
        empty.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    empty.style.display = 'none';

    grid.innerHTML = filtered.map(a => `
        <div class="announcement-card">
            <div class="ann-header">
                <div class="ann-title">${a.judul}</div>
                <span class="badge badge-${a.tipe}">
                    <i class="fas ${tipeIcon[a.tipe] || 'fa-circle'}"></i>
                    ${tipeLabel[a.tipe] || a.tipe}
                </span>
            </div>
            <div class="ann-body">${truncate(a.isi, 160)}</div>
            <div class="ann-footer">
                <div class="ann-date">
                    <i class="fas fa-calendar-alt"></i>
                    ${formatDate(a.tanggal)}
                </div>
                <button class="btn btn-outline btn-sm" onclick="openAnn('${a.id}')">
                    Baca Selengkapnya <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function truncate(str, n) {
    return str.length > n ? str.slice(0, n) + '...' : str;
}

function openAnn(id) {
    const list = DB.getPengumuman();
    const a = list.find(x => x.id === id);
    if (!a) return;

    document.getElementById('modalAnnTitle').textContent = a.judul;
    document.getElementById('modalAnnBadge').className = `badge badge-${a.tipe}`;
    document.getElementById('modalAnnBadge').innerHTML = `<i class="fas ${tipeIcon[a.tipe] || 'fa-circle'}"></i> ${tipeLabel[a.tipe] || a.tipe}`;
    document.getElementById('modalAnnDate').textContent = formatDate(a.tanggal);
    document.getElementById('modalAnnBody').textContent = a.isi;

    openModal('annModal');
}

function openModal(id) {
    document.getElementById(id).classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeModal(id) {
    document.getElementById(id).classList.remove('show');
    document.body.style.overflow = '';
}

// Close on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
        if (e.target === overlay) {
            overlay.classList.remove('show');
            document.body.style.overflow = '';
        }
    });
});

async function checkStatus() {
    const id = (document.getElementById('checkId').value || '').trim().toUpperCase();
    const box = document.getElementById('statusResult');
    if (!id) { showToast('Masukkan nomor ID pendaftaran.', 'error'); return; }

    box.className = 'status-result show';
    box.innerHTML = `<div style="text-align:center;padding:12px;color:var(--gray-500)"><i class="fas fa-spinner fa-spin"></i> Mencari data...</div>`;

    let found = null;
    try {
        const res = await fetch(`${APPS_SCRIPT_URL}?action=checkStatus&id=${encodeURIComponent(id)}`);
        const json = await res.json();
        if (json.ok && json.found) found = json.data;
    } catch (err) {
        box.innerHTML = `<div style="text-align:center;padding:12px;color:var(--danger)"><i class="fas fa-exclamation-circle"></i> Gagal terhubung ke server. Coba lagi.</div>`;
        return;
    }

    if (!found) {
        box.className = 'status-result show';
        box.innerHTML = `
            <div style="display:flex;align-items:center;gap:12px">
                <div style="width:48px;height:48px;border-radius:50%;background:#fee2e2;color:var(--danger);display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0">
                    <i class="fas fa-times-circle"></i>
                </div>
                <div>
                    <div style="font-weight:600;color:var(--text-strong)">Data Tidak Ditemukan</div>
                    <div style="font-size:.9rem;color:var(--gray-600)">Nomor ID <strong>${id}</strong> tidak terdaftar. Periksa kembali nomor Anda.</div>
                </div>
            </div>`;
        return;
    }

    const statusInfo = {
        pending:    { icon: 'fa-clock',        color: '#d97706', bg: '#fffbeb',  label: 'Sedang Diproses' },
        lolos:      { icon: 'fa-check-circle', color: '#059669', bg: '#ecfdf5', label: 'Lolos Seleksi' },
        tidak_lolos:{ icon: 'fa-times-circle', color: '#dc2626', bg: '#fef2f2', label: 'Tidak Lolos' },
        wawancara:  { icon: 'fa-video',        color: '#1a56db', bg: '#eff6ff', label: 'Dipanggil Wawancara' }
    };

    const s = statusInfo[found.status] || statusInfo.pending;

    box.className = 'status-result show';
    box.innerHTML = `
        <div style="display:flex;align-items:flex-start;gap:16px;flex-wrap:wrap">
            <div style="width:52px;height:52px;border-radius:50%;background:${s.bg};color:${s.color};display:flex;align-items:center;justify-content:center;font-size:1.75rem;flex-shrink:0">
                <i class="fas ${s.icon}"></i>
            </div>
            <div style="flex:1">
                <div style="font-size:.75rem;color:var(--gray-500);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Status Pendaftaran</div>
                <div style="font-size:1.25rem;font-weight:700;color:${s.color};margin-bottom:8px">${s.label}</div>
                <div class="detail-grid" style="gap:12px;margin-bottom:${found.pesan ? '12px' : '0'}">
                    <div class="detail-item"><span class="detail-label">Nama</span><span class="detail-value">${found.nama}</span></div>
                    <div class="detail-item"><span class="detail-label">Program Studi</span><span class="detail-value">${found.programStudi}</span></div>
                    <div class="detail-item"><span class="detail-label">Kelas</span><span class="detail-value">${found.kelas}</span></div>
                    <div class="detail-item"><span class="detail-label">Tanggal Daftar</span><span class="detail-value">${formatDate(found.tanggalDaftar)}</span></div>
                </div>
                ${found.pesan ? `<div style="margin-top:12px;padding:12px 16px;background:${s.bg};border-radius:var(--radius-sm);font-size:.9rem;color:${s.color}"><i class="fas fa-info-circle" style="margin-right:8px"></i>${found.pesan}</div>` : ''}
            </div>
        </div>`;
}

// Auto check if URL has ?id=
(function () {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
        document.getElementById('checkId').value = id;
        checkStatus();
    }
})();

// Init
renderAnn();
document.addEventListener('publicContentSynced', renderAnn);
