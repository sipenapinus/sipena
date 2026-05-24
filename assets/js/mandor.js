// =========================================================================
// KONFIGURASI: Isi URL Google Apps Script Anda di sini
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwTelvmwcTnXUKYx_CQKfUg82nltxUNWjHsckbCO9vNj3My_VYl2huNYqmqJZKhzO61Kg/exec";
// =========================================================================

document.addEventListener('DOMContentLoaded', function () {

    // ======================== STATE MANAGEMENT ========================
    const LS = {
        PENYADAP: 'sipena_penyadap',
        PETAK: 'sipena_petak',
        TARGET: 'sipena_targets',
        DEMO_DATA: 'sipena_demo_entries',
        MANDOR: 'sipena_mandor',
        ACTIVE_MANDOR: 'sipena_active_mandor',
        MONITORING: 'sipena_monitoring',
    };

    // Helper functions for LocalStorage
    function lsGet(key) {
        try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
    }
    function lsSet(key, val) {
        try { localStorage.setItem(key, JSON.stringify(val)); } catch { }
    }
    let isSyncingOffline = false;

    function queueOfflineCrud(actionPayload) {
        let queue = [];
        try {
            queue = JSON.parse(localStorage.getItem('sipena_offline_crud')) || [];
        } catch {
            queue = [];
        }
        queue.push(actionPayload);
        localStorage.setItem('sipena_offline_crud', JSON.stringify(queue));
        if (!navigator.onLine) {
            showToast('📶 Disimpan offline. Akan disinkronkan saat terhubung internet.', 'warning');
        }
    }

    function dequeueOfflineCrud() {
        try {
            let queue = JSON.parse(localStorage.getItem('sipena_offline_crud')) || [];
            if (queue.length > 0) {
                queue.shift(); // Remove the first item
                localStorage.setItem('sipena_offline_crud', JSON.stringify(queue));
            }
        } catch (e) {
            console.error("Gagal dequeue offline crud:", e);
        }
    }

    function syncOfflineCrud(callback) {
        if (isSyncingOffline) {
            setTimeout(() => {
                syncOfflineCrud(callback);
            }, 1000);
            return;
        }

        let queue = [];
        try {
            queue = JSON.parse(localStorage.getItem('sipena_offline_crud')) || [];
        } catch {
            queue = [];
        }

        if (queue.length === 0) {
            if (callback) callback();
            return;
        }

        isSyncingOffline = true;
        console.log(`Menyinkronkan ${queue.length} aksi CRUD offline ke Google Sheets...`);
        let promiseChain = Promise.resolve();
        let syncedCount = 0;

        queue.forEach((payload, index) => {
            promiseChain = promiseChain.then(() => {
                return fetch(WEB_APP_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    body: JSON.stringify(payload)
                }).then(() => {
                    syncedCount++;
                    dequeueOfflineCrud();
                });
            });
        });

        promiseChain.then(() => {
            isSyncingOffline = false;
            if (syncedCount > 0) {
                const elapsed = Date.now() - lastToastTime;
                const delay = Math.max(0, 1800 - elapsed);
                setTimeout(() => {
                    showToast(`🔄 Berhasil sinkron ${syncedCount} data offline ke Google Sheets!`, 'success');
                    if (callback) callback();
                }, delay);
            } else {
                if (callback) callback();
            }
        }).catch(err => {
            isSyncingOffline = false;
            console.error("Gagal sinkron aksi offline:", err);
            if (callback) callback();
        });
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

    function syncCloudMetadata(callback) {
        if (WEB_APP_URL && navigator.onLine) {
            // Cek jika ada antrean offline crud. Jika ada, jangan timpa local storage agar data lokal tidak terhapus.
            let queue = [];
            try {
                queue = JSON.parse(localStorage.getItem('sipena_offline_crud')) || [];
            } catch {
                queue = [];
            }
            if (queue.length > 0) {
                console.log("Ada antrean offline CRUD. Menunda sinkronisasi metadata cloud agar data lokal tidak terhapus.");
                if (callback) callback();
                return;
            }

            fetch(WEB_APP_URL)
                .then(r => r.json())
                .then(res => {
                    if (res.status === 'success') {
                        if (res.penyadap && Array.isArray(res.penyadap) && res.penyadap.length) {
                            lsSet(LS.PENYADAP, res.penyadap);
                        }
                        if (res.petak && Array.isArray(res.petak) && res.petak.length) {
                            lsSet(LS.PETAK, res.petak);
                        }
                        if (res.mandor && Array.isArray(res.mandor) && res.mandor.length) {
                            lsSet(LS.MANDOR, res.mandor);
                        }
                        if (res.targets && Array.isArray(res.targets) && res.targets.length) {
                            lsSet(LS.TARGET, res.targets);
                        }
                        if (res.monitoring && typeof res.monitoring === 'object' && Object.keys(res.monitoring).length) {
                            Object.keys(res.monitoring).forEach(tgl => {
                                if (res.monitoring[tgl] && typeof res.monitoring[tgl] === 'object') {
                                    res.monitoring[tgl]._submitted = true;
                                }
                            });
                            lsSet(LS.MONITORING, res.monitoring);
                        }
                    }
                    if (callback) callback();
                })
                .catch(() => { if (callback) callback(); });
        } else {
            if (callback) callback();
        }
    }

    // Default lists matching main app
    function getMandorList() {
        const cached = lsGet(LS.MANDOR);
        if (WEB_APP_URL) return cached || [];
        
        return cached || [
            { id: 'm1', nama: 'Mandor Wawan', nik: '001', petak: ['P.01', 'P.03'] },
            { id: 'm2', nama: 'Mandor Budi',  nik: '002', petak: ['P.02', 'P.04'] },
            { id: 'm3', nama: 'Mandor Kardi', nik: '003', petak: ['P.05', 'P.06'] },
        ];
    }

    function getPenyadapList() {
        const cached = lsGet(LS.PENYADAP);
        if (WEB_APP_URL) return cached || [];

        return cached || [
            { id: 'p1', nama: 'Slamet',  petak: 'P.01', status: 'Aktif', pohon: 800 },
            { id: 'p2', nama: 'Budi',    petak: 'P.02', status: 'Aktif', pohon: 1000 },
            { id: 'p3', nama: 'Sukijo',  petak: 'P.03', status: 'Aktif', pohon: 700 },
            { id: 'p4', nama: 'Tukimin', petak: 'P.04', status: 'Aktif', pohon: 900 },
            { id: 'p5', nama: 'Wawan',   petak: 'P.05', status: 'Aktif', pohon: 800 },
            { id: 'p6', nama: 'Kardi',   petak: 'P.06', status: 'Aktif', pohon: 950 },
        ];
    }

    function getPetakList() {
        const cached = lsGet(LS.PETAK);
        if (WEB_APP_URL) return cached || [];

        return cached || [
            { id: 'b1', kode: 'P.01', luas: 12.5, pohon: 1200 },
            { id: 'b2', kode: 'P.02', luas: 15.0, pohon: 1500 },
            { id: 'b3', kode: 'P.03', luas: 10.0, pohon: 1000 },
            { id: 'b4', kode: 'P.04', luas: 13.0, pohon: 1300 },
            { id: 'b5', kode: 'P.05', luas: 11.5, pohon: 1100 },
            { id: 'b6', kode: 'P.06', luas: 14.0, pohon: 1400 },
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
        return getFilteredPenyadapList().filter(p => (p.status || 'Aktif') === 'Aktif');
    }

    function getFilteredPetakList() {
        const supervised = getSupervisedPetaks();
        return getPetakList().filter(b => supervised.includes(b.kode));
    }

    // ======================== TOAST NOTIFICATION ========================
    let toastTimer = null;
    let lastToastTime = 0;
    function showToast(msg, type = 'success') {
        const t = document.getElementById('globalToast');
        if (!t) return;
        clearTimeout(toastTimer);
        lastToastTime = Date.now();
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
        document.getElementById('inputLuasPenyadap').value = '';
        document.getElementById('inputTargetPenyadap').value = '';
        document.getElementById('inputStatusPenyadap').value = 'Aktif';

        const infoEl = document.getElementById('infoSisaPohon');
        if (infoEl) infoEl.textContent = '';
        const infoLuasEl = document.getElementById('infoSisaLuas');
        if (infoLuasEl) infoLuasEl.textContent = '';
        const infoTargetEl = document.getElementById('infoSisaTarget');
        if (infoTargetEl) infoTargetEl.textContent = '';
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
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    const menuItems = document.querySelectorAll('.sidebar-menu li');
    const tabContents = document.querySelectorAll('.tab-content');
    const pageTitle = document.getElementById('pageTitle');
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
            const tab = this.getAttribute('data-tab');
            if (!tab) return; // Allow normal link navigation for non-tab links

            e.preventDefault();
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
        dashboard: ['Beranda Mandor', 'Ringkasan Operasional & Pengelolaan Lapangan'],
        penyadap: ['Kelola Penyadap', 'Manajemen Data Tapper Hutan Pinus'],
        monitoring: ['Absensi Harian (Absen)', 'Pencatatan Kehadiran & Status Harian Tapper'],
        petak: ['Petak yang Diawasi', 'Daftar Blok Wilayah Sadap (Read-Only)'],
        target: ['Target per Penyadap', 'Beban Target Bulanan/Tahunan per Penyadap (Read-Only)'],
        input: ['Form Timbangan HP', 'Formulir Input Hasil Timbangan Getah Pinus']
    };

    function updatePageHeader(tab) {
        const t = pageTitles[tab] || ['Beranda Mandor', ''];
        if (pageTitle) pageTitle.textContent = t[0];
        if (pageSubtitle) pageSubtitle.textContent = t[1];
    }

    function renderTabView(tab) {
        switch (tab) {
            case 'dashboard': renderDashboardStats(); break;
            case 'penyadap': renderPenyadapTable(); break;
            case 'monitoring': renderMonitoringTab(); break;
            case 'petak': renderPetakTable(); break;
            case 'target': renderTargetTable(); break;
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
                <td>
                    <strong>${(p.pohon || 0).toLocaleString('id-ID')} pohon</strong>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">
                        Luas: <strong>${p.luas ? p.luas + ' Ha' : '-'}</strong> | Target: <strong>${p.target ? p.target + ' kg/th' : '-'}</strong>
                    </div>
                </td>
                <td><span class="status-badge-${(p.status || 'Aktif') === 'Aktif' ? 'aktif' : 'nonaktif'}">${p.status || 'Aktif'}</span></td>
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
        const infoLuasEl = document.getElementById('infoSisaLuas');
        const infoTargetEl = document.getElementById('infoSisaTarget');
        const idInput = document.getElementById('editPenyadapId');

        if (!petakSelect) return;

        const petakKode = petakSelect.value;
        const currentPenyadapId = idInput ? idInput.value : '';

        if (!petakKode) {
            if (infoEl) infoEl.textContent = '';
            if (infoLuasEl) infoLuasEl.textContent = '';
            if (infoTargetEl) infoTargetEl.textContent = '';
            return;
        }

        const petakList = getPetakList();
        const targetPetak = petakList.find(b => b.kode === petakKode);
        if (!targetPetak) {
            if (infoEl) infoEl.textContent = 'Petak tidak ditemukan';
            return;
        }

        const totalPohon = parseInt(targetPetak.pohon) || 0;
        const totalLuas = parseFloat(targetPetak.luas) || 0;

        const targets = getTargetList();
        const thisYear = new Date().getFullYear();
        const targetEntry = targets.find(t => t.petak === petakKode && parseInt(t.tahun) === thisYear) || { tahunan: 0 };
        const totalTarget = parseFloat(targetEntry.tahunan) || 0;

        const penyadapList = getPenyadapList();
        const otherActive = penyadapList.filter(x => x.petak === petakKode && (x.status || 'Aktif') === 'Aktif' && x.id !== currentPenyadapId);

        // Calculate Trees
        const allocatedPohon = otherActive.reduce((sum, x) => sum + (parseInt(x.pohon) || 0), 0);
        const sisaPohon = Math.max(0, totalPohon - allocatedPohon);

        // Calculate Area (Luas)
        const allocatedLuas = otherActive.reduce((sum, x) => sum + (parseFloat(x.luas) || 0), 0);
        const sisaLuas = Math.max(0, totalLuas - allocatedLuas);

        // Calculate Target
        const allocatedTarget = otherActive.reduce((sum, x) => sum + (parseFloat(x.target) || 0), 0);
        const sisaTarget = Math.max(0, totalTarget - allocatedTarget);

        if (infoEl) {
            infoEl.innerHTML = `🌳 Kapasitas Petak: <strong>${totalPohon.toLocaleString('id-ID')}</strong> pohon | Sisa Idle (Bisa disadap): <strong>${sisaPohon.toLocaleString('id-ID')}</strong> pohon`;
            infoEl.style.color = sisaPohon > 0 ? '#2e7d32' : '#e53935';
        }
        if (infoLuasEl) {
            infoLuasEl.innerHTML = `📐 Luas Petak: <strong>${totalLuas.toLocaleString('id-ID')}</strong> Ha | Sisa Luas Idle: <strong>${sisaLuas.toLocaleString('id-ID')}</strong> Ha`;
            infoLuasEl.style.color = sisaLuas > 0 ? '#2e7d32' : '#e53935';
        }
        if (infoTargetEl) {
            infoTargetEl.innerHTML = `🎯 Target Tahunan Petak: <strong>${totalTarget.toLocaleString('id-ID')}</strong> kg | Sisa Alokasi Target: <strong>${sisaTarget.toLocaleString('id-ID')}</strong> kg`;
            infoTargetEl.style.color = sisaTarget > 0 ? '#2e7d32' : '#e53935';
        }
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
        document.getElementById('inputLuasPenyadap').value = p.luas || '';
        document.getElementById('inputTargetPenyadap').value = p.target || '';
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

            queueOfflineCrud({ action: 'deletePenyadap', id: id });
            if (navigator.onLine) {
                syncOfflineCrud(() => {
                    syncCloudMetadata(() => {
                        renderPenyadapTable();
                    });
                });
            } else {
                renderPenyadapTable();
            }
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
        const luasInput = parseFloat(document.getElementById('inputLuasPenyadap').value) || 0;
        const targetInput = parseFloat(document.getElementById('inputTargetPenyadap').value) || 0;
        const status = document.getElementById('inputStatusPenyadap').value;

        if (!nama) { showToast('Mohon isi nama penyadap!', 'error'); return; }
        if (!petak) { showToast('Mohon pilih petak tugas!', 'error'); return; }
        if (pohonInput <= 0) { showToast('Mohon isi jumlah pohon sadap dengan angka lebih dari 0!', 'error'); return; }
        if (luasInput <= 0) { showToast('Mohon isi luas lahan dengan angka lebih dari 0!', 'error'); return; }
        if (targetInput <= 0) { showToast('Mohon isi target tahunan penyadap dengan angka lebih dari 0!', 'error'); return; }

        // Validasi Kapasitas Petak (Pohon, Luas, dan Target)
        const petakList = getPetakList();
        const targetPetak = petakList.find(b => b.kode === petak);
        if (!targetPetak) {
            showToast('Kritikal: Data petak tidak ditemukan!', 'error');
            return;
        }

        const totalPohonPetak = parseInt(targetPetak.pohon) || 0;
        const totalLuasPetak = parseFloat(targetPetak.luas) || 0;

        const targets = getTargetList();
        const thisYear = new Date().getFullYear();
        const targetEntry = targets.find(t => t.petak === petak && parseInt(t.tahun) === thisYear) || { tahunan: 0 };
        const totalTargetPetak = parseFloat(targetEntry.tahunan) || 0;

        let list = getPenyadapList();

        if (status === 'Aktif') {
            const otherActivePenyadap = list.filter(x => x.petak === petak && (x.status || 'Aktif') === 'Aktif' && x.id !== id);

            // Validasi Pohon
            const currentAllocatedPohon = otherActivePenyadap.reduce((sum, x) => sum + (parseInt(x.pohon) || 0), 0);
            const maxAllowedPohon = totalPohonPetak - currentAllocatedPohon;
            if (pohonInput > maxAllowedPohon) {
                showToast(`Gagal! Akumulasi pohon sadap melebihi kapasitas petak ${petak}. Sisa pohon menganggur: ${maxAllowedPohon} pohon.`, 'error');
                return;
            }

            // Validasi Luas
            const currentAllocatedLuas = otherActivePenyadap.reduce((sum, x) => sum + (parseFloat(x.luas) || 0), 0);
            const maxAllowedLuas = totalLuasPetak - currentAllocatedLuas;
            if (luasInput > maxAllowedLuas) {
                showToast(`Gagal! Akumulasi luas lahan melebihi luas petak ${petak}. Sisa luas menganggur: ${maxAllowedLuas.toFixed(2)} Ha.`, 'error');
                return;
            }

            // Validasi Target
            const currentAllocatedTarget = otherActivePenyadap.reduce((sum, x) => sum + (parseFloat(x.target) || 0), 0);
            const maxAllowedTarget = totalTargetPetak - currentAllocatedTarget;
            if (targetInput > maxAllowedTarget) {
                showToast(`Gagal! Akumulasi target penyadap melebihi target petak ${petak}. Sisa target belum dialokasikan: ${maxAllowedTarget.toFixed(0)} kg.`, 'error');
                return;
            }
        }

        const existingP = id ? list.find(x => x.id === id) : null;
        const newP = id ? 
            { id, nama, petak, status, pohon: pohonInput, luas: luasInput, target: targetInput, periode1: (existingP ? (existingP.periode1 || 0) : 0), periode2: (existingP ? (existingP.periode2 || 0) : 0) } : 
            { id: 'p' + Date.now(), nama, petak, status, pohon: pohonInput, luas: luasInput, target: targetInput, periode1: 0, periode2: 0 };

        if (id) {
            // Update
            const idx = list.findIndex(x => x.id === id);
            if (idx >= 0) {
                list[idx] = newP;
                showToast(`Data penyadap "${nama}" berhasil diubah!`);
            }
        } else {
            // Add new
            list.push(newP);
            showToast(`Penyadap "${nama}" berhasil ditambahkan!`);
        }

        lsSet(LS.PENYADAP, list);
        closeModal('modalPenyadap');
        renderPenyadapTable();

        queueOfflineCrud({ action: 'savePenyadap', data: newP });
        if (navigator.onLine) {
            syncOfflineCrud(() => {
                syncCloudMetadata(() => {
                    renderPenyadapTable();
                });
            });
        } else {
            renderPenyadapTable();
        }
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
            const workers = penyadapList.filter(p => p.petak === b.kode && (p.status || 'Aktif') === 'Aktif');
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

    // ======================== TARGET PRODUKSI ========================
    function renderTargetTable() {
        const petakList = getFilteredPetakList();
        const targets = getTargetList();
        const penyadapList = getPenyadapList();
        const tbody = document.getElementById('targetTbody');
        if (!tbody) return;

        if (!petakList.length) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:30px;">Belum ada data petak yang diawasi oleh Anda.</td></tr>';
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

            const assignedActive = penyadapList.filter(p => p.petak === b.kode && (p.status || 'Aktif') === 'Aktif');
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
                    <td style="text-align: center;">
                        <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.8rem;" onclick="window.aturTarget('${b.kode}')">✏️ Atur Periode</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Expose aturTarget to global for Mandor
    window.aturTarget = function(petakKode) {
        const targets = getTargetList();
        const thisYear = new Date().getFullYear();
        const target = targets.find(t => t.petak === petakKode && parseInt(t.tahun) === thisYear) || {
            tahun: thisYear,
            tahunan: 3600,
            periode1: 0,
            periode2: 0
        };

        const activeWorkers = getPenyadapList().filter(p => p.petak === petakKode && (p.status || 'Aktif') === 'Aktif');
        document.getElementById('targetPetakKode').value = petakKode;

        // Show names and individual targets of assigned tappers
        const namesContainer = document.getElementById('modalTargetPenyadapNames');
        if (namesContainer) {
            namesContainer.innerHTML = activeWorkers.length > 0
                ? activeWorkers.map(w => `<strong>${w.nama}</strong> (${(parseFloat(w.target) || 0).toLocaleString('id-ID')} kg/tahun)`).join('<br>')
                : 'Belum ada penyadap aktif ditugaskan pada petak ini.';
        }

        // Calculate total target of tappers (or default to petak target)
        const totalTapperTarget = activeWorkers.length > 0 
            ? activeWorkers.reduce((sum, w) => sum + (parseFloat(w.target) || 0), 0)
            : (parseFloat(target.tahunan) || 3600);

        document.getElementById('targetTahun').value = target.tahun;
        document.getElementById('targetTahunanTotal').value = totalTapperTarget;

        // Render tapperTargetContainer
        const container = document.getElementById('tapperTargetContainer');
        if (container) {
            if (activeWorkers.length === 0) {
                container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">Tidak ada penyadap aktif di petak ini.</div>';
            } else {
                container.innerHTML = activeWorkers.map(w => `
                    <div class="tapper-target-row" style="background: var(--bg-main); padding: 12px 16px; border-radius: 8px; border: 1.5px solid var(--border); margin-bottom: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="font-weight: 700; color: var(--primary-dark); font-size: 0.95rem;">👤 ${w.nama}</span>
                            <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">Target: ${(parseFloat(w.target) || 0).toLocaleString('id-ID')} kg/th</span>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div class="form-group" style="margin-bottom: 0;">
                                <label style="font-size: 0.75rem; font-weight: 700; color: var(--primary-light); margin-bottom: 4px;">Periode 1 (tgl 1-15)</label>
                                <input type="number" class="form-control tapper-p1-input" data-tapper-id="${w.id}" value="${w.periode1 || 0}" min="0" style="padding: 6px 10px; font-size: 0.9rem; height: 36px;">
                            </div>
                            <div class="form-group" style="margin-bottom: 0;">
                                <label style="font-size: 0.75rem; font-weight: 700; color: var(--primary-light); margin-bottom: 4px;">Periode 2 (tgl 16-31)</label>
                                <input type="number" class="form-control tapper-p2-input" data-tapper-id="${w.id}" value="${w.periode2 || 0}" min="0" style="padding: 6px 10px; font-size: 0.9rem; height: 36px;">
                            </div>
                        </div>
                    </div>
                `).join('');
                
                // Attach change listeners to dynamic inputs
                container.querySelectorAll('input').forEach(input => {
                    input.addEventListener('input', calcAndShowTargetPerPenyadap);
                });
            }
        }

        document.getElementById('modalTargetTitle').textContent = `Atur Target Petak: ${petakKode}`;
        
        const modalTarget = document.getElementById('modalTarget');
        if (modalTarget) {
            modalTarget.classList.add('active');
        }
        
        calcAndShowTargetPerPenyadap();
    };

    function calcAndShowTargetPerPenyadap() {
        const petak = document.getElementById('targetPetakKode')?.value;
        const tahunan = parseFloat(document.getElementById('targetTahunanTotal')?.value) || 0;
        if (!petak) return;

        const elTahunan = document.getElementById('targetPerPenyadapTahunan');
        
        let sumP1 = 0;
        let sumP2 = 0;
        const p1Inputs = document.querySelectorAll('.tapper-p1-input');
        const p2Inputs = document.querySelectorAll('.tapper-p2-input');
        p1Inputs.forEach(input => sumP1 += parseFloat(input.value) || 0);
        p2Inputs.forEach(input => sumP2 += parseFloat(input.value) || 0);

        if (elTahunan) {
            elTahunan.style.display = 'flex';
            const spanEl = elTahunan.querySelector('span');
            if (spanEl) {
                spanEl.innerHTML = `Total Alokasi Bulanan Petak: <strong>P1: ${sumP1.toLocaleString('id-ID')} kg | P2: ${sumP2.toLocaleString('id-ID')} kg</strong>`;
            }
        }
    }

    // Close target modal handler (using close triggers or manual)
    document.querySelectorAll('[data-modal-close="modalTarget"]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('modalTarget')?.classList.remove('active');
        });
    });

    // Save target button click handler
    document.getElementById('btnSimpanTarget')?.addEventListener('click', () => {
        const petak = document.getElementById('targetPetakKode')?.value;
        const tahun = document.getElementById('targetTahun')?.value || '2026';
        const tahunan = parseFloat(document.getElementById('targetTahunanTotal')?.value) || 0;

        if (!petak) { showToast('Pilih petak.', 'error'); return; }

        const p1Inputs = document.querySelectorAll('.tapper-p1-input');
        const p2Inputs = document.querySelectorAll('.tapper-p2-input');
        
        let tapperUpdates = [];
        let totalP1 = 0;
        let totalP2 = 0;

        p1Inputs.forEach((input, index) => {
            const tId = input.getAttribute('data-tapper-id');
            const p1Val = parseFloat(input.value) || 0;
            const p2Val = parseFloat(p2Inputs[index].value) || 0;
            tapperUpdates.push({ id: tId, periode1: p1Val, periode2: p2Val });
            totalP1 += p1Val;
            totalP2 += p2Val;
        });

        let penyadapList = getPenyadapList();
        tapperUpdates.forEach(update => {
            const idx = penyadapList.findIndex(p => p.id === update.id);
            if (idx >= 0) {
                penyadapList[idx].periode1 = update.periode1;
                penyadapList[idx].periode2 = update.periode2;
            }
        });
        lsSet(LS.PENYADAP, penyadapList);

        let targets = getTargetList();
        const idx = targets.findIndex(t => t.petak === petak && String(t.tahun) === String(tahun));
        const entry = { petak, tahun: parseInt(tahun), tahunan: tahunan, periode1: totalP1, periode2: totalP2 };

        if (idx >= 0) {
            targets[idx] = entry;
        } else {
            targets.push(entry);
        }
        
        lsSet(LS.TARGET, targets);
        renderTargetTable();
        document.getElementById('modalTarget')?.classList.remove('active');
        showToast(`Target petak ${petak} periode berhasil disimpan!`, 'success');

        queueOfflineCrud({ action: 'saveTarget', data: entry });
        tapperUpdates.forEach(update => {
            const fullTapper = penyadapList.find(p => p.id === update.id);
            if (fullTapper) {
                queueOfflineCrud({ action: 'savePenyadap', data: fullTapper });
            }
        });

        if (navigator.onLine) {
            syncOfflineCrud(() => {
                syncCloudMetadata(() => {
                    renderTargetTable();
                });
            });
        } else {
            renderTargetTable();
        }
    });

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

        const petakList = getFilteredPetakList();
        const penyadapList = getFilteredActivePenyadap();
        const mon = getMonitoringData();
        const dayData = mon[tgl] || {};
        const isSubmitted = !!dayData._submitted;

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
                const saved = dayData[p.nama] || {};
                const status = saved.status || 'Hadir';
                const ket = saved.keterangan || '';

                const radios = statusOptions.map(s => {
                    const checked = status === s ? 'checked' : '';
                    const safeId = `mon_${tgl}_${p.nama.replace(/\s+/g, '_')}_${s.replace(/\s+/g, '_')}`;
                    return `<input type="radio" class="mon-status-radio" name="mon_${tgl}_${p.nama.replace(/\s+/g, '_')}" value="${s}" id="${safeId}" ${checked} ${isSubmitted ? 'disabled' : `onchange="window.onMonStatusChange('${tgl}','${p.nama}',this.value)"`} style="margin-right: 4px; ${isSubmitted ? '' : 'cursor:pointer;'}">
                            <label class="mon-status-label" for="${safeId}" style="margin-right:12px; font-size:0.85rem; font-weight:500; ${isSubmitted ? '' : 'cursor:pointer;'}">${s}</label>`;
                }).join('');

                const showKet = (status !== 'Hadir') ? 'block' : 'none';
                const rowStyle = status === 'Hadir' ? 'border-left: 4px solid var(--primary-light); background:#f9fcf9;' : status === 'Sakit' ? 'border-left: 4px solid var(--warning); background:#fffaf5;' : 'border-left: 4px solid var(--danger); background:#fff5f5;';

                html += `<div class="monitoring-penyadap-row" id="monrow_${tgl}_${p.nama.replace(/\s+/g, '_')}" style="padding:14px; border-radius:8px; display:flex; flex-direction:column; gap:10px; ${rowStyle} transition:var(--transition);">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                        <div class="mon-penyadap-name" style="font-weight:700; color:var(--text-dark); font-size:0.95rem;">👤 ${p.nama}</div>
                        <div class="mon-status-select-group" style="display:flex; align-items:center; flex-wrap:wrap;">${radios}</div>
                    </div>
                    <input type="text" class="form-control mon-keterangan-input" id="monket_${tgl}_${p.nama.replace(/\s+/g, '_')}" placeholder="Tulis alasan jika tidak hadir (sakit, hajatan, dll)..." value="${ket}" ${isSubmitted ? 'disabled' : `oninput="window.onMonKetChange('${tgl}','${p.nama}',this.value)"`} style="display:${showKet}; font-size:0.85rem; padding:6px 12px; width:100%;">
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

        // Update state of Simpan Status button based on submission
        const btnSimpan = document.getElementById('btnSimpanMonitoring');
        if (btnSimpan) {
            btnSimpan.disabled = isSubmitted;
            if (isSubmitted) {
                btnSimpan.innerHTML = '🔒 Sudah Diabsen';
                btnSimpan.style.opacity = '0.6';
                btnSimpan.style.cursor = 'not-allowed';
            } else {
                btnSimpan.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                        <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    Simpan Status
                `;
                btnSimpan.style.opacity = '1';
                btnSimpan.style.cursor = 'pointer';
            }
        }
    }

    window.onMonStatusChange = function (tgl, nama, status) {
        const mon = getMonitoringData();
        if (!mon[tgl]) mon[tgl] = {};
        if (!mon[tgl][nama]) mon[tgl][nama] = {};
        mon[tgl][nama].status = status;
        lsSet(LS.MONITORING, mon);

        const safeNama = nama.replace(/\s+/g, '_');
        const row = document.getElementById(`monrow_${tgl}_${safeNama}`);
        const ketEl = document.getElementById(`monket_${tgl}_${safeNama}`);
        if (row) {
            row.style.borderLeft = status === 'Hadir' ? '4px solid var(--primary-light)' : status === 'Sakit' ? '4px solid var(--warning)' : '4px solid var(--danger)';
            row.style.background = status === 'Hadir' ? '#f9fcf9' : status === 'Sakit' ? '#fffaf5' : '#fff5f5';
        }
        if (ketEl) {
            ketEl.style.display = status !== 'Hadir' ? 'block' : 'none';
        }
        updateMonitoringCounts();
    };

    window.onMonKetChange = function (tgl, nama, ket) {
        const mon = getMonitoringData();
        if (!mon[tgl]) mon[tgl] = {};
        if (!mon[tgl][nama]) mon[tgl][nama] = {};
        mon[tgl][nama].keterangan = ket;
        lsSet(LS.MONITORING, mon);
    };

    function saveMonitoringData(tgl) {
        const mon = getMonitoringData();
        if (!mon[tgl]) mon[tgl] = {};

        // Pastikan semua penyadap aktif di bawah pengawasan mandor ini terisi statusnya (default Hadir)
        const supervisedTappers = getFilteredActivePenyadap();
        supervisedTappers.forEach(p => {
            if (!mon[tgl][p.nama]) {
                mon[tgl][p.nama] = { status: 'Hadir', keterangan: '' };
            }
        });

        // Tandai sebagai telah dikirim/dikunci secara lokal
        mon[tgl]._submitted = true;
        lsSet(LS.MONITORING, mon);

        // Salin data bersih tanpa flag internal _submitted untuk disinkronkan ke cloud
        const dayData = {};
        Object.keys(mon[tgl]).forEach(nama => {
            if (nama !== '_submitted') {
                dayData[nama] = mon[tgl][nama];
            }
        });

        showToast(`Data absensi tanggal ${tgl} disimpan secara lokal!`, 'success');
        updateMonitoringCounts();

        queueOfflineCrud({ action: 'saveMonitoring', tanggal: tgl, data: dayData });
        if (navigator.onLine) {
            syncOfflineCrud(() => {
                syncCloudMetadata(() => {
                    buildMonitoringForm(tgl);
                });
            });
        } else {
            buildMonitoringForm(tgl);
        }
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
        setEl('monHadirCount', hadir);
        setEl('monTidakHadirCount', tidakHadir);
        setEl('monSakitCount', sakit);
        setEl('monLainnyaCount', lainnya);
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

        // Compare entered PIN with NIK (robust comparison: handles Google Sheets removing leading zeros like "002" -> "2")
        const val1 = String(pinVal).trim();
        const val2 = String(targetMandor.nik).trim();
        const pinMatches = (val1 === val2) || 
                            (!isNaN(val1) && !isNaN(val2) && parseInt(val1, 10) === parseInt(val2, 10));

        if (pinMatches) {
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
    document.getElementById('loginPIN')?.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            handleLoginSubmit();
        }
    });

    // Bind logout event listener
    document.getElementById('btnLogoutMandor')?.addEventListener('click', function (e) {
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

    function startApp() {
        if (checkAuth()) {
            initMandorSelector();
            renderDashboardStats();
            
            // Reload active tab view on startup/auth success
            const activeTab = document.querySelector('.sidebar-menu li.active')?.getAttribute('data-tab') || 'dashboard';
            renderTabView(activeTab);
        } else {
            // Just populate the login dropdown in case it hasn't been
            const loginSelect = document.getElementById('loginMandorSelect');
            if (loginSelect) {
                const mandors = getMandorList();
                loginSelect.innerHTML = mandors.map(m => `<option value="${m.id}">${m.nama}</option>`).join('');
            }
        }
    }

    // Auto-sync when browser goes back online
    window.addEventListener('online', () => {
        showToast('📶 Koneksi terhubung kembali. Mensinkronkan data offline...', 'success');
        syncOfflineCrud(() => {
            syncCloudMetadata(() => {
                const activeTab = document.querySelector('.sidebar-menu li.active')?.getAttribute('data-tab') || 'dashboard';
                renderTabView(activeTab);
            });
        });
    });

    // Initial render / Authentication check
    if (navigator.onLine) {
        syncOfflineCrud(() => {
            syncCloudMetadata(() => {
                startApp();
            });
        });
    } else {
        startApp();
    }
});
