// assets/js/mandor.js
// Javascript for SIPENA PINUS - Panel Mandor Lapangan

document.addEventListener('DOMContentLoaded', function () {

    // ======================== STATE MANAGEMENT ========================
    const LS = {
        PENYADAP: 'sipena_penyadap',
        PETAK:    'sipena_petak',
        TARGET:   'sipena_targets',
        DEMO_DATA: 'sipena_demo_entries',
        MANDOR:   'sipena_mandor',
        ACTIVE_MANDOR: 'sipena_active_mandor',
        MONITORING: 'sipena_monitoring',
    };

    // Helper functions for LocalStorage
    function lsGet(key) {
        try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
    }
    function lsSet(key, val) {
        try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
    }

    function migrateLocalStorageData() {
        // 1. Migrate Petak
        let petakList = lsGet(LS.PETAK);
        if (petakList && Array.isArray(petakList)) {
            let updated = false;
            const defaults = {
                'P.01 - B.01': 1200,
                'P.02 - B.05': 1500,
                'P.03 - B.12': 1000,
                'P.04 - B.08': 1300,
                'P.05 - B.03': 1100,
                'P.06 - B.10': 1400
            };
            petakList = petakList.map(b => {
                if (b.pohon === undefined || b.pohon === null || parseInt(b.pohon) <= 0) {
                    b.pohon = defaults[b.kode] || 1000;
                    updated = true;
                }
                return b;
            });
            if (updated) {
                lsSet(LS.PETAK, petakList);
            }
        }

        // 2. Migrate Penyadap
        let penyadapList = lsGet(LS.PENYADAP);
        if (penyadapList && Array.isArray(penyadapList)) {
            let updated = false;
            const defaults = {
                'Slamet': 800,
                'Budi': 1000,
                'Sukijo': 700,
                'Tukimin': 900,
                'Wawan': 800,
                'Kardi': 950
            };
            penyadapList = penyadapList.map(p => {
                if (p.pohon === undefined || p.pohon === null || parseInt(p.pohon) <= 0) {
                    p.pohon = defaults[p.nama] || 800;
                    updated = true;
                }
                return p;
            });
            if (updated) {
                lsSet(LS.PENYADAP, penyadapList);
            }
        }
    }

    // Default lists matching main app
    function getMandorList() {
        return lsGet(LS.MANDOR) || [
            { id: 'm1', nama: 'Mandor Wawan', nik: '001', petak: ['P.01 - B.01', 'P.03 - B.12'] },
            { id: 'm2', nama: 'Mandor Budi',  nik: '002', petak: ['P.02 - B.05', 'P.04 - B.08'] },
            { id: 'm3', nama: 'Mandor Kardi', nik: '003', petak: ['P.05 - B.03', 'P.06 - B.10'] },
        ];
    }

    function getPenyadapList() {
        return lsGet(LS.PENYADAP) || [
            { id: 'p1', nama: 'Slamet',  petak: 'P.01 - B.01', status: 'Aktif', pohon: 800 },
            { id: 'p2', nama: 'Budi',    petak: 'P.02 - B.05', status: 'Aktif', pohon: 1000 },
            { id: 'p3', nama: 'Sukijo',  petak: 'P.03 - B.12', status: 'Aktif', pohon: 700 },
            { id: 'p4', nama: 'Tukimin', petak: 'P.04 - B.08', status: 'Aktif', pohon: 900 },
            { id: 'p5', nama: 'Wawan',   petak: 'P.05 - B.03', status: 'Aktif', pohon: 800 },
            { id: 'p6', nama: 'Kardi',   petak: 'P.06 - B.10', status: 'Aktif', pohon: 950 },
        ];
    }

    function getPetakList() {
        return lsGet(LS.PETAK) || [
            { id: 'b1', kode: 'P.01 - B.01', luas: 12.5, pohon: 1200 },
            { id: 'b2', kode: 'P.02 - B.05', luas: 15.0, pohon: 1500 },
            { id: 'b3', kode: 'P.03 - B.12', luas: 10.0, pohon: 1000 },
            { id: 'b4', kode: 'P.04 - B.08', luas: 13.0, pohon: 1300 },
            { id: 'b5', kode: 'P.05 - B.03', luas: 11.5, pohon: 1100 },
            { id: 'b6', kode: 'P.06 - B.10', luas: 14.0, pohon: 1400 },
        ];
    }

    function getTargetList() { return lsGet(LS.TARGET) || []; }
    function getDemoEntries() { return lsGet(LS.DEMO_DATA) || []; }
    function getMonitoringData() { return lsGet(LS.MONITORING) || {}; }

    // Helper to get active mandor info and their supervised petaks
    function getActiveMandor() {
        const mandors = getMandorList();
        const loggedInId = localStorage.getItem('sipena_logged_in_mandor');
        const activeId = loggedInId || localStorage.getItem(LS.ACTIVE_MANDOR) || 'm1';
        return mandors.find(m => m.id === activeId) || mandors[0];
    }

    function getSupervisedPetaks() {
        const activeM = getActiveMandor();
        return activeM ? (activeM.petak || []) : [];
    }

    // Filter data based on active mandor
    function getFilteredPenyadapList() {
        const supervised = getSupervisedPetaks();
        return getPenyadapList().filter(p => supervised.includes(p.petak));
    }

    function getFilteredActivePenyadap() {
        return getFilteredPenyadapList().filter(p => p.status === 'Aktif');
    }

    function getFilteredPetakList() {
        const supervised = getSupervisedPetaks();
        return getPetakList().filter(b => supervised.includes(b.kode));
    }

    // ======================== TOAST NOTIFICATION ========================
    let toastTimer = null;
    function showToast(msg, type = 'success') {
        const t = document.getElementById('globalToast');
        if (!t) return;
        clearTimeout(toastTimer);
        t.textContent = msg;
        t.className = `global-toast ${type}`;
        t.style.display = 'block';
        toastTimer = setTimeout(() => { t.style.display = 'none'; }, 3500);
    }

    // ======================== MODAL HELPERS ========================
    function openModal(id) { document.getElementById(id)?.classList.add('active'); }
    function closeModal(id) { 
        document.getElementById(id)?.classList.remove('active'); 
        resetModalForms();
    }

    document.querySelectorAll('[data-modal-close]').forEach(btn => {
        btn.addEventListener('click', () => closeModal(btn.getAttribute('data-modal-close')));
    });

    function resetModalForms() {
        // Penyadap Form Reset
        document.getElementById('editPenyadapId').value = '';
        document.getElementById('inputNamaPenyadap').value = '';
        document.getElementById('inputPetakPenyadap').selectedIndex = 0;
        document.getElementById('inputPohonPenyadap').value = '';
        document.getElementById('inputStatusPenyadap').value = 'Aktif';
        
        const infoEl = document.getElementById('infoSisaPohon');
        if (infoEl) infoEl.textContent = '';
    }

    // ======================== MANDOR SELECTOR INITIALIZATION ========================
    function initMandorSelector() {
        const select = document.getElementById('activeMandorSelect');
        if (!select) return;

        const mandors = getMandorList();
        select.innerHTML = mandors.map(m => `<option value="${m.id}">${m.nama}</option>`).join('');

        const savedId = localStorage.getItem(LS.ACTIVE_MANDOR) || 'm1';
        select.value = savedId;
        updateHeaderMandorName(savedId);

        select.addEventListener('change', function () {
            const val = this.value;
            localStorage.setItem(LS.ACTIVE_MANDOR, val);
            updateHeaderMandorName(val);
            
            // Reload active view stats or tables
            const activeTab = document.querySelector('.sidebar-menu li.active')?.getAttribute('data-tab') || 'dashboard';
            renderTabView(activeTab);
            showToast(`Beralih ke pengawasan ${getActiveMandor().nama}!`);

            // Propagate active mandor change to iframe form if loaded
            propagateMandorToIframe();
        });
    }

    function updateHeaderMandorName(mandorId) {
        const mandors = getMandorList();
        const m = mandors.find(x => x.id === mandorId) || mandors[0];
        const span = document.getElementById('headerMandorName');
        if (span && m) {
            span.textContent = m.nama;
        }
    }

    function propagateMandorToIframe() {
        const activeM = getActiveMandor();
        const iframe = document.getElementById('inputIframe');
        if (iframe && iframe.contentWindow && activeM) {
            iframe.contentWindow.postMessage({
                type: 'SIPENA_SET_ACTIVE_MANDOR',
                mandorId: activeM.id,
                petak: activeM.petak
            }, '*');
        }
    }

    // ======================== TAB ROUTING ========================
    const sidebar     = document.getElementById('sidebar');
    const menuToggle  = document.getElementById('menuToggle');
    const menuItems   = document.querySelectorAll('.sidebar-menu li');
    const tabContents = document.querySelectorAll('.tab-content');
    const pageTitle   = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => sidebar.classList.toggle('active'));
    }

    document.addEventListener('click', (e) => {
        if (sidebar && menuToggle && !sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
            if (sidebar.classList.contains('active') && window.innerWidth <= 768) {
                sidebar.classList.remove('active');
            }
        }
    });

    menuItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            const tab = this.getAttribute('data-tab');
            menuItems.forEach(li => li.classList.remove('active'));
            this.classList.add('active');
            tabContents.forEach(tc => tc.classList.remove('active'));
            document.getElementById('tab-' + tab)?.classList.add('active');
            updatePageHeader(tab);
            renderTabView(tab);
            if (window.innerWidth <= 768) sidebar.classList.remove('active');
        });
    });

    const pageTitles = {
        dashboard:  ['Beranda Mandor', 'Ringkasan Operasional & Pengelolaan Lapangan'],
        penyadap:   ['Kelola Penyadap', 'Manajemen Data Tapper Hutan Pinus'],
        monitoring: ['Absensi Harian (Absen)', 'Pencatatan Kehadiran & Status Harian Tapper'],
        petak:      ['Petak yang Diawasi', 'Daftar Blok Wilayah Sadap (Read-Only)'],
        target:     ['Target per Penyadap', 'Beban Target Bulanan/Tahunan per Penyadap (Read-Only)'],
        input:      ['Form Timbangan HP', 'Formulir Input Hasil Timbangan Getah Pinus']
    };

    function updatePageHeader(tab) {
        const t = pageTitles[tab] || ['Beranda Mandor', ''];
        if (pageTitle) pageTitle.textContent = t[0];
        if (pageSubtitle) pageSubtitle.textContent = t[1];
    }

    function renderTabView(tab) {
        switch (tab) {
            case 'dashboard':  renderDashboardStats(); break;
            case 'penyadap':   renderPenyadapTable(); break;
            case 'monitoring': renderMonitoringTab(); break;
            case 'petak':      renderPetakTable(); break;
            case 'target':     renderTargetTable(); break;
            case 'input':
                // Refresh iframe contents and pass active mandor values
                const iframe = document.getElementById('inputIframe');
                if (iframe) {
                    iframe.src = iframe.src;
                    setTimeout(propagateMandorToIframe, 400);
                }
                break;
        }
    }

    // ======================== DASHBOARD STATS ========================
    function renderDashboardStats() {
        const activeWorkers = getFilteredActivePenyadap().length;
        const totalBlocks = getFilteredPetakList().length;
        
        const totalArea = getFilteredPetakList().reduce((sum, b) => sum + (parseFloat(b.luas) || 0), 0);
        
        const targets = getTargetList();
        const supervised = getSupervisedPetaks();
        const supervisedTargets = targets.filter(t => supervised.includes(t.petak));
        const avgTarget = supervisedTargets.length > 0
            ? supervisedTargets.reduce((sum, t) => sum + (parseFloat(t.tahunan) || 0), 0) / supervisedTargets.length
            : 3600; // default benchmark

        animateValue(document.getElementById('stat-active-workers'), activeWorkers, ' orang', true);
        animateValue(document.getElementById('stat-total-blocks'), totalBlocks, ' petak', true);
        animateValue(document.getElementById('stat-total-area'), totalArea, ' Ha', false);
        animateValue(document.getElementById('stat-avg-target'), avgTarget, ' kg', true);
    }

    function animateValue(el, end, suffix = '', isInt = false) {
        if (!el) return;
        let start = 0, dur = 500, startTs = null;
        const step = (ts) => {
            if (!startTs) startTs = ts;
            const prog = Math.min((ts - startTs) / dur, 1);
            const cur = prog * (end - start) + start;
            el.innerHTML = (isInt ? Math.floor(cur) : cur.toFixed(1)) + suffix;
            if (prog < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    // ======================== KELOLA PENYADAP ========================
    function renderPenyadapTable() {
        const list = getFilteredPenyadapList();
        const tbody = document.getElementById('penyadapTbody');
        if (!tbody) return;

        if (!list.length) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:30px;">Belum ada data penyadap di petak Anda. Klik tombol Tambah Penyadap.</td></tr>';
            return;
        }

        tbody.innerHTML = list.map(p => `
            <tr>
                <td><strong>${p.nama}</strong></td>
                <td><code style="background:#edf2f7;padding:3px 7px;border-radius:4px;font-weight:600;">${p.petak}</code></td>
                <td><strong>${(p.pohon || 0).toLocaleString('id-ID')} pohon</strong></td>
                <td><span class="status-badge-${p.status === 'Aktif' ? 'aktif' : 'nonaktif'}">${p.status}</span></td>
                <td style="text-align: center;">
                    <div class="action-btns" style="justify-content: center;">
                        <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.8rem;" onclick="window.editPenyadap('${p.id}')">✏️ Edit</button>
                        <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.8rem; border-color: var(--danger); color: var(--danger);" onclick="window.deletePenyadap('${p.id}')">🗑️ Hapus</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    function updateModalTreeInfo() {
        const petakSelect = document.getElementById('inputPetakPenyadap');
        const infoEl = document.getElementById('infoSisaPohon');
        const idInput = document.getElementById('editPenyadapId');
        
        if (!petakSelect || !infoEl) return;
        
        const petakKode = petakSelect.value;
        const currentPenyadapId = idInput ? idInput.value : '';
        
        if (!petakKode) {
            infoEl.textContent = '';
            return;
        }
        
        const petakList = getPetakList();
        const targetPetak = petakList.find(b => b.kode === petakKode);
        if (!targetPetak) {
            infoEl.textContent = 'Petak tidak ditemukan';
            return;
        }
        
        const totalPohon = parseInt(targetPetak.pohon) || 0;
        const penyadapList = getPenyadapList();
        
        // hitung pohon yang dipegang penyadap aktif LAIN
        const otherActive = penyadapList.filter(x => x.petak === petakKode && x.status === 'Aktif' && x.id !== currentPenyadapId);
        const allocated = otherActive.reduce((sum, x) => sum + (parseInt(x.pohon) || 0), 0);
        const sisa = Math.max(0, totalPohon - allocated);
        
        infoEl.innerHTML = `🌳 Kapasitas Petak: <strong>${totalPohon.toLocaleString('id-ID')}</strong> pohon | Sisa Idle (Bisa disadap): <strong>${sisa.toLocaleString('id-ID')}</strong> pohon`;
        
        // Jika sisa = 0, beri warna merah, jika tidak beri warna hijau
        infoEl.style.color = sisa > 0 ? '#2e7d32' : '#e53935';
    }

    function populatePetakSelectDropdown() {
        const petakList = getFilteredPetakList();
        const select = document.getElementById('inputPetakPenyadap');
        if (!select) return;

        if (!petakList.length) {
            select.innerHTML = '<option value="" disabled selected>-- Tidak ada petak yang diawasi --</option>';
            return;
        }

        select.innerHTML = '<option value="" disabled selected>-- Pilih Petak --</option>' +
            petakList.map(b => `<option value="${b.kode}">${b.kode}</option>`).join('');

        // Wire up change listener
        if (!select.dataset.listenerAttached) {
            select.addEventListener('change', updateModalTreeInfo);
            select.dataset.listenerAttached = "true";
        }

        const statusSelect = document.getElementById('inputStatusPenyadap');
        if (statusSelect && !statusSelect.dataset.listenerAttached) {
            statusSelect.addEventListener('change', updateModalTreeInfo);
            statusSelect.dataset.listenerAttached = "true";
        }
    }

    window.editPenyadap = function (id) {
        const list = getPenyadapList();
        const p = list.find(x => x.id === id);
        if (!p) return;

        populatePetakSelectDropdown();
        document.getElementById('editPenyadapId').value = p.id;
        document.getElementById('inputNamaPenyadap').value = p.nama;
        document.getElementById('inputPetakPenyadap').value = p.petak;
        document.getElementById('inputPohonPenyadap').value = p.pohon || 0;
        document.getElementById('inputStatusPenyadap').value = p.status;

        document.getElementById('modalPenyadapTitle').textContent = 'Edit Data Penyadap';
        openModal('modalPenyadap');
        updateModalTreeInfo();
    };

    window.deletePenyadap = function (id) {
        const list = getPenyadapList();
        const p = list.find(x => x.id === id);
        if (!p) return;

        if (confirm(`Apakah Anda yakin ingin menghapus penyadap "${p.nama}"?`)) {
            const newList = list.filter(x => x.id !== id);
            lsSet(LS.PENYADAP, newList);
            renderPenyadapTable();
            showToast(`Penyadap "${p.nama}" berhasil dihapus.`, 'warning');
        }
    };

    document.getElementById('btnTambahPenyadap')?.addEventListener('click', () => {
        populatePetakSelectDropdown();
        document.getElementById('modalPenyadapTitle').textContent = 'Tambah Penyadap Baru';
        openModal('modalPenyadap');
        updateModalTreeInfo();
    });

    document.getElementById('btnSimpanPenyadap')?.addEventListener('click', () => {
        const id = document.getElementById('editPenyadapId').value;
        const nama = document.getElementById('inputNamaPenyadap').value.trim();
        const petak = document.getElementById('inputPetakPenyadap').value;
        const pohonInput = parseInt(document.getElementById('inputPohonPenyadap').value) || 0;
        const status = document.getElementById('inputStatusPenyadap').value;

        if (!nama) { showToast('Mohon isi nama penyadap!', 'error'); return; }
        if (!petak) { showToast('Mohon pilih petak tugas!', 'error'); return; }
        if (pohonInput <= 0) { showToast('Mohon isi jumlah pohon sadap dengan angka lebih dari 0!', 'error'); return; }

        // Validasi Kapasitas Pohon Petak
        const petakList = getPetakList();
        const targetPetak = petakList.find(b => b.kode === petak);
        if (!targetPetak) {
            showToast('Kritikal: Data petak tidak ditemukan!', 'error');
            return;
        }

        const totalPohonPetak = parseInt(targetPetak.pohon) || 0;
        let list = getPenyadapList();

        if (status === 'Aktif') {
            const otherActivePenyadap = list.filter(x => x.petak === petak && x.status === 'Aktif' && x.id !== id);
            const currentAllocated = otherActivePenyadap.reduce((sum, x) => sum + (parseInt(x.pohon) || 0), 0);
            const maxAllowed = totalPohonPetak - currentAllocated;

            if (pohonInput > maxAllowed) {
                showToast(`Gagal! Akumulasi pohon sadap melebihi kapasitas petak ${petak}. Sisa pohon menganggur: ${maxAllowed} pohon.`, 'error');
                return;
            }
        }

        if (id) {
            // Update
            const idx = list.findIndex(x => x.id === id);
            if (idx >= 0) {
                list[idx] = { id, nama, petak, status, pohon: pohonInput };
                showToast(`Data penyadap "${nama}" berhasil diubah!`);
            }
        } else {
            // Add new
            const newP = { id: 'p' + Date.now(), nama, petak, status, pohon: pohonInput };
            list.push(newP);
            showToast(`Penyadap "${nama}" berhasil ditambahkan!`);
        }

        lsSet(LS.PENYADAP, list);
        closeModal('modalPenyadap');
        renderPenyadapTable();
    });

    // ======================== KELOLA PETAK (READ-ONLY) ========================
    function renderPetakTable() {
        const petakList = getFilteredPetakList();
        const penyadapList = getPenyadapList();
        const tbody = document.getElementById('petakTbody');
        if (!tbody) return;

        if (!petakList.length) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:30px;">Belum ada petak yang diawasi oleh Anda.</td></tr>';
            return;
        }

        tbody.innerHTML = petakList.map(b => {
            const workers = penyadapList.filter(p => p.petak === b.kode && p.status === 'Aktif');
            const workerNames = workers.map(w => w.nama).join(', ') || '<span style="color: var(--text-muted); font-style: italic;">Belum ada penyadap aktif</span>';

            const totalPohon = parseInt(b.pohon) || 0;
            const activePohon = workers.reduce((sum, p) => sum + (parseInt(p.pohon) || 0), 0);
            const nganggurPohon = Math.max(0, totalPohon - activePohon);

            return `
                <tr>
                    <td><strong>${b.kode}</strong></td>
                    <td>${workerNames}</td>
                    <td><strong>${b.luas} Ha</strong></td>
                    <td>
                        <strong>${activePohon.toLocaleString('id-ID')} / ${totalPohon.toLocaleString('id-ID')} pohon</strong>
                        <br>
                        <small style="color: ${nganggurPohon > 0 ? '#ef6c00' : '#2e7d32'}; font-weight: 600;">
                            ${nganggurPohon.toLocaleString('id-ID')} nganggur
                        </small>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // ======================== TARGET PRODUKSI (READ-ONLY) ========================
    function renderTargetTable() {
        const petakList = getFilteredPetakList();
        const targets = getTargetList();
        const penyadapList = getPenyadapList();
        const tbody = document.getElementById('targetTbody');
        if (!tbody) return;

        if (!petakList.length) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:30px;">Belum ada data petak yang diawasi oleh Anda.</td></tr>';
            return;
        }

        tbody.innerHTML = petakList.map(b => {
            const thisYear = new Date().getFullYear();
            const target = targets.find(t => t.petak === b.kode && parseInt(t.tahun) === thisYear) || {
                tahun: thisYear,
                tahunan: 3600,
                periode1: 150,
                periode2: 150
            };

            const assignedActive = penyadapList.filter(p => p.petak === b.kode && p.status === 'Aktif');
            const n = assignedActive.length;
            const perPenyadap = n > 0 ? (target.tahunan / n) : target.tahunan;

            return `
                <tr>
                    <td><code style="background:#edf2f7;padding:3px 7px;border-radius:4px;font-weight:600;">${b.kode}</code></td>
                    <td>${target.tahun}</td>
                    <td><strong>${parseFloat(target.tahunan).toLocaleString('id-ID')} kg</strong></td>
                    <td>
                        <strong style="color: var(--primary-light);">${parseFloat(perPenyadap.toFixed(0)).toLocaleString('id-ID')} kg</strong>
                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">Dihitung dari ${n} penyadap aktif</div>
                    </td>
                    <td>${parseFloat(target.periode1).toLocaleString('id-ID')} kg</td>
                    <td>${parseFloat(target.periode2).toLocaleString('id-ID')} kg</td>
                </tr>
            `;
        }).join('');
    }

    // ======================== ABSENSI / MONITORING HARIAN ========================
    function todayStr() { return new Date().toISOString().split('T')[0]; }
    function formatDateLong(ds) {
        if (!ds) return '-';
        const d = new Date(ds);
        return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }

    function renderMonitoringTab() {
        const dateEl = document.getElementById('monitoringDate');
        if (dateEl && !dateEl.value) dateEl.value = todayStr();
        
        const tgl = dateEl?.value || todayStr();
        buildMonitoringForm(tgl);
    }

    document.getElementById('btnLoadMonitoring')?.addEventListener('click', () => {
        const tgl = document.getElementById('monitoringDate')?.value;
        if (!tgl) { showToast('Pilih tanggal terlebih dahulu.', 'error'); return; }
        buildMonitoringForm(tgl);
    });

    document.getElementById('btnSimpanMonitoring')?.addEventListener('click', () => {
        const tgl = document.getElementById('monitoringDate')?.value;
        if (!tgl) { showToast('Pilih tanggal terlebih dahulu.', 'error'); return; }
        saveMonitoringData(tgl);
    });

    function buildMonitoringForm(tgl) {
        const container = document.getElementById('monitoringPetakContainer');
        if (!container) return;

        const petakList    = getFilteredPetakList();
        const penyadapList = getFilteredActivePenyadap();
        const mon          = getMonitoringData();
        const dayData      = mon[tgl] || {};

        if (!petakList.length) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);">Belum ada petak yang ditugaskan kepada Anda oleh pimpinan.</div>';
            return;
        }

        const statusOptions = ['Hadir', 'Sakit', 'Ke Pertanian', 'Hajatan', 'Bangunan', 'Lainnya'];
        const dateLabel = formatDateLong(tgl);

        let html = `<div style="margin-bottom:12px; font-size:0.9rem; color:var(--text-muted); font-weight:600;">📅 Absensi: ${dateLabel}</div>`;
        let hasTapper = false;

        petakList.forEach(petak => {
            const assigned = penyadapList.filter(p => p.petak === petak.kode);
            if (!assigned.length) return;

            hasTapper = true;
            html += `<div class="monitoring-petak-section" style="background:#fff; border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-bottom: 20px; box-shadow: var(--shadow);">
                <div class="monitoring-petak-header" style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid var(--border); padding-bottom:10px; margin-bottom:12px;">
                    <div class="monitoring-petak-title" style="font-weight:700; color:var(--primary);">📍 Petak ${petak.kode}</div>
                    <div class="monitoring-petak-badge" style="background:var(--primary-ultra-light); color:var(--primary); padding:3px 8px; border-radius:4px; font-size:0.8rem; font-weight:600;">${assigned.length} Penyadap</div>
                </div>
                <div class="monitoring-penyadap-list" style="display:flex; flex-direction:column; gap:12px;">`;

            assigned.forEach(p => {
                const saved  = dayData[p.nama] || {};
                const status = saved.status || 'Hadir';
                const ket    = saved.keterangan || '';

                const radios = statusOptions.map(s => {
                    const checked = status === s ? 'checked' : '';
                    const safeId  = `mon_${tgl}_${p.nama.replace(/\s+/g, '_')}_${s.replace(/\s+/g, '_')}`;
                    return `<input type="radio" class="mon-status-radio" name="mon_${tgl}_${p.nama.replace(/\s+/g,'_')}" value="${s}" id="${safeId}" ${checked} onchange="window.onMonStatusChange('${tgl}','${p.nama}',this.value)" style="margin-right: 4px; cursor:pointer;">
                            <label class="mon-status-label" for="${safeId}" style="margin-right:12px; font-size:0.85rem; font-weight:500; cursor:pointer; color:var(--text-main);">${s}</label>`;
                }).join('');

                const showKet = (status !== 'Hadir') ? 'block' : 'none';
                const rowStyle = status === 'Hadir' ? 'border-left: 4px solid var(--primary-light); background:#f9fcf9;' : status === 'Sakit' ? 'border-left: 4px solid var(--warning); background:#fffaf5;' : 'border-left: 4px solid var(--danger); background:#fff5f5;';

                html += `<div class="monitoring-penyadap-row" id="monrow_${tgl}_${p.nama.replace(/\s+/g,'_')}" style="padding:14px; border-radius:8px; display:flex; flex-direction:column; gap:10px; ${rowStyle} transition:var(--transition);">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                        <div class="mon-penyadap-name" style="font-weight:700; color:var(--text-dark); font-size:0.95rem;">👤 ${p.nama}</div>
                        <div class="mon-status-select-group" style="display:flex; align-items:center; flex-wrap:wrap;">${radios}</div>
                    </div>
                    <input type="text" class="form-control mon-keterangan-input" id="monket_${tgl}_${p.nama.replace(/\s+/g,'_')}" placeholder="Tulis alasan jika tidak hadir (sakit, hajatan, dll)..." value="${ket}" oninput="window.onMonKetChange('${tgl}','${p.nama}',this.value)" style="display:${showKet}; font-size:0.85rem; padding:6px 12px; width:100%;">
                </div>`;
            });

            html += '</div></div>';
        });

        if (!hasTapper) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);">Tidak ada penyadap aktif ditugaskan di petak pengawasan Anda.</div>';
            return;
        }

        container.innerHTML = html;
        updateMonitoringCounts();
    }

    window.onMonStatusChange = function(tgl, nama, status) {
        const mon = getMonitoringData();
        if (!mon[tgl]) mon[tgl] = {};
        if (!mon[tgl][nama]) mon[tgl][nama] = {};
        mon[tgl][nama].status = status;
        lsSet(LS.MONITORING, mon);

        const safeNama = nama.replace(/\s+/g, '_');
        const row    = document.getElementById(`monrow_${tgl}_${safeNama}`);
        const ketEl  = document.getElementById(`monket_${tgl}_${safeNama}`);
        if (row) {
            row.style.borderLeft = status === 'Hadir' ? '4px solid var(--primary-light)' : status === 'Sakit' ? '4px solid var(--warning)' : '4px solid var(--danger)';
            row.style.background = status === 'Hadir' ? '#f9fcf9' : status === 'Sakit' ? '#fffaf5' : '#fff5f5';
        }
        if (ketEl) {
            ketEl.style.display = status !== 'Hadir' ? 'block' : 'none';
        }
        updateMonitoringCounts();
    };

    window.onMonKetChange = function(tgl, nama, ket) {
        const mon = getMonitoringData();
        if (!mon[tgl]) mon[tgl] = {};
        if (!mon[tgl][nama]) mon[tgl][nama] = {};
        mon[tgl][nama].keterangan = ket;
        lsSet(LS.MONITORING, mon);
    };

    function saveMonitoringData(tgl) {
        showToast(`✅ Data absensi tanggal ${tgl} berhasil disimpan!`, 'success');
        updateMonitoringCounts();
    }

    function updateMonitoringCounts() {
        const tgl = document.getElementById('monitoringDate')?.value;
        if (!tgl) return;
        
        const mon = getMonitoringData();
        const dayData = mon[tgl] || {};
        const allActive = getFilteredActivePenyadap();

        let hadir = 0, tidakHadir = 0, sakit = 0, lainnya = 0;
        allActive.forEach(p => {
            const info = dayData[p.nama];
            const status = info?.status || 'Hadir';
            if (status === 'Hadir') hadir++;
            else { tidakHadir++; if (status === 'Sakit') sakit++; else lainnya++; }
        });

        const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        setEl('monHadirCount',     hadir);
        setEl('monTidakHadirCount', tidakHadir);
        setEl('monSakitCount',      sakit);
        setEl('monLainnyaCount',    lainnya);
    }

    // ======================== EMBED FORM MSG LISTENER ========================
    window.addEventListener('message', (e) => {
        if (e.data?.type === 'SIPENA_SUBMIT_SUCCESS') {
            const activeTab = document.querySelector('.sidebar-menu li.active')?.getAttribute('data-tab');
            if (activeTab === 'dashboard') {
                renderDashboardStats();
            }
            showToast('Laporan timbangan penyadap berhasil terekam!', 'success');
        }
    });

    // ======================== AUTHENTICATION ========================
    function checkAuth() {
        const loggedInId = localStorage.getItem('sipena_logged_in_mandor');
        const overlay = document.getElementById('loginOverlay');
        
        if (!loggedInId) {
            // Show overlay
            if (overlay) overlay.style.display = 'flex';
            
            // Populate select dropdown
            const loginSelect = document.getElementById('loginMandorSelect');
            if (loginSelect) {
                const mandors = getMandorList();
                loginSelect.innerHTML = mandors.map(m => `<option value="${m.id}">${m.nama}</option>`).join('');
            }
            
            // Focus PIN field
            const pinInput = document.getElementById('loginPIN');
            if (pinInput) {
                pinInput.value = '';
                pinInput.focus();
            }
            return false;
        } else {
            // Hide overlay
            if (overlay) overlay.style.display = 'none';
            
            // Set active mandor in localStorage to match the logged-in user
            localStorage.setItem(LS.ACTIVE_MANDOR, loggedInId);
            updateHeaderMandorName(loggedInId);
            return true;
        }
    }

    function handleLoginSubmit() {
        const select = document.getElementById('loginMandorSelect');
        const pinInput = document.getElementById('loginPIN');
        if (!select || !pinInput) return;

        const mandorId = select.value;
        const pinVal = pinInput.value.trim();

        if (!pinVal) {
            showToast('Silakan masukkan PIN NIK Anda!', 'error');
            pinInput.focus();
            return;
        }

        const mandors = getMandorList();
        const targetMandor = mandors.find(m => m.id === mandorId);

        if (!targetMandor) {
            showToast('Mandor tidak ditemukan!', 'error');
            return;
        }

        // Compare entered PIN with NIK
        if (pinVal === targetMandor.nik) {
            // Success!
            localStorage.setItem('sipena_logged_in_mandor', mandorId);
            localStorage.setItem(LS.ACTIVE_MANDOR, mandorId);
            
            // Clean pin
            pinInput.value = '';
            
            // Hide overlay
            const overlay = document.getElementById('loginOverlay');
            if (overlay) overlay.style.display = 'none';

            // Show success toast
            showToast(`Selamat datang kembali, ${targetMandor.nama}!`, 'success');
            
            // Re-initialize views
            updateHeaderMandorName(mandorId);
            initMandorSelector();
            
            // Reload active tab view
            const activeTab = document.querySelector('.sidebar-menu li.active')?.getAttribute('data-tab') || 'dashboard';
            renderTabView(activeTab);
            
            // Propagate active mandor to iframe
            propagateMandorToIframe();
        } else {
            // Failure!
            showToast('Gagal! PIN / NIK Mandor salah.', 'error');
            pinInput.select();
            pinInput.focus();
        }
    }

    // Bind login event listeners
    document.getElementById('btnSubmitLogin')?.addEventListener('click', handleLoginSubmit);
    document.getElementById('loginPIN')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleLoginSubmit();
        }
    });

    // Bind logout event listener
    document.getElementById('btnLogoutMandor')?.addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('Apakah Anda yakin ingin keluar dari panel mandor?')) {
            localStorage.removeItem('sipena_logged_in_mandor');
            localStorage.removeItem(LS.ACTIVE_MANDOR);
            showToast('Anda telah keluar.', 'warning');
            // Hard reload to reset everything
            window.location.reload();
        }
    });

    // ======================== INITIAL DEFAULTS ========================
    // Run schema migration first
    migrateLocalStorageData();

    // Ensure default arrays exist in localStorage
    if (!localStorage.getItem(LS.PENYADAP)) {
        lsSet(LS.PENYADAP, getPenyadapList());
    }
    if (!localStorage.getItem(LS.PETAK)) {
        lsSet(LS.PETAK, getPetakList());
    }
    if (!localStorage.getItem(LS.MANDOR)) {
        lsSet(LS.MANDOR, getMandorList());
    }

    // Initial render / Authentication check
    if (checkAuth()) {
        initMandorSelector();
        renderDashboardStats();
    } else {
        // Just populate the login dropdown in case it hasn't been
        const loginSelect = document.getElementById('loginMandorSelect');
        if (loginSelect) {
            const mandors = getMandorList();
            loginSelect.innerHTML = mandors.map(m => `<option value="${m.id}">${m.nama}</option>`).join('');
        }
    }
});
