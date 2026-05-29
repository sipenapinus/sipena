// assets/js/app.js
// SIPENA PINUS v2.0 - Full Feature Dashboard
// =========================================================================
// KONFIGURASI: Isi URL Google Apps Script Anda di sini
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwTelvmwcTnXUKYx_CQKfUg82nltxUNWjHsckbCO9vNj3My_VYl2huNYqmqJZKhzO61Kg/exec";
// =========================================================================

document.addEventListener('DOMContentLoaded', function () {

    // Color constants for charts
    const G = '#1b4332'; // Dark green
    const GA = '#40916c'; // Actual green
    const GL = '#52b788'; // Light green
    const Y = '#f4a261'; // Orange/Yellow
    const R = '#e76f51'; // Red

    // ======================== STATE MANAGEMENT ========================
    // Kunci localStorage
    const LS = {
        BKPH: 'sipena_bkph',
        RPH: 'sipena_rph',
        TPG: 'sipena_tpg',
        PETAK: 'sipena_petak',
        MANDOR: 'sipena_mandor',
        PENYADAP: 'sipena_penyadap',
        TARGET: 'sipena_targets',
        USER: 'sipena_users_list',
        MONITORING: 'sipena_monitoring',
        DEMO_DATA: 'sipena_demo_entries',
        CLOUD_CACHE: 'sipena_last_dashboard_data',
        AUTH_USER: 'sipena_auth_user'
    };

    // State global
    let globalRecords = [];
    let mapDataCache = [];
    let charts = {};
    let monitoringData = {}; // {tanggal: {namapenyadap: {status, keterangan}}}

    // ======================== HELPER: STORAGE ========================
    function lsGet(key) {
        try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
    }
    function lsSet(key, val) {
        try { localStorage.setItem(key, JSON.stringify(val)); } catch { }
    }

    function migrateLocalStorageData() {
        if (!localStorage.getItem(LS.BKPH)) lsSet(LS.BKPH, getBkphList());
        if (!localStorage.getItem(LS.RPH)) lsSet(LS.RPH, getRphList());
        if (!localStorage.getItem(LS.TPG)) lsSet(LS.TPG, getTpgList());
        if (!localStorage.getItem(LS.PETAK)) lsSet(LS.PETAK, getPetakList());
        if (!localStorage.getItem(LS.MANDOR)) lsSet(LS.MANDOR, getMandorList());
        if (!localStorage.getItem(LS.PENYADAP)) lsSet(LS.PENYADAP, getPenyadapList());
        if (!localStorage.getItem(LS.TARGET)) lsSet(LS.TARGET, getTargetList());
        if (!localStorage.getItem(LS.USER)) lsSet(LS.USER, getUserList());
    }

    function getBkphList() {
        const cached = lsGet(LS.BKPH);
        if (WEB_APP_URL && cached && cached.length) return cached;
        return cached || [
            { id_bkph: 'b1', kode_bkph: 'BKPH-BTR', nama_bkph: 'BKPH Bantarkawung', status: 'Aktif' }
        ];
    }

    function getRphList() {
        const cached = lsGet(LS.RPH);
        if (WEB_APP_URL && cached && cached.length) return cached;
        return cached || [
            { id_rph: 'r1', kode_rph: 'RPH-CKN', nama_rph: 'RPH Cikuning', id_bkph: 'b1', status: 'Aktif' },
            { id_rph: 'r2', kode_rph: 'RPH-TBS', nama_rph: 'RPH TB. Serang', id_bkph: 'b1', status: 'Aktif' },
            { id_rph: 'r3', kode_rph: 'RPH-TLG', nama_rph: 'RPH Telaga', id_bkph: 'b1', status: 'Aktif' },
            { id_rph: 'r4', kode_rph: 'RPH-BJS', nama_rph: 'RPH Banjarsari', id_bkph: 'b1', status: 'Aktif' },
            { id_rph: 'r5', kode_rph: 'RPH-KNS', nama_rph: 'RPH Kalinusu', id_bkph: 'b1', status: 'Aktif' }
        ];
    }

    function getTpgList() {
        const cached = lsGet(LS.TPG);
        if (WEB_APP_URL && cached && cached.length) return cached;
        return cached || [
            { id_tpg: 't1', kode_tpg: 'TPG-CKN', nama_tpg: 'Cikuning', id_rph: 'r1', status: 'Aktif' },
            { id_tpg: 't2', kode_tpg: 'TPG-TRL', nama_tpg: 'Terlaya', id_rph: 'r1', status: 'Aktif' },
            { id_tpg: 't3', kode_tpg: 'TPG-JPG', nama_tpg: 'Jipang', id_rph: 'r1', status: 'Aktif' },
            { id_tpg: 't4', kode_tpg: 'TPG-BBY', nama_tpg: 'Bangbayang', id_rph: 'r1', status: 'Aktif' },
            { id_tpg: 't5', kode_tpg: 'TPG-MYN', nama_tpg: 'Mayana', id_rph: 'r1', status: 'Aktif' },
            { id_tpg: 't6', kode_tpg: 'TPG-LGK', nama_tpg: 'Legok', id_rph: 'r2', status: 'Aktif' },
            { id_tpg: 't7', kode_tpg: 'TPG-CKG', nama_tpg: 'Cukanggaleh', id_rph: 'r2', status: 'Aktif' },
            { id_tpg: 't8', kode_tpg: 'TPG-BTR', nama_tpg: 'Bantarkawung', id_rph: 'r2', status: 'Aktif' },
            { id_tpg: 't9', kode_tpg: 'TPG-SMD', nama_tpg: 'Samudra', id_rph: 'r2', status: 'Aktif' },
            { id_tpg: 't10', kode_tpg: 'TPG-TGG', nama_tpg: 'Tegongan', id_rph: 'r2', status: 'Aktif' },
            { id_tpg: 't11', kode_tpg: 'TPG-LMN', nama_tpg: 'Lemahngebul', id_rph: 'r2', status: 'Aktif' },
            { id_tpg: 't12', kode_tpg: 'TPG-PRS', nama_tpg: 'Parasi', id_rph: 'r3', status: 'Aktif' },
            { id_tpg: 't13', kode_tpg: 'TPG-TNJ', nama_tpg: 'Tanjung', id_rph: 'r3', status: 'Aktif' },
            { id_tpg: 't14', kode_tpg: 'TPG-BJS', nama_tpg: 'Banjarsari', id_rph: 'r4', status: 'Aktif' },
            { id_tpg: 't15', kode_tpg: 'TPG-KLJ', nama_tpg: 'Kalijurang', id_rph: 'r5', status: 'Aktif' },
            { id_tpg: 't16', kode_tpg: 'TPG-KRD', nama_tpg: 'Karangdempul', id_rph: 'r5', status: 'Aktif' },
            { id_tpg: 't17', kode_tpg: 'TPG-HLR', nama_tpg: 'Hilir', id_rph: 'r5', status: 'Aktif' }
        ];
    }

    function getMandorList() {
        const cached = lsGet(LS.MANDOR);
        if (WEB_APP_URL && cached && cached.length) return cached;
        return cached || [
            { id_mandor: 'm1', nama_mandor: 'Mandor Wawan', nik: '001', nomor_hp: '08123456789', id_tpg: 't1', status: 'Aktif', id: 'm1', nama: 'Mandor Wawan', petak: ['P.01', 'P.03'] },
            { id_mandor: 'm2', nama_mandor: 'Mandor Budi', nik: '002', nomor_hp: '08123456780', id_tpg: 't6', status: 'Aktif', id: 'm2', nama: 'Mandor Budi', petak: ['P.02', 'P.04'] },
            { id_mandor: 'm3', nama_mandor: 'Mandor Kardi', nik: '003', nomor_hp: '08123456781', id_tpg: 't15', status: 'Aktif', id: 'm3', nama: 'Mandor Kardi', petak: ['P.05', 'P.06'] }
        ];
    }

    function getPenyadapList() {
        const cached = lsGet(LS.PENYADAP);
        if (WEB_APP_URL && cached && cached.length) return cached;
        return cached || [
            { id_penyadap: 'p1', nama_penyadap: 'Slamet', id_mandor: 'm1', id_petak: 'b1', status: 'Aktif', pohon: 800, luas: 2.5, target: 3600, periode1: 150, periode2: 150, id: 'p1', nama: 'Slamet', petak: 'P.01' },
            { id_penyadap: 'p2', nama_penyadap: 'Budi', id_mandor: 'm2', id_petak: 'b2', status: 'Aktif', pohon: 1000, luas: 3.0, target: 3600, periode1: 150, periode2: 150, id: 'p2', nama: 'Budi', petak: 'P.02' },
            { id_penyadap: 'p3', nama_penyadap: 'Sukijo', id_mandor: 'm1', id_petak: 'b3', status: 'Aktif', pohon: 700, luas: 2.0, target: 3600, periode1: 150, periode2: 150, id: 'p3', nama: 'Sukijo', petak: 'P.03' },
            { id_penyadap: 'p4', nama_penyadap: 'Tukimin', id_mandor: 'm2', id_petak: 'b2', status: 'Aktif', pohon: 900, luas: 2.8, target: 3600, periode1: 150, periode2: 150, id: 'p4', nama: 'Tukimin', petak: 'P.02' },
            { id_penyadap: 'p5', nama_penyadap: 'Wawan', id_mandor: 'm3', id_petak: 'b5', status: 'Aktif', pohon: 800, luas: 2.4, target: 3600, periode1: 150, periode2: 150, id: 'p5', nama: 'Wawan', petak: 'P.05' },
            { id_penyadap: 'p6', nama_penyadap: 'Kardi', id_mandor: 'm3', id_petak: 'b6', status: 'Aktif', pohon: 950, luas: 3.1, target: 3600, periode1: 150, periode2: 150, id: 'p6', nama: 'Kardi', petak: 'P.06' }
        ];
    }

    function getPetakList() {
        const cached = lsGet(LS.PETAK);
        if (WEB_APP_URL && cached && cached.length) return cached;
        return cached || [
            { id_petak: 'b1', nomor_petak: 'P.01', anak_petak: '', luas: 12.5, id_tpg: 't1', pohon: 1200, status: 'Aktif', id: 'b1', kode: 'P.01' },
            { id_petak: 'b2', nomor_petak: 'P.02', anak_petak: '', luas: 15.0, id_tpg: 't6', pohon: 1500, status: 'Aktif', id: 'b2', kode: 'P.02' },
            { id_petak: 'b3', nomor_petak: 'P.03', anak_petak: '', luas: 10.0, id_tpg: 't12', pohon: 1000, status: 'Aktif', id: 'b3', kode: 'P.03' },
            { id_petak: 'b4', nomor_petak: 'P.04', anak_petak: '', luas: 13.0, id_tpg: 't14', pohon: 1300, status: 'Aktif', id: 'b4', kode: 'P.04' },
            { id_petak: 'b5', nomor_petak: 'P.05', anak_petak: '', luas: 11.5, id_tpg: 't15', pohon: 1100, status: 'Aktif', id: 'b5', kode: 'P.05' },
            { id_petak: 'b6', nomor_petak: 'P.06', anak_petak: '', luas: 14.0, id_tpg: 't2', pohon: 1400, status: 'Aktif', id: 'b6', kode: 'P.06' }
        ];
    }

    function getUserList() {
        const cached = lsGet(LS.USER);
        if (WEB_APP_URL && cached && cached.length) return cached;
        return cached || [
            { id_user: 'u1', nama: 'Admin Perhutani', username: 'admin', password: 'admin', role: 'Admin BKPH', wilayah_akses: 'ALL', status: 'Aktif' },
            { id_user: 'u2', nama: 'KRPH Cikuning', username: 'krph', password: 'krph', role: 'KRPH / ASPER', wilayah_akses: 'RPH Cikuning', status: 'Aktif' },
            { id_user: 'u3', nama: 'Pimpinan Perhutani', username: 'pimpinan', password: 'pimpinan', role: 'Pimpinan', wilayah_akses: 'ALL', status: 'Aktif' }
        ];
    }

    function getTargetList() {
        const cached = lsGet(LS.TARGET);
        if (WEB_APP_URL && cached && cached.length) return cached;
        return cached || [
            { id_target: 't-P.01-2026', petak: 'P.01', tahun: '2026', tahunan: 3600, periode1: 150, periode2: 150, id_bkph: 'b1', id_rph: 'r1', id_tpg: 't1', status: 'Aktif' },
            { id_target: 't-P.02-2026', petak: 'P.02', tahun: '2026', tahunan: 3600, periode1: 150, periode2: 150, id_bkph: 'b1', id_rph: 'r2', id_tpg: 't6', status: 'Aktif' },
            { id_target: 't-P.03-2026', petak: 'P.03', tahun: '2026', tahunan: 3600, periode1: 150, periode2: 150, id_bkph: 'b1', id_rph: 'r3', id_tpg: 't12', status: 'Aktif' },
            { id_target: 't-P.04-2026', petak: 'P.04', tahun: '2026', tahunan: 3600, periode1: 150, periode2: 150, id_bkph: 'b1', id_rph: 'r4', id_tpg: 't14', status: 'Aktif' },
            { id_target: 't-P.05-2026', petak: 'P.05', tahun: '2026', tahunan: 3600, periode1: 150, periode2: 150, id_bkph: 'b1', id_rph: 'r5', id_tpg: 't15', status: 'Aktif' },
            { id_target: 't-P.06-2026', petak: 'P.06', tahun: '2026', tahunan: 3600, periode1: 150, periode2: 150, id_bkph: 'b1', id_rph: 'r1', id_tpg: 't2', status: 'Aktif' }
        ];
    }


    function getMonitoringData() { return lsGet(LS.MONITORING) || {}; }

    // Penyadap aktif saja
    function getActivePenyadap() {
        return getPenyadapList().filter(p => (p.status || 'Aktif') === 'Aktif');
    }

    // ======================== HELPER: DATE & FORMAT ========================
    function todayStr() { return new Date().toISOString().split('T')[0]; }

    function formatDateDMY(ds) {
        if (!ds || ds === '-') return '-';
        const p = ds.split(' ')[0].split('-');
        if (p.length !== 3) return ds;
        return `${p[2]}/${p[1]}/${p[0]}`;
    }

    function formatDateLong(ds) {
        if (!ds) return '-';
        const d = new Date(ds);
        return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }

    function getCurrentMonthName() {
        return new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    }

    // ======================== HELPER: TOAST ========================
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

    // ======================== HELPER: OFFLINE CRUD QUEUE ========================
    let isSyncingOffline = false;
    let lastToastTime = 0;

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
                queue.shift();
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
        console.log(`Menyinkronkan ${queue.length} aksi CRUD admin offline ke Google Sheets...`);
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
                lastToastTime = Date.now();
                showToast(`🔄 Berhasil sinkron ${syncedCount} data offline ke Google Sheets!`, 'success');
            }
            if (callback) callback();
        }).catch(err => {
            isSyncingOffline = false;
            console.error("Gagal sinkron aksi offline admin:", err);
            if (callback) callback();
        });
    }

    window.addEventListener('online', () => {
        showToast('📶 Koneksi terhubung kembali. Mensinkronkan data offline...', 'success');
        syncOfflineCrud(() => {
            loadAllData(() => {
                const activeItem = document.querySelector('.sidebar-menu li.active');
                const activeTab = activeItem ? activeItem.getAttribute('data-tab') : 'dashboard';
                renderTabView(activeTab);
            });
        });
    });


    // ======================== HELPER: MODAL ========================
    function openModal(id) { document.getElementById(id)?.classList.add('active'); }
    function closeModal(id) { document.getElementById(id)?.classList.remove('active'); }

    document.querySelectorAll('[data-modal-close]').forEach(btn => {
        btn.addEventListener('click', () => closeModal(btn.getAttribute('data-modal-close')));
    });

    // ======================== 1. TAB ROUTING ========================
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

    const filterSelect = document.getElementById('filterMandorSelect');
    if (filterSelect) {
        filterSelect.addEventListener('change', function () {
            renderPimpinan(globalRecords);
        });
    }

    const pageTitles = {
        dashboard: ['Dashboard Monitoring', 'Sistem Monitoring Produksi Getah Berbasis Mandor & Wilayah Sadap'],
        pimpinan: ['Dashboard Pimpinan', 'Evaluasi Kinerja Mandor & Progress Target Produksi'],
        mandor: ['Kelola Mandor', 'Manajemen Penyadap, Petak Sadap, dan Target Produksi'],
        'petak-target': ['Kelola Petak & Target', 'Atur Kapasitas Petak Lahan & Target Bulanan/Tahunan Produksi'],
        monitoring: ['Monitoring Harian', 'Pantau Kehadiran & Status Penyadap Setiap Hari'],
        'input-data': ['Input Data Lapangan', 'Formulir Input Data Produksi bagi Mandor di Lapangan'],
        'peta-wilayah': ['Pemetaan Wilayah Sadap', 'Visualisasi Status Produktivitas dan Kondisi Petak Hutan Pinus'],
        laporan: ['Laporan & Evaluasi Produksi', 'Tabel Rekapitulasi Data dan Ekspor Laporan Produksi'],
    };

    function updatePageHeader(tab) {
        const t = pageTitles[tab] || ['Dashboard', ''];
        if (pageTitle) pageTitle.textContent = t[0];
        if (pageSubtitle) pageSubtitle.textContent = t[1];
    }

    function renderTabView(tab) {
        switch (tab) {
            case 'dashboard': renderDashboard(globalRecords); break;
            case 'pimpinan': renderPimpinan(globalRecords); break;
            case 'mandor': renderMandorTab(); break;
            case 'petak-target': renderPetakTargetTable(); break;
            case 'monitoring': renderMonitoringTab(); break;
            case 'peta-wilayah': renderMap(globalRecords); break;
            case 'laporan': renderReportTable(globalRecords); break;
        }
    }

    // ======================== 2. DATA ENGINE ========================
    function getInitialMockData() {
        const mockData = [];
        const penyadapList = getPenyadapList().filter(p => (p.status || 'Aktif') === 'Aktif');
        const workerMap = {};
        penyadapList.forEach(p => { workerMap[p.nama] = p.petak; });

        const conditions = ['Normal', 'Hujan', 'Pohon Rusak', 'Wadah Rusak'];

        for (let i = 30; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const ds = date.toISOString().split('T')[0];

            const shuffled = [...penyadapList].sort(() => 0.5 - Math.random());
            const active = shuffled.slice(0, Math.floor(Math.random() * 3) + 4);

            active.forEach(worker => {
                const petak = workerMap[worker.nama];
                let kondisi = 'Normal', kendala = '';
                const r = Math.random() * 100;

                if (worker.nama === 'Wawan') {
                    if (r < 25) { kondisi = 'Pohon Rusak'; kendala = 'Kulit sadap kering'; }
                    else if (r < 40) { kondisi = 'Wadah Rusak'; kendala = 'Wadah bocor'; }
                    else if (r < 55) { kondisi = 'Hujan'; kendala = 'Air masuk wadah'; }
                } else {
                    if (r < 10) { kondisi = 'Hujan'; kendala = 'Hujan deras, getah encer'; }
                    else if (r < 13) { kondisi = 'Wadah Rusak'; kendala = 'Wadah bocor'; }
                    else if (r < 15) { kondisi = 'Pohon Rusak'; kendala = 'Saluran tersumbat'; }
                }

                let base = 15;
                if (worker.nama === 'Slamet') base = 20.5;
                else if (worker.nama === 'Sukijo') base = 14 - ((30 - i) / 30) * 6.5;
                else if (worker.nama === 'Wawan') base = 4.5;

                let hasil = base + (Math.random() * 4 - 2);
                if (kondisi === 'Hujan') hasil *= 0.6;
                else if (kondisi === 'Pohon Rusak') hasil *= 0.4;
                else if (kondisi === 'Wadah Rusak') hasil *= 0.5;
                hasil = Math.max(0.5, parseFloat(hasil.toFixed(1)));

                mockData.push({
                    id: 'mock-' + Math.random().toString(36).substr(2, 9),
                    tanggal: ds,
                    nama_penyadap: worker.nama,
                    petak,
                    estimasi_hasil: hasil,
                    kondisi_lapangan: kondisi,
                    kendala,
                    timestamp: date.toISOString()
                });
            });
        }
        return mockData;
    }

    function loadAllData(callback) {
        const cloudBanner = document.getElementById('cloudConnectionBanner');
        const demoBanner = document.getElementById('demoModeBanner');

        // Reset banners
        if (cloudBanner) {
            cloudBanner.style.display = 'none';
            cloudBanner.style.backgroundColor = '#e8f5e9'; // Default green
            cloudBanner.querySelector('span:last-child').textContent = 'Menghubungkan ke Google Sheets Cloud...';
        }
        if (demoBanner) demoBanner.style.display = 'none';

        if (!WEB_APP_URL) {
            if (demoBanner) demoBanner.style.display = 'flex';
            let data = lsGet(LS.DEMO_DATA);
            if (!data || !data.length) {
                data = getInitialMockData();
                lsSet(LS.DEMO_DATA, data);
            }
            data.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
            globalRecords = data;
            callback(data);
            return;
        }

        if (cloudBanner) cloudBanner.style.display = 'flex';

        const fallback = (errorMsg = null) => {
            console.warn("Menggunakan data cache atau mock karena gagal fetch:", errorMsg);
            if (cloudBanner) {
                cloudBanner.style.backgroundColor = '#ffebee';
                cloudBanner.style.borderColor = '#ffcdd2';
                cloudBanner.style.color = '#c62828';
                cloudBanner.querySelector('span:first-child').style.backgroundColor = '#c62828';
                cloudBanner.querySelector('span:last-child').textContent = errorMsg || 'Gagal terhubung ke Cloud. Menggunakan data terakhir.';
            }

            let cached = lsGet(LS.CLOUD_CACHE);
            if (!cached || !cached.length) {
                // Jika tidak ada cache sama sekali, baru gunakan mock tapi beri peringatan
                cached = getInitialMockData();
            }
            cached.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
            globalRecords = cached;
            callback(cached);
        };

        if (navigator.onLine) {
            // Cek jika ada antrean offline crud. Jika ada, jangan timpa local storage agar data lokal tidak terhapus.
            let queue = [];
            try {
                queue = JSON.parse(localStorage.getItem('sipena_offline_crud')) || [];
            } catch {
                queue = [];
            }
            if (queue.length > 0) {
                console.log("Ada antrean offline CRUD admin. Menunda sinkronisasi cloud agar data lokal tidak terhapus.");
                fallback('Ada data offline belum tersinkron. Menunda sinkronisasi cloud.');
                return;
            }

            fetch(WEB_APP_URL)
                .then(r => {
                    if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
                    return r.json();
                })
                .then(res => {
                    if (res.status === 'success') {
                        if (cloudBanner) {
                            cloudBanner.style.backgroundColor = '#e8f5e9';
                            cloudBanner.style.color = '#2e7d32';
                            cloudBanner.querySelector('span:last-child').textContent = 'Database Terhubung ke Google Sheets Cloud';
                        }

                        // Sync Metadata tables if present
                        if (res.penyadap && Array.isArray(res.penyadap)) {
                            lsSet(LS.PENYADAP, res.penyadap);
                        }
                        if (res.petak && Array.isArray(res.petak)) {
                            lsSet(LS.PETAK, res.petak);
                        }
                        if (res.mandor && Array.isArray(res.mandor)) {
                            lsSet(LS.MANDOR, res.mandor);
                        }
                        if (res.targets && Array.isArray(res.targets)) {
                            lsSet(LS.TARGET, res.targets);
                        }
                        if (res.monitoring && typeof res.monitoring === 'object') {
                            lsSet(LS.MONITORING, res.monitoring);
                        }

                        const rawData = res.data || [];
                        const fmt = rawData.map(r => {
                            // Mencoba mencari key dengan case-insensitive atau variasi nama
                            const findKey = (obj, target) => {
                                const keys = Object.keys(obj);
                                return keys.find(k => k.toLowerCase().replace(/_/g, '') === target.toLowerCase().replace(/_/g, ''));
                            };

                            const getVal = (obj, target) => {
                                const k = findKey(obj, target);
                                return k ? obj[k] : null;
                            };

                            return {
                                id: getVal(r, 'id') || 'c-' + Math.random().toString(36).substr(2, 9),
                                tanggal: getVal(r, 'tanggal') || '',
                                nama_penyadap: getVal(r, 'nama_penyadap') || getVal(r, 'nama') || '',
                                petak: getVal(r, 'petak') || getVal(r, 'kode_petak') || '',
                                estimasi_hasil: parseFloat(getVal(r, 'estimasi_hasil')) || 0,
                                kondisi_lapangan: getVal(r, 'kondisi_lapangan') || 'Normal',
                                kendala: getVal(r, 'kendala') || ''
                            };
                        });

                        fmt.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
                        lsSet(LS.CLOUD_CACHE, fmt);
                        globalRecords = fmt;
                        callback(fmt);
                    } else {
                        fallback(res.message || 'API Google Sheets mengembalikan status error.');
                    }
                })
                .catch(err => fallback(`Gagal mengambil data: ${err.message}`));
        } else {
            fallback('Koneksi internet terputus. Menggunakan data offline.');
        }
    }

    // ======================== 3. DASHBOARD MONITORING ========================
    function renderDashboard(records) {
        if (!records || !records.length) return;

        const total = records.reduce((s, r) => s + r.estimasi_hasil, 0);
        const dailySums = {};
        records.forEach(r => { dailySums[r.tanggal] = (dailySums[r.tanggal] || 0) + r.estimasi_hasil; });
        const avg = total / (Object.keys(dailySums).length || 1);

        const d30 = new Date(); d30.setDate(d30.getDate() - 30);
        const workers = new Set(), blocks = new Set();
        records.forEach(r => {
            if (new Date(r.tanggal) >= d30) { workers.add(r.nama_penyadap); blocks.add(r.petak); }
        });
        const issues = records.filter(r => r.kondisi_lapangan !== 'Normal' && new Date(r.tanggal) >= d30).length;

        animateValue(document.getElementById('stat-total-prod'), total, ' kg');
        animateValue(document.getElementById('stat-avg-daily'), avg, ' kg');
        animateValue(document.getElementById('stat-workers'), workers.size || 6, ' orang', true);
        animateValue(document.getElementById('stat-blocks'), blocks.size || 6, ' petak', true);
        animateValue(document.getElementById('stat-issues'), issues, ' kasus', true);

        // Chart 1: per petak
        const petakTotals = {};
        records.forEach(r => { petakTotals[r.petak] = (petakTotals[r.petak] || 0) + r.estimasi_hasil; });
        const lp = Object.keys(petakTotals).sort();
        const vp = lp.map(l => +petakTotals[l].toFixed(1));

        // Chart 2: per penyadap
        const wt = {};
        records.forEach(r => { wt[r.nama_penyadap] = (wt[r.nama_penyadap] || 0) + r.estimasi_hasil; });
        const lw = Object.keys(wt).sort((a, b) => wt[b] - wt[a]);
        const vw = lw.map(w => +wt[w].toFixed(1));

        // Chart 3: tren harian
        const lt = Object.keys(dailySums).sort().slice(-15);
        const vt = lt.map(d => +dailySums[d].toFixed(1));

        // Chart 4: kondisi
        const cc = {};
        records.forEach(r => { cc[r.kondisi_lapangan] = (cc[r.kondisi_lapangan] || 0) + 1; });
        const lc = Object.keys(cc), vc = lc.map(k => cc[k]);

        const G = '#1b4332', GL = '#40916c', GA = '#52b788', R = '#e63946', Y = '#f4a261';

        initChart('chartPetak', 'bar',
            { labels: lp, datasets: [{ label: 'Total (kg)', data: vp, backgroundColor: GL, borderColor: G, borderWidth: 1.5, borderRadius: 6 }] },
            { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
        );
        initChart('chartPenyadap', 'bar',
            { labels: lw, datasets: [{ label: 'Total (kg)', data: vw, backgroundColor: GA, borderColor: GL, borderWidth: 1.5, borderRadius: 6 }] },
            { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } }
        );
        initChart('chartTren', 'line',
            { labels: lt.map(formatDateDMY), datasets: [{ label: 'Produksi (kg)', data: vt, borderColor: G, backgroundColor: 'rgba(45,106,79,0.08)', fill: true, tension: 0.3, borderWidth: 3, pointBackgroundColor: GL, pointBorderColor: '#fff', pointRadius: 4 }] },
            { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
        );

        const condColors = lc.map(c => c === 'Normal' ? GL : c === 'Hujan' ? '#a2d2ff' : c === 'Pohon Rusak' ? R : Y);
        initChart('chartKondisi', 'doughnut',
            { labels: lc, datasets: [{ data: vc, backgroundColor: condColors, borderWidth: 2, borderColor: '#fff' }] },
            { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { boxWidth: 12, font: { family: 'Outfit', size: 11 } } } }, cutout: '60%' }
        );

        renderRecentIssues(records.filter(r => r.kondisi_lapangan !== 'Normal' && r.kendala).slice(0, 10));
    }

    function renderRecentIssues(issues) {
        const el = document.getElementById('activeIssuesList');
        if (!el) return;
        if (!issues.length) { el.innerHTML = '<div class="no-issues">Tidak ada kendala aktif dalam 30 hari terakhir.</div>'; return; }
        el.innerHTML = issues.map(item => {
            const crit = item.kondisi_lapangan === 'Pohon Rusak' || item.kondisi_lapangan === 'Wadah Rusak';
            return `<div class="issue-item ${crit ? '' : 'kuning'}">
                <div class="issue-meta"><span>${item.petak}</span><span>${formatDateDMY(item.tanggal)}</span></div>
                <div class="issue-desc">${item.kendala}</div>
                <div class="issue-context">Kondisi: <strong>${item.kondisi_lapangan}</strong> | Penyadap: <strong>${item.nama_penyadap}</strong></div>
            </div>`;
        }).join('');
    }

    function populatePimpinanMandorDropdown() {
        const select = document.getElementById('filterMandorSelect');
        if (!select) return;

        const mandorList = getMandorList();
        const currentValue = select.value || 'all';

        let html = '<option value="all">-- Semua Mandor --</option>';
        html += mandorList.map(m => `<option value="${m.id}">${m.nama}</option>`).join('');

        select.innerHTML = html;

        // Restore selected value if it still exists in the list
        if (currentValue === 'all' || mandorList.some(m => m.id === currentValue)) {
            select.value = currentValue;
        } else {
            select.value = 'all';
        }
    }

    // ======================== 4. DASHBOARD PIMPINAN ========================
    function renderPimpinan(records) {
        const badge = document.getElementById('pimpinan-period-badge');
        if (badge) badge.textContent = `Periode: ${getCurrentMonthName()}`;

        populatePimpinanMandorDropdown();

        const filterSelect = document.getElementById('filterMandorSelect');
        const selectedMandorId = filterSelect ? filterSelect.value : 'all';

        const mandorList = getMandorList();
        let activeMandorObj = null;
        let supervisedPetaks = [];

        if (selectedMandorId !== 'all') {
            activeMandorObj = mandorList.find(m => m.id === selectedMandorId);
            if (activeMandorObj) {
                supervisedPetaks = activeMandorObj.petak || [];
            }
        }

        const originalPenyadapList = getActivePenyadap();
        const originalPetakList = getPetakList();
        const targets = getTargetList();
        const monitoring = getMonitoringData();

        // Filter lists based on selected mandor
        const penyadapList = selectedMandorId === 'all'
            ? originalPenyadapList
            : originalPenyadapList.filter(p => supervisedPetaks.includes(p.petak));

        const petakList = selectedMandorId === 'all'
            ? originalPetakList
            : originalPetakList.filter(b => supervisedPetaks.includes(b.kode));

        const now = new Date();
        const thisYear = now.getFullYear();
        const thisMonth = now.getMonth();

        // Hitung total produksi per penyadap & petak
        const prodPerPenyadap = {};
        const prodPerPetak = {};

        originalPenyadapList.forEach(p => { prodPerPenyadap[p.nama] = 0; });
        originalPetakList.forEach(b => { prodPerPetak[b.kode] = 0; });

        records.forEach(r => {
            if (prodPerPenyadap.hasOwnProperty(r.nama_penyadap)) {
                prodPerPenyadap[r.nama_penyadap] += r.estimasi_hasil;
            }
            if (prodPerPetak.hasOwnProperty(r.petak)) {
                prodPerPetak[r.petak] += r.estimasi_hasil;
            }
        });

        // Hitung ketidakhadiran per penyadap
        const absPerPenyadap = {};
        originalPenyadapList.forEach(p => { absPerPenyadap[p.nama] = { total: 0, Sakit: 0, 'Ke Pertanian': 0, Hajatan: 0, Bangunan: 0, Lainnya: 0 }; });
        Object.entries(monitoring).forEach(([tgl, dayData]) => {
            const d = new Date(tgl);
            if ((now - d) / 86400000 <= 30) {
                Object.entries(dayData).forEach(([nama, info]) => {
                    if (absPerPenyadap[nama] && info.status && info.status !== 'Hadir') {
                        absPerPenyadap[nama].total++;
                        const key = absPerPenyadap[nama].hasOwnProperty(info.status) ? info.status : 'Lainnya';
                        absPerPenyadap[nama][key]++;
                    }
                });
            }
        });

        // Render Summary Kinerja Mandor (Foreman Dashboard)
        const mandorSummaryDashboard = document.getElementById('mandorSummaryDashboard');
        if (mandorSummaryDashboard) {
            let html = '';
            if (selectedMandorId === 'all') {
                mandorList.forEach(m => {
                    const mPetaks = m.petak || [];
                    const mPenyadaps = originalPenyadapList.filter(p => mPetaks.includes(p.petak));
                    const mPetakList = originalPetakList.filter(b => mPetaks.includes(b.kode));

                    const totalLuas = mPetakList.reduce((sum, b) => sum + (parseFloat(b.luas) || 0), 0);
                    const totalPohon = mPetakList.reduce((sum, b) => sum + (parseInt(b.pohon) || 0), 0);
                    const activePohon = mPenyadaps.reduce((sum, p) => sum + (parseInt(p.pohon) || 0), 0);
                    const nganggurPohon = Math.max(0, totalPohon - activePohon);

                    let actualProd = 0;
                    mPenyadaps.forEach(p => {
                        actualProd += prodPerPenyadap[p.nama] || 0;
                    });

                    let totalTarget = 0;
                    mPetaks.forEach(petakKode => {
                        const target = targets.find(t => t.petak === petakKode && parseInt(t.tahun) === thisYear);
                        totalTarget += target ? parseFloat(target.tahunan) : 3600;
                    });

                    const pct = totalTarget > 0 ? Math.min(100, (actualProd / totalTarget) * 100) : 0;
                    let grade = 'A', gradeClass = 'a', cardClass = '';
                    if (pct >= 90) { grade = 'A'; gradeClass = 'a'; }
                    else if (pct >= 70) { grade = 'B'; gradeClass = 'b'; }
                    else if (pct >= 50) { grade = 'C'; gradeClass = 'c'; cardClass = 'kuning'; }
                    else { grade = 'D'; gradeClass = 'd'; cardClass = 'merah'; }

                    const barClass = pct >= 90 ? 'over' : pct < 50 ? 'under' : '';

                    html += `
                    <div class="mandor-kinerja-card ${cardClass}" style="border: 1.5px solid var(--primary-light);">
                        <div class="mk-header">
                            <div>
                                <div class="mk-name" style="font-size: 1.15rem; color: var(--primary-dark);">${m.nama}</div>
                                <div style="font-size: 0.75rem; color: var(--text-muted); font-weight:600; margin-top:2px;">NIK: ${m.nik || '-'}</div>
                            </div>
                            <div class="mk-grade ${gradeClass}">${grade}</div>
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-main); line-height: 1.5; margin-bottom: 12px;">
                            📍 <strong>Petak Diawasi:</strong> ${mPetaks.join(', ') || 'Belum ada'} <br>
                            👥 <strong>Penyadap:</strong> ${mPenyadaps.length} orang <br>
                            🌳 <strong>Pohon:</strong> ${activePohon.toLocaleString('id-ID')} / ${totalPohon.toLocaleString('id-ID')} (${nganggurPohon} nganggur) <br>
                            📐 <strong>Luas:</strong> ${totalLuas.toFixed(1)} Ha
                        </div>
                        <div class="mk-progress-label" style="margin-top: 12px;">
                            <span>Capaian YTD: <strong>${actualProd.toFixed(1)} kg</strong></span>
                            <span>Target: ${totalTarget.toFixed(0)} kg</span>
                        </div>
                        <div class="mk-progress-bar-wrap">
                            <div class="mk-progress-bar ${barClass}" style="width: ${pct.toFixed(1)}%"></div>
                        </div>
                        <div class="mk-stats-row">
                            <div class="mk-stat">
                                <div class="mk-stat-val">${pct.toFixed(0)}%</div>
                                <div class="mk-stat-label">Capaian</div>
                            </div>
                            <div class="mk-stat">
                                <div class="mk-stat-val">${mPenyadaps.reduce((sum, p) => sum + (absPerPenyadap[p.nama]?.total || 0), 0)}x</div>
                                <div class="mk-stat-label">Tdk Hadir</div>
                            </div>
                            <div class="mk-stat">
                                <div class="mk-stat-val">${Math.max(0, totalTarget - actualProd).toFixed(0)} kg</div>
                                <div class="mk-stat-label">Sisa Target</div>
                            </div>
                        </div>
                    </div>`;
                });
            } else {
                if (activeMandorObj) {
                    const mPetaks = activeMandorObj.petak || [];
                    const mPenyadaps = originalPenyadapList.filter(p => mPetaks.includes(p.petak));
                    const mPetakList = originalPetakList.filter(b => mPetaks.includes(b.kode));

                    const totalLuas = mPetakList.reduce((sum, b) => sum + (parseFloat(b.luas) || 0), 0);
                    const totalPohon = mPetakList.reduce((sum, b) => sum + (parseInt(b.pohon) || 0), 0);
                    const activePohon = mPenyadaps.reduce((sum, p) => sum + (parseInt(p.pohon) || 0), 0);
                    const nganggurPohon = Math.max(0, totalPohon - activePohon);

                    let actualProd = 0;
                    mPenyadaps.forEach(p => {
                        actualProd += prodPerPenyadap[p.nama] || 0;
                    });

                    let totalTarget = 0;
                    mPetaks.forEach(petakKode => {
                        const target = targets.find(t => t.petak === petakKode && parseInt(t.tahun) === thisYear);
                        totalTarget += target ? parseFloat(target.tahunan) : 3600;
                    });

                    const pct = totalTarget > 0 ? Math.min(100, (actualProd / totalTarget) * 100) : 0;
                    let grade = 'A', gradeClass = 'a', cardClass = '';
                    if (pct >= 90) { grade = 'A'; gradeClass = 'a'; }
                    else if (pct >= 70) { grade = 'B'; gradeClass = 'b'; }
                    else if (pct >= 50) { grade = 'C'; gradeClass = 'c'; cardClass = 'kuning'; }
                    else { grade = 'D'; gradeClass = 'd'; cardClass = 'merah'; }

                    const barClass = pct >= 90 ? 'over' : pct < 50 ? 'under' : '';

                    html += `
                    <div class="mandor-kinerja-card ${cardClass}" style="grid-column: 1/-1; border: 2px solid var(--primary); background: linear-gradient(145deg, #fff, #f9fbf9);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; margin-bottom: 16px;">
                            <div>
                                <h3 style="font-size: 1.4rem; font-weight: 800; color: var(--primary-dark); margin: 0;">${activeMandorObj.nama}</h3>
                                <div style="font-size: 0.85rem; color: var(--text-muted); font-weight:600; margin-top: 4px;">NIK: ${activeMandorObj.nik || '-'} | Pengawas Lapangan Aktif</div>
                            </div>
                            <div class="mk-grade ${gradeClass}" style="font-size: 1.5rem; width: 48px; height: 48px; line-height: 48px;">${grade}</div>
                        </div>
                        
                        <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 20px;">
                            <div style="background: #edf2f7; padding: 12px; border-radius: 8px;">
                                <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">PETAK DIAWASI</div>
                                <div style="font-size: 1rem; font-weight: 700; color: var(--primary-dark); margin-top: 4px;">${mPetaks.join(', ') || '-'}</div>
                            </div>
                            <div style="background: #edf2f7; padding: 12px; border-radius: 8px;">
                                <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">PENYADAP AKTIF</div>
                                <div style="font-size: 1rem; font-weight: 700; color: var(--primary-dark); margin-top: 4px;">${mPenyadaps.length} orang</div>
                            </div>
                            <div style="background: #edf2f7; padding: 12px; border-radius: 8px;">
                                <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">ALOKASI POHON</div>
                                <div style="font-size: 1rem; font-weight: 700; color: var(--primary-dark); margin-top: 4px;">${activePohon.toLocaleString('id-ID')} / ${totalPohon.toLocaleString('id-ID')} <small style="font-size:0.75rem; font-weight:500; color:#ef6c00;">(${nganggurPohon} nganggur)</small></div>
                            </div>
                            <div style="background: #edf2f7; padding: 12px; border-radius: 8px;">
                                <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">LUAS LAHAN</div>
                                <div style="font-size: 1rem; font-weight: 700; color: var(--primary-dark); margin-top: 4px;">${totalLuas.toFixed(1)} Ha</div>
                            </div>
                        </div>

                        <div class="mk-progress-label">
                            <span>Produksi Getah Kumulatif: <strong>${actualProd.toFixed(1)} kg</strong></span>
                            <span>Target Mandor: ${totalTarget.toFixed(0)} kg</span>
                        </div>
                        <div class="mk-progress-bar-wrap" style="height: 10px;">
                            <div class="mk-progress-bar ${barClass}" style="width: ${pct.toFixed(1)}%"></div>
                        </div>
                        
                        <div class="mk-stats-row" style="margin-top: 16px; border-top: 1px solid var(--border); padding-top: 16px;">
                            <div class="mk-stat">
                                <div class="mk-stat-val">${pct.toFixed(1)}%</div>
                                <div class="mk-stat-label">Capaian YTD</div>
                            </div>
                            <div class="mk-stat">
                                <div class="mk-stat-val">${mPenyadaps.reduce((sum, p) => sum + (absPerPenyadap[p.nama]?.total || 0), 0)}x</div>
                                <div class="mk-stat-label">Total Tidak Hadir</div>
                            </div>
                            <div class="mk-stat">
                                <div class="mk-stat-val">${Math.max(0, totalTarget - actualProd).toFixed(0)} kg</div>
                                <div class="mk-stat-label">Kekurangan Target</div>
                            </div>
                        </div>
                    </div>`;
                }
            }
            mandorSummaryDashboard.innerHTML = html;
        }

        // Update tapper section title
        const tapperSectionTitle = document.getElementById('tapperSectionTitle');
        if (tapperSectionTitle) {
            tapperSectionTitle.textContent = selectedMandorId === 'all'
                ? 'Daftar Penyadap yang Diawasi (Semua Mandor)'
                : `Daftar Penyadap di Bawah Pengawasan ${activeMandorObj ? activeMandorObj.nama : ''}`;
        }

        // Render kartu per penyadap
        const grid = document.getElementById('mandorKinerjaGrid');
        if (grid) {
            grid.innerHTML = '';
            if (penyadapList.length === 0) {
                grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">Tidak ada penyadap aktif di bawah mandor ini.</div>';
            } else {
                penyadapList.forEach(p => {
                    const target = targets.find(t => t.petak === p.petak && parseInt(t.tahun) === thisYear);
                    const targetTahunan = target ? parseFloat(target.tahunan) : 3600;
                    const actual = prodPerPenyadap[p.nama] || 0;
                    const pct = targetTahunan > 0 ? Math.min(100, (actual / targetTahunan) * 100) : 0;

                    let grade = 'A', gradeClass = 'a', cardClass = '';
                    if (pct >= 90) { grade = 'A'; gradeClass = 'a'; }
                    else if (pct >= 70) { grade = 'B'; gradeClass = 'b'; }
                    else if (pct >= 50) { grade = 'C'; gradeClass = 'c'; cardClass = 'kuning'; }
                    else { grade = 'D'; gradeClass = 'd'; cardClass = 'merah'; }

                    const barClass = pct >= 90 ? 'over' : pct < 50 ? 'under' : '';
                    const absInfo = absPerPenyadap[p.nama] || {};

                    grid.innerHTML += `
                    <div class="mandor-kinerja-card ${cardClass}">
                        <div class="mk-header">
                            <div>
                                <div class="mk-name">${p.nama}</div>
                                <div class="mk-petak-tag">${p.petak}</div>
                            </div>
                            <div class="mk-grade ${gradeClass}">${grade}</div>
                        </div>
                        <div class="mk-progress-label">
                            <span>Produksi: <strong>${actual.toFixed(1)} kg</strong></span>
                            <span>Target: ${targetTahunan.toFixed(0)} kg</span>
                        </div>
                        <div class="mk-progress-bar-wrap">
                            <div class="mk-progress-bar ${barClass}" style="width: ${pct.toFixed(1)}%"></div>
                        </div>
                        <div class="mk-stats-row">
                            <div class="mk-stat">
                                <div class="mk-stat-val">${pct.toFixed(1)}%</div>
                                <div class="mk-stat-label">Capaian YTD</div>
                            </div>
                            <div class="mk-stat">
                                <div class="mk-stat-val">${absInfo.total || 0}x</div>
                                <div class="mk-stat-label">Tdk Hadir</div>
                            </div>
                            <div class="mk-stat">
                                <div class="mk-stat-val">${Math.max(0, targetTahunan - actual).toFixed(0)} kg</div>
                                <div class="mk-stat-label">Sisa Target</div>
                            </div>
                        </div>
                    </div>`;
                });
            }
        }

        // Chart 1: Target Tahunan per Petak
        const pCodes = petakList.map(b => b.kode);
        const pActuals = pCodes.map(c => +(prodPerPetak[c] || 0).toFixed(1));
        const pTargets = pCodes.map(c => {
            const t = targets.find(x => x.petak === c && parseInt(x.tahun) === thisYear);
            return t ? parseFloat(t.tahunan) : 3600;
        });

        initChart('chartTargetPetak', 'bar', {
            labels: pCodes,
            datasets: [
                { label: 'Aktual (kg)', data: pActuals, backgroundColor: GA, borderRadius: 6 },
                { label: 'Target (kg)', data: pTargets, backgroundColor: 'rgba(27,67,50,0.1)', borderColor: G, borderWidth: 1.5, borderRadius: 6 }
            ]
        }, { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } });

        // Chart 2: Target Tahunan per Penyadap
        const names = penyadapList.map(p => p.nama);
        const actuals = names.map(n => +(prodPerPenyadap[n] || 0).toFixed(1));
        const tgts = penyadapList.map(p => {
            const t = targets.find(x => x.petak === p.petak && parseInt(x.tahun) === thisYear);
            return t ? parseFloat(t.tahunan) : 3600;
        });

        initChart('chartTargetTahunan', 'bar', {
            labels: names,
            datasets: [
                { label: 'Aktual (kg)', data: actuals, backgroundColor: GL, borderRadius: 6 },
                { label: 'Target (kg)', data: tgts, backgroundColor: 'rgba(27,67,50,0.1)', borderColor: G, borderWidth: 1.5, borderRadius: 6 }
            ]
        }, { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } });

        // Chart 3: Target Bulanan per Periode (P1 vs P2)
        const p1Actuals = penyadapList.map(p => {
            return records.filter(r => {
                const d = new Date(r.tanggal);
                return r.nama_penyadap === p.nama && d.getFullYear() === thisYear && d.getMonth() === thisMonth && d.getDate() <= 15;
            }).reduce((s, r) => s + r.estimasi_hasil, 0);
        });
        const p2Actuals = penyadapList.map(p => {
            return records.filter(r => {
                const d = new Date(r.tanggal);
                return r.nama_penyadap === p.nama && d.getFullYear() === thisYear && d.getMonth() === thisMonth && d.getDate() > 15;
            }).reduce((s, r) => s + r.estimasi_hasil, 0);
        });

        // Asumsi target bulanan dibagi 2 periode sama rata dari target bulanan di metadata penyadap
        const p1Targets = penyadapList.map(p => (parseFloat(p.periode1) || 0));
        const p2Targets = penyadapList.map(p => (parseFloat(p.periode2) || 0));

        initChart('chartTargetBulanan', 'bar', {
            labels: names,
            datasets: [
                { label: 'P1 Aktual (1-15)', data: p1Actuals.map(v => +v.toFixed(1)), backgroundColor: GA, borderRadius: 4 },
                { label: 'P1 Target', data: p1Targets, backgroundColor: 'rgba(82,183,136,0.2)', borderColor: GA, borderWidth: 1, borderRadius: 4 },
                { label: 'P2 Aktual (16-31)', data: p2Actuals.map(v => +v.toFixed(1)), backgroundColor: Y, borderRadius: 4 },
                { label: 'P2 Target', data: p2Targets, backgroundColor: 'rgba(244,162,97,0.2)', borderColor: Y, borderWidth: 1, borderRadius: 4 },
            ]
        }, {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        footer: (items) => {
                            const idx = items[0].dataIndex;
                            const p1Pct = p1Targets[idx] > 0 ? (p1Actuals[idx] / p1Targets[idx] * 100).toFixed(1) : 0;
                            const p2Pct = p2Targets[idx] > 0 ? (p2Actuals[idx] / p2Targets[idx] * 100).toFixed(1) : 0;
                            return `Prog P1: ${p1Pct}%\nProg P2: ${p2Pct}%`;
                        }
                    }
                }
            },
            scales: { y: { beginAtZero: true } }
        });

        // Tabel ketidakhadiran
        const tbody = document.getElementById('ketidakhadiranTbody');
        if (tbody) {
            tbody.innerHTML = '';
            penyadapList.forEach(p => {
                const abs = absPerPenyadap[p.nama] || {};
                tbody.innerHTML += `<tr>
                    <td><strong>${p.nama}</strong></td>
                    <td><code style="background:#edf2f7;padding:3px 7px;border-radius:4px;">${p.petak}</code></td>
                    <td><strong style="color:${abs.total > 5 ? 'var(--danger)' : 'var(--text-dark)'}">${abs.total || 0}x</strong></td>
                    <td>${abs['Sakit'] || 0}x</td>
                    <td>${abs['Ke Pertanian'] || 0}x</td>
                    <td>${abs['Hajatan'] || 0}x</td>
                    <td>${abs['Bangunan'] || 0}x</td>
                    <td>${abs['Lainnya'] || 0}x</td>
                </tr>`;
            });
        }
    }

    // ======================== 5. KELOLA MANDOR ========================
    function renderMandorTab() {
        renderMandorTable();
    }

    function renderMandorTable() {
        const list = getMandorList();
        const tpgs = getTpgList();
        const tbody = document.getElementById('mandorTbody');
        if (!tbody) return;

        if (!list.length) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:30px;">Belum ada data mandor. Klik tombol Tambah Mandor.</td></tr>';
            return;
        }

        tbody.innerHTML = list.map(m => {
            const tpg = tpgs.find(t => t.id_tpg === m.id_tpg) || { nama_tpg: '-' };
            return `
                <tr>
                    <td><strong>${m.nama_mandor || m.nama}</strong></td>
                    <td><code>${m.nik || '-'}</code></td>
                    <td><code>${m.nomor_hp || '-'}</code></td>
                    <td><strong>${tpg.nama_tpg}</strong></td>
                    <td style="text-align: center;">
                        <div class="action-btns" style="display:flex; gap:8px; justify-content: center;">
                            <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.8rem;" onclick="window.editMandor('${m.id_mandor || m.id}')">✏️ Edit</button>
                            <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.8rem; border-color: var(--danger); color: var(--danger);" onclick="window.deleteMandor('${m.id_mandor || m.id}')">🗑️ Hapus</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    document.getElementById('btnTambahMandor')?.addEventListener('click', () => {
        document.getElementById('editMandorId').value = '';
        document.getElementById('inputNamaMandor').value = '';
        document.getElementById('inputNIKMandor').value = '';
        document.getElementById('inputHPMandor').value = '';
        populateTPGIndukSelect('inputTPGMandor');
        document.getElementById('inputStatusMandor').value = 'Aktif';
        document.getElementById('modalMandorTitle').textContent = 'Tambah Mandor';
        openModal('modalMandor');
    });

    window.editMandor = function (id) {
        const list = getMandorList();
        const m = list.find(x => x.id_mandor === id || x.id === id);
        if (!m) return;

        document.getElementById('editMandorId').value = m.id_mandor || m.id;
        document.getElementById('inputNamaMandor').value = m.nama_mandor || m.nama;
        document.getElementById('inputNIKMandor').value = m.nik || '';
        document.getElementById('inputHPMandor').value = m.nomor_hp || '';
        populateTPGIndukSelect('inputTPGMandor', m.id_tpg);
        document.getElementById('inputStatusMandor').value = m.status || 'Aktif';
        document.getElementById('modalMandorTitle').textContent = 'Edit Data Mandor';
        openModal('modalMandor');
    };

    window.deleteMandor = function (id) {
        const list = getMandorList();
        const m = list.find(x => x.id_mandor === id || x.id === id);
        if (!m) return;

        if (confirm(`Apakah Anda yakin ingin menghapus mandor "${m.nama_mandor || m.nama}"?`)) {
            const newList = list.filter(x => x.id_mandor !== id && x.id !== id);
            lsSet(LS.MANDOR, newList);
            renderMandorTable();
            showToast('Mandor berhasil dihapus.', 'warning');

            queueOfflineCrud({ action: 'deleteMandor', id: id });
            if (navigator.onLine) {
                syncOfflineCrud(() => {
                    loadAllData(records => {
                        renderMandorTable();
                    });
                });
            }
        }
    };

    document.getElementById('btnSimpanMandor')?.addEventListener('click', () => {
        const id = document.getElementById('editMandorId').value;
        const nama = document.getElementById('inputNamaMandor').value.trim();
        const nik = document.getElementById('inputNIKMandor').value.trim();
        const nomor_hp = document.getElementById('inputHPMandor').value.trim();
        const id_tpg = document.getElementById('inputTPGMandor').value;
        const status = document.getElementById('inputStatusMandor').value;

        if (!nama) { showToast('Nama mandor wajib diisi!', 'error'); return; }
        if (!id_tpg) { showToast('Pilih TPG Induk!', 'error'); return; }

        let list = getMandorList();
        const mandorId = id || 'm' + Date.now();
        const mandorData = { id_mandor: mandorId, nama_mandor: nama, nik, nomor_hp, id_tpg, status, id: mandorId, nama };

        if (id) {
            const idx = list.findIndex(x => x.id_mandor === id || x.id === id);
            if (idx >= 0) {
                list[idx] = mandorData;
                showToast(`Data mandor "${nama}" berhasil diubah!`);
            }
        } else {
            list.push(mandorData);
            showToast(`Mandor "${nama}" berhasil ditambahkan!`);
        }

        lsSet(LS.MANDOR, list);
        closeModal('modalMandor');
        renderMandorTable();

        queueOfflineCrud({ action: 'saveMandor', data: mandorData });
        if (navigator.onLine) {
            syncOfflineCrud(() => {
                loadAllData(records => {
                    renderMandorTable();
                });
            });
        }
    });

    let activeWilayahSubtab = 'petak';

    // ======================== CASCADING SELECT HELPERS ========================
    function populateBKPHIndukSelect(selectId, selectedId = '') {
        const select = document.getElementById(selectId);
        if (!select) return;
        const list = getBkphList().filter(x => x.status === 'Aktif');
        select.innerHTML = '<option value="" disabled selected>-- Pilih BKPH --</option>' +
            list.map(x => `<option value="${x.id_bkph}" ${x.id_bkph === selectedId ? 'selected' : ''}>${x.nama_bkph}</option>`).join('');
    }

    function populateRPHIndukSelect(selectId, selectedId = '') {
        const select = document.getElementById(selectId);
        if (!select) return;
        const list = getRphList().filter(x => x.status === 'Aktif');
        select.innerHTML = '<option value="" disabled selected>-- Pilih RPH --</option>' +
            list.map(x => `<option value="${x.id_rph}" ${x.id_rph === selectedId ? 'selected' : ''}>${x.nama_rph}</option>`).join('');
    }

    function populateTPGIndukSelect(selectId, selectedId = '') {
        const select = document.getElementById(selectId);
        if (!select) return;
        const list = getTpgList().filter(x => x.status === 'Aktif');
        select.innerHTML = '<option value="" disabled selected>-- Pilih TPG --</option>' +
            list.map(x => `<option value="${x.id_tpg}" ${x.id_tpg === selectedId ? 'selected' : ''}>${x.nama_tpg}</option>`).join('');
    }

    function populateMandorSelect(selectId, selectedId = '') {
        const select = document.getElementById(selectId);
        if (!select) return;
        const list = getMandorList().filter(x => x.status === 'Aktif');
        select.innerHTML = '<option value="" disabled selected>-- Pilih Mandor --</option>' +
            list.map(x => `<option value="${x.id_mandor}" ${x.id_mandor === selectedId ? 'selected' : ''}>${x.nama_mandor || x.nama}</option>`).join('');
    }

    function populatePetakSelect(selectId, selectedId = '') {
        const select = document.getElementById(selectId);
        if (!select) return;
        const list = getPetakList().filter(x => x.status === 'Aktif');
        select.innerHTML = '<option value="" disabled selected>-- Pilih Petak --</option>' +
            list.map(x => `<option value="${x.id_petak}" ${x.id_petak === selectedId ? 'selected' : ''}>${x.nomor_petak || x.kode}</option>`).join('');
    }

    function initFilterCascadingSelects() {
        const bkphSel = document.getElementById('dbFilterBKPH');
        const rphSel = document.getElementById('dbFilterRPH');
        const tpgSel = document.getElementById('dbFilterTPG');
        if (!bkphSel) return;

        const bkphs = getBkphList().filter(x => x.status === 'Aktif');
        bkphSel.innerHTML = '<option value="all">-- Semua BKPH --</option>' +
            bkphs.map(b => `<option value="${b.id_bkph}">${b.nama_bkph}</option>`).join('');

        bkphSel.addEventListener('change', function () {
            const bkphId = this.value;
            if (bkphId === 'all') {
                rphSel.innerHTML = '<option value="all">-- Semua RPH --</option>';
                tpgSel.innerHTML = '<option value="all">-- Semua TPG --</option>';
                return;
            }
            const rphs = getRphList().filter(r => r.id_bkph === bkphId && r.status === 'Aktif');
            rphSel.innerHTML = '<option value="all">-- Semua RPH --</option>' +
                rphs.map(r => `<option value="${r.id_rph}">${r.nama_rph}</option>`).join('');
            tpgSel.innerHTML = '<option value="all">-- Semua TPG --</option>';
        });

        rphSel.addEventListener('change', function () {
            const rphId = this.value;
            if (rphId === 'all') {
                tpgSel.innerHTML = '<option value="all">-- Semua TPG --</option>';
                return;
            }
            const tpgs = getTpgList().filter(t => t.id_rph === rphId && t.status === 'Aktif');
            tpgSel.innerHTML = '<option value="all">-- Semua TPG --</option>' +
                tpgs.map(t => `<option value="${t.id_tpg}">${t.nama_tpg}</option>`).join('');
        });
    }

    function initReportCascadingSelects() {
        const bkphSel = document.getElementById('reportBKPH');
        const rphSel = document.getElementById('reportRPH');
        const tpgSel = document.getElementById('reportTPG');
        const mandorSel = document.getElementById('reportMandor');
        const penyadapSel = document.getElementById('reportPenyadap');
        if (!bkphSel) return;

        const bkphs = getBkphList().filter(x => x.status === 'Aktif');
        bkphSel.innerHTML = '<option value="all">-- Semua BKPH --</option>' +
            bkphs.map(b => `<option value="${b.id_bkph}">${b.nama_bkph}</option>`).join('');

        bkphSel.addEventListener('change', function () {
            const bkphId = this.value;
            if (bkphId === 'all') {
                rphSel.innerHTML = '<option value="all">-- Semua RPH --</option>';
                tpgSel.innerHTML = '<option value="all">-- Semua TPG --</option>';
                mandorSel.innerHTML = '<option value="all">-- Semua Mandor --</option>';
                penyadapSel.innerHTML = '<option value="all">-- Semua Penyadap --</option>';
                return;
            }
            const rphs = getRphList().filter(r => r.id_bkph === bkphId && r.status === 'Aktif');
            rphSel.innerHTML = '<option value="all">-- Semua RPH --</option>' +
                rphs.map(r => `<option value="${r.id_rph}">${r.nama_rph}</option>`).join('');
            tpgSel.innerHTML = '<option value="all">-- Semua TPG --</option>';
            mandorSel.innerHTML = '<option value="all">-- Semua Mandor --</option>';
            penyadapSel.innerHTML = '<option value="all">-- Semua Penyadap --</option>';
        });

        rphSel.addEventListener('change', function () {
            const rphId = this.value;
            if (rphId === 'all') {
                tpgSel.innerHTML = '<option value="all">-- Semua TPG --</option>';
                mandorSel.innerHTML = '<option value="all">-- Semua Mandor --</option>';
                penyadapSel.innerHTML = '<option value="all">-- Semua Penyadap --</option>';
                return;
            }
            const tpgs = getTpgList().filter(t => t.id_rph === rphId && t.status === 'Aktif');
            tpgSel.innerHTML = '<option value="all">-- Semua TPG --</option>' +
                tpgs.map(t => `<option value="${t.id_tpg}">${t.nama_tpg}</option>`).join('');
            mandorSel.innerHTML = '<option value="all">-- Semua Mandor --</option>';
            penyadapSel.innerHTML = '<option value="all">-- Semua Penyadap --</option>';
        });

        tpgSel.addEventListener('change', function () {
            const tpgId = this.value;
            if (tpgId === 'all') {
                mandorSel.innerHTML = '<option value="all">-- Semua Mandor --</option>';
                penyadapSel.innerHTML = '<option value="all">-- Semua Penyadap --</option>';
                return;
            }
            const mandors = getMandorList().filter(m => m.id_tpg === tpgId && m.status === 'Aktif');
            mandorSel.innerHTML = '<option value="all">-- Semua Mandor --</option>' +
                mandors.map(m => `<option value="${m.id_mandor}">${m.nama_mandor || m.nama}</option>`).join('');
            penyadapSel.innerHTML = '<option value="all">-- Semua Penyadap --</option>';
        });

        mandorSel.addEventListener('change', function () {
            const mandorId = this.value;
            if (mandorId === 'all') {
                penyadapSel.innerHTML = '<option value="all">-- Semua Penyadap --</option>';
                return;
            }
            const penyadaps = getPenyadapList().filter(p => p.id_mandor === mandorId && p.status === 'Aktif');
            penyadapSel.innerHTML = '<option value="all">-- Semua Penyadap --</option>' +
                penyadaps.map(p => `<option value="${p.id_penyadap}">${p.nama_penyadap || p.nama}</option>`).join('');
        });
    }

    function initTargetCascadingSelects(selectedBkph = '', selectedRph = '', selectedTpg = '') {
        const bkphSel = document.getElementById('targetBKPHSelect');
        const rphSel = document.getElementById('targetRPHSelect');
        const tpgSel = document.getElementById('targetTPGSelect');
        if (!bkphSel) return;

        const bkphs = getBkphList().filter(x => x.status === 'Aktif');
        bkphSel.innerHTML = bkphs.map(b => `<option value="${b.id_bkph}">${b.nama_bkph}</option>`).join('');
        if (selectedBkph) bkphSel.value = selectedBkph;

        const updateRph = (bkphId, currentRph = '') => {
            const rphs = getRphList().filter(r => r.id_bkph === bkphId && r.status === 'Aktif');
            rphSel.innerHTML = rphs.map(r => `<option value="${r.id_rph}">${r.nama_rph}</option>`).join('');
            if (currentRph) rphSel.value = currentRph;
            updateTpg(rphSel.value, selectedTpg);
        };

        const updateTpg = (rphId, currentTpg = '') => {
            const tpgs = getTpgList().filter(t => t.id_rph === rphId && t.status === 'Aktif');
            tpgSel.innerHTML = tpgs.map(t => `<option value="${t.id_tpg}">${t.nama_tpg}</option>`).join('');
            if (currentTpg) tpgSel.value = currentTpg;
        };

        bkphSel.addEventListener('change', function () {
            updateRph(this.value);
        });

        rphSel.addEventListener('change', function () {
            updateTpg(this.value);
        });

        updateRph(bkphSel.value, selectedRph);
    }

    // ======================== TAB RENDERING ========================
    function renderWilayahTab() {
        const subtabs = document.querySelectorAll('#wilayahSubtabs .btn-subtab');
        subtabs.forEach(btn => {
            const sub = btn.getAttribute('data-subtab');
            if (sub === activeWilayahSubtab) {
                btn.className = 'btn btn-primary btn-subtab';
                document.getElementById('subcontent-' + sub).style.display = 'block';
            } else {
                btn.className = 'btn btn-outline btn-subtab';
                document.getElementById('subcontent-' + sub).style.display = 'none';
            }
        });

        switch (activeWilayahSubtab) {
            case 'bkph': renderBKPHList(); break;
            case 'rph': renderRPHList(); break;
            case 'tpg': renderTPGList(); break;
            case 'petak': renderPetakListTable(); break;
        }
    }

    // Bind subtab button clicks
    document.querySelectorAll('#wilayahSubtabs .btn-subtab').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            activeWilayahSubtab = this.getAttribute('data-subtab');
            renderWilayahTab();
        });
    });

    // ======================== BKPH CRUD ========================
    document.getElementById('btnTambahWilayahItem')?.addEventListener('click', () => {
        if (activeWilayahSubtab === 'bkph') {
            document.getElementById('editBKPHId').value = '';
            document.getElementById('inputKodeBKPH').value = '';
            document.getElementById('inputNamaBKPH').value = '';
            document.getElementById('inputStatusBKPH').value = 'Aktif';
            document.getElementById('modalBKPHTitle').textContent = 'Tambah BKPH';
            openModal('modalBKPH');
        } else if (activeWilayahSubtab === 'rph') {
            document.getElementById('editRPHId').value = '';
            document.getElementById('inputKodeRPH').value = '';
            document.getElementById('inputNamaRPH').value = '';
            populateBKPHIndukSelect('inputBKPHInduk');
            document.getElementById('inputStatusRPH').value = 'Aktif';
            document.getElementById('modalRPHTitle').textContent = 'Tambah RPH';
            openModal('modalRPH');
        } else if (activeWilayahSubtab === 'tpg') {
            document.getElementById('editTPGId').value = '';
            document.getElementById('inputKodeTPG').value = '';
            document.getElementById('inputNamaTPG').value = '';
            populateRPHIndukSelect('inputRPHInduk');
            document.getElementById('inputStatusTPG').value = 'Aktif';
            document.getElementById('modalTPGTitle').textContent = 'Tambah TPG';
            openModal('modalTPG');
        } else if (activeWilayahSubtab === 'petak') {
            document.getElementById('editPetakId').value = '';
            document.getElementById('inputKodePetak').value = '';
            document.getElementById('inputAnakPetak').value = '';
            document.getElementById('inputLuasPetak').value = '';
            document.getElementById('inputPohonPetak').value = '';
            populateTPGIndukSelect('inputTPGPetak');
            document.getElementById('inputStatusPetak').value = 'Aktif';
            document.getElementById('modalPetakTitle').textContent = 'Tambah Petak Baru';
            openModal('modalPetak');
        }
    });

    document.getElementById('btnSimpanBKPH')?.addEventListener('click', () => {
        const id = document.getElementById('editBKPHId').value;
        const kode = document.getElementById('inputKodeBKPH').value.trim();
        const nama = document.getElementById('inputNamaBKPH').value.trim();
        const status = document.getElementById('inputStatusBKPH').value;

        if (!kode || !nama) { showToast('Isi kode dan nama BKPH!', 'error'); return; }

        let list = getBkphList();
        const bkphId = id || 'b' + Date.now();
        const bkphData = { id_bkph: bkphId, kode_bkph: kode, nama_bkph: nama, status };

        if (id) {
            const idx = list.findIndex(x => x.id_bkph === id);
            if (idx >= 0) list[idx] = bkphData;
        } else {
            list.push(bkphData);
        }

        lsSet(LS.BKPH, list);
        closeModal('modalBKPH');
        renderBKPHList();
        showToast('BKPH berhasil disimpan.');

        queueOfflineCrud({ action: 'saveBKPH', data: bkphData });
        if (navigator.onLine) {
            syncOfflineCrud(() => {
                loadAllData(() => {
                    renderBKPHList();
                });
            });
        }
    });

    window.editBKPH = function (id) {
        const list = getBkphList();
        const x = list.find(item => item.id_bkph === id);
        if (!x) return;
        document.getElementById('editBKPHId').value = x.id_bkph;
        document.getElementById('inputKodeBKPH').value = x.kode_bkph;
        document.getElementById('inputNamaBKPH').value = x.nama_bkph;
        document.getElementById('inputStatusBKPH').value = x.status;
        document.getElementById('modalBKPHTitle').textContent = 'Edit BKPH';
        openModal('modalBKPH');
    };

    window.deleteBKPH = function (id) {
        if (!confirm('Hapus BKPH ini? Semua relasi RPH akan terputus.')) return;
        let list = getBkphList().filter(x => x.id_bkph !== id);
        lsSet(LS.BKPH, list);
        renderBKPHList();
        showToast('BKPH berhasil dihapus.', 'warning');

        queueOfflineCrud({ action: 'deleteBKPH', id: id });
        if (navigator.onLine) {
            syncOfflineCrud(() => {
                loadAllData(() => {
                    renderBKPHList();
                });
            });
        }
    };

    function renderBKPHList() {
        const list = getBkphList();
        const tbody = document.getElementById('bkphTbody');
        if (!tbody) return;
        tbody.innerHTML = list.length ? list.map(x => `
            <tr>
                <td><code>${x.kode_bkph}</code></td>
                <td><strong>${x.nama_bkph}</strong></td>
                <td><span class="status-badge-${x.status.toLowerCase()}">${x.status}</span></td>
                <td style="text-align: center;">
                    <div class="action-btns" style="display:flex; gap:8px; justify-content: center;">
                        <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.8rem;" onclick="window.editBKPH('${x.id_bkph}')">✏️ Edit</button>
                        <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.8rem; border-color: var(--danger); color: var(--danger);" onclick="window.deleteBKPH('${x.id_bkph}')">🗑️ Hapus</button>
                    </div>
                </td>
            </tr>
        `).join('') : '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:20px;">Belum ada data BKPH</td></tr>';
    }

    // ======================== RPH CRUD ========================
    document.getElementById('btnSimpanRPH')?.addEventListener('click', () => {
        const id = document.getElementById('editRPHId').value;
        const kode = document.getElementById('inputKodeRPH').value.trim();
        const nama = document.getElementById('inputNamaRPH').value.trim();
        const id_bkph = document.getElementById('inputBKPHInduk').value;
        const status = document.getElementById('inputStatusRPH').value;

        if (!kode || !nama || !id_bkph) { showToast('Isi kode, nama, dan BKPH Induk!', 'error'); return; }

        let list = getRphList();
        const rphId = id || 'r' + Date.now();
        const rphData = { id_rph: rphId, kode_rph: kode, nama_rph: nama, id_bkph, status };

        if (id) {
            const idx = list.findIndex(x => x.id_rph === id);
            if (idx >= 0) list[idx] = rphData;
        } else {
            list.push(rphData);
        }

        lsSet(LS.RPH, list);
        closeModal('modalRPH');
        renderRPHList();
        showToast('RPH berhasil disimpan.');

        queueOfflineCrud({ action: 'saveRPH', data: rphData });
        if (navigator.onLine) {
            syncOfflineCrud(() => {
                loadAllData(() => {
                    renderRPHList();
                });
            });
        }
    });

    window.editRPH = function (id) {
        const list = getRphList();
        const x = list.find(item => item.id_rph === id);
        if (!x) return;
        document.getElementById('editRPHId').value = x.id_rph;
        document.getElementById('inputKodeRPH').value = x.kode_rph;
        document.getElementById('inputNamaRPH').value = x.nama_rph;
        populateBKPHIndukSelect('inputBKPHInduk', x.id_bkph);
        document.getElementById('inputStatusRPH').value = x.status;
        document.getElementById('modalRPHTitle').textContent = 'Edit RPH';
        openModal('modalRPH');
    };

    window.deleteRPH = function (id) {
        if (!confirm('Hapus RPH ini? Semua relasi TPG akan terputus.')) return;
        let list = getRphList().filter(x => x.id_rph !== id);
        lsSet(LS.RPH, list);
        renderRPHList();
        showToast('RPH berhasil dihapus.', 'warning');

        queueOfflineCrud({ action: 'deleteRPH', id: id });
        if (navigator.onLine) {
            syncOfflineCrud(() => {
                loadAllData(() => {
                    renderRPHList();
                });
            });
        }
    };

    function renderRPHList() {
        const list = getRphList();
        const bkphs = getBkphList();
        const tbody = document.getElementById('rphTbody');
        if (!tbody) return;
        tbody.innerHTML = list.length ? list.map(x => {
            const bkph = bkphs.find(b => b.id_bkph === x.id_bkph) || { nama_bkph: '-' };
            return `
                <tr>
                    <td><code>${x.kode_rph}</code></td>
                    <td><strong>${x.nama_rph}</strong></td>
                    <td>${bkph.nama_bkph}</td>
                    <td><span class="status-badge-${x.status.toLowerCase()}">${x.status}</span></td>
                    <td style="text-align: center;">
                        <div class="action-btns" style="display:flex; gap:8px; justify-content: center;">
                            <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.8rem;" onclick="window.editRPH('${x.id_rph}')">✏️ Edit</button>
                            <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.8rem; border-color: var(--danger); color: var(--danger);" onclick="window.deleteRPH('${x.id_rph}')">🗑️ Hapus</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('') : '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:20px;">Belum ada data RPH</td></tr>';
    }

    // ======================== TPG CRUD ========================
    document.getElementById('btnSimpanTPG')?.addEventListener('click', () => {
        const id = document.getElementById('editTPGId').value;
        const kode = document.getElementById('inputKodeTPG').value.trim();
        const nama = document.getElementById('inputNamaTPG').value.trim();
        const id_rph = document.getElementById('inputRPHInduk').value;
        const status = document.getElementById('inputStatusTPG').value;

        if (!kode || !nama || !id_rph) { showToast('Isi kode, nama, and RPH Induk!', 'error'); return; }

        let list = getTpgList();
        const tpgId = id || 't' + Date.now();
        const tpgData = { id_tpg: tpgId, kode_tpg: kode, nama_tpg: nama, id_rph, status };

        if (id) {
            const idx = list.findIndex(x => x.id_tpg === id);
            if (idx >= 0) list[idx] = tpgData;
        } else {
            list.push(tpgData);
        }

        lsSet(LS.TPG, list);
        closeModal('modalTPG');
        renderTPGList();
        showToast('TPG berhasil disimpan.');

        queueOfflineCrud({ action: 'saveTPG', data: tpgData });
        if (navigator.onLine) {
            syncOfflineCrud(() => {
                loadAllData(() => {
                    renderTPGList();
                });
            });
        }
    });

    window.editTPG = function (id) {
        const list = getTpgList();
        const x = list.find(item => item.id_tpg === id);
        if (!x) return;
        document.getElementById('editTPGId').value = x.id_tpg;
        document.getElementById('inputKodeTPG').value = x.kode_tpg;
        document.getElementById('inputNamaTPG').value = x.nama_tpg;
        populateRPHIndukSelect('inputRPHInduk', x.id_rph);
        document.getElementById('inputStatusTPG').value = x.status;
        document.getElementById('modalTPGTitle').textContent = 'Edit TPG';
        openModal('modalTPG');
    };

    window.deleteTPG = function (id) {
        if (!confirm('Hapus TPG ini? Semua relasi Petak akan terputus.')) return;
        let list = getTpgList().filter(x => x.id_tpg !== id);
        lsSet(LS.TPG, list);
        renderTPGList();
        showToast('TPG berhasil dihapus.', 'warning');

        queueOfflineCrud({ action: 'deleteTPG', id: id });
        if (navigator.onLine) {
            syncOfflineCrud(() => {
                loadAllData(() => {
                    renderTPGList();
                });
            });
        }
    };

    function renderTPGList() {
        const list = getTpgList();
        const rphs = getRphList();
        const tbody = document.getElementById('tpgTbody');
        if (!tbody) return;
        tbody.innerHTML = list.length ? list.map(x => {
            const rph = rphs.find(r => r.id_rph === x.id_rph) || { nama_rph: '-' };
            return `
                <tr>
                    <td><code>${x.kode_tpg}</code></td>
                    <td><strong>${x.nama_tpg}</strong></td>
                    <td>${rph.nama_rph}</td>
                    <td><span class="status-badge-${x.status.toLowerCase()}">${x.status}</span></td>
                    <td style="text-align: center;">
                        <div class="action-btns" style="display:flex; gap:8px; justify-content: center;">
                            <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.8rem;" onclick="window.editTPG('${x.id_tpg}')">✏️ Edit</button>
                            <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.8rem; border-color: var(--danger); color: var(--danger);" onclick="window.deleteTPG('${x.id_tpg}')">🗑️ Hapus</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('') : '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:20px;">Belum ada data TPG</td></tr>';
    }

    // ======================== PETAK CRUD ========================
    document.getElementById('btnSimpanPetak')?.addEventListener('click', () => {
        const id = document.getElementById('editPetakId').value;
        const kode = document.getElementById('inputKodePetak').value.trim();
        const anak_petak = document.getElementById('inputAnakPetak').value.trim();
        const luas = parseFloat(document.getElementById('inputLuasPetak').value) || 0;
        const pohon = parseInt(document.getElementById('inputPohonPetak').value) || 0;
        const id_tpg = document.getElementById('inputTPGPetak').value;
        const status = document.getElementById('inputStatusPetak').value;

        if (!kode || luas <= 0 || pohon <= 0 || !id_tpg) { showToast('Isi kode, luas, pohon, dan TPG Induk!', 'error'); return; }

        let list = getPetakList();
        const petakId = id || 'b' + Date.now();
        const petakData = { id_petak: petakId, nomor_petak: kode, anak_petak, luas, id_tpg, pohon, status, id: petakId, kode };

        if (id) {
            const idx = list.findIndex(x => x.id_petak === id || x.id === id);
            if (idx >= 0) list[idx] = petakData;
        } else {
            list.push(petakData);
        }

        lsSet(LS.PETAK, list);
        closeModal('modalPetak');
        renderPetakListTable();
        showToast('Petak berhasil disimpan.');

        queueOfflineCrud({ action: 'savePetak', data: petakData });
        if (navigator.onLine) {
            syncOfflineCrud(() => {
                loadAllData(() => {
                    renderPetakListTable();
                });
            });
        }
    });

    window.editPetak = function (id) {
        const list = getPetakList();
        const x = list.find(item => item.id_petak === id || item.id === id);
        if (!x) return;
        document.getElementById('editPetakId').value = x.id_petak || x.id;
        document.getElementById('inputKodePetak').value = x.nomor_petak || x.kode;
        document.getElementById('inputAnakPetak').value = x.anak_petak || '';
        document.getElementById('inputLuasPetak').value = x.luas;
        document.getElementById('inputPohonPetak').value = x.pohon || 1000;
        populateTPGIndukSelect('inputTPGPetak', x.id_tpg);
        document.getElementById('inputStatusPetak').value = x.status || 'Aktif';
        document.getElementById('modalPetakTitle').textContent = 'Edit Petak';
        openModal('modalPetak');
    };

    window.deletePetak = function (id) {
        if (!confirm('Hapus petak ini? Semua relasi penyadap akan terputus.')) return;
        let list = getPetakList().filter(x => x.id_petak !== id && x.id !== id);
        lsSet(LS.PETAK, list);
        renderPetakListTable();
        showToast('Petak berhasil dihapus.', 'warning');

        queueOfflineCrud({ action: 'deletePetak', id: id });
        if (navigator.onLine) {
            syncOfflineCrud(() => {
                loadAllData(() => {
                    renderPetakListTable();
                });
            });
        }
    };

    function renderPetakListTable() {
        const list = getPetakList();
        const tpgs = getTpgList();
        const tbody = document.getElementById('petakTargetTbody');
        if (!tbody) return;
        tbody.innerHTML = list.length ? list.map(x => {
            const tpg = tpgs.find(t => t.id_tpg === x.id_tpg) || { nama_tpg: '-' };
            const targets = getTargetList();
            const target = targets.find(t => t.petak === x.nomor_petak && parseInt(t.tahun) === 2026) || { tahunan: 0 };
            return `
                <tr>
                    <td><code>${x.nomor_petak}${x.anak_petak ? ' - ' + x.anak_petak : ''}</code></td>
                    <td>${tpg.nama_tpg}</td>
                    <td>${x.luas} Ha</td>
                    <td>${x.pohon || 1000}</td>
                    <td><span class="status-badge-${(x.status || 'Aktif').toLowerCase()}">${x.status || 'Aktif'}</span></td>
                    <td><strong>${target.tahunan.toLocaleString('id-ID')} kg/th</strong></td>
                    <td style="text-align: center;">
                        <div class="action-btns" style="display:flex; gap:8px; justify-content: center;">
                            <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.8rem;" onclick="window.editPetak('${x.id_petak || x.id}')">✏️ Edit</button>
                            <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.8rem;" onclick="window.aturTarget('${x.nomor_petak || x.kode}')">🎯 Target</button>
                            <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.8rem; border-color: var(--danger); color: var(--danger);" onclick="window.deletePetak('${x.id_petak || x.id}')">🗑️ Hapus</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('') : '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:20px;">Belum ada data Petak</td></tr>';
    }

    // ======================== PENYADAP CRUD ========================
    document.getElementById('btnTambahPenyadap')?.addEventListener('click', () => {
        document.getElementById('editPenyadapId').value = '';
        document.getElementById('inputNamaPenyadap').value = '';
        populateMandorSelect('inputMandorPenyadap');
        populatePetakSelect('inputPetakPenyadap');
        document.getElementById('inputPohonPenyadap').value = '';
        document.getElementById('inputLuasPenyadap').value = '';
        document.getElementById('inputStatusPenyadap').value = 'Aktif';
        document.getElementById('modalPenyadapTitle').textContent = 'Tambah Penyadap';
        openModal('modalPenyadap');
    });

    document.getElementById('btnSimpanPenyadap')?.addEventListener('click', () => {
        const id = document.getElementById('editPenyadapId').value;
        const nama = document.getElementById('inputNamaPenyadap').value.trim();
        const id_mandor = document.getElementById('inputMandorPenyadap').value;
        const id_petak = document.getElementById('inputPetakPenyadap').value;
        const pohon = parseInt(document.getElementById('inputPohonPenyadap').value) || 0;
        const luas = parseFloat(document.getElementById('inputLuasPenyadap').value) || 0;
        const status = document.getElementById('inputStatusPenyadap').value;

        if (!nama || !id_mandor || !id_petak || pohon <= 0) { showToast('Isi nama, mandor, petak, dan pohon garapan!', 'error'); return; }

        const petaks = getPetakList();
        const selPetak = petaks.find(p => p.id_petak === id_petak) || { nomor_petak: '' };

        let list = getPenyadapList();
        const penyadapId = id || 'p' + Date.now();
        const penyadapData = {
            id_penyadap: penyadapId,
            nama_penyadap: nama,
            id_mandor,
            id_petak,
            status,
            pohon,
            luas,
            target: 3600,
            periode1: 150,
            periode2: 150,
            id: penyadapId,
            nama,
            petak: selPetak.nomor_petak
        };

        if (id) {
            const idx = list.findIndex(x => x.id_penyadap === id || x.id === id);
            if (idx >= 0) list[idx] = penyadapData;
        } else {
            list.push(penyadapData);
        }

        lsSet(LS.PENYADAP, list);
        closeModal('modalPenyadap');
        renderPenyadapTable();
        showToast('Penyadap berhasil disimpan.');

        queueOfflineCrud({ action: 'savePenyadap', data: penyadapData });
        if (navigator.onLine) {
            syncOfflineCrud(() => {
                loadAllData(() => {
                    renderPenyadapTable();
                });
            });
        }
    });

    window.editPenyadap = function (id) {
        const list = getPenyadapList();
        const x = list.find(item => item.id_penyadap === id || item.id === id);
        if (!x) return;
        document.getElementById('editPenyadapId').value = x.id_penyadap || x.id;
        document.getElementById('inputNamaPenyadap').value = x.nama_penyadap || x.nama;
        populateMandorSelect('inputMandorPenyadap', x.id_mandor);
        populatePetakSelect('inputPetakPenyadap', x.id_petak);
        document.getElementById('inputPohonPenyadap').value = x.pohon || 800;
        document.getElementById('inputLuasPenyadap').value = x.luas || 2.5;
        document.getElementById('inputStatusPenyadap').value = x.status || 'Aktif';
        document.getElementById('modalPenyadapTitle').textContent = 'Edit Penyadap';
        openModal('modalPenyadap');
    };

    window.deletePenyadap = function (id) {
        if (!confirm('Hapus penyadap ini?')) return;
        let list = getPenyadapList().filter(x => x.id_penyadap !== id && x.id !== id);
        lsSet(LS.PENYADAP, list);
        renderPenyadapTable();
        showToast('Penyadap berhasil dihapus.', 'warning');

        queueOfflineCrud({ action: 'deletePenyadap', id: id });
        if (navigator.onLine) {
            syncOfflineCrud(() => {
                loadAllData(() => {
                    renderPenyadapTable();
                });
            });
        }
    };

    function renderPenyadapTable() {
        const list = getPenyadapList();
        const mandors = getMandorList();
        const petaks = getPetakList();
        const tbody = document.getElementById('penyadapTbody');
        if (!tbody) return;
        tbody.innerHTML = list.length ? list.map(x => {
            const mandor = mandors.find(m => m.id_mandor === x.id_mandor || m.id === x.id_mandor) || { nama_mandor: '-' };
            const petak = petaks.find(p => p.id_petak === x.id_petak || p.kode === x.petak) || { nomor_petak: x.petak || '-' };
            return `
                <tr>
                    <td><strong>${x.nama_penyadap || x.nama}</strong></td>
                    <td><code>${petak.nomor_petak}</code></td>
                    <td>${mandor.nama_mandor || mandor.nama}</td>
                    <td>
                        🌳 ${x.pohon || 0} ph | 📐 ${x.luas || 0} Ha
                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">Target: <strong>${(x.target || 0).toLocaleString('id')} kg/th</strong> | P1: ${x.periode1 || 0} kg | P2: ${x.periode2 || 0} kg</div>
                    </td>
                    <td><span class="status-badge-${(x.status || 'Aktif').toLowerCase()}">${x.status || 'Aktif'}</span></td>
                    <td style="text-align: center;">
                        <div class="action-btns" style="display:flex; gap:8px; justify-content: center;">
                            <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.8rem;" onclick="window.editPenyadap('${x.id_penyadap || x.id}')">✏️ Edit</button>
                            <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.8rem; border-color: var(--danger); color: var(--danger);" onclick="window.deletePenyadap('${x.id_penyadap || x.id}')">🗑️ Hapus</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('') : '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:20px;">Belum ada data penyadap</td></tr>';
    }

    // ======================== USER CRUD ========================
    document.getElementById('btnTambahUser')?.addEventListener('click', () => {
        document.getElementById('editUserId').value = '';
        document.getElementById('inputNamaUser').value = '';
        document.getElementById('inputUsernameUser').value = '';
        document.getElementById('inputPasswordUser').value = '';
        document.getElementById('inputRoleUser').value = 'KRPH / ASPER';
        document.getElementById('inputWilayahAksesUser').value = '';
        document.getElementById('inputStatusUser').value = 'Aktif';
        document.getElementById('modalUserTitle').textContent = 'Tambah User Baru';
        openModal('modalUser');
    });

    document.getElementById('btnSimpanUser')?.addEventListener('click', () => {
        const id = document.getElementById('editUserId').value;
        const nama = document.getElementById('inputNamaUser').value.trim();
        const username = document.getElementById('inputUsernameUser').value.trim();
        const password = document.getElementById('inputPasswordUser').value.trim();
        const role = document.getElementById('inputRoleUser').value;
        const wilayah_akses = document.getElementById('inputWilayahAksesUser').value.trim();
        const status = document.getElementById('inputStatusUser').value;

        if (!nama || !username || (!id && !password)) { showToast('Isi nama, username, and password!', 'error'); return; }

        let list = getUserList();
        const userId = id || 'u' + Date.now();

        let oldUser = list.find(x => x.id_user === id);
        let finalPassword = password || (oldUser ? oldUser.password : '123456');

        const userData = { id_user: userId, nama, username, password: finalPassword, role, wilayah_akses, status };

        if (id) {
            const idx = list.findIndex(x => x.id_user === id);
            if (idx >= 0) list[idx] = userData;
        } else {
            list.push(userData);
        }

        lsSet(LS.USER, list);
        closeModal('modalUser');
        renderUserTable();
        showToast('User berhasil disimpan.');

        queueOfflineCrud({ action: 'saveUser', data: userData });
        if (navigator.onLine) {
            syncOfflineCrud(() => {
                loadAllData(() => {
                    renderUserTable();
                });
            });
        }
    });

    window.editUser = function (id) {
        const list = getUserList();
        const x = list.find(item => item.id_user === id);
        if (!x) return;
        document.getElementById('editUserId').value = x.id_user;
        document.getElementById('inputNamaUser').value = x.nama;
        document.getElementById('inputUsernameUser').value = x.username;
        document.getElementById('inputPasswordUser').value = ''; // leave blank if unchanged
        document.getElementById('inputRoleUser').value = x.role;
        document.getElementById('inputWilayahAksesUser').value = x.wilayah_akses;
        document.getElementById('inputStatusUser').value = x.status;
        document.getElementById('modalUserTitle').textContent = 'Edit User';
        openModal('modalUser');
    };

    window.deleteUser = function (id) {
        if (!confirm('Hapus user ini?')) return;
        let list = getUserList().filter(x => x.id_user !== id);
        lsSet(LS.USER, list);
        renderUserTable();
        showToast('User berhasil dihapus.', 'warning');

        queueOfflineCrud({ action: 'deleteUser', id: id });
        if (navigator.onLine) {
            syncOfflineCrud(() => {
                loadAllData(() => {
                    renderUserTable();
                });
            });
        }
    };

    function renderUserTable() {
        const list = getUserList();
        const tbody = document.getElementById('userTbody');
        if (!tbody) return;
        tbody.innerHTML = list.length ? list.map(x => `
            <tr>
                <td><strong>${x.nama}</strong></td>
                <td><code>${x.username}</code></td>
                <td><span style="font-weight: 700; color: var(--primary);">${x.role}</span></td>
                <td>${x.wilayah_akses}</td>
                <td><span class="status-badge-${x.status.toLowerCase()}">${x.status}</span></td>
                <td style="text-align: center;">
                    <div class="action-btns" style="display:flex; gap:8px; justify-content: center;">
                        <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.8rem;" onclick="window.editUser('${x.id_user}')">✏️ Edit</button>
                        <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.8rem; border-color: var(--danger); color: var(--danger);" onclick="window.deleteUser('${x.id_user}')">🗑️ Hapus</button>
                    </div>
                </td>
            </tr>
        `).join('') : '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:20px;">Belum ada data user</td></tr>';
    }

    // ======================== TARGET SETTING ========================
    window.aturTarget = function (petakKode) {
        const targets = getTargetList();
        const bkphs = getBkphList();
        const rphs = getRphList();
        const tpgs = getTpgList();
        const petaks = getPetakList();

        const petak = petaks.find(p => p.nomor_petak === petakKode || p.kode === petakKode) || { id_tpg: 't1' };
        const tpg = tpgs.find(t => t.id_tpg === petak.id_tpg) || { id_rph: 'r1' };
        const rph = rphs.find(r => r.id_rph === tpg.id_rph) || { id_bkph: 'b1' };

        const thisYear = new Date().getFullYear();
        const target = targets.find(t => t.petak === petakKode && parseInt(t.tahun) === thisYear) || {
            id_target: '',
            petak: petakKode,
            tahun: thisYear,
            tahunan: 3600,
            periode1: 150,
            periode2: 150,
            id_bkph: rph.id_bkph,
            id_rph: tpg.id_rph,
            id_tpg: petak.id_tpg,
            target_ro: 3600,
            target_rkap: 0,
            target_rtt: 0
        };

        document.getElementById('targetPetakKode').value = petakKode;
        document.getElementById('editTargetId').value = target.id_target;
        document.getElementById('targetTahun').value = target.tahun;
        document.getElementById('targetTahunanTotal').value = target.tahunan;
        document.getElementById('targetRO').value = target.target_ro || target.tahunan;
        document.getElementById('targetRKAP').value = target.target_rkap || 0;
        document.getElementById('targetRTT').value = target.target_rtt || 0;

        initTargetCascadingSelects(target.id_bkph, target.id_rph, target.id_tpg);

        document.getElementById('modalTargetTitle').textContent = `Set Target Petak: ${petakKode}`;
        openModal('modalTarget');
    };

    document.getElementById('btnSimpanTarget')?.addEventListener('click', () => {
        const petak = document.getElementById('targetPetakKode').value;
        const id = document.getElementById('editTargetId').value;
        const bkph = document.getElementById('targetBKPHSelect').value;
        const rph = document.getElementById('targetRPHSelect').value;
        const tpg = document.getElementById('targetTPGSelect').value;
        const tahun = document.getElementById('targetTahun').value;
        const bulan = document.getElementById('targetBulan').value;
        const periode = document.getElementById('targetPeriode').value;
        const tahunan = parseFloat(document.getElementById('targetTahunanTotal').value) || 0;
        const target_ro = parseFloat(document.getElementById('targetRO').value) || 0;
        const target_rkap = parseFloat(document.getElementById('targetRKAP').value) || 0;
        const target_rtt = parseFloat(document.getElementById('targetRTT').value) || 0;

        if (!tpg || tahunan <= 0) { showToast('Isi target tahunan dan TPG Induk!', 'error'); return; }

        let targets = getTargetList();
        const targetId = id || 't-' + petak + '-' + tahun;
        const entry = {
            id_target: targetId,
            petak,
            tahun,
            bulan,
            periode,
            tahunan,
            periode1: Math.round(tahunan / 24), // target periode default
            periode2: Math.round(tahunan / 24),
            id_bkph: bkph,
            id_rph: rph,
            id_tpg: tpg,
            target_ro,
            target_rkap,
            target_rtt,
            status: 'Aktif'
        };

        const idx = targets.findIndex(t => t.id_target === targetId || (t.petak === petak && t.tahun === tahun));
        if (idx >= 0) targets[idx] = entry;
        else targets.push(entry);

        lsSet(LS.TARGET, targets);
        closeModal('modalTarget');
        renderWilayahTab();
        showToast('Target berhasil disimpan.');

        queueOfflineCrud({ action: 'saveTarget', data: entry });
        if (navigator.onLine) {
            syncOfflineCrud(() => {
                loadAllData(() => {
                    renderWilayahTab();
                });
            });
        }
    });

    // ======================== 6. MONITORING HARIAN ========================
    function renderMonitoringTab() {
        const dateEl = document.getElementById('monitoringDate');
        if (dateEl && !dateEl.value) dateEl.value = todayStr();

        const btnSimpanMon = document.getElementById('btnSimpanMonitoring');
        if (btnSimpanMon) btnSimpanMon.style.display = 'none';

        updateMonitoringCounts();
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

        const petakList = getPetakList();
        const penyadapList = getActivePenyadap();
        const mon = getMonitoringData();
        const dayData = mon[tgl] || {};

        if (!petakList.length) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);">Belum ada petak terdaftar. Silakan tambah petak di menu Kelola Mandor.</div>';
            return;
        }

        const statusOptions = ['Hadir', 'Sakit', 'Ke Pertanian', 'Hajatan', 'Bangunan', 'Lainnya'];
        const dateLabel = formatDateLong(tgl);

        let html = `<div style="margin-bottom:12px; font-size:0.9rem; color:var(--text-muted); font-weight:600;">📅 Monitoring: ${dateLabel}</div>`;

        petakList.forEach(petak => {
            const assigned = penyadapList.filter(p => p.petak === petak.kode);
            if (!assigned.length) return;

            html += `<div class="monitoring-petak-section">
                <div class="monitoring-petak-header">
                    <div class="monitoring-petak-title">📍 ${petak.kode}</div>
                    <div class="monitoring-petak-badge">${assigned.length} Penyadap</div>
                </div>
                <div class="monitoring-penyadap-list">`;

            assigned.forEach(p => {
                const saved = dayData[p.nama] || {};
                const status = saved.status || 'Hadir';
                const ket = saved.keterangan || '';

                const radios = statusOptions.map(s => {
                    const checked = status === s ? 'checked' : '';
                    const safeId = `mon_${tgl}_${p.nama.replace(/\s+/g, '_')}_${s.replace(/\s+/g, '_')}`;
                    return `<input type="radio" class="mon-status-radio" name="mon_${tgl}_${p.nama.replace(/\s+/g, '_')}" value="${s}" id="${safeId}" ${checked} disabled style="margin-right: 4px;">
                            <label class="mon-status-label" for="${safeId}" style="margin-right: 12px; font-size: 0.85rem; font-weight: 500;">${s}</label>`;
                }).join('');

                const showKet = (status !== 'Hadir') ? 'visible' : '';
                const rowClass = status === 'Hadir' ? 'hadir' : status === 'Sakit' ? 'sakit' : 'tidak-hadir';

                html += `<div class="monitoring-penyadap-row ${rowClass}" id="monrow_${tgl}_${p.nama.replace(/\s+/g, '_')}">
                    <div class="mon-penyadap-name">👤 ${p.nama}</div>
                    <div class="mon-status-select-group">${radios}</div>
                    <input type="text" class="mon-keterangan-input ${showKet}" id="monket_${tgl}_${p.nama.replace(/\s+/g, '_')}" placeholder="Keterangan..." value="${ket}" disabled style="font-size: 0.85rem; padding: 6px 12px; width: 100%;">
                </div>`;
            });

            html += '</div></div>';
        });

        container.innerHTML = html;
        updateMonitoringCounts();
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
            row.className = `monitoring-penyadap-row ${status === 'Hadir' ? 'hadir' : status === 'Sakit' ? 'sakit' : 'tidak-hadir'}`;
        }
        if (ketEl) {
            ketEl.classList.toggle('visible', status !== 'Hadir');
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
        // Data sudah auto-save saat user klik radio, ini hanya konfirmasi
        showToast(`✅ Data monitoring ${formatDateDMY(tgl)} berhasil disimpan!`, 'success');
        updateMonitoringCounts();
    }

    function updateMonitoringCounts() {
        const tgl = document.getElementById('monitoringDate')?.value;
        if (!tgl) return;
        const mon = getMonitoringData();
        const dayData = mon[tgl] || {};
        const allActive = getActivePenyadap();

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

    // ======================== 7. MAP VISUALIZER ========================
    const mapBlocks = document.querySelectorAll('.map-block');

    function renderMap(records) {
        const petakList = getPetakList();
        mapDataCache = [];

        // Map SVG blocks by index to the petakList from spreadsheet
        mapBlocks.forEach((el, index) => {
            const petak = petakList[index];
            if (!petak) {
                el.style.display = 'none'; // Sembunyikan blok jika tidak ada petak ke-n
                // Sembunyikan juga teksnya
                const textEl = document.querySelector(`.map-text:nth-of-type(${index + 1})`);
                if (textEl) textEl.style.display = 'none';
                return;
            }

            el.style.display = 'block';
            const b = petak.kode;
            el.setAttribute('data-block-id', b);

            // Update text inside SVG
            const textEl = document.querySelector(`.map-text:nth-of-type(${index + 1})`);
            if (textEl) {
                textEl.style.display = 'block';
                // Jika kode terlalu panjang, ambil 4 karakter pertama saja untuk label peta
                textEl.textContent = b.length > 7 ? b.substring(0, 5) + '..' : b;
            }

            const br = records.filter(r => r.petak && (r.petak === b || r.petak.startsWith(b + ' ') || r.petak.startsWith(b + '-')));

            const avg = br.length > 0 ? br.reduce((s, r) => s + r.estimasi_hasil, 0) / br.length : 0;
            const latest = br[0] || { tanggal: '-', nama_penyadap: 'Belum ada', kondisi_lapangan: 'Normal', kendala: 'Tidak ada' };
            const cond = latest.kondisi_lapangan;
            let status = 'hijau', statusText = 'Produksi Baik';

            if (br.length === 0) {
                status = ''; // Tetap hitam jika tidak ada data sama sekali
                statusText = 'Belum Ada Data';
            } else if (avg < 5 || cond === 'Pohon Rusak' || cond === 'Wadah Rusak') {
                status = 'merah'; statusText = 'Perlu Pengecekan';
            } else if (avg <= 15 || cond === 'Hujan') {
                status = 'kuning'; statusText = 'Produksi Menurun';
            }

            mapDataCache.push({
                petak: b,
                avg_produksi: +avg.toFixed(1),
                terakhir_update: latest.tanggal,
                penyadap_terakhir: latest.nama_penyadap,
                kondisi_terakhir: latest.kondisi_lapangan,
                kendala_terakhir: latest.kendala || 'Tidak ada',
                status,
                status_text: statusText
            });

            el.classList.remove('hijau', 'kuning', 'merah');
            if (status) el.classList.add(status);
        });

        const sel = document.querySelector('.map-block.selected');
        if (sel) showBlockDetails(sel.getAttribute('data-block-id'));
    }

    mapBlocks.forEach(block => {
        block.addEventListener('click', function () {
            mapBlocks.forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            showBlockDetails(this.getAttribute('data-block-id'));
        });
    });

    function showBlockDetails(blockId) {
        const info = mapDataCache.find(d => d.petak === blockId);
        if (!info) return;
        document.getElementById('detailEmptyState').style.display = 'none';
        document.getElementById('detailActiveState').style.display = 'block';
        document.getElementById('det-petak-name').textContent = info.petak;
        const badge = document.getElementById('det-status-badge');
        badge.textContent = info.status_text;
        badge.className = 'badge-status ' + info.status;
        document.getElementById('det-avg-prod').textContent = `${info.avg_produksi} kg`;
        document.getElementById('det-last-worker').textContent = info.penyadap_terakhir;
        document.getElementById('det-last-cond').textContent = info.kondisi_terakhir;
        document.getElementById('det-last-issue').textContent = info.kendala_terakhir;
        document.getElementById('det-last-update').textContent = formatDateDMY(info.terakhir_update);
    }

    // ======================== 8. TABEL LAPORAN ========================
    function getTransactionDetails(r) {
        const penyadaps = getPenyadapList();
        const petaks = getPetakList();
        const tpgs = getTpgList();
        const rphs = getRphList();
        const bkphs = getBkphList();
        const mandors = getMandorList();

        const penyadap = penyadaps.find(p => p.nama === r.nama_penyadap || p.nama_penyadap === r.nama_penyadap);
        const petakKode = r.petak || (penyadap ? penyadap.petak : '');
        const petak = petaks.find(p => p.nomor_petak === petakKode || p.kode === petakKode);

        let tpgId = petak ? petak.id_tpg : '';
        if (!tpgId && penyadap) {
            const mandor = mandors.find(m => m.id_mandor === penyadap.id_mandor || m.id === penyadap.id_mandor);
            if (mandor) tpgId = mandor.id_tpg;
        }
        const tpg = tpgs.find(t => t.id_tpg === tpgId);
        const rphId = tpg ? tpg.id_rph : '';
        const rph = rphs.find(r => r.id_rph === rphId);
        const bkphId = rph ? rph.id_bkph : '';
        const bkph = bkphs.find(b => b.id_bkph === bkphId);
        const mandorId = penyadap ? penyadap.id_mandor : '';
        const mandor = mandors.find(m => m.id_mandor === mandorId || m.id === mandorId);

        return {
            penyadap,
            petak,
            tpg,
            rph,
            bkph,
            mandor,
            id_bkph: bkphId,
            id_rph: rphId,
            id_tpg: tpgId,
            id_mandor: mandorId,
            id_penyadap: penyadap ? (penyadap.id_penyadap || penyadap.id) : ''
        };
    }

    function filterRecordsForReport(records) {
        const type = document.getElementById('reportType')?.value || 'harian';
        const bkphId = document.getElementById('reportBKPH')?.value || 'all';
        const rphId = document.getElementById('reportRPH')?.value || 'all';
        const tpgId = document.getElementById('reportTPG')?.value || 'all';
        const mandorId = document.getElementById('reportMandor')?.value || 'all';
        const penyadapId = document.getElementById('reportPenyadap')?.value || 'all';
        const tahun = document.getElementById('reportTahun')?.value || 'all';
        const bulan = document.getElementById('reportBulan')?.value || 'all';
        const periode = document.getElementById('reportPeriode')?.value || 'all';

        return records.filter(r => {
            const details = getTransactionDetails(r);

            // Regional Filters
            if (bkphId !== 'all' && details.id_bkph !== bkphId) return false;
            if (rphId !== 'all' && details.id_rph !== rphId) return false;
            if (tpgId !== 'all' && details.id_tpg !== tpgId) return false;
            if (mandorId !== 'all' && details.id_mandor !== mandorId) return false;
            if (penyadapId !== 'all' && details.id_penyadap !== penyadapId) return false;

            // Date Filters
            const d = new Date(r.tanggal);
            if (isNaN(d.getTime())) return false;

            if (tahun !== 'all' && d.getFullYear().toString() !== tahun) return false;
            if (bulan !== 'all' && (d.getMonth() + 1).toString() !== bulan) return false;

            if (periode !== 'all') {
                const day = d.getDate();
                const recordPeriod = day <= 15 ? '1' : '2';
                if (recordPeriod !== periode) return false;
            }

            return true;
        });
    }

    function renderReportTable(records) {
        const reportType = document.getElementById('reportType')?.value || 'harian';
        const tbody = document.querySelector('#reportsTable tbody');
        const thead = document.querySelector('#reportsTable thead');

        if (!tbody || !thead) return;

        const filtered = filterRecordsForReport(records);
        tbody.innerHTML = '';
        thead.innerHTML = '';
        tbody.dataset.reportType = reportType;

        if (reportType === 'harian') {
            thead.innerHTML = `
                <tr>
                    <th>Tanggal</th>
                    <th>Nama Penyadap</th>
                    <th>BKPH</th>
                    <th>RPH</th>
                    <th>TPG</th>
                    <th>Petak</th>
                    <th>Hasil (kg)</th>
                    <th>Kondisi</th>
                    <th>Kendala</th>
                </tr>
            `;

            if (!filtered.length) {
                tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--text-muted);padding:30px;">Tidak ditemukan data laporan harian yang cocok.</td></tr>';
                tbody.dataset.filteredJson = JSON.stringify([]);
                return;
            }

            filtered.forEach(item => {
                const details = getTransactionDetails(item);
                const tr = document.createElement('tr');
                let condBadge = `<span style="font-weight:700;color:#2d6a4f;">${item.kondisi_lapangan}</span>`;
                if (item.kondisi_lapangan === 'Hujan') condBadge = `<span style="font-weight:700;color:#f4a261;">${item.kondisi_lapangan}</span>`;
                else if (item.kondisi_lapangan === 'Pohon Rusak' || item.kondisi_lapangan === 'Wadah Rusak') condBadge = `<span style="font-weight:700;color:#e63946;">${item.kondisi_lapangan}</span>`;

                tr.innerHTML = `
                    <td><strong>${formatDateDMY(item.tanggal)}</strong></td>
                    <td>${item.nama_penyadap}</td>
                    <td>${details.bkph ? details.bkph.nama_bkph : '-'}</td>
                    <td>${details.rph ? details.rph.nama_rph : '-'}</td>
                    <td>${details.tpg ? details.tpg.nama_tpg : '-'}</td>
                    <td><code style="background:#edf2f7;padding:4px 8px;border-radius:4px;font-weight:600;">${item.petak}</code></td>
                    <td><strong>${item.estimasi_hasil.toFixed(1)} kg</strong></td>
                    <td>${condBadge}</td>
                    <td>${item.kendala ? `<span style="color:#d90429;font-weight:600;">${item.kendala}</span>` : '<span style="color:#718096;font-style:italic;">Tidak ada</span>'}</td>
                `;
                tbody.appendChild(tr);
            });

            tbody.dataset.filteredJson = JSON.stringify(filtered.map(item => {
                const d = getTransactionDetails(item);
                return {
                    Tanggal: formatDateDMY(item.tanggal),
                    Penyadap: item.nama_penyadap,
                    BKPH: d.bkph ? d.bkph.nama_bkph : '-',
                    RPH: d.rph ? d.rph.nama_rph : '-',
                    TPG: d.tpg ? d.tpg.nama_tpg : '-',
                    Petak: item.petak,
                    Hasil_kg: item.estimasi_hasil,
                    Kondisi: item.kondisi_lapangan,
                    Kendala: item.kendala || '-'
                };
            }));

        } else if (reportType === 'periode') {
            thead.innerHTML = `
                <tr>
                    <th>BKPH</th>
                    <th>RPH</th>
                    <th>TPG</th>
                    <th>Nama Penyadap</th>
                    <th>Tahun</th>
                    <th>Bulan</th>
                    <th>Periode</th>
                    <th>Total Realisasi (kg)</th>
                </tr>
            `;

            const agg = {};
            filtered.forEach(item => {
                const details = getTransactionDetails(item);
                const d = new Date(item.tanggal);
                const yr = d.getFullYear();
                const mo = d.getMonth() + 1;
                const pe = d.getDate() <= 15 ? 1 : 2;

                const key = `${details.id_bkph || 'b-all'}_${details.id_rph || 'r-all'}_${details.id_tpg || 't-all'}_${item.nama_penyadap}_${yr}_${mo}_${pe}`;
                if (!agg[key]) {
                    agg[key] = {
                        bkph: details.bkph ? details.bkph.nama_bkph : '-',
                        rph: details.rph ? details.rph.nama_rph : '-',
                        tpg: details.tpg ? details.tpg.nama_tpg : '-',
                        penyadap: item.nama_penyadap,
                        tahun: yr,
                        bulan: mo,
                        periode: pe,
                        total: 0
                    };
                }
                agg[key].total += item.estimasi_hasil;
            });

            const rows = Object.values(agg);

            if (!rows.length) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:30px;">Tidak ditemukan data rekap periode yang cocok.</td></tr>';
                tbody.dataset.filteredJson = JSON.stringify([]);
                return;
            }

            rows.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${item.bkph}</td>
                    <td>${item.rph}</td>
                    <td>${item.tpg}</td>
                    <td><strong>${item.penyadap}</strong></td>
                    <td>${item.tahun}</td>
                    <td>Bulan ${item.bulan}</td>
                    <td>Periode ${item.periode}</td>
                    <td><strong>${item.total.toFixed(1)} kg</strong></td>
                `;
                tbody.appendChild(tr);
            });

            tbody.dataset.filteredJson = JSON.stringify(rows.map(item => ({
                BKPH: item.bkph,
                RPH: item.rph,
                TPG: item.tpg,
                Penyadap: item.penyadap,
                Tahun: item.tahun,
                Bulan: 'Bulan ' + item.bulan,
                Periode: 'Periode ' + item.periode,
                Total_Realisasi_kg: item.total
            })));

        } else if (reportType === 'bulanan') {
            thead.innerHTML = `
                <tr>
                    <th>BKPH</th>
                    <th>RPH</th>
                    <th>TPG</th>
                    <th>Nama Penyadap</th>
                    <th>Tahun</th>
                    <th>Bulan</th>
                    <th>Total Realisasi (kg)</th>
                </tr>
            `;

            const agg = {};
            filtered.forEach(item => {
                const details = getTransactionDetails(item);
                const d = new Date(item.tanggal);
                const yr = d.getFullYear();
                const mo = d.getMonth() + 1;

                const key = `${details.id_bkph || 'b-all'}_${details.id_rph || 'r-all'}_${details.id_tpg || 't-all'}_${item.nama_penyadap}_${yr}_${mo}`;
                if (!agg[key]) {
                    agg[key] = {
                        bkph: details.bkph ? details.bkph.nama_bkph : '-',
                        rph: details.rph ? details.rph.nama_rph : '-',
                        tpg: details.tpg ? details.tpg.nama_tpg : '-',
                        penyadap: item.nama_penyadap,
                        tahun: yr,
                        bulan: mo,
                        total: 0
                    };
                }
                agg[key].total += item.estimasi_hasil;
            });

            const rows = Object.values(agg);

            if (!rows.length) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:30px;">Tidak ditemukan data rekap bulanan yang cocok.</td></tr>';
                tbody.dataset.filteredJson = JSON.stringify([]);
                return;
            }

            rows.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${item.bkph}</td>
                    <td>${item.rph}</td>
                    <td>${item.tpg}</td>
                    <td><strong>${item.penyadap}</strong></td>
                    <td>${item.tahun}</td>
                    <td>Bulan ${item.bulan}</td>
                    <td><strong>${item.total.toFixed(1)} kg</strong></td>
                `;
                tbody.appendChild(tr);
            });

            tbody.dataset.filteredJson = JSON.stringify(rows.map(item => ({
                BKPH: item.bkph,
                RPH: item.rph,
                TPG: item.tpg,
                Penyadap: item.penyadap,
                Tahun: item.tahun,
                Bulan: 'Bulan ' + item.bulan,
                Total_Realisasi_kg: item.total
            })));

        } else if (reportType === 'tahunan') {
            thead.innerHTML = `
                <tr>
                    <th>BKPH</th>
                    <th>RPH</th>
                    <th>TPG</th>
                    <th>Nama Penyadap</th>
                    <th>Tahun</th>
                    <th>Total Realisasi (kg)</th>
                </tr>
            `;

            const agg = {};
            filtered.forEach(item => {
                const details = getTransactionDetails(item);
                const d = new Date(item.tanggal);
                const yr = d.getFullYear();

                const key = `${details.id_bkph || 'b-all'}_${details.id_rph || 'r-all'}_${details.id_tpg || 't-all'}_${item.nama_penyadap}_${yr}`;
                if (!agg[key]) {
                    agg[key] = {
                        bkph: details.bkph ? details.bkph.nama_bkph : '-',
                        rph: details.rph ? details.rph.nama_rph : '-',
                        tpg: details.tpg ? details.tpg.nama_tpg : '-',
                        penyadap: item.nama_penyadap,
                        tahun: yr,
                        total: 0
                    };
                }
                agg[key].total += item.estimasi_hasil;
            });

            const rows = Object.values(agg);

            if (!rows.length) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:30px;">Tidak ditemukan data rekap tahunan yang cocok.</td></tr>';
                tbody.dataset.filteredJson = JSON.stringify([]);
                return;
            }

            rows.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${item.bkph}</td>
                    <td>${item.rph}</td>
                    <td>${item.tpg}</td>
                    <td><strong>${item.penyadap}</strong></td>
                    <td>${item.tahun}</td>
                    <td><strong>${item.total.toFixed(1)} kg</strong></td>
                `;
                tbody.appendChild(tr);
            });

            tbody.dataset.filteredJson = JSON.stringify(rows.map(item => ({
                BKPH: item.bkph,
                RPH: item.rph,
                TPG: item.tpg,
                Penyadap: item.penyadap,
                Tahun: item.tahun,
                Total_Realisasi_kg: item.total
            })));

        } else if (reportType === 'target_vs_realisasi') {
            thead.innerHTML = `
                <tr>
                    <th>BKPH</th>
                    <th>RPH</th>
                    <th>TPG</th>
                    <th>Tahun</th>
                    <th>Bulan</th>
                    <th>Periode</th>
                    <th>Target (kg)</th>
                    <th>Realisasi (kg)</th>
                    <th>Selisih (kg)</th>
                    <th>Capaian</th>
                </tr>
            `;

            const targets = getTargetList();
            const tpgs = getTpgList();
            const rphs = getRphList();
            const bkphs = getBkphList();

            const agg = {};

            targets.forEach(t => {
                const bkph = bkphs.find(b => b.id_bkph === t.id_bkph) || { nama_bkph: '-' };
                const rph = rphs.find(r => r.id_rph === t.id_rph) || { nama_rph: '-' };
                const tpg = tpgs.find(g => g.id_tpg === t.id_tpg) || { nama_tpg: '-' };

                const key = `${t.id_tpg}_${t.tahun}_${t.bulan || 1}_${t.periode || 1}`;
                agg[key] = {
                    id_tpg: t.id_tpg,
                    bkph: bkph.nama_bkph,
                    rph: rph.nama_rph,
                    tpg: tpg.nama_tpg,
                    tahun: parseInt(t.tahun),
                    bulan: parseInt(t.bulan || 1),
                    periode: parseInt(t.periode || 1),
                    target: parseFloat(t.target_ro || t.tahunan || 0),
                    realisasi: 0
                };
            });

            filtered.forEach(item => {
                const details = getTransactionDetails(item);
                const d = new Date(item.tanggal);
                const yr = d.getFullYear();
                const mo = d.getMonth() + 1;
                const pe = d.getDate() <= 15 ? 1 : 2;

                const key = `${details.id_tpg}_${yr}_${mo}_${pe}`;
                if (agg[key]) {
                    agg[key].realisasi += item.estimasi_hasil;
                } else if (details.id_tpg) {
                    agg[key] = {
                        id_tpg: details.id_tpg,
                        bkph: details.bkph ? details.bkph.nama_bkph : '-',
                        rph: details.rph ? details.rph.nama_rph : '-',
                        tpg: details.tpg ? details.tpg.nama_tpg : '-',
                        tahun: yr,
                        bulan: mo,
                        periode: pe,
                        target: 0,
                        realisasi: item.estimasi_hasil
                    };
                }
            });

            const rows = Object.values(agg).filter(r => {
                const fTahun = document.getElementById('reportTahun')?.value || 'all';
                const fBulan = document.getElementById('reportBulan')?.value || 'all';
                const fPeriode = document.getElementById('reportPeriode')?.value || 'all';
                const fBkph = document.getElementById('reportBKPH')?.value || 'all';
                const fRph = document.getElementById('reportRPH')?.value || 'all';
                const fTpg = document.getElementById('reportTPG')?.value || 'all';

                if (fTahun !== 'all' && r.tahun.toString() !== fTahun) return false;
                if (fBulan !== 'all' && r.bulan.toString() !== fBulan) return false;
                if (fPeriode !== 'all' && r.periode.toString() !== fPeriode) return false;

                if (fBkph !== 'all') {
                    const matchedTpg = getTpgList().find(t => t.id_tpg === r.id_tpg);
                    const matchedRph = matchedTpg ? getRphList().find(h => h.id_rph === matchedTpg.id_rph) : null;
                    if (!matchedRph || matchedRph.id_bkph !== fBkph) return false;
                }
                if (fRph !== 'all') {
                    const matchedTpg = getTpgList().find(t => t.id_tpg === r.id_tpg);
                    if (!matchedTpg || matchedTpg.id_rph !== fRph) return false;
                }
                if (fTpg !== 'all' && r.id_tpg !== fTpg) return false;

                return true;
            });

            if (!rows.length) {
                tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:var(--text-muted);padding:30px;">Tidak ditemukan data target vs realisasi yang cocok.</td></tr>';
                tbody.dataset.filteredJson = JSON.stringify([]);
                return;
            }

            rows.forEach(item => {
                const diff = item.realisasi - item.target;
                const pct = item.target > 0 ? (item.realisasi / item.target * 100) : 0;

                let pctBadge = '';
                if (pct >= 90) pctBadge = `<span class="badge-status hijau" style="display:inline;">${pct.toFixed(1)}%</span>`;
                else if (pct >= 60) pctBadge = `<span class="badge-status kuning" style="display:inline;">${pct.toFixed(1)}%</span>`;
                else pctBadge = `<span class="badge-status merah" style="display:inline;">${pct.toFixed(1)}%</span>`;

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${item.bkph}</td>
                    <td>${item.rph}</td>
                    <td><strong>${item.tpg}</strong></td>
                    <td>${item.tahun}</td>
                    <td>Bulan ${item.bulan}</td>
                    <td>P${item.periode}</td>
                    <td><strong>${item.target.toLocaleString('id-ID')} kg</strong></td>
                    <td><strong>${item.realisasi.toLocaleString('id-ID')} kg</strong></td>
                    <td style="color: ${diff >= 0 ? 'green' : 'red'}; font-weight: 700;">
                        ${diff >= 0 ? '+' : ''}${diff.toLocaleString('id-ID')} kg
                    </td>
                    <td>${pctBadge}</td>
                `;
                tbody.appendChild(tr);
            });

            tbody.dataset.filteredJson = JSON.stringify(rows.map(item => ({
                BKPH: item.bkph,
                RPH: item.rph,
                TPG: item.tpg,
                Tahun: item.tahun,
                Bulan: 'Bulan ' + item.bulan,
                Periode: 'Periode ' + item.periode,
                Target_kg: item.target,
                Realisasi_kg: item.realisasi,
                Selisih_kg: item.realisasi - item.target,
                Capaian_Persen: (item.target > 0 ? (item.realisasi / item.target * 100).toFixed(2) : '0.00') + '%'
            })));
        }
    }

    document.getElementById('btnFilterApply')?.addEventListener('click', () => renderReportTable(globalRecords));

    // ======================== 9. EXPORT & PRINT ========================
    document.getElementById('btnExportCSV')?.addEventListener('click', () => {
        const tbody = document.querySelector('#reportsTable tbody');
        const reportType = tbody?.dataset.reportType || 'harian';
        const data = JSON.parse(tbody?.dataset.filteredJson || '[]');
        if (!data.length) { showToast('Tidak ada data untuk diekspor.', 'warning'); return; }

        try {
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(data);
            XLSX.utils.book_append_sheet(wb, ws, "Laporan " + reportType.toUpperCase());
            XLSX.writeFile(wb, `laporan_${reportType}_${todayStr()}.xlsx`);
            showToast('Laporan Excel berhasil diunduh!');
        } catch (err) {
            showToast('Gagal ekspor Excel: ' + err.message, 'error');
        }
    });

    // ======================== AUTHENTICATION & ROLE ACCESS ========================
    function checkAuth() {
        const user = lsGet(LS.AUTH_USER);
        const loginOverlay = document.getElementById('loginOverlay');
        if (!user) {
            if (loginOverlay) loginOverlay.style.display = 'flex';
            tabContents.forEach(tc => tc.classList.remove('active'));
            if (sidebar) sidebar.style.display = 'none';
            return null;
        } else {
            if (loginOverlay) loginOverlay.style.display = 'none';
            if (sidebar) sidebar.style.display = 'flex';
            applyRoleAccess(user);
            return user;
        }
    }

    function applyRoleAccess(user) {
        const role = user.role;
        const profileName = document.querySelector('.user-profile span:first-child');
        const profileRole = document.querySelector('.user-profile span:last-child');
        const avatar = document.querySelector('.user-profile .avatar');
        if (profileName) profileName.textContent = user.nama;
        if (profileRole) profileRole.textContent = user.role + (user.wilayah_akses && user.wilayah_akses !== 'ALL' ? ` (${user.wilayah_akses})` : '');
        if (avatar) avatar.textContent = user.nama ? user.nama.substring(0, 3).toUpperCase() : 'USR';

        menuItems.forEach(item => {
            const tab = item.getAttribute('data-tab');
            if (!tab) return;

            if (role === 'Admin BKPH') {
                item.style.display = 'block';
            } else if (role === 'KRPH / ASPER') {
                if (['wilayah', 'mandor', 'penyadap', 'user', 'import-excel'].includes(tab)) {
                    item.style.display = 'none';
                } else {
                    item.style.display = 'block';
                }
            } else if (role === 'Pimpinan') {
                if (['wilayah', 'mandor', 'penyadap', 'user', 'import-excel', 'monitoring'].includes(tab)) {
                    item.style.display = 'none';
                } else {
                    item.style.display = 'block';
                }
            }
        });

        const activeItem = document.querySelector('.sidebar-menu li.active');
        if (activeItem) {
            const activeTab = activeItem.getAttribute('data-tab');
            const targetMenuItem = document.querySelector(`.sidebar-menu li[data-tab="${activeTab}"]`);
            if (targetMenuItem && targetMenuItem.style.display === 'none') {
                menuItems.forEach(li => li.classList.remove('active'));
                const dbItem = document.querySelector('.sidebar-menu li[data-tab="dashboard"]');
                if (dbItem) dbItem.classList.add('active');
                tabContents.forEach(tc => tc.classList.remove('active'));
                document.getElementById('tab-dashboard')?.classList.add('active');
                updatePageHeader('dashboard');
                renderTabView('dashboard');
            }
        }
    }

    function handleLoginSubmit() {
        const usernameEl = document.getElementById('loginUsername');
        const passwordEl = document.getElementById('loginPassword');
        if (!usernameEl || !passwordEl) return;

        const username = usernameEl.value.trim();
        const password = passwordEl.value.trim();

        const users = getUserList();
        const found = users.find(u => u.username === username && u.password === password && u.status === 'Aktif');

        if (found) {
            lsSet(LS.AUTH_USER, found);
            showToast('Login berhasil! Selamat datang, ' + found.nama);
            checkAuth();
            triggerInitialLoad();
            usernameEl.value = '';
            passwordEl.value = '';
        } else {
            showToast('Username atau password salah / akun nonaktif!', 'error');
        }
    }

    document.getElementById('loginForm')?.addEventListener('submit', function (e) {
        e.preventDefault();
        handleLoginSubmit();
    });

    document.getElementById('btnLogoutAtasan')?.addEventListener('click', function (e) {
        e.preventDefault();
        localStorage.removeItem(LS.AUTH_USER);
        showToast('Anda telah logout.', 'warning');
        setTimeout(() => {
            window.location.reload();
        }, 800);
    });

    // ======================== SHEETJS EXCEL IMPORTER ========================
    let importedData = [];
    let importType = '';

    const excelDropZone = document.getElementById('excelDropZone');
    const excelFileInput = document.getElementById('excelFileInput');
    const importTemplateSelect = document.getElementById('importTemplateSelect');
    const excelPreviewArea = document.getElementById('excelPreviewArea');
    const btnCancelImport = document.getElementById('btnCancelImport');
    const btnConfirmImport = document.getElementById('btnConfirmImport');

    if (excelDropZone) {
        excelDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            excelDropZone.classList.add('dragover');
        });
        excelDropZone.addEventListener('dragleave', () => {
            excelDropZone.classList.remove('dragover');
        });
        excelDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            excelDropZone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length) handleExcelFile(files[0]);
        });
        excelDropZone.addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A') {
                excelFileInput.click();
            }
        });
    }

    if (excelFileInput) {
        excelFileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files.length) handleExcelFile(files[0]);
        });
    }

    if (btnCancelImport) {
        btnCancelImport.addEventListener('click', () => {
            resetExcelImport();
        });
    }

    if (btnConfirmImport) {
        btnConfirmImport.addEventListener('click', () => {
            processExcelImport();
        });
    }

    function resetExcelImport() {
        if (excelFileInput) excelFileInput.value = '';
        if (excelPreviewArea) excelPreviewArea.style.display = 'none';
        if (btnConfirmImport) btnConfirmImport.disabled = true;
        importedData = [];
        importType = '';
    }

    function handleExcelFile(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

                importType = importTemplateSelect ? importTemplateSelect.value : 'penyadap';
                previewAndValidateExcelData(jsonData, importType);
            } catch (err) {
                showToast("Gagal membaca file Excel: " + err.message, "error");
            }
        };
        reader.readAsArrayBuffer(file);
    }

    function previewAndValidateExcelData(jsonData, type) {
        if (!jsonData || !jsonData.length) {
            showToast("File Excel kosong atau tidak terbaca!", "error");
            return;
        }

        const thead = document.getElementById('excelPreviewThead');
        const tbody = document.getElementById('excelPreviewTbody');
        const statusEl = document.getElementById('excelValidationStatus');

        if (!thead || !tbody) return;
        thead.innerHTML = '';
        tbody.innerHTML = '';

        let columns = [];
        let validationErrors = 0;
        let processedRows = [];

        const mandors = getMandorList();
        const petaks = getPetakList();
        const tpgs = getTpgList();
        const rphs = getRphList();
        const bkphs = getBkphList();

        const getRowVal = (row, possibleKeys) => {
            for (const key of Object.keys(row)) {
                const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                for (const pk of possibleKeys) {
                    if (cleanKey === pk.toLowerCase().replace(/[^a-z0-9]/g, '')) {
                        return row[key];
                    }
                }
            }
            return '';
        };

        if (type === 'penyadap') {
            columns = ['Nama Penyadap', 'Petak (Kode)', 'Mandor (Nama)', 'Pohon Garapan', 'Luas Garapan (Ha)', 'Status', 'Validasi'];
            thead.innerHTML = `<tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr>`;

            jsonData.forEach(row => {
                const nama = getRowVal(row, ['Nama Penyadap', 'nama', 'penyadap']);
                const petakKode = getRowVal(row, ['Petak', 'Kode Petak', 'petak']);
                const mandorNama = getRowVal(row, ['Mandor', 'Nama Mandor', 'mandor']);
                const pohon = parseInt(getRowVal(row, ['Pohon Garapan', 'pohon', 'jumlah pohon'])) || 0;
                const luas = parseFloat(getRowVal(row, ['Luas Garapan', 'luas', 'luas garapan'])) || 0;
                const status = getRowVal(row, ['Status', 'status']) || 'Aktif';

                let errors = [];
                if (!nama) errors.push("Nama penyadap kosong");

                const matchedPetak = petaks.find(p => p.nomor_petak === petakKode || p.kode === petakKode);
                if (!petakKode) errors.push("Petak kosong");
                else if (!matchedPetak) errors.push(`Petak "${petakKode}" tidak terdaftar`);

                const matchedMandor = mandors.find(m => (m.nama_mandor || m.nama).toLowerCase() === mandorNama.toString().toLowerCase());
                if (!mandorNama) errors.push("Mandor kosong");
                else if (!matchedMandor) errors.push(`Mandor "${mandorNama}" tidak terdaftar`);

                if (pohon <= 0) errors.push("Pohon garapan harus > 0");

                const isValid = errors.length === 0;
                if (!isValid) validationErrors++;

                processedRows.push({
                    valid: isValid,
                    data: {
                        nama_penyadap: nama,
                        id_petak: matchedPetak ? matchedPetak.id_petak : '',
                        petak_kode: petakKode,
                        id_mandor: matchedMandor ? (matchedMandor.id_mandor || matchedMandor.id) : '',
                        pohon,
                        luas,
                        status: status.trim() === 'Nonaktif' ? 'Nonaktif' : 'Aktif'
                    }
                });

                tbody.innerHTML += `
                    <tr class="${isValid ? '' : 'invalid-row'}" style="${isValid ? '' : 'background-color: #ffebee;'}">
                        <td><strong>${nama || '-'}</strong></td>
                        <td><code>${petakKode || '-'}</code></td>
                        <td>${mandorNama || '-'}</td>
                        <td>${pohon} pohon</td>
                        <td>${luas} Ha</td>
                        <td><span class="status-badge-${status.toLowerCase().trim()}">${status}</span></td>
                        <td style="color: ${isValid ? 'green' : 'red'}; font-weight: 600;">
                            ${isValid ? '✅ OK' : '❌ ' + errors.join(', ')}
                        </td>
                    </tr>
                `;
            });

        } else if (type === 'petak') {
            columns = ['Kode Petak', 'Anak Petak', 'Luas (Ha)', 'Jumlah Pohon', 'Nama TPG', 'Status', 'Validasi'];
            thead.innerHTML = `<tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr>`;

            jsonData.forEach(row => {
                const kode = getRowVal(row, ['Kode Petak', 'kode', 'petak']);
                const anak = getRowVal(row, ['Anak Petak', 'anak']);
                const luas = parseFloat(getRowVal(row, ['Luas', 'Luas Lahan', 'luas'])) || 0;
                const pohon = parseInt(getRowVal(row, ['Jumlah Pohon', 'pohon', 'total pohon'])) || 0;
                const tpgNama = getRowVal(row, ['Nama TPG', 'tpg']);
                const status = getRowVal(row, ['Status', 'status']) || 'Aktif';

                let errors = [];
                if (!kode) errors.push("Kode petak kosong");
                if (luas <= 0) errors.push("Luas harus > 0");
                if (pohon <= 0) errors.push("Pohon harus > 0");

                const matchedTpg = tpgs.find(t => t.nama_tpg.toLowerCase() === tpgNama.toString().toLowerCase());
                if (!tpgNama) errors.push("TPG kosong");
                else if (!matchedTpg) errors.push(`TPG "${tpgNama}" tidak terdaftar`);

                const isValid = errors.length === 0;
                if (!isValid) validationErrors++;

                processedRows.push({
                    valid: isValid,
                    data: {
                        nomor_petak: kode,
                        anak_petak: anak,
                        luas,
                        pohon,
                        id_tpg: matchedTpg ? matchedTpg.id_tpg : '',
                        status: status.trim() === 'Nonaktif' ? 'Nonaktif' : 'Aktif'
                    }
                });

                tbody.innerHTML += `
                    <tr class="${isValid ? '' : 'invalid-row'}" style="${isValid ? '' : 'background-color: #ffebee;'}">
                        <td><code>${kode || '-'}</code></td>
                        <td>${anak || '-'}</td>
                        <td>${luas} Ha</td>
                        <td>${pohon} pohon</td>
                        <td>${tpgNama || '-'}</td>
                        <td><span class="status-badge-${status.toLowerCase().trim()}">${status}</span></td>
                        <td style="color: ${isValid ? 'green' : 'red'}; font-weight: 600;">
                            ${isValid ? '✅ OK' : '❌ ' + errors.join(', ')}
                        </td>
                    </tr>
                `;
            });

        } else if (type === 'target') {
            columns = ['Tahun', 'Bulan', 'Periode', 'BKPH', 'RPH', 'TPG', 'Target (kg)', 'Target RO', 'Target RKAP', 'Target RTT', 'Validasi'];
            thead.innerHTML = `<tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr>`;

            jsonData.forEach(row => {
                const tahun = parseInt(getRowVal(row, ['Tahun', 'tahun'])) || new Date().getFullYear();
                const bulan = parseInt(getRowVal(row, ['Bulan', 'bulan'])) || (new Date().getMonth() + 1);
                const periode = parseInt(getRowVal(row, ['Periode', 'periode'])) || 1;
                const bkphNama = getRowVal(row, ['BKPH', 'Nama BKPH', 'bkph']);
                const rphNama = getRowVal(row, ['RPH', 'Nama RPH', 'rph']);
                const tpgNama = getRowVal(row, ['TPG', 'Nama TPG', 'tpg']);
                const tahunan = parseFloat(getRowVal(row, ['Target', 'Target Per TPG (kg)', 'Target Per TPG'])) || 0;
                const target_ro = parseFloat(getRowVal(row, ['Target RO (kg)', 'Target RO', 'ro'])) || tahunan;
                const target_rkap = parseFloat(getRowVal(row, ['Target RKAP (kg)', 'Target RKAP', 'rkap'])) || 0;
                const target_rtt = parseFloat(getRowVal(row, ['Target RTT (kg)', 'Target RTT', 'rtt'])) || 0;

                let errors = [];
                if (tahun < 2020 || tahun > 2030) errors.push("Tahun tidak valid (2020-2030)");
                if (bulan < 1 || bulan > 12) errors.push("Bulan tidak valid (1-12)");
                if (periode !== 1 && periode !== 2) errors.push("Periode harus 1 atau 2");
                if (tahunan <= 0) errors.push("Target harus > 0");

                const matchedBkph = bkphs.find(b => b.nama_bkph.toLowerCase().includes(bkphNama.toString().toLowerCase()));
                const matchedRph = rphs.find(r => r.nama_rph.toLowerCase().includes(rphNama.toString().toLowerCase()));
                const matchedTpg = tpgs.find(t => t.nama_tpg.toLowerCase().includes(tpgNama.toString().toLowerCase()));

                if (!bkphNama) errors.push("BKPH kosong");
                else if (!matchedBkph) errors.push(`BKPH "${bkphNama}" tidak terdaftar`);

                if (!rphNama) errors.push("RPH kosong");
                else if (!matchedRph) errors.push(`RPH "${rphNama}" tidak terdaftar`);

                if (!tpgNama) errors.push("TPG kosong");
                else if (!matchedTpg) errors.push(`TPG "${tpgNama}" tidak terdaftar`);

                const isValid = errors.length === 0;
                if (!isValid) validationErrors++;

                processedRows.push({
                    valid: isValid,
                    data: {
                        tahun,
                        bulan,
                        periode,
                        tahunan,
                        target_ro,
                        target_rkap,
                        target_rtt,
                        id_bkph: matchedBkph ? matchedBkph.id_bkph : '',
                        id_rph: matchedRph ? matchedRph.id_rph : '',
                        id_tpg: matchedTpg ? matchedTpg.id_tpg : '',
                        status: 'Aktif'
                    }
                });

                tbody.innerHTML += `
                    <tr class="${isValid ? '' : 'invalid-row'}" style="${isValid ? '' : 'background-color: #ffebee;'}">
                        <td>${tahun}</td>
                        <td>Bulan ${bulan}</td>
                        <td>P${periode}</td>
                        <td>${bkphNama || '-'}</td>
                        <td>${rphNama || '-'}</td>
                        <td>${tpgNama || '-'}</td>
                        <td><strong>${tahunan} kg</strong></td>
                        <td>${target_ro} kg</td>
                        <td>${target_rkap} kg</td>
                        <td>${target_rtt} kg</td>
                        <td style="color: ${isValid ? 'green' : 'red'}; font-weight: 600;">
                            ${isValid ? '✅ OK' : '❌ ' + errors.join(', ')}
                        </td>
                    </tr>
                `;
            });

        } else if (type === 'user') {
            columns = ['Nama Lengkap', 'Username', 'Password', 'Role', 'Wilayah Akses', 'Status', 'Validasi'];
            thead.innerHTML = `<tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr>`;

            jsonData.forEach(row => {
                const nama = getRowVal(row, ['Nama Lengkap', 'nama']);
                const username = getRowVal(row, ['Username', 'username']);
                const password = getRowVal(row, ['Password', 'password']);
                const role = getRowVal(row, ['Role', 'role']);
                const wilayah = getRowVal(row, ['Wilayah Akses', 'wilayah akses', 'wilayah']) || 'ALL';
                const status = getRowVal(row, ['Status', 'status']) || 'Aktif';

                let errors = [];
                if (!nama) errors.push("Nama lengkap kosong");
                if (!username) errors.push("Username kosong");
                if (!password) errors.push("Password kosong");
                if (!['Admin BKPH', 'KRPH / ASPER', 'Pimpinan'].includes(role)) errors.push("Role harus 'Admin BKPH', 'KRPH / ASPER', atau 'Pimpinan'");

                const isValid = errors.length === 0;
                if (!isValid) validationErrors++;

                processedRows.push({
                    valid: isValid,
                    data: {
                        nama,
                        username,
                        password,
                        role,
                        wilayah_akses: wilayah,
                        status: status.trim() === 'Nonaktif' ? 'Nonaktif' : 'Aktif'
                    }
                });

                tbody.innerHTML += `
                    <tr class="${isValid ? '' : 'invalid-row'}" style="${isValid ? '' : 'background-color: #ffebee;'}">
                        <td><strong>${nama || '-'}</strong></td>
                        <td><code>${username || '-'}</code></td>
                        <td>••••••</td>
                        <td>${role || '-'}</td>
                        <td>${wilayah}</td>
                        <td><span class="status-badge-${status.toLowerCase().trim()}">${status}</span></td>
                        <td style="color: ${isValid ? 'green' : 'red'}; font-weight: 600;">
                            ${isValid ? '✅ OK' : '❌ ' + errors.join(', ')}
                        </td>
                    </tr>
                `;
            });
        }

        if (statusEl) {
            if (validationErrors > 0) {
                statusEl.innerHTML = `<span style="color: red; font-weight: 800;">⚠️ Terdapat ${validationErrors} baris data tidak valid. Perbaiki data sebelum impor.</span>`;
                btnConfirmImport.disabled = true;
            } else {
                statusEl.innerHTML = `<span style="color: green; font-weight: 800;">✓ Semua ${jsonData.length} baris data valid. Siap diimpor!</span>`;
                btnConfirmImport.disabled = false;
            }
        }

        excelPreviewArea.style.display = 'block';
        importedData = processedRows;
    }

    function processExcelImport() {
        if (!importedData || !importedData.length) return;

        const type = importType;
        const validRows = importedData.filter(r => r.valid).map(r => r.data);

        if (!validRows.length) {
            showToast("Tidak ada data valid yang dapat diimpor!", "error");
            return;
        }

        if (type === 'penyadap') {
            let list = getPenyadapList();
            validRows.forEach(row => {
                const id = 'p' + Date.now() + Math.floor(Math.random() * 1000);
                const matchedPetak = getPetakList().find(p => p.id_petak === row.id_petak);
                const entry = {
                    id_penyadap: id,
                    nama_penyadap: row.nama_penyadap,
                    id_mandor: row.id_mandor,
                    id_petak: row.id_petak,
                    status: row.status,
                    pohon: row.pohon,
                    luas: row.luas,
                    target: 3600,
                    periode1: 150,
                    periode2: 150,
                    id: id,
                    nama: row.nama_penyadap,
                    petak: matchedPetak ? matchedPetak.nomor_petak : row.petak_kode
                };
                list.push(entry);

                queueOfflineCrud({ action: 'savePenyadap', data: entry });
            });
            lsSet(LS.PENYADAP, list);
            renderPenyadapTable();

        } else if (type === 'petak') {
            let list = getPetakList();
            validRows.forEach(row => {
                const id = 'b' + Date.now() + Math.floor(Math.random() * 1000);
                const entry = {
                    id_petak: id,
                    nomor_petak: row.nomor_petak,
                    anak_petak: row.anak_petak,
                    luas: row.luas,
                    id_tpg: row.id_tpg,
                    pohon: row.pohon,
                    status: row.status,
                    id: id,
                    kode: row.nomor_petak
                };
                list.push(entry);

                queueOfflineCrud({ action: 'savePetak', data: entry });
            });
            lsSet(LS.PETAK, list);
            renderPetakListTable();

        } else if (type === 'target') {
            let list = getTargetList();
            validRows.forEach(row => {
                const id = 't-' + row.id_tpg + '-' + row.tahun + '-' + row.bulan + '-' + row.periode;
                const entry = {
                    id_target: id,
                    petak: '',
                    tahun: row.tahun.toString(),
                    bulan: row.bulan.toString(),
                    periode: row.periode.toString(),
                    tahunan: row.tahunan,
                    periode1: Math.round(row.tahunan / 24),
                    periode2: Math.round(row.tahunan / 24),
                    id_bkph: row.id_bkph,
                    id_rph: row.id_rph,
                    id_tpg: row.id_tpg,
                    target_ro: row.target_ro,
                    target_rkap: row.target_rkap,
                    target_rtt: row.target_rtt,
                    status: 'Aktif'
                };
                const idx = list.findIndex(t => t.id_target === id);
                if (idx >= 0) list[idx] = entry;
                else list.push(entry);

                queueOfflineCrud({ action: 'saveTarget', data: entry });
            });
            lsSet(LS.TARGET, list);

        } else if (type === 'user') {
            let list = getUserList();
            validRows.forEach(row => {
                const id = 'u' + Date.now() + Math.floor(Math.random() * 1000);
                const entry = {
                    id_user: id,
                    nama: row.nama,
                    username: row.username,
                    password: row.password,
                    role: row.role,
                    wilayah_akses: row.wilayah_akses,
                    status: row.status
                };
                list.push(entry);

                queueOfflineCrud({ action: 'saveUser', data: entry });
            });
            lsSet(LS.USER, list);
            renderUserTable();
        }

        showToast(`Impor massal ${validRows.length} data ${type} berhasil!`);
        resetExcelImport();

        if (WEB_APP_URL && navigator.onLine) {
            syncOfflineCrud(() => {
                loadAllData(records => {
                    const activeItem = document.querySelector('.sidebar-menu li.active');
                    const activeTab = activeItem ? activeItem.getAttribute('data-tab') : 'dashboard';
                    renderTabView(activeTab);
                });
            });
        }
    }

    document.getElementById('btnDownloadTemplate')?.addEventListener('click', (e) => {
        e.preventDefault();
        const type = importTemplateSelect ? importTemplateSelect.value : 'penyadap';
        downloadExcelTemplate(type);
    });

    function downloadExcelTemplate(type) {
        let headers = [];
        let sampleData = [];
        let filename = '';

        if (type === 'penyadap') {
            headers = ['Nama Penyadap', 'Petak (Kode)', 'Mandor (Nama)', 'Pohon Garapan', 'Luas Garapan (Ha)', 'Status'];
            sampleData = [
                ['Slamet Supriadi', 'P.01', 'Mandor Wawan', 800, 2.5, 'Aktif'],
                ['Budi Santoso', 'P.02', 'Mandor Budi', 1000, 3.0, 'Aktif']
            ];
            filename = 'template_master_penyadap.xlsx';
        } else if (type === 'petak') {
            headers = ['Kode Petak', 'Anak Petak', 'Luas Lahan (Ha)', 'Jumlah Pohon', 'Nama TPG', 'Status'];
            sampleData = [
                ['P.07', 'A', 12.5, 1200, 'Cikuning', 'Aktif'],
                ['P.08', '', 10.0, 1000, 'Terlaya', 'Aktif']
            ];
            filename = 'template_master_petak.xlsx';
        } else if (type === 'target') {
            headers = ['Tahun', 'Bulan', 'Periode', 'BKPH', 'RPH', 'TPG', 'Target Per TPG (kg)', 'Target RO (kg)', 'Target RKAP (kg)', 'Target RTT (kg)'];
            sampleData = [
                [2026, 5, 1, 'BKPH Bantarkawung', 'RPH Cikuning', 'Cikuning', 1500, 1500, 1400, 1300],
                [2026, 5, 2, 'BKPH Bantarkawung', 'RPH Cikuning', 'Cikuning', 1600, 1600, 1500, 1400]
            ];
            filename = 'template_target_produksi.xlsx';
        } else if (type === 'user') {
            headers = ['Nama Lengkap', 'Username', 'Password', 'Role', 'Wilayah Akses', 'Status'];
            sampleData = [
                ['Joni Hermawan', 'joni', 'password123', 'KRPH / ASPER', 'RPH Cikuning', 'Aktif'],
                ['Dian Sastro', 'dian', 'pimpinan123', 'Pimpinan', 'ALL', 'Aktif']
            ];
            filename = 'template_master_user.xlsx';
        }

        const wb = XLSX.utils.book_new();
        const wsData = [headers, ...sampleData];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "Template " + type);
        XLSX.writeFile(wb, filename);
        showToast(`Template ${type} berhasil diunduh!`);
    }

    // ======================== DASHBOARD PERIOD FILTERS ========================
    function filterRecordsForDashboard(records) {
        const year = document.getElementById('dbFilterYear')?.value || 'all';
        const month = document.getElementById('dbFilterMonth')?.value || 'all';
        const period = document.getElementById('dbFilterPeriod')?.value || 'all';
        const bkphId = document.getElementById('dbFilterBKPH')?.value || 'all';
        const rphId = document.getElementById('dbFilterRPH')?.value || 'all';
        const tpgId = document.getElementById('dbFilterTPG')?.value || 'all';

        return records.filter(r => {
            const details = getTransactionDetails(r);

            if (bkphId !== 'all' && details.id_bkph !== bkphId) return false;
            if (rphId !== 'all' && details.id_rph !== rphId) return false;
            if (tpgId !== 'all' && details.id_tpg !== tpgId) return false;

            const d = new Date(r.tanggal);
            if (isNaN(d.getTime())) return false;

            if (year !== 'all' && d.getFullYear().toString() !== year) return false;
            if (month !== 'all' && (d.getMonth() + 1).toString() !== month) return false;
            if (period !== 'all') {
                const day = d.getDate();
                const recordPeriod = day <= 15 ? '1' : '2';
                if (recordPeriod !== period) return false;
            }

            return true;
        });
    }

    document.getElementById('btnApplyDbFilter')?.addEventListener('click', () => {
        const filtered = filterRecordsForDashboard(globalRecords);
        renderDashboard(filtered);
        renderMap(filtered);
        showToast('Filter dashboard berhasil diterapkan!');
    });

    function populatePetakDropdowns() {
        populatePetakSelect('inputPetakPenyadap');
    }

    document.getElementById('btnPrintReport')?.addEventListener('click', () => {
        const span = document.getElementById('printDateSpan');
        if (span) span.textContent = new Date().toLocaleString('id-ID');
        window.print();
    });

    // ======================== 10. CHART HELPERS ========================
    function initChart(canvasId, type, data, options) {
        if (charts[canvasId]) charts[canvasId].destroy();
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        charts[canvasId] = new Chart(canvas.getContext('2d'), { type, data, options });
    }

    function animateValue(el, end, suffix = '', isInt = false) {
        if (!el) return;
        let start = 0, dur = 600, startTs = null;
        const step = (ts) => {
            if (!startTs) startTs = ts;
            const prog = Math.min((ts - startTs) / dur, 1);
            const cur = prog * (end - start) + start;
            el.innerHTML = (isInt ? Math.floor(cur) : cur.toFixed(1)) + suffix;
            if (prog < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    // ======================== 11. INTER-IFRAME MSG ========================
    window.addEventListener('message', (e) => {
        if (e.data?.type === 'SIPENA_SUBMIT_SUCCESS') {
            loadAllData(records => {
                const activeTab = document.querySelector('.sidebar-menu li.active')?.getAttribute('data-tab');
                if (activeTab) renderTabView(activeTab);
            });
        }
    });

    function triggerInitialLoad() {
        // Load data & render dashboard
        loadAllData(records => {
            const activeItem = document.querySelector('.sidebar-menu li.active');
            const activeTab = activeItem ? activeItem.getAttribute('data-tab') : 'dashboard';

            console.log(`Data sinkronisasi selesai. Refreshing tab: ${activeTab}`);

            renderTabView(activeTab);
            renderMap(records);
            populatePetakDropdowns();

            // Populate cascading select inputs with values from current data
            initFilterCascadingSelects();
            initReportCascadingSelects();
        });
    }

    // ======================== INITIAL LOAD ========================
    // Run schema migration first
    migrateLocalStorageData();

    // Ensure default mandor array exists in localStorage
    if (!localStorage.getItem(LS.MANDOR)) {
        lsSet(LS.MANDOR, getMandorList());
    }

    // Set default monitoring date
    const monDateEl = document.getElementById('monitoringDate');
    if (monDateEl) monDateEl.value = todayStr();

    // Set print date
    const pds = document.getElementById('printDateSpan');
    if (pds) pds.textContent = new Date().toLocaleDateString('id-ID');

    // Run authentication check on startup
    if (checkAuth()) {
        triggerInitialLoad();
    }
});
