// assets/js/input.js
// Javascript for SIPENA PINUS Input Form (Google Sheets & Demo Mode)

// =========================================================================
// CONFIGURATION: SALIN URL WEB APP GOOGLE APPS SCRIPT ANDA DI SINI
// Contoh: "https://script.google.com/macros/s/AKfycbz.../exec"
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwTelvmwcTnXUKYx_CQKfUg82nltxUNWjHsckbCO9vNj3My_VYl2huNYqmqJZKhzO61Kg/exec";
// =========================================================================

document.addEventListener('DOMContentLoaded', function () {
    let isSyncingEntries = false;
    let lastToastTime = 0;
    let toastTimeout = null;
    const form = document.getElementById('productionForm');
    const selectPenyadap = document.getElementById('nama_penyadap');
    const selectPetak = document.getElementById('petak');

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

    // Helper to load Penyadap list
    function getPenyadapList() {
        try {
            const list = JSON.parse(localStorage.getItem('sipena_penyadap'));
            if (list && list.length) return list;
        } catch(e) {}
        
        if (!WEB_APP_URL) {
            return [
                { id: 'p1', nama: 'Slamet',  petak: 'P.01', status: 'Aktif', pohon: 800 },
                { id: 'p2', nama: 'Budi',    petak: 'P.02', status: 'Aktif', pohon: 1000 },
                { id: 'p3', nama: 'Sukijo',  petak: 'P.03', status: 'Aktif', pohon: 700 },
                { id: 'p4', nama: 'Tukimin', petak: 'P.04', status: 'Aktif', pohon: 900 },
                { id: 'p5', nama: 'Wawan',   petak: 'P.05', status: 'Aktif', pohon: 800 },
                { id: 'p6', nama: 'Kardi',   petak: 'P.06', status: 'Aktif', pohon: 950 },
            ];
        }
        return [];
    }

    // Helper to load Petak list
    function getPetakList() {
        try {
            const list = JSON.parse(localStorage.getItem('sipena_petak'));
            if (list && list.length) return list;
        } catch(e) {}
        
        if (!WEB_APP_URL) {
            return [
                { id: 'b1', kode: 'P.01', luas: 12.5, pohon: 1200 },
                { id: 'b2', kode: 'P.02', luas: 15.0, pohon: 1500 },
                { id: 'b3', kode: 'P.03', luas: 10.0, pohon: 1000 },
                { id: 'b4', kode: 'P.04', luas: 13.0, pohon: 1300 },
                { id: 'b5', kode: 'P.05', luas: 11.5, pohon: 1100 },
                { id: 'b6', kode: 'P.06', luas: 14.0, pohon: 1400 },
            ];
        }
        return [];
    }

    function getSupervisedPetaks() {
        try {
            const mandorList = JSON.parse(localStorage.getItem('sipena_mandor')) || [];
            const activeMandorId = localStorage.getItem('sipena_active_mandor') || 'm1';
            const activeM = mandorList.find(m => m.id === activeMandorId) || mandorList[0];
            return activeM ? (activeM.petak || []) : [];
        } catch(e) {
            return [];
        }
    }

    // 1. Fetch options and populate selects
    function loadFormOptions() {
        const supervised = getSupervisedPetaks();
        const activeWorkers = getPenyadapList()
            .filter(p => (p.status || 'Aktif') === 'Aktif' && (supervised.length === 0 || supervised.includes(p.petak)))
            .map(p => p.nama);
        const petakCodes = getPetakList()
            .filter(b => supervised.length === 0 || supervised.includes(b.kode))
            .map(b => b.kode);

        let workers = [...activeWorkers];
        let blocks = [...petakCodes];

        if (!WEB_APP_URL) {
            // Demo Mode: Populate with local lists
            populateDropdown(selectPenyadap, arrayUnique(workers), '-- Pilih Penyadap --');
            populateDropdown(selectPetak, arrayUnique(blocks), '-- Pilih Petak --');
            return;
        }

        // Cloud Mode: Fetch all metadata from Google Sheets
        fetch(WEB_APP_URL)
            .then(res => res.json())
            .then(res => {
                if (res.status === 'success') {
                    if (res.penyadap && res.penyadap.length) {
                        const cloudWorkers = res.penyadap
                            .filter(p => (p.status || 'Aktif') === 'Aktif' && (supervised.length === 0 || supervised.includes(p.petak)))
                            .map(p => p.nama);
                        if (cloudWorkers.length > 0) workers = cloudWorkers;
                    }
                    if (res.petak && res.petak.length) {
                        const cloudBlocks = res.petak
                            .filter(b => supervised.length === 0 || supervised.includes(b.kode))
                            .map(b => b.kode);
                        if (cloudBlocks.length > 0) blocks = cloudBlocks;
                    }
                }

                populateDropdown(selectPenyadap, arrayUnique(workers), '-- Pilih Penyadap --');
                populateDropdown(selectPetak, arrayUnique(blocks), '-- Pilih Petak --');
            })
            .catch(err => {
                console.warn("Gagal mengambil data dari Google Sheets, menggunakan fallback lokal:", err);
                populateDropdown(selectPenyadap, arrayUnique(workers), '-- Pilih Penyadap --');
                populateDropdown(selectPetak, arrayUnique(blocks), '-- Pilih Petak --');
            });
    }

    function populateDropdown(selectElement, arrayItems, placeholder) {
        const currentVal = selectElement.value;
        selectElement.innerHTML = `<option value="" disabled>${placeholder}</option>`;
        arrayItems.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item;
            opt.textContent = item;
            selectElement.appendChild(opt);
        });
        if (currentVal && arrayItems.includes(currentVal)) {
            selectElement.value = currentVal;
        } else if (!currentVal) {
            selectElement.selectedIndex = 0;
        }
    }

    function arrayUnique(array) {
        return array.filter((value, index, self) => self.indexOf(value) === index).sort();
    }

    loadFormOptions();

    // 2. Add New Options dynamically via modals
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
            const newPenyadap = {
                id: 'p' + Date.now(),
                nama: name,
                petak: selectPetak.value || 'P.01 - B.01',
                status: 'Aktif',
                pohon: 800
            };
            list.push(newPenyadap);
            localStorage.setItem('sipena_penyadap', JSON.stringify(list));

            // Append and select
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            selectPenyadap.appendChild(opt);
            selectPenyadap.value = name;
            closeModal(modalPenyadap);
        } else {
            alert('Nama penyadap tidak boleh kosong!');
        }
    });

    btnSaveNewPetak.addEventListener('click', function () {
        const block = newPetakNameInput.value.trim();
        if (block) {
            const list = getPetakList();
            const newPetak = {
                id: 'b' + Date.now(),
                kode: block,
                luas: 10.0, // Default 10.0 Hectares
                pohon: 1000
            };
            list.push(newPetak);
            localStorage.setItem('sipena_petak', JSON.stringify(list));

            // Append and select
            const opt = document.createElement('option');
            opt.value = block;
            opt.textContent = block;
            selectPetak.appendChild(opt);
            selectPetak.value = block;
            closeModal(modalPetak);
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

        const data = {
            tanggal: document.getElementById('tanggal').value,
            nama_penyadap: selectPenyadap.value,
            petak: selectPetak.value,
            estimasi_hasil: parseFloat(document.getElementById('estimasi_hasil').value),
            kondisi_lapangan: inputKondisi.value,
            kendala: inputKendala.value.trim()
        };

        if (!data.tanggal || !data.nama_penyadap || !data.petak || isNaN(data.estimasi_hasil)) {
            showToast('⚠️ Mohon lengkapi semua field yang wajib!', true);
            return;
        }

        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Mengirim...';

        if (!WEB_APP_URL) {
            // ================= DEMO MODE =================
            saveEntryDemoMode(data);
        } else {
            // ================= CLOUD MODE =================
            saveEntryOffline(data);
            if (navigator.onLine) {
                syncOfflineEntries();
            }
        }
    });

    // Demo mode: Save to local demo database array
    function saveEntryDemoMode(data) {
        setTimeout(() => { // Simulate small network delay
            // We append a custom field for ID and Timestamp to mimic Cloud behavior
            data.id = 'demo-' + Math.random().toString(36).substr(2, 9);
            data.timestamp = new Date().toISOString();

            let demoEntries = JSON.parse(localStorage.getItem('sipena_demo_entries')) || [];

            // If local storage demo entries is empty, the dashboard will populate initial mock data.
            // But we must push the new entry here:
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
        selectPenyadap.selectedIndex = 0;
        selectPetak.selectedIndex = 0;
        inputKondisi.value = 'Normal';
        inputKendala.value = '';
        inputKendala.placeholder = 'Isi kendala jika ada (contoh: Wadah bocor)';
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

    // 5. Connection state monitoring
    function updateOnlineStatus() {
        if (navigator.onLine) {
            bannerOffline.style.display = 'none';
            if (netStatusIcon) netStatusIcon.textContent = '📶 Online';
            if (WEB_APP_URL) {
                syncOfflineEntries();
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
                entries.shift(); // Remove the first item
                localStorage.setItem('sipena_offline_entries', JSON.stringify(entries));
            }
        } catch (e) {
            console.error("Gagal dequeue offline entry:", e);
        }
    }

    // 6. Sync offline entries (Google Sheets)
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
                    body: JSON.stringify(item)
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
            if (syncedCount > 0) {
                const elapsed = Date.now() - lastToastTime;
                const delay = Math.max(0, 1800 - elapsed);
                setTimeout(() => {
                    showToast(`🔄 Sebagian tersinkron (${syncedCount} data).`);
                }, delay);
            }
        });
    }

    window.addEventListener('message', (e) => {
        if (e.data?.type === 'SIPENA_SET_ACTIVE_MANDOR') {
            loadFormOptions();
        }
    });
});
