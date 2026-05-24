// assets/js/app.js
// SIPENA PINUS v2.0 - Full Feature Dashboard
// =========================================================================
// KONFIGURASI: Isi URL Google Apps Script Anda di sini
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwTelvmwcTnXUKYx_CQKfUg82nltxUNWjHsckbCO9vNj3My_VYl2huNYqmqJZKhzO61Kg/exec";
// =========================================================================

document.addEventListener('DOMContentLoaded', function () {

    // ======================== STATE MANAGEMENT ========================
    // Kunci localStorage
    const LS = {
        PENYADAP: 'sipena_penyadap',
        PETAK:    'sipena_petak',
        TARGET:   'sipena_targets',
        MONITORING: 'sipena_monitoring',
        DEMO_DATA: 'sipena_demo_entries',
        CLOUD_CACHE: 'sipena_last_dashboard_data',
        MANDOR:   'sipena_mandor',
    };

    // State global
    let globalRecords = [];
    let mapDataCache  = [];
    let charts        = {};
    let monitoringData = {}; // {tanggal: {namapenyadap: {status, keterangan}}}

    // ======================== HELPER: STORAGE ========================
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
    function getMonitoringData() { return lsGet(LS.MONITORING) || {}; }

    // Penyadap aktif saja
    function getActivePenyadap() {
        return getPenyadapList().filter(p => p.status === 'Aktif');
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

    // ======================== HELPER: MODAL ========================
    function openModal(id) { document.getElementById(id)?.classList.add('active'); }
    function closeModal(id) { document.getElementById(id)?.classList.remove('active'); }

    document.querySelectorAll('[data-modal-close]').forEach(btn => {
        btn.addEventListener('click', () => closeModal(btn.getAttribute('data-modal-close')));
    });

    // ======================== 1. TAB ROUTING ========================
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

    const filterSelect = document.getElementById('filterMandorSelect');
    if (filterSelect) {
        filterSelect.addEventListener('change', function () {
            renderPimpinan(globalRecords);
        });
    }

    const pageTitles = {
        dashboard:   ['Dashboard Monitoring', 'Sistem Monitoring Produksi Getah Berbasis Mandor & Wilayah Sadap'],
        pimpinan:    ['Dashboard Pimpinan',   'Evaluasi Kinerja Mandor & Progress Target Produksi'],
        mandor:      ['Kelola Mandor',         'Manajemen Penyadap, Petak Sadap, dan Target Produksi'],
        'petak-target':['Kelola Petak & Target', 'Atur Kapasitas Petak Lahan & Target Bulanan/Tahunan Produksi'],
        monitoring:  ['Monitoring Harian',     'Pantau Kehadiran & Status Penyadap Setiap Hari'],
        'input-data':['Input Data Lapangan',  'Formulir Input Data Produksi bagi Mandor di Lapangan'],
        'peta-wilayah':['Pemetaan Wilayah Sadap', 'Visualisasi Status Produktivitas dan Kondisi Petak Hutan Pinus'],
        laporan:     ['Laporan & Evaluasi Produksi', 'Tabel Rekapitulasi Data dan Ekspor Laporan Produksi'],
    };

    function updatePageHeader(tab) {
        const t = pageTitles[tab] || ['Dashboard', ''];
        if (pageTitle)    pageTitle.textContent    = t[0];
        if (pageSubtitle) pageSubtitle.textContent = t[1];
    }

    function renderTabView(tab) {
        switch (tab) {
            case 'dashboard':   renderDashboard(globalRecords); break;
            case 'pimpinan':    renderPimpinan(globalRecords);  break;
            case 'mandor':      renderMandorTab();              break;
            case 'petak-target': renderPetakTargetTable();      break;
            case 'monitoring':  renderMonitoringTab();          break;
            case 'peta-wilayah': renderMap(globalRecords);      break;
            case 'laporan':     renderReportTable(globalRecords); break;
        }
    }

    // ======================== 2. DATA ENGINE ========================
    function getInitialMockData() {
        const mockData = [];
        const penyadapList = getPenyadapList().filter(p => p.status === 'Aktif');
        const workerMap    = {};
        penyadapList.forEach(p => { workerMap[p.nama] = p.petak; });

        const conditions = ['Normal', 'Hujan', 'Pohon Rusak', 'Wadah Rusak'];

        for (let i = 30; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const ds = date.toISOString().split('T')[0];

            const shuffled = [...penyadapList].sort(() => 0.5 - Math.random());
            const active   = shuffled.slice(0, Math.floor(Math.random() * 3) + 4);

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
                if (worker.nama === 'Slamet')  base = 20.5;
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
        const demoBanner  = document.getElementById('demoModeBanner');

        if (!WEB_APP_URL) {
            if (demoBanner)  demoBanner.style.display  = 'flex';
            if (cloudBanner) cloudBanner.style.display = 'none';
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

        if (demoBanner)  demoBanner.style.display  = 'none';
        if (cloudBanner) cloudBanner.style.display = 'flex';

        const fallback = () => {
            let cached = lsGet(LS.CLOUD_CACHE);
            if (!cached || !cached.length) cached = getInitialMockData();
            cached.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
            globalRecords = cached;
            callback(cached);
        };

        if (navigator.onLine) {
            fetch(WEB_APP_URL)
                .then(r => r.json())
                .then(res => {
                    if (res.status === 'success' && res.data) {
                        // Sync Metadata tables if present
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
                            lsSet(LS.MONITORING, res.monitoring);
                        }

                        const fmt = res.data.map(r => ({
                            id: r.id || 'c-' + Math.random().toString(36).substr(2,9),
                            tanggal: r.tanggal || '',
                            nama_penyadap: r.nama_penyadap || '',
                            petak: r.petak || '',
                            estimasi_hasil: parseFloat(r.estimasi_hasil) || 0,
                            kondisi_lapangan: r.kondisi_lapangan || 'Normal',
                            kendala: r.kendala || ''
                        }));
                        fmt.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
                        lsSet(LS.CLOUD_CACHE, fmt);
                        globalRecords = fmt;
                        callback(fmt);
                    } else { fallback(); }
                })
                .catch(() => fallback());
        } else { fallback(); }
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
        animateValue(document.getElementById('stat-avg-daily'),  avg,   ' kg');
        animateValue(document.getElementById('stat-workers'),    workers.size || 6, ' orang', true);
        animateValue(document.getElementById('stat-blocks'),     blocks.size  || 6, ' petak', true);
        animateValue(document.getElementById('stat-issues'),     issues, ' kasus', true);

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

    // ======================== 4. DASHBOARD PIMPINAN ========================
    function renderPimpinan(records) {
        const badge = document.getElementById('pimpinan-period-badge');
        if (badge) badge.textContent = `Periode: ${getCurrentMonthName()}`;

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
        const originalPetakList    = getPetakList();
        const targets      = getTargetList();
        const monitoring   = getMonitoringData();

        // Filter lists based on selected mandor
        const penyadapList = selectedMandorId === 'all' 
            ? originalPenyadapList 
            : originalPenyadapList.filter(p => supervisedPetaks.includes(p.petak));

        const petakList = selectedMandorId === 'all'
            ? originalPetakList
            : originalPetakList.filter(b => supervisedPetaks.includes(b.kode));

        const now = new Date();
        const thisYear  = now.getFullYear();
        const thisMonth = now.getMonth();

        // Hitung total produksi per penyadap
        const prodPerPenyadap = {};
        originalPenyadapList.forEach(p => { prodPerPenyadap[p.nama] = 0; });
        records.forEach(r => {
            if (prodPerPenyadap.hasOwnProperty(r.nama_penyadap)) {
                prodPerPenyadap[r.nama_penyadap] += r.estimasi_hasil;
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
                    if (pct >= 90)      { grade = 'A'; gradeClass = 'a'; }
                    else if (pct >= 70) { grade = 'B'; gradeClass = 'b'; }
                    else if (pct >= 50) { grade = 'C'; gradeClass = 'c'; cardClass = 'kuning'; }
                    else                { grade = 'D'; gradeClass = 'd'; cardClass = 'merah'; }

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
                            <span>Produksi: <strong>${actualProd.toFixed(1)} kg</strong></span>
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
                    if (pct >= 90)      { grade = 'A'; gradeClass = 'a'; }
                    else if (pct >= 70) { grade = 'B'; gradeClass = 'b'; }
                    else if (pct >= 50) { grade = 'C'; gradeClass = 'c'; cardClass = 'kuning'; }
                    else                { grade = 'D'; gradeClass = 'd'; cardClass = 'merah'; }

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
                                <div class="mk-stat-label">Persentase Capaian</div>
                            </div>
                            <div class="mk-stat">
                                <div class="mk-stat-val">${mPenyadaps.reduce((sum, p) => sum + (absPerPenyadap[p.nama]?.total || 0), 0)}x</div>
                                <div class="mk-stat-label">Total Tidak Hadir Tapper</div>
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
                    const targetTahunan    = target ? parseFloat(target.tahunan)  : 3600;
                    const targetPerPenyadap = targetTahunan; // target sudah per penyadap
                    const actual = prodPerPenyadap[p.nama] || 0;
                    const pct    = targetPerPenyadap > 0 ? Math.min(100, (actual / targetPerPenyadap) * 100) : 0;

                    let grade = 'A', gradeClass = 'a', cardClass = '';
                    if (pct >= 90)      { grade = 'A'; gradeClass = 'a'; }
                    else if (pct >= 70) { grade = 'B'; gradeClass = 'b'; }
                    else if (pct >= 50) { grade = 'C'; gradeClass = 'c'; cardClass = 'kuning'; }
                    else                { grade = 'D'; gradeClass = 'd'; cardClass = 'merah'; }

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
                            <span>Target: ${targetPerPenyadap.toFixed(0)} kg</span>
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
                                <div class="mk-stat-val">${absInfo.total || 0}x</div>
                                <div class="mk-stat-label">Tdk Hadir</div>
                            </div>
                            <div class="mk-stat">
                                <div class="mk-stat-val">${(targetPerPenyadap - actual).toFixed(0)} kg</div>
                                <div class="mk-stat-label">Sisa Target</div>
                            </div>
                        </div>
                    </div>`;
                });
            }
        }

        // Chart: Target Tahunan per Penyadap
        const names  = penyadapList.map(p => p.nama);
        const actuals = names.map(n => +(prodPerPenyadap[n] || 0).toFixed(1));
        const tgts   = penyadapList.map(p => {
            const t = targets.find(x => x.petak === p.petak && parseInt(x.tahun) === thisYear);
            return t ? parseFloat(t.tahunan) : 3600;
        });

        initChart('chartTargetTahunan', 'bar', {
            labels: names,
            datasets: [
                { label: 'Produksi Aktual (kg)', data: actuals, backgroundColor: '#40916c', borderRadius: 6 },
                { label: 'Target Tahunan (kg)',  data: tgts,    backgroundColor: 'rgba(27,67,50,0.15)', borderColor: '#1b4332', borderWidth: 2, borderRadius: 6 }
            ]
        }, { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } });

        // Chart: Target Bulanan bulan ini (Periode 1 & 2)
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
        const p1Targets = penyadapList.map(p => {
            const t = targets.find(x => x.petak === p.petak && parseInt(x.tahun) === thisYear);
            return t ? parseFloat(t.periode1) : 150;
        });
        const p2Targets = penyadapList.map(p => {
            const t = targets.find(x => x.petak === p.petak && parseInt(x.tahun) === thisYear);
            return t ? parseFloat(t.periode2) : 150;
        });

        initChart('chartTargetBulanan', 'bar', {
            labels: names,
            datasets: [
                { label: 'Periode 1 Aktual', data: p1Actuals.map(v => +v.toFixed(1)), backgroundColor: '#52b788', borderRadius: 4 },
                { label: 'Periode 1 Target', data: p1Targets, backgroundColor: 'rgba(82,183,136,0.2)', borderColor: '#52b788', borderWidth: 1.5, borderRadius: 4 },
                { label: 'Periode 2 Aktual', data: p2Actuals.map(v => +v.toFixed(1)), backgroundColor: '#f4a261', borderRadius: 4 },
                { label: 'Periode 2 Target', data: p2Targets, backgroundColor: 'rgba(244,162,97,0.2)', borderColor: '#f4a261', borderWidth: 1.5, borderRadius: 4 },
            ]
        }, { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } });

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
        const tbody = document.getElementById('mandorTbody');
        if (!tbody) return;

        if (!list.length) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:30px;">Belum ada data mandor. Klik tombol Tambah Mandor.</td></tr>';
            return;
        }

        tbody.innerHTML = list.map(m => `
            <tr>
                <td><strong>${m.nama}</strong></td>
                <td><code>${m.nik || '-'}</code></td>
                <td>${m.petak && m.petak.length ? m.petak.map(p => `<code style="background:#edf2f7;padding:3px 7px;border-radius:4px;font-weight:600;margin-right:4px;">${p}</code>`).join('') : '<span style="color:var(--text-muted);font-style:italic;">Belum ada petak</span>'}</td>
                <td style="text-align: center;">
                    <div class="action-btns" style="display:flex; gap:8px; justify-content: center;">
                        <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.8rem;" onclick="window.editMandor('${m.id}')">✏️ Edit</button>
                        <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.8rem; border-color: var(--danger); color: var(--danger);" onclick="window.deleteMandor('${m.id}')">🗑️ Hapus</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    function populateMandorPetakCheckboxes(selectedPetaks = []) {
        const container = document.getElementById('mandorPetakCheckboxes');
        if (!container) return;

        const petakList = getPetakList();
        container.innerHTML = petakList.map(b => {
            const checked = selectedPetaks.includes(b.kode) ? 'checked' : '';
            return `<label style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; cursor: pointer; color: var(--text-main);">
                <input type="checkbox" name="mandorPetak" value="${b.kode}" ${checked}>
                <span>${b.kode}</span>
            </label>`;
        }).join('');
    }

    document.getElementById('btnTambahMandor')?.addEventListener('click', () => {
        document.getElementById('editMandorId').value = '';
        document.getElementById('inputNamaMandor').value = '';
        document.getElementById('inputNIKMandor').value = '';
        document.getElementById('modalMandorTitle').textContent = 'Tambah Mandor';
        populateMandorPetakCheckboxes([]);
        openModal('modalMandor');
    });

    window.editMandor = function(id) {
        const list = getMandorList();
        const m = list.find(x => x.id === id);
        if (!m) return;

        document.getElementById('editMandorId').value = m.id;
        document.getElementById('inputNamaMandor').value = m.nama;
        document.getElementById('inputNIKMandor').value = m.nik || '';
        document.getElementById('modalMandorTitle').textContent = 'Edit Data Mandor';
        populateMandorPetakCheckboxes(m.petak || []);
        openModal('modalMandor');
    };

    window.deleteMandor = function(id) {
        const list = getMandorList();
        const m = list.find(x => x.id === id);
        if (!m) return;

        if (confirm(`Apakah Anda yakin ingin menghapus mandor "${m.nama}"?`)) {
            const newList = list.filter(x => x.id !== id);
            lsSet(LS.MANDOR, newList);
            renderMandorTable();
            showToast('Mandor berhasil dihapus.', 'warning');

            if (WEB_APP_URL && navigator.onLine) {
                fetch(WEB_APP_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    body: JSON.stringify({ action: 'deleteMandor', id: id })
                }).then(() => {
                    showToast('Data mandor berhasil dihapus dari Google Sheets!', 'warning');
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
        
        // Get checked petaks
        const checkboxes = document.querySelectorAll('input[name="mandorPetak"]:checked');
        const petak = Array.from(checkboxes).map(cb => cb.value);

        if (!nama) { showToast('Nama mandor wajib diisi!', 'error'); return; }

        let list = getMandorList();
        const mandorId = id || 'm' + Date.now();
        const mandorData = { id: mandorId, nama, nik, petak };

        if (id) {
            const idx = list.findIndex(x => x.id === id);
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

        if (WEB_APP_URL && navigator.onLine) {
            fetch(WEB_APP_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({ action: 'saveMandor', data: mandorData })
            }).then(() => {
                showToast('Data mandor berhasil disinkronkan ke Google Sheets!');
                loadAllData(records => {
                    renderMandorTable();
                });
            });
        }
    });

    function renderPenyadapTable() {
        const list = getPenyadapList();
        const tbody = document.getElementById('penyadapTbody');
        if (!tbody) return;
        tbody.innerHTML = list.length ? list.map(p => `
            <tr>
                <td><strong>${p.nama}</strong></td>
                <td><code style="background:#edf2f7;padding:3px 7px;border-radius:4px;">${p.petak}</code></td>
                <td><span class="status-badge-${p.status === 'Aktif' ? 'aktif' : 'nonaktif'}">${p.status}</span></td>
                <td>
                    <button class="btn-icon" title="Hapus" onclick="deletePenyadap('${p.id}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14H6L5 6"></path></svg>
                    </button>
                </td>
            </tr>`).join('') : '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);">Belum ada data penyadap</td></tr>';
    }

    function renderPetakTable() {
        const list  = getPetakList();
        const penyadapList = getPenyadapList();
        const tbody = document.getElementById('petakTbody');
        if (!tbody) return;
        tbody.innerHTML = list.length ? list.map(b => {
            const assigned = penyadapList.filter(p => p.petak === b.kode).map(p => p.nama).join(', ') || '-';
            return `<tr>
                <td><strong>${b.kode}</strong></td>
                <td>${assigned}</td>
                <td>${b.luas} Ha</td>
                <td>
                    <button class="btn-icon" title="Hapus" onclick="deletePetak('${b.id}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14H6L5 6"></path></svg>
                    </button>
                </td>
            </tr>`;
        }).join('') : '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);">Belum ada data petak</td></tr>';
    }

    function renderTargetTable() {
        const targets = getTargetList();
        const tbody   = document.getElementById('targetTbody');
        if (!tbody) return;
        if (!targets.length) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);">Belum ada target tersimpan</td></tr>';
            return;
        }
        const penyadapList = getPenyadapList();
        tbody.innerHTML = targets.map(t => {
            const assigned = penyadapList.filter(p => p.petak === t.petak && p.status === 'Aktif');
            const perPenyadap = assigned.length > 0 ? (parseFloat(t.tahunan) / assigned.length).toFixed(0) : t.tahunan;
            return `<tr>
                <td><code style="background:#edf2f7;padding:3px 7px;border-radius:4px;">${t.petak}</code></td>
                <td>${t.tahun}</td>
                <td><strong>${parseFloat(t.tahunan).toLocaleString('id')} kg</strong></td>
                <td>${parseFloat(perPenyadap).toLocaleString('id')} kg</td>
                <td>${parseFloat(t.periode1).toLocaleString('id')} kg</td>
                <td>${parseFloat(t.periode2).toLocaleString('id')} kg</td>
            </tr>`;
        }).join('');
    }

    function populatePetakDropdowns() {
        const petakList = getPetakList();
        const opts = '<option value="">-- Pilih Petak --</option>' + petakList.map(b => `<option value="${b.kode}">${b.kode}</option>`).join('');
        ['targetPetakSelect', 'inputPetakPenyadap', 'filter-petak'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (id === 'filter-petak') {
                    el.innerHTML = '<option value="">Semua Petak</option>' + petakList.map(b => `<option value="${b.kode}">${b.kode}</option>`).join('');
                } else {
                    el.innerHTML = opts;
                }
            }
        });
    }

    // Expose hapus ke global
    window.deletePenyadap = function(id) {
        if (!confirm('Hapus penyadap ini?')) return;
        let list = getPenyadapList().filter(p => p.id !== id);
        lsSet(LS.PENYADAP, list);
        renderMandorTab();
        showToast('Penyadap dihapus.', 'warning');
    };
    window.deletePetak = function(id) {
        if (!confirm('Hapus petak ini?')) return;
        let list = getPetakList().filter(b => b.id !== id);
        lsSet(LS.PETAK, list);
        renderMandorTab();
        showToast('Petak dihapus.', 'warning');

        if (WEB_APP_URL && navigator.onLine) {
            fetch(WEB_APP_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({ action: 'deletePetak', id: id })
            }).then(() => {
                showToast('Petak berhasil dihapus dari Google Sheets!', 'warning');
                loadAllData(records => {
                    renderMandorTab();
                });
            });
        }
    };

    // Tambah Penyadap
    document.getElementById('btnTambahPenyadap')?.addEventListener('click', () => {
        document.getElementById('inputNamaPenyadap').value = '';
        document.getElementById('inputPetakPenyadap').value = '';
        document.getElementById('inputStatusPenyadap').value = 'Aktif';
        populatePetakDropdowns();
        openModal('modalTambahPenyadap');
    });

    document.getElementById('btnSimpanPenyadap')?.addEventListener('click', () => {
        const nama   = document.getElementById('inputNamaPenyadap').value.trim();
        const petak  = document.getElementById('inputPetakPenyadap').value;
        const status = document.getElementById('inputStatusPenyadap').value;
        if (!nama || !petak) { showToast('Isi nama dan petak terlebih dahulu.', 'error'); return; }
        const list = getPenyadapList();
        list.push({ id: 'p' + Date.now(), nama, petak, status });
        lsSet(LS.PENYADAP, list);
        closeModal('modalTambahPenyadap');
        renderMandorTab();
        showToast(`Penyadap "${nama}" berhasil ditambahkan!`, 'success');
    });

    // Tambah Petak
    document.getElementById('btnTambahPetak')?.addEventListener('click', () => {
        document.getElementById('editPetakId').value = '';
        document.getElementById('inputKodePetak').value = '';
        document.getElementById('inputLuasPetak').value = '';
        document.getElementById('inputPohonPetak').value = '';
        
        // Reset target fields
        document.getElementById('inputTargetTahunan').value = '';
        
        document.getElementById('modalPetakTitle').textContent = 'Tambah Petak Baru';
        openModal('modalPetak');
    });

    document.getElementById('btnSimpanPetak')?.addEventListener('click', () => {
        const id = document.getElementById('editPetakId').value;
        const kode = document.getElementById('inputKodePetak').value.trim();
        const luas = parseFloat(document.getElementById('inputLuasPetak').value) || 0;
        const pohon = parseInt(document.getElementById('inputPohonPetak').value) || 0;
        
        const targetTahunan = parseFloat(document.getElementById('inputTargetTahunan').value) || 0;

        if (!kode) { showToast('Masukkan kode petak.', 'error'); return; }
        if (luas <= 0) { showToast('Luas petak harus bernilai positif.', 'error'); return; }
        if (pohon <= 0) { showToast('Jumlah pohon harus bernilai positif.', 'error'); return; }

        let list = getPetakList();
        const exists = list.some(b => b.kode.toLowerCase() === kode.toLowerCase() && b.id !== id);
        if (exists) { showToast('Kode petak sudah terdaftar.', 'error'); return; }

        const petakId = id || 'b' + Date.now();
        const petakData = { id: petakId, kode, luas, pohon };

        if (id) {
            // Edit
            const idx = list.findIndex(b => b.id === id);
            if (idx >= 0) {
                const oldKode = list[idx].kode;
                list[idx] = petakData;

                // Integrity: update tappers and targets
                if (oldKode !== kode) {
                    let tappers = getPenyadapList();
                    tappers.forEach(t => { if (t.petak === oldKode) t.petak = kode; });
                    lsSet(LS.PENYADAP, tappers);

                    let targets = getTargetList();
                    targets.forEach(t => { if (t.petak === oldKode) t.petak = kode; });
                    lsSet(LS.TARGET, targets);
                }
                showToast(`Petak "${kode}" berhasil diubah!`);
            }
        } else {
            // Add new
            list.push(petakData);
            showToast(`Petak "${kode}" berhasil ditambahkan!`);
        }

        lsSet(LS.PETAK, list);
        
        // Save target details if targetTahunan is filled
        if (targetTahunan > 0) {
            let targets = getTargetList();
            const tIdx = targets.findIndex(t => t.petak === kode && parseInt(t.tahun) === 2026);
            const targetBulan1 = tIdx >= 0 ? (targets[tIdx].periode1 || 0) : 0;
            const targetBulan2 = tIdx >= 0 ? (targets[tIdx].periode2 || 0) : 0;
            const targetEntry = { petak: kode, tahun: 2026, tahunan: targetTahunan, periode1: targetBulan1, periode2: targetBulan2 };
            if (tIdx >= 0) {
                targets[tIdx] = targetEntry;
            } else {
                targets.push(targetEntry);
            }
            lsSet(LS.TARGET, targets);
            
            // Post Target to Sheets
            if (WEB_APP_URL && navigator.onLine) {
                fetch(WEB_APP_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    body: JSON.stringify({ action: 'saveTarget', data: targetEntry })
                });
            }
        }
        
        closeModal('modalPetak');
        renderPetakTargetTable();

        if (WEB_APP_URL && navigator.onLine) {
            fetch(WEB_APP_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({ action: 'savePetak', data: petakData })
            }).then(() => {
                showToast('Petak berhasil disinkronkan ke Google Sheets!');
                loadAllData(records => {
                    renderPetakTargetTable();
                });
            });
        }
    });

    window.editPetak = function(id) {
        const list = getPetakList();
        const b = list.find(x => x.id === id);
        if (!b) return;

        document.getElementById('editPetakId').value = b.id;
        document.getElementById('inputKodePetak').value = b.kode;
        document.getElementById('inputLuasPetak').value = b.luas;
        document.getElementById('inputPohonPetak').value = b.pohon || 1000;
        
        // Fetch target for current year 2026
        const targets = getTargetList();
        const t = targets.find(x => x.petak === b.kode && parseInt(x.tahun) === 2026) || { tahunan: '' };
        document.getElementById('inputTargetTahunan').value = t.tahunan;

        document.getElementById('modalPetakTitle').textContent = 'Edit Data Petak';
        openModal('modalPetak');
    };

    window.deletePetak = function(id) {
        const list = getPetakList();
        const b = list.find(x => x.id === id);
        if (!b) return;

        if (confirm(`Apakah Anda yakin ingin menghapus petak "${b.kode}"?`)) {
            const newList = list.filter(x => x.id !== id);
            lsSet(LS.PETAK, newList);
            renderPetakTargetTable();
            showToast('Petak berhasil dihapus.', 'warning');

            if (WEB_APP_URL && navigator.onLine) {
                fetch(WEB_APP_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    body: JSON.stringify({ action: 'deletePetak', id: id })
                }).then(() => {
                    showToast('Petak berhasil dihapus dari Google Sheets!', 'warning');
                    loadAllData(records => {
                        renderPetakTargetTable();
                    });
                });
            }
        }
    };

    function renderPetakTargetTable() {
        const petakList = getPetakList();
        const penyadapList = getPenyadapList();
        const targets = getTargetList();
        const tbody = document.getElementById('petakTargetTbody');
        if (!tbody) return;

        if (!petakList.length) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:30px;">Belum ada data petak. Klik tombol Tambah Petak.</td></tr>';
            return;
        }

        const thisYear = new Date().getFullYear();

        tbody.innerHTML = petakList.map(b => {
            const assigned = penyadapList.filter(p => p.petak === b.kode && p.status === 'Aktif');
            
            // Calculate trees digarap vs total
            const treesDigarap = assigned.reduce((sum, p) => sum + (parseInt(p.pohon) || 0), 0);
            const treesNganggur = Math.max(0, (b.pohon || 1000) - treesDigarap);

            const t = targets.find(x => x.petak === b.kode && parseInt(x.tahun) === thisYear) || { tahunan: 3600 };

            const namesList = assigned.map(p => `${p.nama} (${p.pohon || 0} ph)`).join(', ') || '-';

            return `
                <tr>
                    <td><strong>${b.kode}</strong></td>
                    <td>${b.luas} Ha</td>
                    <td><strong>${b.pohon || 1000}</strong></td>
                    <td>
                        <span style="font-weight:600; color:var(--primary-light);">${treesDigarap}</span>
                        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">(${namesList})</div>
                    </td>
                    <td><strong style="color:${treesNganggur > 0 ? 'var(--warning)' : 'var(--text-muted)'}">${treesNganggur} pohon</strong></td>
                    <td><strong>${t.tahunan.toLocaleString('id-ID')} kg</strong></td>
                    <td style="text-align: center;">
                        <div class="action-btns" style="display:flex; gap:8px; justify-content: center;">
                            <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.8rem;" onclick="window.editPetak('${b.id}')">✏️ Edit</button>
                            <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.8rem; border-color: var(--danger); color: var(--danger);" onclick="window.deletePetak('${b.id}')">🗑️ Hapus</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Expose aturTarget to global
    window.aturTarget = function(petakKode) {
        const targets = getTargetList();
        const thisYear = new Date().getFullYear();
        const target = targets.find(t => t.petak === petakKode && parseInt(t.tahun) === thisYear) || {
            tahun: thisYear,
            tahunan: 3600,
            periode1: 150,
            periode2: 150
        };

        const activeWorkers = getActivePenyadap().filter(p => p.petak === petakKode);
        document.getElementById('targetPetakKode').value = petakKode;
        document.getElementById('modalTargetPenyadapNames').textContent = activeWorkers.length > 0
            ? activeWorkers.map(w => w.nama).join(', ')
            : 'Belum ada penyadap aktif ditugaskan pada petak ini.';

        document.getElementById('targetTahun').value = target.tahun;
        document.getElementById('targetTahunanTotal').value = target.tahunan;
        document.getElementById('targetBulan1').value = target.periode1;
        document.getElementById('targetBulan2').value = target.periode2;

        document.getElementById('modalTargetTitle').textContent = `Set Target Petak: ${petakKode}`;
        openModal('modalTarget');
        calcAndShowTargetPerPenyadap();
    };

    // Setting Target
    const targetPetakSel = document.getElementById('targetPetakSelect');
    if (targetPetakSel) {
        targetPetakSel.addEventListener('change', updateTargetInfo);
    }

    function calcAndShowTargetPerPenyadap() {
        const petak    = document.getElementById('targetPetakSelect')?.value;
        const tahunan  = parseFloat(document.getElementById('targetTahunanTotal')?.value) || 0;
        const p1 = parseFloat(document.getElementById('targetBulan1')?.value) || 0;
        const p2 = parseFloat(document.getElementById('targetBulan2')?.value) || 0;
        if (!petak) return;

        const assigned = getActivePenyadap().filter(p => p.petak === petak);
        const n = assigned.length || 1;

        const elTahunan = document.getElementById('targetPerPenyadapTahunan');
        const elNilai   = document.getElementById('nilaiTargetPerPenyadap');
        const elBulanan = document.getElementById('targetBulananPerPenyadap');
        const elNilaiBul = document.getElementById('nilaiTargetBulananPenyadap');

        if (tahunan > 0 && elTahunan && elNilai) {
            elTahunan.style.display = 'flex';
            elNilai.textContent = `${(tahunan / n).toFixed(0)} kg/tahun (${n} penyadap)`;
        }
        if ((p1 > 0 || p2 > 0) && elBulanan && elNilaiBul) {
            elBulanan.style.display = 'flex';
            elNilaiBul.textContent = `Periode 1: ${(p1 / n).toFixed(0)} kg | Periode 2: ${(p2 / n).toFixed(0)} kg`;
        }
    }

    ['targetTahunanTotal', 'targetBulan1', 'targetBulan2'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', calcAndShowTargetPerPenyadap);
    });

    function updateTargetInfo() {
        const petak = document.getElementById('targetPetakSelect')?.value;
        const infoBox = document.getElementById('targetPenyadapInfo');
        const namesEl = document.getElementById('targetPenyadapNames');
        if (!petak || !infoBox || !namesEl) return;

        const assigned = getActivePenyadap().filter(p => p.petak === petak);
        infoBox.style.display = assigned.length ? 'block' : 'none';
        namesEl.textContent   = assigned.length ? assigned.map(p => p.nama).join(', ') : '-';
        calcAndShowTargetPerPenyadap();
    }

    document.getElementById('btnSimpanTarget')?.addEventListener('click', () => {
        const petak   = document.getElementById('targetPetakSelect')?.value || document.getElementById('targetPetakKode')?.value;
        const tahun   = document.getElementById('targetTahun')?.value;
        const tahunan = document.getElementById('targetTahunanTotal')?.value;
        const p1      = document.getElementById('targetBulan1')?.value;
        const p2      = document.getElementById('targetBulan2')?.value;

        if (!petak || !tahunan) { showToast('Pilih petak dan isi target tahunan.', 'error'); return; }

        let targets = getTargetList();
        const idx   = targets.findIndex(t => t.petak === petak && t.tahun === tahun);
        const entry = { petak, tahun, tahunan: parseFloat(tahunan), periode1: parseFloat(p1) || 0, periode2: parseFloat(p2) || 0 };

        if (idx >= 0) targets[idx] = entry;
        else targets.push(entry);
        lsSet(LS.TARGET, targets);
        renderTargetTable();
        showToast(`Target petak ${petak} tahun ${tahun} disimpan!`, 'success');

        if (WEB_APP_URL && navigator.onLine) {
            fetch(WEB_APP_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({ action: 'saveTarget', data: entry })
            }).then(() => {
                showToast('Target berhasil disinkronkan ke Google Sheets!');
                loadAllData(records => {
                    renderTargetTable();
                });
            });
        }
    });

    // ======================== 6. MONITORING HARIAN ========================
    function renderMonitoringTab() {
        const dateEl = document.getElementById('monitoringDate');
        if (dateEl && !dateEl.value) dateEl.value = todayStr();
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

        const petakList    = getPetakList();
        const penyadapList = getActivePenyadap();
        const mon          = getMonitoringData();
        const dayData      = mon[tgl] || {};

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
                const saved  = dayData[p.nama] || {};
                const status = saved.status || 'Hadir';
                const ket    = saved.keterangan || '';

                const radios = statusOptions.map(s => {
                    const checked = status === s ? 'checked' : '';
                    const safeId  = `mon_${tgl}_${p.nama.replace(/\s+/g, '_')}_${s.replace(/\s+/g, '_')}`;
                    return `<input type="radio" class="mon-status-radio" name="mon_${tgl}_${p.nama.replace(/\s+/g,'_')}" value="${s}" id="${safeId}" ${checked} onchange="onMonStatusChange('${tgl}','${p.nama}',this.value)">
                            <label class="mon-status-label" for="${safeId}">${s}</label>`;
                }).join('');

                const showKet = (status !== 'Hadir') ? 'visible' : '';
                const rowClass = status === 'Hadir' ? 'hadir' : status === 'Sakit' ? 'sakit' : 'tidak-hadir';

                html += `<div class="monitoring-penyadap-row ${rowClass}" id="monrow_${tgl}_${p.nama.replace(/\s+/g,'_')}">
                    <div class="mon-penyadap-name">👤 ${p.nama}</div>
                    <div class="mon-status-select-group">${radios}</div>
                    <input type="text" class="mon-keterangan-input ${showKet}" id="monket_${tgl}_${p.nama.replace(/\s+/g,'_')}" placeholder="Keterangan..." value="${ket}" oninput="onMonKetChange('${tgl}','${p.nama}',this.value)">
                </div>`;
            });

            html += '</div></div>';
        });

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
            row.className = `monitoring-penyadap-row ${status === 'Hadir' ? 'hadir' : status === 'Sakit' ? 'sakit' : 'tidak-hadir'}`;
        }
        if (ketEl) {
            ketEl.classList.toggle('visible', status !== 'Hadir');
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
        setEl('monHadirCount',     hadir);
        setEl('monTidakHadirCount', tidakHadir);
        setEl('monSakitCount',      sakit);
        setEl('monLainnyaCount',    lainnya);
    }

    // ======================== 7. MAP VISUALIZER ========================
    const predefinedBlocks = ['P.01 - B.01', 'P.02 - B.05', 'P.03 - B.12', 'P.04 - B.08', 'P.05 - B.03', 'P.06 - B.10'];
    const mapBlocks = document.querySelectorAll('.map-block');

    function renderMap(records) {
        const allPetak = getPetakList().map(b => b.kode);
        const useBlocks = allPetak.length ? allPetak : predefinedBlocks;
        mapDataCache = [];

        useBlocks.forEach(b => {
            const br = records.filter(r => r.petak === b);
            const avg = br.length > 0 ? br.reduce((s, r) => s + r.estimasi_hasil, 0) / br.length : 0;
            const latest = br[0] || { tanggal: '-', nama_penyadap: 'Belum ada', kondisi_lapangan: 'Normal', kendala: 'Tidak ada' };
            const cond = latest.kondisi_lapangan;
            let status = 'hijau', statusText = 'Produksi Baik';
            if (avg < 5 || cond === 'Pohon Rusak' || cond === 'Wadah Rusak') { status = 'merah'; statusText = 'Perlu Pengecekan'; }
            else if (avg <= 15 || cond === 'Hujan') { status = 'kuning'; statusText = 'Produksi Menurun'; }
            mapDataCache.push({ petak: b, avg_produksi: +avg.toFixed(1), terakhir_update: latest.tanggal, penyadap_terakhir: latest.nama_penyadap, kondisi_terakhir: latest.kondisi_lapangan, kendala_terakhir: latest.kendala || 'Tidak ada', status, status_text: statusText });
        });

        mapDataCache.forEach(block => {
            const el = document.querySelector(`.map-block[data-block-id="${block.petak}"]`);
            if (el) { el.classList.remove('hijau', 'kuning', 'merah'); el.classList.add(block.status); }
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
        document.getElementById('detailEmptyState').style.display  = 'none';
        document.getElementById('detailActiveState').style.display = 'block';
        document.getElementById('det-petak-name').textContent = info.petak;
        const badge = document.getElementById('det-status-badge');
        badge.textContent = info.status_text;
        badge.className   = 'badge-status ' + info.status;
        document.getElementById('det-avg-prod').textContent    = `${info.avg_produksi} kg`;
        document.getElementById('det-last-worker').textContent = info.penyadap_terakhir;
        document.getElementById('det-last-cond').textContent   = info.kondisi_terakhir;
        document.getElementById('det-last-issue').textContent  = info.kendala_terakhir;
        document.getElementById('det-last-update').textContent = formatDateDMY(info.terakhir_update);
    }

    // ======================== 8. TABEL LAPORAN ========================
    function renderReportTable(records) {
        const search    = document.getElementById('filter-search')?.value.toLowerCase().trim() || '';
        const petak     = document.getElementById('filter-petak')?.value || '';
        const startDate = document.getElementById('filter-start-date')?.value || '';
        const endDate   = document.getElementById('filter-end-date')?.value || '';

        let filtered = [...records];
        if (search)    filtered = filtered.filter(r => r.nama_penyadap.toLowerCase().includes(search) || (r.kendala || '').toLowerCase().includes(search));
        if (petak)     filtered = filtered.filter(r => r.petak === petak);
        if (startDate) filtered = filtered.filter(r => r.tanggal >= startDate);
        if (endDate)   filtered = filtered.filter(r => r.tanggal <= endDate);

        const tbody = document.querySelector('#reportsTable tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!filtered.length) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:30px;">Tidak ditemukan data yang cocok dengan filter.</td></tr>';
            return;
        }
        filtered.forEach(item => {
            const tr = document.createElement('tr');
            let condBadge = `<span style="font-weight:700;color:#2d6a4f;">${item.kondisi_lapangan}</span>`;
            if (item.kondisi_lapangan === 'Hujan') condBadge = `<span style="font-weight:700;color:#f4a261;">${item.kondisi_lapangan}</span>`;
            else if (item.kondisi_lapangan === 'Pohon Rusak' || item.kondisi_lapangan === 'Wadah Rusak') condBadge = `<span style="font-weight:700;color:#e63946;">${item.kondisi_lapangan}</span>`;
            tr.innerHTML = `
                <td><strong>${formatDateDMY(item.tanggal)}</strong></td>
                <td>${item.nama_penyadap}</td>
                <td><code style="background:#edf2f7;padding:4px 8px;border-radius:4px;font-weight:600;">${item.petak}</code></td>
                <td><strong>${item.estimasi_hasil} kg</strong></td>
                <td>${condBadge}</td>
                <td>${item.kendala ? `<span style="color:#d90429;font-weight:600;">${item.kendala}</span>` : '<span style="color:#718096;font-style:italic;">Tidak ada</span>'}</td>`;
            tbody.appendChild(tr);
        });
        tbody.dataset.filteredJson = JSON.stringify(filtered);
    }

    document.getElementById('btnFilterApply')?.addEventListener('click', () => renderReportTable(globalRecords));

    // ======================== 9. EXPORT & PRINT ========================
    document.getElementById('btnExportCSV')?.addEventListener('click', () => {
        const tbody = document.querySelector('#reportsTable tbody');
        const data  = JSON.parse(tbody?.dataset.filteredJson || '[]');
        if (!data.length) { showToast('Tidak ada data untuk diekspor.', 'warning'); return; }
        let csv = 'data:text/csv;charset=utf-8,ID,Tanggal,Nama Penyadap,Petak/Blok,Estimasi Hasil (kg),Kondisi Lapangan,Kendala\n';
        data.forEach(r => {
            csv += [r.id, r.tanggal, `"${(r.nama_penyadap||'').replace(/"/g,'""')}"`, `"${(r.petak||'').replace(/"/g,'""')}"`, r.estimasi_hasil, `"${(r.kondisi_lapangan||'').replace(/"/g,'""')}"`, `"${(r.kendala||'').replace(/"/g,'""')}"`].join(',') + '\n';
        });
        const a = document.createElement('a');
        a.href = encodeURI(csv);
        a.download = `laporan_sipena_${todayStr()}.csv`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    });

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
            const cur  = prog * (end - start) + start;
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

    // Load data & render dashboard
    loadAllData(records => {
        renderDashboard(records);
        // Also update filter petak dropdown
        populatePetakDropdowns();

        // Render mandor table if active
        const activeTab = document.querySelector('.sidebar-menu li.active')?.getAttribute('data-tab');
        if (activeTab === 'mandor') renderMandorTable();
        else if (activeTab === 'petak-target') renderPetakTargetTable();
    });
});
