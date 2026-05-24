// assets/js/app.js
// JavaScript for SIPENA PINUS Dashboard (Google Sheets & Demo Mode)

// =========================================================================
// CONFIGURATION: SALIN URL WEB APP GOOGLE APPS SCRIPT ANDA DI SINI
// Contoh: "https://script.google.com/macros/s/AKfycbz.../exec"
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwTelvmwcTnXUKYx_CQKfUg82nltxUNWjHsckbCO9vNj3My_VYl2huNYqmqJZKhzO61Kg/exec";
// =========================================================================

document.addEventListener('DOMContentLoaded', function () {

    // Elements
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    const menuItems = document.querySelectorAll('.sidebar-menu li');
    const tabContents = document.querySelectorAll('.tab-content');

    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');

    // Banners
    const cloudConnectionBanner = document.getElementById('cloudConnectionBanner');
    const demoModeBanner = document.getElementById('demoModeBanner');

    // Stats Elements
    const statTotalProd = document.getElementById('stat-total-prod');
    const statAvgDaily = document.getElementById('stat-avg-daily');
    const statWorkers = document.getElementById('stat-workers');
    const statBlocks = document.getElementById('stat-blocks');
    const statIssues = document.getElementById('stat-issues');

    // Filter & Export Elements
    const btnFilterApply = document.getElementById('btnFilterApply');
    const btnExportCSV = document.getElementById('btnExportCSV');
    const btnPrintReport = document.getElementById('btnPrintReport');
    const printDateSpan = document.getElementById('printDateSpan');

    // Map Panel Elements
    const detailEmptyState = document.getElementById('detailEmptyState');
    const detailActiveState = document.getElementById('detailActiveState');
    const mapBlocks = document.querySelectorAll('.map-block');

    // Global caches and chart instances
    let charts = {};
    let globalRecords = [];
    let mapDataCache = [];

    // Predefined blocks list
    const predefinedBlocks = ['P.01 - B.01', 'P.02 - B.05', 'P.03 - B.12', 'P.04 - B.08', 'P.05 - B.03', 'P.06 - B.10'];

    // ================= 1. TAB ROUTING & NAVIGATION =================

    if (menuToggle) {
        menuToggle.addEventListener('click', function () {
            sidebar.classList.toggle('active');
        });
    }

    document.addEventListener('click', function (event) {
        const isClickInside = sidebar.contains(event.target) || menuToggle.contains(event.target);
        if (!isClickInside && sidebar.classList.contains('active') && window.innerWidth <= 768) {
            sidebar.classList.remove('active');
        }
    });

    menuItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();

            const targetTab = this.getAttribute('data-tab');

            menuItems.forEach(li => li.classList.remove('active'));
            this.classList.add('active');

            tabContents.forEach(tc => tc.classList.remove('active'));
            document.getElementById('tab-' + targetTab).classList.add('active');

            updatePageHeader(targetTab);

            // Render view from cached global records
            renderTabView(targetTab);

            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
            }
        });
    });

    function updatePageHeader(tabName) {
        switch (tabName) {
            case 'dashboard':
                pageTitle.textContent = "Dashboard Monitoring";
                pageSubtitle.textContent = "Sistem Monitoring Produksi Getah Berbasis Mandor & Wilayah Sadap";
                break;
            case 'input-data':
                pageTitle.textContent = "Input Data Lapangan";
                pageSubtitle.textContent = "Formulir Input Data Produksi bagi Mandor di Lapangan";
                break;
            case 'peta-wilayah':
                pageTitle.textContent = "Pemetaan Wilayah Sadap";
                pageSubtitle.textContent = "Visualisasi Status Produktivitas dan Kondisi Petak Hutan Pinus";
                break;
            case 'laporan':
                pageTitle.textContent = "Laporan & Evaluasi Produksi";
                pageSubtitle.textContent = "Tabel Rekapitulasi Data dan Ekspor Laporan Produksi";
                break;
        }
    }

    // Render tab views from our current loaded dataset
    function renderTabView(tabName) {
        if (tabName === 'dashboard') {
            renderDashboard(globalRecords);
        } else if (tabName === 'peta-wilayah') {
            renderMap(globalRecords);
        } else if (tabName === 'laporan') {
            renderReportTable(globalRecords);
        }
    }

    // ================= 2. CLIENT-SIDE DATA ENGINE (MOCK & SYNC) =================

    // Generate mock database for initial demo run
    function getInitialMockData() {
        const mockData = [];
        const penyadapList = ['Slamet', 'Kardi', 'Sukijo', 'Tukimin', 'Wawan', 'Budi'];
        const workerBlocks = {
            'Slamet': 'P.01 - B.01',
            'Budi': 'P.02 - B.05',
            'Sukijo': 'P.03 - B.12',
            'Tukimin': 'P.04 - B.08',
            'Wawan': 'P.05 - B.03',
            'Kardi': 'P.06 - B.10'
        };
        const conditions = ['Normal', 'Hujan', 'Pohon Rusak', 'Wadah Rusak'];

        for (let i = 30; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toISOString().split('T')[0];

            // Shuffle workers and pick a random subset (4 to 6 workers daily)
            const shuffledWorkers = [...penyadapList].sort(() => 0.5 - Math.random());
            const activeCount = Math.floor(Math.random() * 3) + 4; // 4 to 6
            const activeWorkers = shuffledWorkers.slice(0, activeCount);

            activeWorkers.forEach(worker => {
                const petak = workerBlocks[worker];
                let kondisi = 'Normal';
                let kendala = '';
                const condRand = Math.floor(Math.random() * 100);

                if (worker === 'Wawan') {
                    // Wawan's block has issues more often in our simulation
                    if (condRand < 25) {
                        kondisi = 'Pohon Rusak';
                        kendala = 'Kulit sadap kering & keras';
                    } else if (condRand < 40) {
                        kondisi = 'Wadah Rusak';
                        kendala = 'Wadah bocor';
                    } else if (condRand < 55) {
                        kondisi = 'Hujan';
                        kendala = 'Air masuk ke wadah';
                    }
                } else {
                    if (condRand < 10) {
                        kondisi = 'Hujan';
                        kendala = 'Hujan deras, getah encer';
                    } else if (condRand < 13) {
                        kondisi = 'Wadah Rusak';
                        kendala = 'Wadah bocor';
                    } else if (condRand < 15) {
                        kondisi = 'Pohon Rusak';
                        kendala = 'Saluran getah tersumbat';
                    }
                }

                let baseYield = 15.0;
                if (worker === 'Slamet') {
                    baseYield = 20.5; // Highly productive block
                } else if (worker === 'Sukijo') {
                    // Gradual decline over the 30 days to yellow status
                    const declineFactor = (30 - i) / 30;
                    baseYield = 14.0 - (declineFactor * 6.5);
                } else if (worker === 'Wawan') {
                    baseYield = 4.5; // Poor yield / red status
                }

                const variance = (Math.random() * 4) - 2; // -2 to +2
                let estimasiHasil = baseYield + variance;

                if (kondisi === 'Hujan') estimasiHasil *= 0.6;
                else if (kondisi === 'Pohon Rusak') estimasiHasil *= 0.4;
                else if (kondisi === 'Wadah Rusak') {
                    estimasiHasil *= 0.5;
                    if (!kendala) kendala = 'Wadah bocor';
                }

                estimasiHasil = Math.max(0.5, parseFloat(estimasiHasil.toFixed(1)));

                mockData.push({
                    id: 'mock-' + Math.random().toString(36).substr(2, 9),
                    tanggal: dateString,
                    nama_penyadap: worker,
                    petak: petak,
                    estimasi_hasil: estimasiHasil,
                    kondisi_lapangan: kondisi,
                    kendala: kendala,
                    timestamp: date.toISOString()
                });
            });
        }
        return mockData;
    }

    // Unified loader supporting local fallback, localStorage caching, and Apps Script API
    function loadAllData(callback) {
        if (!WEB_APP_URL) {
            // ================= DEMO MODE =================
            demoModeBanner.style.display = 'flex';
            if (cloudConnectionBanner) cloudConnectionBanner.style.display = 'none';

            let demoData = JSON.parse(localStorage.getItem('sipena_demo_entries'));
            if (!demoData || demoData.length === 0) {
                demoData = getInitialMockData();
                localStorage.setItem('sipena_demo_entries', JSON.stringify(demoData));
            }
            // Sort by date desc
            demoData.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

            globalRecords = demoData;
            callback(demoData);
            return;
        }

        // ================= CLOUD MODE =================
        demoModeBanner.style.display = 'none';
        if (cloudConnectionBanner) cloudConnectionBanner.style.display = 'flex';

        const loadCachedData = () => {
            console.log("Loading dashboard from local offline cache.");
            let cached = JSON.parse(localStorage.getItem('sipena_last_dashboard_data'));
            if (!cached || cached.length === 0) {
                cached = getInitialMockData(); // Ultimate fallback
            }
            cached.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
            globalRecords = cached;
            callback(cached);
        };

        if (navigator.onLine) {
            fetch(WEB_APP_URL)
                .then(res => res.json())
                .then(res => {
                    if (res.status === 'success' && res.data) {
                        const rows = res.data;
                        // Format types to match (floats, dates, etc.)
                        const formatted = rows.map(r => ({
                            id: r.id || 'cloud-' + Math.random().toString(36).substr(2, 9),
                            tanggal: r.tanggal || '',
                            nama_penyadap: r.nama_penyadap || '',
                            petak: r.petak || '',
                            estimasi_hasil: parseFloat(r.estimasi_hasil) || 0,
                            kondisi_lapangan: r.kondisi_lapangan || 'Normal',
                            kendala: r.kendala || ''
                        }));

                        // Sort by date desc
                        formatted.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

                        // Store in cache for offline use
                        localStorage.setItem('sipena_last_dashboard_data', JSON.stringify(formatted));

                        globalRecords = formatted;
                        callback(formatted);
                    } else {
                        loadCachedData();
                    }
                })
                .catch(err => {
                    console.error("API request failed:", err);
                    loadCachedData();
                });
        } else {
            loadCachedData();
        }
    }

    // ================= 3. RENDER METRICS & CHARTS =================

    function renderDashboard(records) {
        if (!records || records.length === 0) return;

        // --- A. Compute Key Metrics ---

        // 1. Total Produksi
        const totalProd = records.reduce((sum, r) => sum + r.estimasi_hasil, 0);

        // 2. Average Daily Yield (Sum of yields / count of distinct dates)
        const dailySums = {};
        records.forEach(r => {
            dailySums[r.tanggal] = (dailySums[r.tanggal] || 0) + r.estimasi_hasil;
        });
        const datesCount = Object.keys(dailySums).length || 1;
        const avgDaily = totalProd / datesCount;

        // 3. Active Workers (last 30 days)
        const uniqueWorkers = new Set();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        records.forEach(r => {
            if (new Date(r.tanggal) >= thirtyDaysAgo) {
                uniqueWorkers.add(r.nama_penyadap);
            }
        });

        // 4. Active blocks
        const uniqueBlocks = new Set();
        records.forEach(r => {
            if (new Date(r.tanggal) >= thirtyDaysAgo) {
                uniqueBlocks.add(r.petak);
            }
        });

        // 5. Active issues
        const issuesCount = records.filter(r => r.kondisi_lapangan !== 'Normal' && new Date(r.tanggal) >= thirtyDaysAgo).length;

        // Update stats widgets with animation
        animateValue(statTotalProd, totalProd, ' kg');
        animateValue(statAvgDaily, avgDaily, ' kg');
        animateValue(statWorkers, uniqueWorkers.size || 6, ' orang');
        animateValue(statBlocks, uniqueBlocks.size || 6, ' petak');
        animateValue(statIssues, issuesCount, ' kasus');

        // --- B. Prepare Data for Charts ---

        // Chart 1: Rekap Produksi Per Petak
        const petakTotals = {};
        records.forEach(r => {
            petakTotals[r.petak] = (petakTotals[r.petak] || 0) + r.estimasi_hasil;
        });
        // Sort blocks by key name
        const labelsPetak = Object.keys(petakTotals).sort();
        const valsPetak = labelsPetak.map(l => parseFloat(petakTotals[l].toFixed(1)));

        // Chart 2: Produksi Per Penyadap (Leaderboard)
        const workerTotals = {};
        records.forEach(r => {
            workerTotals[r.nama_penyadap] = (workerTotals[r.nama_penyadap] || 0) + r.estimasi_hasil;
        });
        // Sort workers descending
        const sortedWorkers = Object.keys(workerTotals).sort((a, b) => workerTotals[b] - workerTotals[a]);
        const labelsWorkers = sortedWorkers;
        const valsWorkers = sortedWorkers.map(w => parseFloat(workerTotals[w].toFixed(1)));

        // Chart 3: Tren Harian (last 15 days of records)
        const labelsTren = Object.keys(dailySums).sort().slice(-15);
        const valsTren = labelsTren.map(d => parseFloat(dailySums[d].toFixed(1)));
        const formattedLabelsTren = labelsTren.map(formatDateDMY);

        // Chart 4: Kondisi Lapangan
        const conditionCounts = {};
        records.forEach(r => {
            conditionCounts[r.kondisi_lapangan] = (conditionCounts[r.kondisi_lapangan] || 0) + 1;
        });
        const labelsCond = Object.keys(conditionCounts);
        const valsCond = labelsCond.map(c => conditionCounts[c]);

        // Recent Issues list
        const recentIssues = records
            .filter(r => r.kondisi_lapangan !== 'Normal' && r.kendala)
            .slice(0, 10);

        // --- C. Render Charts via Chart.js ---
        const greenPrimary = '#1b4332';
        const greenLight = '#40916c';
        const greenAccent = '#52b788';
        const redAlert = '#e63946';
        const yellowWarning = '#f4a261';

        // Render Bar Chart 1
        initOrUpdateChart('chartPetak', 'bar', {
            labels: labelsPetak,
            datasets: [{
                label: 'Total Getah (kg)',
                data: valsPetak,
                backgroundColor: greenLight,
                borderColor: greenPrimary,
                borderWidth: 1.5,
                borderRadius: 6
            }]
        }, {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        });

        // Render Horizontal Bar Chart 2
        initOrUpdateChart('chartPenyadap', 'bar', {
            labels: labelsWorkers,
            datasets: [{
                label: 'Total Hasil (kg)',
                data: valsWorkers,
                backgroundColor: greenAccent,
                borderColor: greenLight,
                borderWidth: 1.5,
                borderRadius: 6
            }]
        }, {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: { legend: { display: false } },
            scales: { x: { beginAtZero: true } }
        });

        // Render Line Chart 3
        initOrUpdateChart('chartTren', 'line', {
            labels: formattedLabelsTren,
            datasets: [{
                label: 'Produksi (kg)',
                data: valsTren,
                borderColor: greenPrimary,
                backgroundColor: 'rgba(45, 106, 79, 0.08)',
                fill: true,
                tension: 0.3,
                borderWidth: 3,
                pointBackgroundColor: greenLight,
                pointBorderColor: '#ffffff',
                pointRadius: 4
            }]
        }, {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        });

        // Render Doughnut Chart 4
        const condColors = labelsCond.map(c => {
            if (c === 'Normal') return greenLight;
            if (c === 'Hujan') return '#a2d2ff';
            if (c === 'Pohon Rusak') return redAlert;
            if (c === 'Wadah Rusak') return yellowWarning;
            return '#cbd5e0';
        });

        initOrUpdateChart('chartKondisi', 'doughnut', {
            labels: labelsCond,
            datasets: [{
                data: valsCond,
                backgroundColor: condColors,
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        }, {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { boxWidth: 12, font: { family: 'Outfit', size: 11 } }
                }
            },
            cutout: '60%'
        });

        // Render Issues HTML List
        renderRecentIssues(recentIssues);
    }

    function initOrUpdateChart(canvasId, type, data, options) {
        if (charts[canvasId]) {
            charts[canvasId].destroy();
        }
        const ctx = document.getElementById(canvasId).getContext('2d');
        charts[canvasId] = new Chart(ctx, { type, data, options });
    }

    function renderRecentIssues(issues) {
        const listContainer = document.getElementById('activeIssuesList');
        listContainer.innerHTML = '';

        if (issues.length === 0) {
            listContainer.innerHTML = '<div class="no-issues">Tidak ada kendala aktif dalam 30 hari terakhir.</div>';
            return;
        }

        issues.forEach(item => {
            const itemDiv = document.createElement('div');
            const isCritical = item.kondisi_lapangan === 'Pohon Rusak' || item.kondisi_lapangan === 'Wadah Rusak';
            itemDiv.className = `issue-item ${isCritical ? '' : 'kuning'}`;

            itemDiv.innerHTML = `
                <div class="issue-meta">
                    <span>${item.petak}</span>
                    <span>${formatDateDMY(item.tanggal)}</span>
                </div>
                <div class="issue-desc">${item.kendala}</div>
                <div class="issue-context">Kondisi: <strong>${item.kondisi_lapangan}</strong> | Penyadap: <strong>${item.nama_penyadap}</strong></div>
            `;
            listContainer.appendChild(itemDiv);
        });
    }

    function animateValue(obj, endValue, suffix = '') {
        let start = 0;
        let duration = 600;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const current = progress * (endValue - start) + start;

            if (Number.isInteger(endValue)) {
                obj.innerHTML = Math.floor(current) + suffix;
            } else {
                obj.innerHTML = current.toFixed(1) + suffix;
            }
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    // ================= 4. MAP VISUALIZER =================

    function renderMap(records) {
        mapDataCache = [];

        predefinedBlocks.forEach(b => {
            // Get records for block
            const blockRecords = records.filter(r => r.petak === b);

            // Average yield
            const avg = blockRecords.length > 0
                ? blockRecords.reduce((sum, r) => sum + r.estimasi_hasil, 0) / blockRecords.length
                : 0;

            // Latest entry details
            const latest = blockRecords[0] || {
                tanggal: '-',
                nama_penyadap: 'Belum ada',
                kondisi_lapangan: 'Normal',
                kendala: 'Tidak ada'
            };

            // Determine status
            let status = 'hijau';
            let statusText = 'Produksi Baik';

            const cond = latest.kondisi_lapangan;
            if (avg < 5.0 || cond === 'Pohon Rusak' || cond === 'Wadah Rusak') {
                status = 'merah';
                statusText = 'Perlu Pengecekan';
            } else if (avg <= 15.0 || cond === 'Hujan') {
                status = 'kuning';
                statusText = 'Produksi Menurun';
            }

            mapDataCache.push({
                petak: b,
                avg_produksi: parseFloat(avg.toFixed(1)),
                terakhir_update: latest.tanggal,
                penyadap_terakhir: latest.nama_penyadap,
                kondisi_terakhir: latest.kondisi_lapangan,
                kendala_terakhir: latest.kendala || 'Tidak ada',
                status: status,
                status_text: statusText
            });
        });

        // Color the SVG map elements
        mapDataCache.forEach(block => {
            const mapEl = document.querySelector(`.map-block[data-block-id="${block.petak}"]`);
            if (mapEl) {
                mapEl.classList.remove('hijau', 'kuning', 'merah');
                mapEl.classList.add(block.status);
            }
        });

        // Refresh details card if selection is active
        const selectedBlockEl = document.querySelector('.map-block.selected');
        if (selectedBlockEl) {
            showBlockDetails(selectedBlockEl.getAttribute('data-block-id'));
        }
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

        detailEmptyState.style.display = 'none';
        detailActiveState.style.display = 'block';

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


    // ================= 5. TABLE REPORT FILTERING =================

    function renderReportTable(records) {
        const search = document.getElementById('filter-search').value.toLowerCase().trim();
        const petak = document.getElementById('filter-petak').value;
        const startDate = document.getElementById('filter-start-date').value;
        const endDate = document.getElementById('filter-end-date').value;

        // Apply filters locally in browser
        let filtered = [...records];

        if (search) {
            filtered = filtered.filter(r =>
                r.nama_penyadap.toLowerCase().includes(search) ||
                r.kendala.toLowerCase().includes(search)
            );
        }
        if (petak) {
            filtered = filtered.filter(r => r.petak === petak);
        }
        if (startDate) {
            filtered = filtered.filter(r => r.tanggal >= startDate);
        }
        if (endDate) {
            filtered = filtered.filter(r => r.tanggal <= endDate);
        }

        const tableBody = document.querySelector('#reportsTable tbody');
        tableBody.innerHTML = '';

        if (filtered.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">Tidak ditemukan data yang cocok dengan filter.</td></tr>';
            return;
        }

        filtered.forEach(item => {
            const tr = document.createElement('tr');
            let condBadge = `<span style="font-weight: 700; color: #2d6a4f;">${item.kondisi_lapangan}</span>`;
            if (item.kondisi_lapangan === 'Hujan') {
                condBadge = `<span style="font-weight: 700; color: #f4a261;">${item.kondisi_lapangan}</span>`;
            } else if (item.kondisi_lapangan === 'Pohon Rusak' || item.kondisi_lapangan === 'Wadah Rusak') {
                condBadge = `<span style="font-weight: 700; color: #e63946;">${item.kondisi_lapangan}</span>`;
            }

            tr.innerHTML = `
                <td><strong>${formatDateDMY(item.tanggal)}</strong></td>
                <td>${item.nama_penyadap}</td>
                <td><code style="background-color: #edf2f7; padding: 4px 8px; border-radius: 4px; font-weight: 600;">${item.petak}</code></td>
                <td><strong>${item.estimasi_hasil} kg</strong></td>
                <td>${condBadge}</td>
                <td>${item.kendala ? `<span style="color:#d90429; font-weight: 600;">${item.kendala}</span>` : '<span style="color:#718096; font-style: italic;">Tidak ada</span>'}</td>
            `;
            tableBody.appendChild(tr);
        });

        // Store a reference to currently filtered data for CSV export
        tableBody.dataset.filteredJson = JSON.stringify(filtered);
    }

    if (btnFilterApply) {
        btnFilterApply.addEventListener('click', () => renderReportTable(globalRecords));
    }


    // ================= 6. CSV EXPORTS & PRINT =================

    if (btnExportCSV) {
        btnExportCSV.addEventListener('click', function () {
            const tableBody = document.querySelector('#reportsTable tbody');
            const dataStr = tableBody.dataset.filteredJson;
            if (!dataStr) {
                alert('Tabel laporan belum dimuat.');
                return;
            }
            const data = JSON.parse(dataStr);
            downloadCSV(data);
        });
    }

    function downloadCSV(data) {
        if (data.length === 0) {
            alert('Tidak ada data untuk diekspor!');
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "ID,Tanggal,Nama Penyadap,Petak/Blok,Estimasi Hasil (kg),Kondisi Lapangan,Kendala\n";

        data.forEach(row => {
            const fields = [
                row.id,
                row.tanggal,
                `"${row.nama_penyadap.replace(/"/g, '""')}"`,
                `"${row.petak.replace(/"/g, '""')}"`,
                row.estimasi_hasil,
                `"${row.kondisi_lapangan.replace(/"/g, '""')}"`,
                `"${(row.kendala || '').replace(/"/g, '""')}"`
            ];
            csvContent += fields.join(",") + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);

        const dateStr = new Date().toISOString().split('T')[0];
        link.setAttribute("download", `laporan_produksi_sipena_${dateStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    if (btnPrintReport) {
        btnPrintReport.addEventListener('click', function () {
            const today = new Date();
            const dateStr = formatDateDMY(today.toISOString().split('T')[0]) + ' ' + String(today.getHours()).padStart(2, '0') + ':' + String(today.getMinutes()).padStart(2, '0');
            if (printDateSpan) printDateSpan.textContent = dateStr;
            window.print();
        });
    }

    // ================= 7. INTER-IFRAME COMMUNICATION =================

    window.addEventListener('message', function (event) {
        if (event.data && event.data.type === 'SIPENA_SUBMIT_SUCCESS') {
            console.log("Submit sukses dideteksi! Me-refresh database...");
            // Force reload data
            loadAllData(records => {
                const activeTab = document.querySelector('.sidebar-menu li.active').getAttribute('data-tab');
                renderTabView(activeTab);
            });
        }
    });

    // ================= HELPERS =================

    function formatDateDMY(dateString) {
        if (!dateString || dateString === '-') return '-';
        const parts = dateString.split(' ')[0].split('-'); // Split out time if any
        if (parts.length !== 3) return dateString;
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    // ================= INITIAL RUN =================
    loadAllData(records => {
        renderDashboard(records);
    });
});
