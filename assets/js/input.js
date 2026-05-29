// assets/js/input.js
// Javascript for SIPENA PINUS Input Form (Google Sheets & Demo Mode)

// =========================================================================
// CONFIGURATION: SALIN URL WEB APP GOOGLE APPS SCRIPT ANDA DI SINI
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwTelvmwcTnXUKYx_CQKfUg82nltxUNWjHsckbCO9vNj3My_VYl2huNYqmqJZKhzO61Kg/exec";
// =========================================================================

document.addEventListener('DOMContentLoaded', function () {
    let isSyncingEntries = false;
    let lastToastTime = 0;
    let toastTimeout = null;
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
            showToast('📶 Disimpan offline. Akan disinkronkan saat terhubung internet.', false);
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
                    showToast(`🔄 Berhasil sinkron ${syncedCount} data offline ke Google Sheets!`);
                }, delay);
            }
            if (callback) callback();
        }).catch(err => {
            isSyncingOffline = false;
            console.error("Gagal sinkron aksi offline input:", err);
            if (callback) callback();
        });
    }

    // Form Elements
    const form = document.getElementById('productionForm');
    const selectBkph = document.getElementById('bkph');
    const selectRph = document.getElementById('rph');
    const selectTpg = document.getElementById('tpg');
    const selectPetak = document.getElementById('petak');
    const selectPenyadap = document.getElementById('nama_penyadap');

    const inputKondisi = document.getElementById('kondisi_lapangan');
    const inputKendala = document.getElementById('kendala');

    const bannerOffline = document.getElementById('offlineBanner');
    const netStatusIcon = document.getElementById('network-status-icon');
    const toast = document.getElementById('toast');
    const btnSubmit = document.getElementById('btnSubmit');

    // Modal elements
    const modalPenyadap = document.getElementById('modalPenyadap');
    const modalPetak = document.getElementById('modalPetak');

    const btnAddPenyadap = document.getElementById('btnAddPenyadap');
    const btnAddPetak = document.getElementById('btnAddPetak');

    const btnClosePenyadapModal = document.getElementById('btnClosePenyadapModal');
    const btnClosePetakModal = document.getElementById('btnClosePetakModal');

    const btnCancelPenyadap = document.getElementById('btnCancelPenyadap');
    const btnCancelPetak = document.getElementById('btnCancelPetak');

    const btnSaveNewPenyadap = document.getElementById('btnSaveNewPenyadap');
    const btnSaveNewPetak = document.getElementById('btnSaveNewPetak');

    const newPenyadapNameInput = document.getElementById('new_penyadap_name');
    const newPetakNameInput = document.getElementById('new_petak_name');

    // Active Mandor context
    let activeMandorId = null;

    // Helper functions for LocalStorage Data Retrieval with Fallbacks
    function getList(key, defaultData) {
        try {
            const val = localStorage.getItem(key);
            if (val) return JSON.parse(val);
        } catch (e) { }
        return defaultData;
    }

    function getBkphList() {
        return getList('sipena_bkph', [
            { id_bkph: 'b1', kode_bkph: 'BKPH-BTR', nama_bkph: 'BKPH Bantarkawung', status: 'Aktif' }
        ]);
    }

    function getRphList() {
        return getList('sipena_rph', [
            { id_rph: 'r1', kode_rph: 'RPH-CKN', nama_rph: 'RPH Cikuning', id_bkph: 'b1', status: 'Aktif' },
            { id_rph: 'r2', kode_rph: 'RPH-TBS', nama_rph: 'RPH TB. Serang', id_bkph: 'b1', status: 'Aktif' },
            { id_rph: 'r3', kode_rph: 'RPH-TLG', nama_rph: 'RPH Telaga', id_bkph: 'b1', status: 'Aktif' },
            { id_rph: 'r4', kode_rph: 'RPH-BJS', nama_rph: 'RPH Banjarsari', id_bkph: 'b1', status: 'Aktif' },
            { id_rph: 'r5', kode_rph: 'RPH-KNS', nama_rph: 'RPH Kalinusu', id_bkph: 'b1', status: 'Aktif' }
        ]);
    }

    function getTpgList() {
        return getList('sipena_tpg', [
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
        ]);
    }

    function getPetakList() {
        return getList('sipena_petak', [
            { id: 'b1', id_petak: 'b1', kode: 'P.01', nomor_petak: 'P.01', anak_petak: '', luas: 12.5, id_tpg: 't1', pohon: 1200, status: 'Aktif' },
            { id: 'b2', id_petak: 'b2', kode: 'P.02', nomor_petak: 'P.02', anak_petak: '', luas: 15.0, id_tpg: 't6', pohon: 1500, status: 'Aktif' },
            { id: 'b3', id_petak: 'b3', kode: 'P.03', nomor_petak: 'P.03', anak_petak: '', luas: 10.0, id_tpg: 't12', pohon: 1000, status: 'Aktif' },
            { id: 'b4', id_petak: 'b4', kode: 'P.04', nomor_petak: 'P.04', anak_petak: '', luas: 13.0, id_tpg: 't14', pohon: 1300, status: 'Aktif' },
            { id: 'b5', id_petak: 'b5', kode: 'P.05', nomor_petak: 'P.05', anak_petak: '', luas: 11.5, id_tpg: 't15', pohon: 1100, status: 'Aktif' },
            { id: 'b6', id_petak: 'b6', kode: 'P.06', nomor_petak: 'P.06', anak_petak: '', luas: 14.0, id_tpg: 't2', pohon: 1400, status: 'Aktif' }
        ]);
    }

    function getPenyadapList() {
        return getList('sipena_penyadap', [
            { id: 'p1', id_penyadap: 'p1', nama: 'Slamet', nama_penyadap: 'Slamet', petak: 'P.01', id_petak: 'b1', id_mandor: 'm1', status: 'Aktif', pohon: 800 },
            { id: 'p2', id_penyadap: 'p2', nama: 'Budi', nama_penyadap: 'Budi', petak: 'P.02', id_petak: 'b2', id_mandor: 'm2', status: 'Aktif', pohon: 1000 },
            { id: 'p3', id_penyadap: 'p3', nama: 'Sukijo', nama_penyadap: 'Sukijo', petak: 'P.03', id_petak: 'b3', id_mandor: 'm1', status: 'Aktif', pohon: 700 },
            { id: 'p4', id_penyadap: 'p4', nama: 'Tukimin', nama_penyadap: 'Tukimin', petak: 'P.02', id_petak: 'b2', id_mandor: 'm2', status: 'Aktif', pohon: 900 },
            { id: 'p5', id_penyadap: 'p5', nama: 'Wawan', nama_penyadap: 'Wawan', petak: 'P.05', id_petak: 'b5', id_mandor: 'm3', status: 'Aktif', pohon: 800 },
            { id: 'p6', id_penyadap: 'p6', nama: 'Kardi', nama_penyadap: 'Kardi', petak: 'P.06', id_petak: 'b6', id_mandor: 'm3', status: 'Aktif', pohon: 950 }
        ]);
    }

    function getMandorList() {
        return getList('sipena_mandor', [
            { id: 'm1', id_mandor: 'm1', nama: 'Mandor Wawan', nama_mandor: 'Mandor Wawan', nik: '001', nomor_hp: '08123456789', id_tpg: 't1', petak: ['P.01', 'P.03'], status: 'Aktif' },
            { id: 'm2', id_mandor: 'm2', nama: 'Mandor Budi', nama_mandor: 'Mandor Budi', nik: '002', nomor_hp: '08123456780', id_tpg: 't6', petak: ['P.02', 'P.04'], status: 'Aktif' },
            { id: 'm3', id_mandor: 'm3', nama: 'Mandor Kardi', nama_mandor: 'Mandor Kardi', nik: '003', nomor_hp: '08123456781', id_tpg: 't15', petak: ['P.05', 'P.06'], status: 'Aktif' }
        ]);
    }

    // Dynamic Populator of Select Items
    function populateSelect(selectEl, data, valueKey, labelKey, placeholder) {
        selectEl.innerHTML = `<option value="" disabled selected>${placeholder}</option>`;
        data.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item[valueKey];
            opt.textContent = item[labelKey];
            selectEl.appendChild(opt);
        });
        selectEl.disabled = data.length === 0;
    }

    // Core Cascading Select System
    function initCascadingSelects() {
        const bkphList = getBkphList().filter(x => x.status === 'Aktif');
        populateSelect(selectBkph, bkphList, 'id_bkph', 'nama_bkph', '-- Pilih BKPH --');

        // BKPH change handler
        selectBkph.addEventListener('change', function () {
            const bkphId = this.value;
            const rphList = getRphList().filter(x => x.id_bkph === bkphId && x.status === 'Aktif');
            populateSelect(selectRph, rphList, 'id_rph', 'nama_rph', '-- Pilih RPH --');

            // Clear children
            selectTpg.innerHTML = '<option value="" disabled selected>-- Pilih TPG --</option>';
            selectTpg.disabled = true;
            selectPetak.innerHTML = '<option value="" disabled selected>-- Pilih Petak --</option>';
            selectPetak.disabled = true;
            selectPenyadap.innerHTML = '<option value="" disabled selected>-- Pilih Penyadap --</option>';
            selectPenyadap.disabled = true;
        });

        // RPH change handler
        selectRph.addEventListener('change', function () {
            const rphId = this.value;
            const tpgList = getTpgList().filter(x => x.id_rph === rphId && x.status === 'Aktif');
            populateSelect(selectTpg, tpgList, 'id_tpg', 'nama_tpg', '-- Pilih TPG --');

            // Clear children
            selectPetak.innerHTML = '<option value="" disabled selected>-- Pilih Petak --</option>';
            selectPetak.disabled = true;
            selectPenyadap.innerHTML = '<option value="" disabled selected>-- Pilih Penyadap --</option>';
            selectPenyadap.disabled = true;
        });

        // TPG change handler
        selectTpg.addEventListener('change', function () {
            const tpgId = this.value;
            const petakList = getPetakList().filter(x => x.id_tpg === tpgId && x.status === 'Aktif');
            populateSelect(selectPetak, petakList, 'id_petak', 'nomor_petak', '-- Pilih Petak --');

            // Clear children
            selectPenyadap.innerHTML = '<option value="" disabled selected>-- Pilih Penyadap --</option>';
            selectPenyadap.disabled = true;
        });

        // Petak change handler
        selectPetak.addEventListener('change', function () {
            const petakId = this.value;
            const penyadapList = getPenyadapList().filter(x => (x.id_petak === petakId || x.petak === getPetakCode(petakId)) && x.status === 'Aktif');
            populateSelect(selectPenyadap, penyadapList, 'id_penyadap', 'nama_penyadap', '-- Pilih Penyadap --');
        });
    }

    function getPetakCode(id) {
        const p = getPetakList().find(x => x.id_petak === id);
        return p ? (p.nomor_petak || p.kode) : '';
    }

    // Load initial context or fetch from Google Sheet Cloud
    function loadFormOptions() {
        initCascadingSelects();

        if (!WEB_APP_URL) return;

        // Cloud Mode: Fetch hierarchy lists from Google Sheets
        fetch(WEB_APP_URL)
            .then(res => res.json())
            .then(res => {
                if (res.status === 'success') {
                    if (res.bkph && res.bkph.length) localStorage.setItem('sipena_bkph', JSON.stringify(res.bkph));
                    if (res.rph && res.rph.length) localStorage.setItem('sipena_rph', JSON.stringify(res.rph));
                    if (res.tpg && res.tpg.length) localStorage.setItem('sipena_tpg', JSON.stringify(res.tpg));
                    if (res.petak && res.petak.length) localStorage.setItem('sipena_petak', JSON.stringify(res.petak));
                    if (res.penyadap && res.penyadap.length) localStorage.setItem('sipena_penyadap', JSON.stringify(res.penyadap));
                    if (res.mandor && res.mandor.length) localStorage.setItem('sipena_mandor', JSON.stringify(res.mandor));

                    // Re-populate with fresh cloud data
                    initCascadingSelects();

                    // If active mandor is present, resolve context again
                    if (activeMandorId) {
                        applyActiveMandorContext(activeMandorId);
                    }
                }
            })
            .catch(err => {
                console.warn("Gagal fetch metadata dari cloud, menggunakan local storage:", err);
            });
    }

    // Apply specific mandor view locking & context filters
    function applyActiveMandorContext(mandorId) {
        activeMandorId = mandorId;
        const mandorList = getMandorList();
        const activeM = mandorList.find(m => m.id === mandorId || m.id_mandor === mandorId);

        if (!activeM) return;

        const tpgId = activeM.id_tpg;
        const tpgList = getTpgList();
        const activeTpg = tpgList.find(t => t.id_tpg === tpgId);

        if (!activeTpg) return;

        const rphId = activeTpg.id_rph;
        const rphList = getRphList();
        const activeRph = rphList.find(r => r.id_rph === rphId);

        if (!activeRph) return;

        const bkphId = activeRph.id_bkph;
        const bkphList = getBkphList();
        const activeBkph = bkphList.find(b => b.id_bkph === bkphId);

        if (!activeBkph) return;

        // Auto-select and disable parent dropdowns to lock mandor view to their region
        selectBkph.value = bkphId;
        selectBkph.dispatchEvent(new Event('change'));

        selectRph.value = rphId;
        selectRph.dispatchEvent(new Event('change'));

        selectTpg.value = tpgId;
        selectTpg.dispatchEvent(new Event('change'));

        // Lock select dropdowns
        selectBkph.disabled = true;
        selectRph.disabled = true;
        selectTpg.disabled = true;

        // Parent inputs can be styled to look locked
        selectBkph.style.backgroundColor = '#edf2f7';
        selectRph.style.backgroundColor = '#edf2f7';
        selectTpg.style.backgroundColor = '#edf2f7';
    }

    // 2. Modals Inline Options adding
    btnAddPenyadap.addEventListener('click', () => modalPenyadap.classList.add('active'));
    btnAddPetak.addEventListener('click', () => modalPetak.classList.add('active'));

    const closeModal = (modalEl) => {
        modalEl.classList.remove('active');
        newPenyadapNameInput.value = '';
        newPetakNameInput.value = '';
    };

    btnClosePenyadapModal.addEventListener('click', () => closeModal(modalPenyadap));
    btnClosePetakModal.addEventListener('click', () => closeModal(modalPetak));
    btnCancelPenyadap.addEventListener('click', () => closeModal(modalPenyadap));
    btnCancelPetak.addEventListener('click', () => closeModal(modalPetak));

    btnSaveNewPenyadap.addEventListener('click', function () {
        const name = newPenyadapNameInput.value.trim();
        if (name) {
            const list = getPenyadapList();
            const petakId = selectPetak.value;
            if (!petakId) {
                alert('Silakan pilih Petak terlebih dahulu di form!');
                return;
            }

            const newP = {
                id: 'p' + Date.now(),
                id_penyadap: 'p' + Date.now(),
                nama: name,
                nama_penyadap: name,
                petak: getPetakCode(petakId),
                id_petak: petakId,
                id_mandor: activeMandorId || 'm1',
                status: 'Aktif',
                pohon: 800,
                luas: 1.5,
                target: 120,
                periode1: 10,
                periode2: 10
            };
            list.push(newP);
            localStorage.setItem('sipena_penyadap', JSON.stringify(list));

            // Populate and select
            const opt = document.createElement('option');
            opt.value = newP.id_penyadap;
            opt.textContent = name;
            selectPenyadap.appendChild(opt);
            selectPenyadap.value = newP.id_penyadap;
            selectPenyadap.disabled = false;
            closeModal(modalPenyadap);

            // Post metadata to cloud in background
            queueOfflineCrud({ action: 'savePenyadap', data: newP });
            if (navigator.onLine) {
                syncOfflineCrud();
            }
        } else {
            alert('Nama penyadap tidak boleh kosong!');
        }
    });

    btnSaveNewPetak.addEventListener('click', function () {
        const block = newPetakNameInput.value.trim();
        if (block) {
            const list = getPetakList();
            const tpgId = selectTpg.value;
            if (!tpgId) {
                alert('Silakan pilih TPG terlebih dahulu di form!');
                return;
            }

            const newB = {
                id: 'b' + Date.now(),
                id_petak: 'b' + Date.now(),
                kode: block,
                nomor_petak: block,
                anak_petak: '',
                luas: 10.0,
                id_tpg: tpgId,
                pohon: 1000,
                status: 'Aktif'
            };
            list.push(newB);
            localStorage.setItem('sipena_petak', JSON.stringify(list));

            // Populate and select
            const opt = document.createElement('option');
            opt.value = newB.id_petak;
            opt.textContent = block;
            selectPetak.appendChild(opt);
            selectPetak.value = newB.id_petak;
            selectPetak.disabled = false;
            closeModal(modalPetak);

            // Post metadata to cloud in background
            queueOfflineCrud({ action: 'savePetak', data: newB });
            if (navigator.onLine) {
                syncOfflineCrud();
            }
        } else {
            alert('Nomor petak tidak boleh kosong!');
        }
    });

    // 3. Set placeholder/hint for kendala based on kondisi
    inputKondisi.addEventListener('change', function () {
        const val = this.value;
        if (val === 'Normal') {
            inputKendala.placeholder = 'Tidak ada kendala';
            inputKendala.value = '';
        } else if (val === 'Hujan') {
            inputKendala.placeholder = 'Contoh: Getah encer kemasukan air';
            inputKendala.value = 'Hujan deras, getah encer';
        } else if (val === 'Pohon Rusak') {
            inputKendala.placeholder = 'Contoh: Kulit sadap kering';
            inputKendala.value = 'Kulit sadap kering';
        } else if (val === 'Wadah Rusak') {
            inputKendala.placeholder = 'Contoh: Wadah pecah / bocor';
            inputKendala.value = 'Wadah bocor';
        }
    });

    // 4. Form Submit Handler
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const pId = selectPenyadap.value;
        const pObj = getPenyadapList().find(x => x.id_penyadap === pId);

        const dateVal = document.getElementById('tanggal').value;
        const pDate = new Date(dateVal);
        const pNum = pDate.getDate() <= 15 ? 1 : 2;
        const mNum = pDate.getMonth() + 1;
        const yNum = pDate.getFullYear();

        const data = {
            id: 'c-' + Math.random().toString(36).substr(2, 9),
            tanggal: dateVal,
            periode: pNum,
            bulan: mNum,
            tahun: yNum,
            id_bkph: selectBkph.value,
            id_rph: selectRph.value,
            id_tpg: selectTpg.value,
            id_petak: selectPetak.value,
            anak_petak: pObj ? (pObj.anak_petak || '') : '',
            id_mandor: activeMandorId || (pObj ? pObj.id_mandor : 'm1'),
            id_penyadap: pId,
            nama_penyadap: pObj ? pObj.nama_penyadap : selectPenyadap.options[selectPenyadap.selectedIndex].text,
            petak: getPetakCode(selectPetak.value),
            estimasi_hasil: parseFloat(document.getElementById('estimasi_hasil').value),
            realisasi_produksi: parseFloat(document.getElementById('estimasi_hasil').value),
            kondisi_lapangan: inputKondisi.value,
            kendala: inputKendala.value.trim(),
            catatan: inputKendala.value.trim(),
            timestamp: new Date().toISOString()
        };

        if (!data.tanggal || !data.id_penyadap || !data.id_petak || isNaN(data.estimasi_hasil)) {
            showToast('⚠️ Mohon lengkapi semua field yang wajib!', true);
            return;
        }

        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Mengirim...';

        if (!WEB_APP_URL) {
            // Demo mode saving
            saveEntryDemoMode(data);
        } else {
            // Sync / Offline Mode saving
            saveEntryOffline(data);
            if (navigator.onLine) {
                syncOfflineEntries();
            }
        }
    });

    // Demo Mode Local Save
    function saveEntryDemoMode(data) {
        setTimeout(() => {
            let demoEntries = JSON.parse(localStorage.getItem('sipena_demo_entries')) || [];
            demoEntries.push(data);
            localStorage.setItem('sipena_demo_entries', JSON.stringify(demoEntries));

            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Kirim';
            showToast('✅ [Demo Mode] Data disimpan secara lokal!');
            resetForm();

            // Notify parent dashboard to reload
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({ type: 'SIPENA_SUBMIT_SUCCESS' }, '*');
            }
        }, 600);
    }

    // Offline Sync Database Save
    function saveEntryOffline(data) {
        let offlineEntries = [];
        try {
            offlineEntries = JSON.parse(localStorage.getItem('sipena_offline_entries')) || [];
        } catch (e) {
            offlineEntries = [];
        }

        offlineEntries.push(data);
        localStorage.setItem('sipena_offline_entries', JSON.stringify(offlineEntries));

        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Kirim';
        resetForm();
        if (!navigator.onLine) {
            showToast('📶 Tersimpan offline. Otomatis sinkron saat terhubung internet.');
        } else {
            showToast('✅ Laporan timbangan berhasil disimpan!');
        }
    }

    function resetForm() {
        form.reset();
        document.getElementById('tanggal').value = new Date().toISOString().split('T')[0];

        // Reset dropdown statuses
        selectBkph.disabled = false;
        selectRph.disabled = true;
        selectTpg.disabled = true;
        selectPetak.disabled = true;
        selectPenyadap.disabled = true;

        selectBkph.style.backgroundColor = '';
        selectRph.style.backgroundColor = '';
        selectTpg.style.backgroundColor = '';

        inputKondisi.value = 'Normal';
        inputKendala.value = '';
        inputKendala.placeholder = 'Isi kendala jika ada (contoh: Wadah bocor)';

        // Load / context restoration
        if (activeMandorId) {
            applyActiveMandorContext(activeMandorId);
        } else {
            initCascadingSelects();
        }
    }

    function showToast(message, isError = false) {
        if (toastTimeout) {
            clearTimeout(toastTimeout);
        }
        lastToastTime = Date.now();
        toast.querySelector('span').textContent = message;
        if (isError) {
            toast.classList.add('error');
        } else {
            toast.classList.remove('error');
        }
        toast.style.display = 'flex';

        toastTimeout = setTimeout(() => {
            toast.style.display = 'none';
            toastTimeout = null;
        }, 3500);
    }

    // 5. Connection State Handlers
    function updateOnlineStatus() {
        if (navigator.onLine) {
            bannerOffline.style.display = 'none';
            if (netStatusIcon) netStatusIcon.textContent = '📶 Online';
            if (WEB_APP_URL) {
                syncOfflineCrud(() => {
                    syncOfflineEntries();
                });
            }
        } else {
            bannerOffline.style.display = 'flex';
            if (netStatusIcon) netStatusIcon.textContent = '📶 Offline';
        }
    }

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus(); // Initial call

    function dequeueOfflineEntry() {
        try {
            let entries = JSON.parse(localStorage.getItem('sipena_offline_entries')) || [];
            if (entries.length > 0) {
                entries.shift();
                localStorage.setItem('sipena_offline_entries', JSON.stringify(entries));
            }
        } catch (e) {
            console.error("Gagal dequeue offline entry:", e);
        }
    }

    // Sync Offline production submissions
    function syncOfflineEntries() {
        if (isSyncingEntries) {
            setTimeout(syncOfflineEntries, 1000);
            return;
        }

        let entries = [];
        try {
            entries = JSON.parse(localStorage.getItem('sipena_offline_entries')) || [];
        } catch (e) {
            entries = [];
        }

        if (entries.length === 0) return;

        isSyncingEntries = true;
        console.log(`Menyinkronkan ${entries.length} entri offline ke Google Sheets...`);

        let promiseChain = Promise.resolve();
        let syncedCount = 0;

        entries.forEach((item, index) => {
            promiseChain = promiseChain.then(() => {
                return fetch(WEB_APP_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    body: JSON.stringify({ action: 'addTransaction', data: item })
                })
                    .then(() => {
                        syncedCount++;
                        dequeueOfflineEntry();
                    });
            });
        });

        promiseChain.then(() => {
            isSyncingEntries = false;
            loadFormOptions();
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({ type: 'SIPENA_SUBMIT_SUCCESS' }, '*');
            }
            if (syncedCount > 0) {
                const elapsed = Date.now() - lastToastTime;
                const delay = Math.max(0, 1800 - elapsed);
                setTimeout(() => {
                    showToast(`🔄 Berhasil sinkron ${syncedCount} data offline ke Google Sheets!`);
                }, delay);
            }
        }).catch(err => {
            isSyncingEntries = false;
            console.error("Gagal sinkron entries offline:", err);
            loadFormOptions();
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({ type: 'SIPENA_SUBMIT_SUCCESS' }, '*');
            }
        });
    }

    // Listen for parent context commands
    window.addEventListener('message', (e) => {
        if (e.data?.type === 'SIPENA_SET_ACTIVE_MANDOR') {
            const mandorId = e.data.mandorId;
            applyActiveMandorContext(mandorId);
        }
    });

    // Startup Initialization
    loadFormOptions();

    // Check if parent has mandor details in query params or localStorage
    const savedMandorId = localStorage.getItem('sipena_logged_in_mandor');
    if (savedMandorId) {
        applyActiveMandorContext(savedMandorId);
    }
});
