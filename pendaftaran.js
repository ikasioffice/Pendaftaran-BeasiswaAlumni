/* === PENDAFTARAN.JS === */

let currentStep = 1;
const totalSteps = 5;
const uploadedFiles = { ktp: null, ktm: null, transkrip: null };
let prestasiRows = [];
let prestasiCounter = 0;
let organisasiRows = [];
let organisasiCounter = 0;
let kepanitiaanRows = [];
let kepanitiaanCounter = 0;

function updateStepper(step) {
    for (let i = 1; i <= totalSteps; i++) {
        const ind = document.getElementById(`step-ind-${i}`);
        if (!ind) continue;
        ind.classList.remove('active', 'done');
        if (i < step) ind.classList.add('done');
        else if (i === step) ind.classList.add('active');
        // Update icon for done steps
        const num = ind.querySelector('.stepper-num');
        if (i < step) num.innerHTML = '<i class="fas fa-check"></i>';
        else num.textContent = i;
    }
}

function showStep(step) {
    for (let i = 1; i <= totalSteps; i++) {
        const el = document.getElementById(`step${i}`);
        if (el) el.classList.toggle('active', i === step);
    }
    currentStep = step;
    updateStepper(step);
    window.scrollTo({ top: document.querySelector('.form-card').offsetTop - 100, behavior: 'smooth' });
}

function clearErrors() {
    document.querySelectorAll('.form-error').forEach(e => e.classList.remove('show'));
    document.querySelectorAll('.form-control').forEach(e => e.classList.remove('is-invalid'));
}

function setError(fieldId, errId) {
    const field = document.getElementById(fieldId);
    const err = document.getElementById(errId);
    if (field) field.classList.add('is-invalid');
    if (err) err.classList.add('show');
}

function validateStep1() {
    clearErrors();
    let ok = true;
    const nama = document.getElementById('nama').value.trim();
    const nim = document.getElementById('nim').value.trim();
    const email = document.getElementById('email').value.trim();
    const telepon = document.getElementById('telepon').value.trim();
    const tglLahir = document.getElementById('tglLahir').value;
    const jenisKelamin = document.getElementById('jenisKelamin').value;
    const alamat = document.getElementById('alamat').value.trim();
    const tinggalKos = document.getElementById('tinggalKos').value;
    const sedangMenerimaBeasiswa = document.getElementById('sedangMenerimaBeasiswa').value;

    if (!nama) { setError('nama', 'err-nama'); ok = false; }
    if (!nim) { setError('nim', 'err-nim'); ok = false; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('email', 'err-email'); ok = false; }
    if (!telepon || telepon.length < 10) { setError('telepon', 'err-telepon'); ok = false; }
    if (!tglLahir) { setError('tglLahir', 'err-tglLahir'); ok = false; }
    if (!jenisKelamin) { setError('jenisKelamin', 'err-jenisKelamin'); ok = false; }
    if (!alamat) { setError('alamat', 'err-alamat'); ok = false; }
    if (!tinggalKos) { setError('tinggalKos', 'err-tinggalKos'); ok = false; }
    if (!sedangMenerimaBeasiswa) { setError('sedangMenerimaBeasiswa', 'err-sedangMenerimaBeasiswa'); ok = false; }
    return ok;
}

function validateStepOrtu() {
    clearErrors();
    let ok = true;
    const namaAyah = document.getElementById('namaAyah').value.trim();
    const namaIbu = document.getElementById('namaIbu').value.trim();
    const pekerjaanAyah = document.getElementById('pekerjaanAyah').value.trim();
    const pekerjaanIbu = document.getElementById('pekerjaanIbu').value.trim();
    const penghasilan = document.getElementById('penghasilan').value;
    const teleponOrtu = document.getElementById('teleponOrtu').value.trim();

    if (!namaAyah) { setError('namaAyah', 'err-namaAyah'); ok = false; }
    if (!namaIbu) { setError('namaIbu', 'err-namaIbu'); ok = false; }
    if (!pekerjaanAyah) { setError('pekerjaanAyah', 'err-pekerjaanAyah'); ok = false; }
    if (!pekerjaanIbu) { setError('pekerjaanIbu', 'err-pekerjaanIbu'); ok = false; }
    if (!penghasilan) { setError('penghasilan', 'err-penghasilan'); ok = false; }
    if (!teleponOrtu || teleponOrtu.length < 10) { setError('teleponOrtu', 'err-teleponOrtu'); ok = false; }
    return ok;
}

function validateStepAkademik() {
    clearErrors();
    let ok = true;
    const programStudi = document.getElementById('programStudi').value;
    const kelas = document.getElementById('kelas').value.trim();
    const semester = document.getElementById('semester').value;
    const ipk = parseFloat(document.getElementById('ipk').value);
    const jenjang = document.getElementById('jenjang').value;

    if (!programStudi) { setError('programStudi', 'err-programStudi'); ok = false; }
    if (!kelas) { setError('kelas', 'err-kelas'); ok = false; }
    if (!semester) { setError('semester', 'err-semester'); ok = false; }
    if (isNaN(ipk) || ipk < 0 || ipk > 4.00) { setError('ipk', 'err-ipk'); ok = false; }
    if (!jenjang) { setError('jenjang', 'err-jenjang'); ok = false; }
    return ok;
}

function validateStepDokumen() {
    clearErrors();
    let ok = true;
    if (!uploadedFiles.ktp) { document.getElementById('err-ktp').classList.add('show'); ok = false; }
    if (!uploadedFiles.ktm) { document.getElementById('err-ktm').classList.add('show'); ok = false; }
    if (!uploadedFiles.transkrip) { document.getElementById('err-transkrip').classList.add('show'); ok = false; }
    const rencanaPenggunaan = document.getElementById('rencanaPenggunaan').value.trim();
    if (!rencanaPenggunaan) { setError('rencanaPenggunaan', 'err-rencanaPenggunaan'); ok = false; }
    return ok;
}

function nextStep(from) {
    if (from === 1 && !validateStep1()) return;
    if (from === 2 && !validateStepOrtu()) return;
    if (from === 3 && !validateStepAkademik()) return;
    if (from === 4 && !validateStepDokumen()) return;
    if (from === 4) buildSummary();
    showStep(from + 1);
}

function prevStep(from) {
    showStep(from - 1);
}

function handleFile(type, input) {
    const file = input.files[0];
    if (!file) return;
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
        showToast('Ukuran file terlalu besar. Maksimal 2MB.', 'error');
        input.value = '';
        return;
    }
    const area = document.getElementById(`upload-${type}`);
    const fname = document.getElementById(`fname-${type}`);
    const reader = new FileReader();
    reader.onload = (e) => {
        uploadedFiles[type] = { name: file.name, data: e.target.result };
        area.classList.add('has-file');
        fname.textContent = '✓ ' + file.name;
    };
    reader.readAsDataURL(file);
}

// Prestasi / Penghargaan, Pengalaman Organisasi, Pengalaman Kepanitiaan
// (masing-masing multi-entri + bukti, memakai pola/format yang sama)
const multiEntryConfigs = {
    prestasi: {
        rows: () => prestasiRows, setRows: (v) => { prestasiRows = v; }, nextId: () => prestasiCounter++,
        listId: 'prestasiList', emptyText: 'Belum ada prestasi ditambahkan.',
        placeholder: 'Contoh: Juara 1 Lomba Karya Tulis Ilmiah Tingkat Nasional',
        uploadText: 'Upload bukti/sertifikat (opsional)'
    },
    organisasi: {
        rows: () => organisasiRows, setRows: (v) => { organisasiRows = v; }, nextId: () => organisasiCounter++,
        listId: 'organisasiList', emptyText: 'Belum ada pengalaman organisasi ditambahkan.',
        placeholder: 'Contoh: Ketua Divisi Humas, HIMA Teknik Sipil',
        uploadText: 'Upload bukti pendukung (opsional)'
    },
    kepanitiaan: {
        rows: () => kepanitiaanRows, setRows: (v) => { kepanitiaanRows = v; }, nextId: () => kepanitiaanCounter++,
        listId: 'kepanitiaanList', emptyText: 'Belum ada pengalaman kepanitiaan ditambahkan.',
        placeholder: 'Contoh: Koordinator Acara, Panitia Dies Natalis Kampus',
        uploadText: 'Upload bukti pendukung (opsional)'
    }
};

function renderMultiEntryRows(type) {
    const cfg = multiEntryConfigs[type];
    const el = document.getElementById(cfg.listId);
    if (!el) return;
    const rows = cfg.rows();
    if (rows.length === 0) {
        el.innerHTML = `<p style="color:var(--gray-400);font-size:.875rem;font-style:italic;margin-bottom:12px">${cfg.emptyText}</p>`;
        return;
    }
    el.innerHTML = rows.map(r => `
        <div class="prestasi-row">
            <div class="prestasi-row-main">
                <input type="text" class="form-control" placeholder="${cfg.placeholder}" value="${(r.nama || '').replace(/"/g, '&quot;')}" oninput="updateMultiEntryNama('${type}', ${r.id}, this.value)">
                <button type="button" class="prestasi-remove-btn" onclick="removeMultiEntryRow('${type}', ${r.id})" title="Hapus"><i class="fas fa-trash"></i></button>
            </div>
            <label class="prestasi-upload-btn${r.bukti ? ' has-file' : ''}" id="upload-${type}-${r.id}">
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onchange="handleMultiEntryFile('${type}', ${r.id},this)" hidden>
                <i class="fas fa-paperclip"></i> <span id="fname-${type}-${r.id}">${r.bukti ? '✓ ' + r.bukti.name : cfg.uploadText}</span>
            </label>
        </div>`).join('');
}

function addMultiEntryRow(type) {
    const cfg = multiEntryConfigs[type];
    cfg.rows().push({ id: cfg.nextId(), nama: '', bukti: null });
    renderMultiEntryRows(type);
}

function removeMultiEntryRow(type, rowId) {
    const cfg = multiEntryConfigs[type];
    cfg.setRows(cfg.rows().filter(r => r.id !== rowId));
    renderMultiEntryRows(type);
}

function updateMultiEntryNama(type, rowId, val) {
    const row = multiEntryConfigs[type].rows().find(r => r.id === rowId);
    if (row) row.nama = val;
}

function handleMultiEntryFile(type, rowId, input) {
    const file = input.files[0];
    if (!file) return;
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
        showToast('Ukuran file terlalu besar. Maksimal 2MB.', 'error');
        input.value = '';
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        const row = multiEntryConfigs[type].rows().find(r => r.id === rowId);
        if (!row) return;
        row.bukti = { name: file.name, data: e.target.result };
        const wrap = document.getElementById(`upload-${type}-${rowId}`);
        const fname = document.getElementById(`fname-${type}-${rowId}`);
        if (wrap) wrap.classList.add('has-file');
        if (fname) fname.textContent = '✓ ' + file.name;
    };
    reader.readAsDataURL(file);
}

// Wrapper agar tetap kompatibel dipanggil dari HTML (addPrestasiRow, addOrganisasiRow, dst.)
function addPrestasiRow() { addMultiEntryRow('prestasi'); }
function removePrestasiRow(rowId) { removeMultiEntryRow('prestasi', rowId); }
function updatePrestasiNama(rowId, val) { updateMultiEntryNama('prestasi', rowId, val); }
function handlePrestasiFile(rowId, input) { handleMultiEntryFile('prestasi', rowId, input); }

function addOrganisasiRow() { addMultiEntryRow('organisasi'); }
function removeOrganisasiRow(rowId) { removeMultiEntryRow('organisasi', rowId); }
function updateOrganisasiNama(rowId, val) { updateMultiEntryNama('organisasi', rowId, val); }
function handleOrganisasiFile(rowId, input) { handleMultiEntryFile('organisasi', rowId, input); }

function addKepanitiaanRow() { addMultiEntryRow('kepanitiaan'); }
function removeKepanitiaanRow(rowId) { removeMultiEntryRow('kepanitiaan', rowId); }
function updateKepanitiaanNama(rowId, val) { updateMultiEntryNama('kepanitiaan', rowId, val); }
function handleKepanitiaanFile(rowId, input) { handleMultiEntryFile('kepanitiaan', rowId, input); }

renderMultiEntryRows('prestasi');
renderMultiEntryRows('organisasi');
renderMultiEntryRows('kepanitiaan');

// Drag & drop support
['ktp','ktm','transkrip'].forEach(type => {
    const area = document.getElementById(`upload-${type}`);
    if (!area) return;
    area.addEventListener('dragover', e => { e.preventDefault(); area.classList.add('dragover'); });
    area.addEventListener('dragleave', () => area.classList.remove('dragover'));
    area.addEventListener('drop', e => {
        e.preventDefault();
        area.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) {
            const input = document.getElementById(`file-${type}`);
            const dt = new DataTransfer();
            dt.items.add(file);
            input.files = dt.files;
            handleFile(type, input);
        }
    });
});

function buildSummary() {
    const fields = [
        ['Nama Lengkap', 'nama'], ['NIM', 'nim'], ['Email', 'email'], ['Telepon', 'telepon'],
        ['Tanggal Lahir', 'tglLahir'], ['Jenis Kelamin', 'jenisKelamin'], ['Alamat', 'alamat'],
        ['Tinggal di Kos', 'tinggalKos'], ['Sedang Menerima Beasiswa', 'sedangMenerimaBeasiswa'],
        ['Nama Ayah', 'namaAyah'], ['Nama Ibu', 'namaIbu'], ['Pekerjaan Ayah', 'pekerjaanAyah'],
        ['Pekerjaan Ibu', 'pekerjaanIbu'], ['Penghasilan Orang Tua', 'penghasilan'], ['Telepon Orang Tua', 'teleponOrtu'],
        ['Program Studi', 'programStudi'], ['Kelas', 'kelas'], ['Semester', 'semester'],
        ['IPK', 'ipk'], ['Jenjang', 'jenjang']
    ];
    let html = '<div class="detail-grid" style="gap:16px">';
    fields.forEach(([label, id]) => {
        const el = document.getElementById(id);
        const val = el ? el.value : '-';
        html += `<div class="detail-item">
            <span class="detail-label">${label}</span>
            <span class="detail-value">${val || '-'}</span>
        </div>`;
    });
    html += '</div>';
    const rencana = document.getElementById('rencanaPenggunaan').value.trim();
    if (rencana) {
        html += '<hr style="margin:20px 0;border:none;border-top:1px solid var(--gray-200)">';
        html += '<div style="font-size:.875rem;font-weight:600;color:var(--gray-600);text-transform:uppercase;letter-spacing:.04em;margin-bottom:10px">RENCANA PENGGUNAAN BEASISWA</div>';
        html += `<p style="font-size:.9rem;color:var(--text-strong);white-space:pre-wrap">${rencana}</p>`;
    }
    html += '<hr style="margin:20px 0;border:none;border-top:1px solid var(--gray-200)">';
    html += '<div style="display:flex;gap:12px;flex-wrap:wrap">';
    ['ktp','ktm','transkrip'].forEach(type => {
        const labels = { ktp:'KTP', ktm:'KTM', transkrip:'Transkrip' };
        const ok = uploadedFiles[type];
        html += `<span style="display:inline-flex;align-items:center;gap:6px;font-size:.875rem;color:${ok?'var(--success)':'var(--danger)'}">
            <i class="fas fa-${ok?'check-circle':'times-circle'}"></i> ${labels[type]}
        </span>`;
    });
    html += '</div>';
    html += buildMultiEntrySummaryHtml('PENGALAMAN ORGANISASI', organisasiRows);
    html += buildMultiEntrySummaryHtml('PENGALAMAN KEPANITIAAN', kepanitiaanRows);
    html += buildMultiEntrySummaryHtml('PRESTASI / PENGHARGAAN', prestasiRows);
    document.getElementById('summaryBox').innerHTML = html;
}

function buildMultiEntrySummaryHtml(title, rows) {
    const isi = rows.filter(r => r.nama.trim());
    if (isi.length === 0) return '';
    let html = '<hr style="margin:20px 0;border:none;border-top:1px solid var(--gray-200)">';
    html += `<div style="font-size:.875rem;font-weight:600;color:var(--gray-600);text-transform:uppercase;letter-spacing:.04em;margin-bottom:10px">${title}</div>`;
    html += '<div style="display:flex;flex-direction:column;gap:8px">';
    isi.forEach(r => {
        html += `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:.9rem">
            <span>${r.nama}</span>
            <span style="color:${r.bukti ? 'var(--success)' : 'var(--gray-400)'};font-size:.8125rem;white-space:nowrap">
                <i class="fas fa-${r.bukti ? 'check-circle' : 'minus-circle'}"></i> ${r.bukti ? 'Bukti terlampir' : 'Tanpa bukti'}
            </span>
        </div>`;
    });
    html += '</div>';
    return html;
}

function submitForm() {
    const checked = document.getElementById('persetujuan').checked;
    if (!checked) {
        document.getElementById('err-persetujuan').classList.add('show');
        return;
    }

    const btn = document.getElementById('btnSubmit');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';

    const id = generateId();
    const data = {
        id,
        nama: document.getElementById('nama').value.trim(),
        nim: document.getElementById('nim').value.trim(),
        email: document.getElementById('email').value.trim(),
        telepon: document.getElementById('telepon').value.trim(),
        tglLahir: document.getElementById('tglLahir').value,
        jenisKelamin: document.getElementById('jenisKelamin').value,
        alamat: document.getElementById('alamat').value.trim(),
        tinggalKos: document.getElementById('tinggalKos').value,
        sedangMenerimaBeasiswa: document.getElementById('sedangMenerimaBeasiswa').value,
        namaAyah: document.getElementById('namaAyah').value.trim(),
        namaIbu: document.getElementById('namaIbu').value.trim(),
        pekerjaanAyah: document.getElementById('pekerjaanAyah').value.trim(),
        pekerjaanIbu: document.getElementById('pekerjaanIbu').value.trim(),
        penghasilan: document.getElementById('penghasilan').value,
        teleponOrtu: document.getElementById('teleponOrtu').value.trim(),
        programStudi: document.getElementById('programStudi').value,
        kelas: document.getElementById('kelas').value.trim(),
        semester: parseInt(document.getElementById('semester').value),
        ipk: parseFloat(document.getElementById('ipk').value),
        jenjang: document.getElementById('jenjang').value,
        rencanaPenggunaan: document.getElementById('rencanaPenggunaan').value.trim(),
        prestasi: prestasiRows.filter(r => r.nama.trim()).map(r => ({ nama: r.nama.trim(), bukti: r.bukti ? { name: r.bukti.name, data: r.bukti.data } : null })),
        organisasi: organisasiRows.filter(r => r.nama.trim()).map(r => ({ nama: r.nama.trim(), bukti: r.bukti ? { name: r.bukti.name, data: r.bukti.data } : null })),
        kepanitiaan: kepanitiaanRows.filter(r => r.nama.trim()).map(r => ({ nama: r.nama.trim(), bukti: r.bukti ? { name: r.bukti.name, data: r.bukti.data } : null })),
        tanggalDaftar: new Date().toISOString(),
        status: 'pending',
        pesan: '',
        dokumen: {
            ktp: uploadedFiles.ktp ? { name: uploadedFiles.ktp.name, data: uploadedFiles.ktp.data } : null,
            ktm: uploadedFiles.ktm ? { name: uploadedFiles.ktm.name, data: uploadedFiles.ktm.data } : null,
            transkrip: uploadedFiles.transkrip ? { name: uploadedFiles.transkrip.name, data: uploadedFiles.transkrip.data } : null
        }
    };

    DB.submitPendaftarToServer(data).then(result => {
        if (!result.ok) {
            btn.disabled = false;
            btn.innerHTML = 'Kirim Pendaftaran';
            showToast(result.error || 'Gagal mengirim pendaftaran. Coba lagi.', 'error');
            return;
        }

        document.getElementById('regForm').style.display = 'none';
        document.getElementById('successView').style.display = 'block';
        document.getElementById('regIdDisplay').textContent = id;
        document.querySelector('.stepper').style.display = 'none';
    });
}
