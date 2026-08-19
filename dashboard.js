/* === DASHBOARD.JS === */

// Auth guard
if (!DB.isLoggedIn()) window.location.href = 'admin.html';

let currentEditId = null;

// Sidebar mobile
function openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebarOverlay').classList.add('show');
    document.body.style.overflow = 'hidden';
}
function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('show');
    document.body.style.overflow = '';
}

// Modal
function openModal(id) {
    document.getElementById(id).classList.add('show');
    document.body.style.overflow = 'hidden';
}
function closeModal(id) {
    document.getElementById(id).classList.remove('show');
    document.body.style.overflow = '';
}
document.querySelectorAll('.modal-overlay').forEach(o => {
    o.addEventListener('click', e => {
        if (e.target === o) { o.classList.remove('show'); document.body.style.overflow = ''; }
    });
});

// Panel navigation
function showPanel(name) {
    document.querySelectorAll('.dashboard-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
    document.getElementById(`panel-${name}`).classList.add('active');
    const navEl = document.getElementById(`nav-${name}`);
    if (navEl) navEl.classList.add('active');
    const titles = { beranda: 'Dashboard', pendaftar: 'Data Pendaftar', pengumuman: 'Pengumuman', herocards: 'Kartu Beranda', timeline: 'Timeline Pendaftaran', deadline: 'Batas Pendaftaran' };
    document.getElementById('topbarTitle').textContent = titles[name] || name;
    closeSidebar();

    if (name === 'beranda') refreshPendaftarThenRender('beranda');
    if (name === 'pendaftar') refreshPendaftarThenRender('pendaftar');
    if (name === 'pengumuman') renderAnnList();
    if (name === 'herocards') renderHeroCardsList();
    if (name === 'timeline') renderTimelineList();
    if (name === 'deadline') renderDeadlineForm();
}

// Sinkronkan data pendaftar dari Google Sheets, lalu render tampilannya
async function refreshPendaftarThenRender(target) {
    if (target === 'beranda') renderDashboard();
    if (target === 'pendaftar') renderPendaftar();

    const result = await DB.syncPendaftarFromServer();
    if (!result.ok) {
        showToast(result.error || 'Gagal memuat data pendaftar dari server.', 'error');
        return;
    }
    if (target === 'beranda') renderDashboard();
    if (target === 'pendaftar') renderPendaftar();
}

function doLogout() {
    if (confirm('Yakin ingin keluar dari panel admin?')) {
        DB.logout();
        window.location.href = 'admin.html';
    }
}

// ===== DASHBOARD =====
function renderDashboard() {
    const list = DB.getPendaftar();
    const total = list.length;
    const lolos = list.filter(p => p.status === 'lolos').length;
    const wawancara = list.filter(p => p.status === 'wawancara').length;
    const tidak = list.filter(p => p.status === 'tidak_lolos').length;
    const pending = list.filter(p => p.status === 'pending').length;

    document.getElementById('statsGrid').innerHTML = `
        <div class="stat-card">
            <div class="stat-card-header">
                <div class="stat-card-label">Total Pendaftar</div>
                <div class="stat-card-icon blue"><i class="fas fa-users"></i></div>
            </div>
            <div class="stat-card-value">${total}</div>
            <div class="stat-card-sub">Semua pendaftar</div>
        </div>
        <div class="stat-card">
            <div class="stat-card-header">
                <div class="stat-card-label">Lolos Seleksi</div>
                <div class="stat-card-icon green"><i class="fas fa-check-circle"></i></div>
            </div>
            <div class="stat-card-value">${lolos}</div>
            <div class="stat-card-sub">${total ? Math.round(lolos/total*100) : 0}% dari total</div>
        </div>
        <div class="stat-card">
            <div class="stat-card-header">
                <div class="stat-card-label">Wawancara</div>
                <div class="stat-card-icon yellow"><i class="fas fa-video"></i></div>
            </div>
            <div class="stat-card-value">${wawancara}</div>
            <div class="stat-card-sub">Dijadwalkan wawancara</div>
        </div>
        <div class="stat-card">
            <div class="stat-card-header">
                <div class="stat-card-label">Pending</div>
                <div class="stat-card-icon purple"><i class="fas fa-clock"></i></div>
            </div>
            <div class="stat-card-value">${pending}</div>
            <div class="stat-card-sub">Menunggu proses</div>
        </div>`;

    // Recent applicants
    const recent = [...list].sort((a,b) => new Date(b.tanggalDaftar) - new Date(a.tanggalDaftar)).slice(0, 5);
    if (recent.length === 0) {
        document.getElementById('recentApplicants').innerHTML = '<div class="empty-state" style="padding:30px"><i class="fas fa-users"></i><p>Belum ada pendaftar</p></div>';
    } else {
        document.getElementById('recentApplicants').innerHTML = recent.map(p => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--gray-100)">
                <div>
                    <div style="font-weight:600;font-size:.875rem;color:var(--text-strong)">${p.nama}</div>
                    <div style="font-size:.75rem;color:var(--gray-500)">${p.programStudi}</div>
                </div>
                <span class="badge badge-${p.status}">${statusLabel(p.status)}</span>
            </div>`).join('');
    }

    // Status chart (bar visual)
    const statuses = [
        { label: 'Lolos', val: lolos, color: 'var(--success)' },
        { label: 'Wawancara', val: wawancara, color: 'var(--primary)' },
        { label: 'Tidak Lolos', val: tidak, color: 'var(--danger)' },
        { label: 'Pending', val: pending, color: 'var(--gold)' }
    ];
    document.getElementById('statusChart').innerHTML = statuses.map(s => `
        <div style="margin-bottom:14px">
            <div style="display:flex;justify-content:space-between;font-size:.8125rem;color:var(--gray-600);margin-bottom:6px">
                <span>${s.label}</span>
                <span style="font-weight:600">${s.val} <span style="font-weight:400;color:var(--gray-400)">(${total ? Math.round(s.val/total*100) : 0}%)</span></span>
            </div>
            <div class="progress-track" style="height:8px;border-radius:100px;overflow:hidden">
                <div style="height:100%;width:${total ? (s.val/total*100) : 0}%;background:${s.color};border-radius:100px;transition:width .6s ease"></div>
            </div>
        </div>`).join('');

    document.getElementById('lastUpdate').textContent = 'Diperbarui: ' + new Date().toLocaleTimeString('id-ID');
}

// ===== PENDAFTAR =====
function statusLabel(s) {
    return { pending:'Pending', lolos:'Lolos', tidak_lolos:'Tidak Lolos', wawancara:'Wawancara' }[s] || s;
}

function renderPendaftar() {
    let list = DB.getPendaftar();
    const keyword = (document.getElementById('searchPendaftar')?.value || '').toLowerCase();
    const filterVal = document.getElementById('filterStatus')?.value || '';

    if (filterVal) list = list.filter(p => p.status === filterVal);
    if (keyword) list = list.filter(p =>
        p.nama.toLowerCase().includes(keyword) ||
        p.nim.toLowerCase().includes(keyword) ||
        p.programStudi.toLowerCase().includes(keyword) ||
        p.kelas.toLowerCase().includes(keyword)
    );

    list.sort((a,b) => new Date(b.tanggalDaftar) - new Date(a.tanggalDaftar));

    document.getElementById('pendaftarCount').textContent = `${list.length} Pendaftar`;
    const tbody = document.getElementById('pendaftarTable');
    const empty = document.getElementById('pendaftarEmpty');

    if (list.length === 0) {
        tbody.innerHTML = '';
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';

    tbody.innerHTML = list.map((p, i) => `
        <tr>
            <td>${i+1}</td>
            <td><span style="font-size:.8rem;font-family:monospace;color:var(--primary)">${p.id}</span></td>
            <td>
                <div class="applicant-name">${p.nama}</div>
                <div class="applicant-id">${p.nim}</div>
            </td>
            <td>${p.programStudi}</td>
            <td>${p.kelas}</td>
            <td style="text-align:center">${p.semester}</td>
            <td style="text-align:center;font-weight:600;color:${p.ipk>=3.5?'var(--success)':p.ipk>=3?'var(--gold)':'var(--danger)'}">${p.ipk.toFixed(2)}</td>
            <td>${formatDateShort(p.tanggalDaftar)}</td>
            <td><span class="badge badge-${p.status}">${statusLabel(p.status)}</span></td>
            <td>
                <div class="table-actions">
                    <button class="action-btn view" title="Lihat Detail" onclick="viewPendaftar('${p.id}')"><i class="fas fa-eye"></i></button>
                    <button class="action-btn edit" title="Ubah Status" onclick="openStatusModal('${p.id}')"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete" title="Hapus" onclick="confirmHapusPendaftar('${p.id}')"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>`).join('');
}

function buildMultiEntryDetailHtml(title, rows) {
    if (!rows || !rows.length) return '';
    return `
        <div style="margin-top:20px">
            <div style="font-size:.875rem;font-weight:600;color:var(--gray-600);text-transform:uppercase;letter-spacing:.04em;margin-bottom:12px">${title}</div>
            <div style="display:flex;flex-direction:column;gap:8px">
                ${rows.map(r => `
                    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:.9rem;color:var(--text-strong)">
                        <span>${r.nama}</span>
                        ${r.bukti && r.bukti.url
                            ? `<a href="${r.bukti.url}" target="_blank" rel="noopener" style="color:var(--primary);font-size:.8125rem;white-space:nowrap;text-decoration:underline"><i class="fas fa-paperclip"></i> Buka bukti</a>`
                            : `<span style="color:var(--gray-400);font-size:.8125rem;white-space:nowrap"><i class="fas fa-minus-circle"></i> Tanpa bukti</span>`}
                    </div>`).join('')}
            </div>
        </div>`;
}

function viewPendaftar(id) {
    const list = DB.getPendaftar();
    const p = list.find(x => x.id === id);
    if (!p) return;

    document.getElementById('modalPendaftarTitle').textContent = 'Detail Pendaftar — ' + p.id;
    document.getElementById('modalPendaftarBody').innerHTML = `
        <div style="margin-bottom:20px">
            <span class="badge badge-${p.status}" style="font-size:.875rem;padding:6px 16px">${statusLabel(p.status)}</span>
            <span style="font-size:.8125rem;color:var(--gray-500);margin-left:12px">Daftar: ${formatDate(p.tanggalDaftar)}</span>
        </div>
        <div style="margin-bottom:20px">
            <div style="font-size:.875rem;font-weight:600;color:var(--gray-600);text-transform:uppercase;letter-spacing:.04em;margin-bottom:12px">DATA PRIBADI</div>
            <div class="detail-grid">
                <div class="detail-item"><span class="detail-label">Nama</span><span class="detail-value">${p.nama}</span></div>
                <div class="detail-item"><span class="detail-label">NIM</span><span class="detail-value">${p.nim}</span></div>
                <div class="detail-item"><span class="detail-label">Email</span><span class="detail-value">${p.email || '-'}</span></div>
                <div class="detail-item"><span class="detail-label">Telepon</span><span class="detail-value">${p.telepon || '-'}</span></div>
                <div class="detail-item"><span class="detail-label">Tgl Lahir</span><span class="detail-value">${p.tglLahir ? formatDate(p.tglLahir) : '-'}</span></div>
                <div class="detail-item"><span class="detail-label">Jenis Kelamin</span><span class="detail-value">${p.jenisKelamin || '-'}</span></div>
                <div class="detail-item"><span class="detail-label">Tinggal di Kos</span><span class="detail-value">${p.tinggalKos || '-'}</span></div>
                <div class="detail-item"><span class="detail-label">Sedang Menerima Beasiswa</span><span class="detail-value">${p.sedangMenerimaBeasiswa || '-'}</span></div>
            </div>
        </div>
        <div style="margin-bottom:20px">
            <div style="font-size:.875rem;font-weight:600;color:var(--gray-600);text-transform:uppercase;letter-spacing:.04em;margin-bottom:12px">DATA ORANG TUA / WALI</div>
            <div class="detail-grid">
                <div class="detail-item"><span class="detail-label">Nama Ayah</span><span class="detail-value">${p.namaAyah || '-'}</span></div>
                <div class="detail-item"><span class="detail-label">Nama Ibu</span><span class="detail-value">${p.namaIbu || '-'}</span></div>
                <div class="detail-item"><span class="detail-label">Pekerjaan Ayah</span><span class="detail-value">${p.pekerjaanAyah || '-'}</span></div>
                <div class="detail-item"><span class="detail-label">Pekerjaan Ibu</span><span class="detail-value">${p.pekerjaanIbu || '-'}</span></div>
                <div class="detail-item"><span class="detail-label">Penghasilan</span><span class="detail-value">${p.penghasilan || '-'}</span></div>
                <div class="detail-item"><span class="detail-label">Telepon Orang Tua</span><span class="detail-value">${p.teleponOrtu || '-'}</span></div>
            </div>
        </div>
        <div style="margin-bottom:20px">
            <div style="font-size:.875rem;font-weight:600;color:var(--gray-600);text-transform:uppercase;letter-spacing:.04em;margin-bottom:12px">DATA AKADEMIK</div>
            <div class="detail-grid">
                <div class="detail-item"><span class="detail-label">Program Studi</span><span class="detail-value">${p.programStudi}</span></div>
                <div class="detail-item"><span class="detail-label">Kelas</span><span class="detail-value">${p.kelas}</span></div>
                <div class="detail-item"><span class="detail-label">Semester</span><span class="detail-value">${p.semester}</span></div>
                <div class="detail-item"><span class="detail-label">IPK</span><span class="detail-value" style="color:var(--success);font-size:1.125rem;font-weight:700">${p.ipk.toFixed(2)}</span></div>
                <div class="detail-item"><span class="detail-label">Jenjang</span><span class="detail-value">${p.jenjang || '-'}</span></div>
            </div>
        </div>
        ${p.dokumen ? `
        <div>
            <div style="font-size:.875rem;font-weight:600;color:var(--gray-600);text-transform:uppercase;letter-spacing:.04em;margin-bottom:12px">DOKUMEN</div>
            <div style="display:flex;gap:10px;flex-wrap:wrap">
                ${['ktp','ktm','transkrip'].map(d => `
                    <div style="display:flex;align-items:center;gap:6px;font-size:.875rem;color:${p.dokumen[d]&&p.dokumen[d].url?'var(--primary)':'var(--gray-300)'}">
                        ${p.dokumen[d] && p.dokumen[d].url
                            ? `<a href="${p.dokumen[d].url}" target="_blank" rel="noopener" style="color:var(--primary);text-decoration:underline"><i class="fas fa-check-circle"></i> ${{ktp:'KTP',ktm:'KTM',transkrip:'Transkrip'}[d]}</a>`
                            : `<i class="fas fa-times-circle"></i> ${{ktp:'KTP',ktm:'KTM',transkrip:'Transkrip'}[d]}`}
                    </div>`).join('')}
            </div>
        </div>` : ''}
        ${p.rencanaPenggunaan ? `
        <div style="margin-top:20px">
            <div style="font-size:.875rem;font-weight:600;color:var(--gray-600);text-transform:uppercase;letter-spacing:.04em;margin-bottom:12px">RENCANA PENGGUNAAN BEASISWA</div>
            <p style="font-size:.9rem;color:var(--text-strong);white-space:pre-wrap;margin:0">${p.rencanaPenggunaan}</p>
        </div>` : ''}
        ${buildMultiEntryDetailHtml('PENGALAMAN ORGANISASI', p.organisasi)}
        ${buildMultiEntryDetailHtml('PENGALAMAN KEPANITIAAN', p.kepanitiaan)}
        ${buildMultiEntryDetailHtml('PRESTASI / PENGHARGAAN', p.prestasi)}
        ${p.pesan ? `<div style="margin-top:16px;padding:14px 16px;background:var(--primary-50);border-radius:var(--radius-sm);font-size:.9rem;color:var(--primary)"><i class="fas fa-comment-alt" style="margin-right:8px"></i>${p.pesan}</div>` : ''}`;

    document.getElementById('modalPendaftarFooter').innerHTML = `
        <button class="btn btn-secondary" onclick="closeModal('modalPendaftar')">Tutup</button>
        <button class="btn btn-warning" onclick="closeModal('modalPendaftar');openStatusModal('${p.id}')">
            <i class="fas fa-edit"></i> Ubah Status
        </button>`;

    openModal('modalPendaftar');
}

function openStatusModal(id) {
    const list = DB.getPendaftar();
    const p = list.find(x => x.id === id);
    if (!p) return;
    currentEditId = id;
    document.getElementById('statusApplicantInfo').innerHTML = `
        <div style="font-weight:600;color:var(--text-strong)">${p.nama}</div>
        <div style="font-size:.875rem;color:var(--gray-600)">${p.programStudi} • Kelas ${p.kelas} • IPK ${p.ipk.toFixed(2)}</div>
        <div style="margin-top:8px"><span class="badge badge-${p.status}">Status saat ini: ${statusLabel(p.status)}</span></div>`;
    document.getElementById('newStatus').value = p.status;
    document.getElementById('statusPesan').value = p.pesan || '';
    openModal('modalStatus');
}

async function saveStatus() {
    const list = DB.getPendaftar();
    const idx = list.findIndex(x => x.id === currentEditId);
    if (idx === -1) return;
    const status = document.getElementById('newStatus').value;
    const pesan = document.getElementById('statusPesan').value.trim();

    const btnSave = document.querySelector('#modalStatus .btn-primary');
    if (btnSave) { btnSave.disabled = true; btnSave.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...'; }

    const result = await DB.updateStatusOnServer(currentEditId, status, pesan);

    if (btnSave) { btnSave.disabled = false; btnSave.innerHTML = 'Simpan'; }

    if (!result.ok) {
        showToast(result.error || 'Gagal menyimpan status ke server.', 'error');
        return;
    }

    list[idx].status = status;
    list[idx].pesan = pesan;
    DB.setPendaftar(list);
    closeModal('modalStatus');
    renderPendaftar();
    renderDashboard();
    showToast(`Status ${list[idx].nama} berhasil diperbarui.`, 'success');
}

function confirmHapusPendaftar(id) {
    const list = DB.getPendaftar();
    const p = list.find(x => x.id === id);
    if (!p) return;
    document.getElementById('hapusMsg').textContent = `Data pendaftar "${p.nama}" akan dihapus permanen.`;
    document.getElementById('btnHapusConfirm').onclick = async () => {
        const result = await DB.deletePendaftarOnServer(id);
        if (!result.ok) {
            showToast(result.error || 'Gagal menghapus data di server.', 'error');
            return;
        }
        DB.setPendaftar(list.filter(x => x.id !== id));
        closeModal('modalHapus');
        renderPendaftar();
        renderDashboard();
        showToast('Data pendaftar berhasil dihapus.', 'success');
    };
    openModal('modalHapus');
}

// ===== PENGUMUMAN =====
function renderAnnList() {
    const list = DB.getPengumuman().sort((a,b) => new Date(b.tanggal) - new Date(a.tanggal));
    const tipeLabel = { umum:'Umum', seleksi:'Hasil Seleksi', wawancara:'Wawancara', penerima:'Penerima' };

    if (list.length === 0) {
        document.getElementById('annList').innerHTML = `<div class="empty-state"><i class="fas fa-bullhorn"></i><h3>Belum Ada Pengumuman</h3><p>Klik tombol "Tambah Pengumuman" untuk membuat pengumuman baru.</p></div>`;
        return;
    }

    document.getElementById('annList').innerHTML = list.map(a => `
        <div class="ann-manage-card">
            <div class="ann-manage-content">
                <div class="ann-manage-title">${a.judul}</div>
                <div class="ann-manage-meta">
                    <span class="badge badge-${a.tipe}" style="font-size:.75rem">${tipeLabel[a.tipe] || a.tipe}</span>
                    <span><i class="fas fa-calendar-alt"></i> ${formatDate(a.tanggal)}</span>
                </div>
                <div style="margin-top:8px;color:var(--gray-600);font-size:.875rem;line-height:1.6">${a.isi.slice(0,160)}${a.isi.length>160?'...':''}</div>
            </div>
            <div class="ann-manage-actions">
                <button class="btn btn-outline btn-sm" onclick="editAnn('${a.id}')"><i class="fas fa-edit"></i> Edit</button>
                <button class="btn btn-danger btn-sm" onclick="confirmHapusAnn('${a.id}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>`).join('');
}

function openAnnModal(id) {
    document.getElementById('annEditId').value = id || '';
    document.getElementById('modalAnnTitle').textContent = id ? 'Edit Pengumuman' : 'Tambah Pengumuman';
    if (!id) {
        document.getElementById('annJudul').value = '';
        document.getElementById('annTipe').value = 'umum';
        document.getElementById('annTanggal').value = new Date().toISOString().split('T')[0];
        document.getElementById('annIsi').value = '';
    }
    openModal('modalAnn');
}

function editAnn(id) {
    const list = DB.getPengumuman();
    const a = list.find(x => x.id === id);
    if (!a) return;
    document.getElementById('annEditId').value = id;
    document.getElementById('modalAnnTitle').textContent = 'Edit Pengumuman';
    document.getElementById('annJudul').value = a.judul;
    document.getElementById('annTipe').value = a.tipe;
    document.getElementById('annTanggal').value = new Date(a.tanggal).toISOString().split('T')[0];
    document.getElementById('annIsi').value = a.isi;
    openModal('modalAnn');
}

function saveAnn() {
    const judul = document.getElementById('annJudul').value.trim();
    const tipe = document.getElementById('annTipe').value;
    const tanggal = document.getElementById('annTanggal').value;
    const isi = document.getElementById('annIsi').value.trim();

    if (!judul || !tanggal || !isi) { showToast('Lengkapi semua field yang wajib diisi.', 'error'); return; }

    const list = DB.getPengumuman();
    const editId = document.getElementById('annEditId').value;

    if (editId) {
        const idx = list.findIndex(x => x.id === editId);
        if (idx !== -1) {
            list[idx] = { ...list[idx], judul, tipe, tanggal: new Date(tanggal).toISOString(), isi };
        }
    } else {
        const newId = 'ANN-' + Date.now();
        list.push({ id: newId, judul, tipe, tanggal: new Date(tanggal).toISOString(), isi, dibuat: new Date().toISOString() });
    }

    DB.setPengumuman(list);
    closeModal('modalAnn');
    renderAnnList();
    showToast(editId ? 'Pengumuman berhasil diperbarui.' : 'Pengumuman berhasil ditambahkan.', 'success');
}

function confirmHapusAnn(id) {
    const list = DB.getPengumuman();
    const a = list.find(x => x.id === id);
    if (!a) return;
    document.getElementById('hapusMsg').textContent = `Pengumuman "${a.judul}" akan dihapus permanen.`;
    document.getElementById('btnHapusConfirm').onclick = () => {
        DB.setPengumuman(list.filter(x => x.id !== id));
        closeModal('modalHapus');
        renderAnnList();
        showToast('Pengumuman berhasil dihapus.', 'success');
    };
    openModal('modalHapus');
}

// ===== KARTU BERANDA (HERO) =====
function renderHeroCardsList() {
    const list = (DB.getHeroCards() || []).slice().sort((a, b) => a.urutan - b.urutan);

    if (list.length === 0) {
        document.getElementById('heroCardsManageList').innerHTML = `<div class="empty-state"><i class="fas fa-image"></i><h3>Belum Ada Kartu</h3><p>Klik tombol "Tambah Kartu" untuk membuat kartu beranda.</p></div>`;
        return;
    }

    document.getElementById('heroCardsManageList').innerHTML = list.map((c, i) => `
        <div class="ann-manage-card">
            <div class="ann-manage-content" style="display:flex;align-items:center;gap:16px">
                <div style="font-size:1.75rem">${c.icon}</div>
                <div>
                    <div class="ann-manage-title">${c.judul}</div>
                    <div class="ann-manage-meta">${c.sub}</div>
                </div>
            </div>
            <div class="ann-manage-actions" style="align-items:center">
                <div style="display:flex;flex-direction:column;gap:2px;margin-right:4px">
                    <button class="action-btn view" title="Naik" ${i === 0 ? 'disabled style="opacity:.3;cursor:not-allowed"' : ''} onclick="moveHeroCard('${c.id}',-1)"><i class="fas fa-chevron-up"></i></button>
                    <button class="action-btn view" title="Turun" ${i === list.length - 1 ? 'disabled style="opacity:.3;cursor:not-allowed"' : ''} onclick="moveHeroCard('${c.id}',1)"><i class="fas fa-chevron-down"></i></button>
                </div>
                <button class="btn btn-outline btn-sm" onclick="editHeroCard('${c.id}')"><i class="fas fa-edit"></i> Edit</button>
                <button class="btn btn-danger btn-sm" onclick="confirmHapusHeroCard('${c.id}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>`).join('');
}

function openHeroCardModal(id) {
    document.getElementById('hcEditId').value = id || '';
    document.getElementById('modalHeroCardTitle').textContent = id ? 'Edit Kartu Beranda' : 'Tambah Kartu Beranda';
    if (!id) {
        document.getElementById('hcIcon').value = '';
        document.getElementById('hcJudul').value = '';
        document.getElementById('hcSub').value = '';
    }
    openModal('modalHeroCard');
}

function editHeroCard(id) {
    const list = DB.getHeroCards() || [];
    const c = list.find(x => x.id === id);
    if (!c) return;
    document.getElementById('hcEditId').value = id;
    document.getElementById('modalHeroCardTitle').textContent = 'Edit Kartu Beranda';
    document.getElementById('hcIcon').value = c.icon;
    document.getElementById('hcJudul').value = c.judul;
    document.getElementById('hcSub').value = c.sub;
    openModal('modalHeroCard');
}

function saveHeroCard() {
    const icon = document.getElementById('hcIcon').value.trim() || '⭐';
    const judul = document.getElementById('hcJudul').value.trim();
    const sub = document.getElementById('hcSub').value.trim();

    if (!judul || !sub) { showToast('Lengkapi semua field yang wajib diisi.', 'error'); return; }

    const list = DB.getHeroCards() || [];
    const editId = document.getElementById('hcEditId').value;

    if (editId) {
        const idx = list.findIndex(x => x.id === editId);
        if (idx !== -1) list[idx] = { ...list[idx], icon, judul, sub };
    } else {
        const newId = 'HC-' + Date.now();
        const urutan = list.length ? Math.max(...list.map(c => c.urutan)) + 1 : 1;
        list.push({ id: newId, icon, judul, sub, urutan });
    }

    DB.setHeroCards(list);
    closeModal('modalHeroCard');
    renderHeroCardsList();
    showToast(editId ? 'Kartu beranda berhasil diperbarui.' : 'Kartu beranda berhasil ditambahkan.', 'success');
}

function moveHeroCard(id, dir) {
    const list = (DB.getHeroCards() || []).slice().sort((a, b) => a.urutan - b.urutan);
    const idx = list.findIndex(x => x.id === id);
    const swapIdx = idx + dir;
    if (idx === -1 || swapIdx < 0 || swapIdx >= list.length) return;
    const tmp = list[idx].urutan;
    list[idx].urutan = list[swapIdx].urutan;
    list[swapIdx].urutan = tmp;
    DB.setHeroCards(list);
    renderHeroCardsList();
}

function confirmHapusHeroCard(id) {
    const list = DB.getHeroCards() || [];
    const c = list.find(x => x.id === id);
    if (!c) return;
    document.getElementById('hapusMsg').textContent = `Kartu beranda "${c.judul}" akan dihapus permanen.`;
    document.getElementById('btnHapusConfirm').onclick = () => {
        DB.setHeroCards(list.filter(x => x.id !== id));
        closeModal('modalHapus');
        renderHeroCardsList();
        showToast('Kartu beranda berhasil dihapus.', 'success');
    };
    openModal('modalHapus');
}

// ===== TIMELINE PENDAFTARAN =====
function renderTimelineList() {
    const list = DB.getTimeline().slice().sort((a, b) => a.urutan - b.urutan);

    if (list.length === 0) {
        document.getElementById('timelineManageList').innerHTML = `<div class="empty-state"><i class="fas fa-route"></i><h3>Belum Ada Tahap Timeline</h3><p>Klik tombol "Tambah Tahap" untuk membuat tahapan pendaftaran.</p></div>`;
        return;
    }

    document.getElementById('timelineManageList').innerHTML = list.map((t, i) => `
        <div class="ann-manage-card">
            <div class="ann-manage-content">
                <div class="ann-manage-title">
                    ${t.judul}
                    ${t.aktif ? '<span class="badge badge-lolos" style="font-size:.7rem;margin-left:8px">Sedang Berjalan</span>' : ''}
                </div>
                <div class="ann-manage-meta">
                    <span><i class="fas fa-calendar-alt"></i> ${t.tanggal}</span>
                </div>
                <div style="margin-top:8px;color:var(--gray-600);font-size:.875rem;line-height:1.6">${t.deskripsi}</div>
            </div>
            <div class="ann-manage-actions" style="align-items:center">
                <div style="display:flex;flex-direction:column;gap:2px;margin-right:4px">
                    <button class="action-btn view" title="Naik" ${i === 0 ? 'disabled style="opacity:.3;cursor:not-allowed"' : ''} onclick="moveTimeline('${t.id}',-1)"><i class="fas fa-chevron-up"></i></button>
                    <button class="action-btn view" title="Turun" ${i === list.length - 1 ? 'disabled style="opacity:.3;cursor:not-allowed"' : ''} onclick="moveTimeline('${t.id}',1)"><i class="fas fa-chevron-down"></i></button>
                </div>
                <button class="btn btn-outline btn-sm" onclick="editTimeline('${t.id}')"><i class="fas fa-edit"></i> Edit</button>
                <button class="btn btn-danger btn-sm" onclick="confirmHapusTimeline('${t.id}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>`).join('');
}

function openTimelineModal(id) {
    document.getElementById('tlEditId').value = id || '';
    document.getElementById('modalTimelineTitle').textContent = id ? 'Edit Tahap Timeline' : 'Tambah Tahap Timeline';
    if (!id) {
        document.getElementById('tlJudul').value = '';
        document.getElementById('tlTanggal').value = '';
        document.getElementById('tlDeskripsi').value = '';
        document.getElementById('tlAktif').checked = false;
    }
    openModal('modalTimeline');
}

function editTimeline(id) {
    const list = DB.getTimeline();
    const t = list.find(x => x.id === id);
    if (!t) return;
    document.getElementById('tlEditId').value = id;
    document.getElementById('modalTimelineTitle').textContent = 'Edit Tahap Timeline';
    document.getElementById('tlJudul').value = t.judul;
    document.getElementById('tlTanggal').value = t.tanggal;
    document.getElementById('tlDeskripsi').value = t.deskripsi;
    document.getElementById('tlAktif').checked = !!t.aktif;
    openModal('modalTimeline');
}

function saveTimeline() {
    const judul = document.getElementById('tlJudul').value.trim();
    const tanggal = document.getElementById('tlTanggal').value.trim();
    const deskripsi = document.getElementById('tlDeskripsi').value.trim();
    const aktif = document.getElementById('tlAktif').checked;

    if (!judul || !tanggal || !deskripsi) { showToast('Lengkapi semua field yang wajib diisi.', 'error'); return; }

    const list = DB.getTimeline();
    const editId = document.getElementById('tlEditId').value;

    if (aktif) list.forEach(t => t.aktif = false);

    if (editId) {
        const idx = list.findIndex(x => x.id === editId);
        if (idx !== -1) list[idx] = { ...list[idx], judul, tanggal, deskripsi, aktif };
    } else {
        const newId = 'TL-' + Date.now();
        const urutan = list.length ? Math.max(...list.map(t => t.urutan)) + 1 : 1;
        list.push({ id: newId, judul, tanggal, deskripsi, aktif, urutan });
    }

    DB.setTimeline(list);
    closeModal('modalTimeline');
    renderTimelineList();
    showToast(editId ? 'Tahap timeline berhasil diperbarui.' : 'Tahap timeline berhasil ditambahkan.', 'success');
}

function moveTimeline(id, dir) {
    const list = DB.getTimeline().slice().sort((a, b) => a.urutan - b.urutan);
    const idx = list.findIndex(x => x.id === id);
    const swapIdx = idx + dir;
    if (idx === -1 || swapIdx < 0 || swapIdx >= list.length) return;
    const tmp = list[idx].urutan;
    list[idx].urutan = list[swapIdx].urutan;
    list[swapIdx].urutan = tmp;
    DB.setTimeline(list);
    renderTimelineList();
}

function confirmHapusTimeline(id) {
    const list = DB.getTimeline();
    const t = list.find(x => x.id === id);
    if (!t) return;
    document.getElementById('hapusMsg').textContent = `Tahap timeline "${t.judul}" akan dihapus permanen.`;
    document.getElementById('btnHapusConfirm').onclick = () => {
        DB.setTimeline(list.filter(x => x.id !== id));
        closeModal('modalHapus');
        renderTimelineList();
        showToast('Tahap timeline berhasil dihapus.', 'success');
    };
    openModal('modalHapus');
}

// ===== BATAS PENDAFTARAN (DEADLINE) =====
async function renderDeadlineForm() {
    const cached = DB.getDeadline() || '2025-03-31T23:59:59';
    document.getElementById('deadlineInput').value = cached.slice(0, 16);

    const result = await DB.syncDeadlineFromServer();
    if (result.ok) {
        document.getElementById('deadlineInput').value = DB.getDeadline().slice(0, 16);
    }
}

async function saveDeadline() {
    const val = document.getElementById('deadlineInput').value;
    if (!val) { showToast('Pilih tanggal & jam batas akhir pendaftaran.', 'error'); return; }
    const finalVal = val.length === 16 ? val + ':00' : val;

    const btn = document.querySelector('#panel-deadline .btn-primary');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...'; }

    const result = await DB.setDeadlineOnServer(finalVal);

    if (btn) { btn.disabled = false; btn.innerHTML = 'Simpan Batas Waktu'; }

    if (!result.ok) {
        showToast(result.error || 'Gagal menyimpan ke server.', 'error');
        return;
    }

    DB.setDeadline(finalVal);
    showToast('Batas waktu pendaftaran berhasil diperbarui.', 'success');
}

// ===== EXPORT CSV =====
function exportData() {
    const list = DB.getPendaftar();
    const headers = ['ID','Nama','NIM','Program Studi','Kelas','Semester','IPK','Email','Telepon','Tanggal Daftar','Status'];
    const rows = list.map(p => [
        p.id, p.nama, p.nim, p.programStudi, p.kelas, p.semester, p.ipk,
        p.email || '', p.telepon || '',
        new Date(p.tanggalDaftar).toLocaleDateString('id-ID'),
        statusLabel(p.status)
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pendaftar-beasiswa-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data berhasil diekspor ke CSV.', 'success');
}

// Init
document.getElementById('topbarDate').textContent = new Date().toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
refreshPendaftarThenRender('beranda');
