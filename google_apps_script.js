// =========================================================================
// SINKRONISASI DATA MASTER & TRANSAKSI RELASIONAL - SIPENA PINUS
// Salin seluruh kode di bawah ini ke menu Extensions > Apps Script di Google Sheets Anda.
// =========================================================================

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  function getSheetData(sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return [];
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    var headers = data[0];
    var list = [];
    for (var i = 1; i < data.length; i++) {
      var obj = {};
      for (var j = 0; j < headers.length; j++) {
        obj[headers[j]] = data[i][j];
      }
      list.push(obj);
    }
    return list;
  }
  
  try {
    var bkph = getSheetData("BKPH");
    var rph = getSheetData("RPH");
    var tpg = getSheetData("TPG");
    var petak = getSheetData("Petak");
    var mandor = getSheetData("Mandor");
    var penyadap = getSheetData("Penyadap");
    var targets = getSheetData("Target");
    var users = getSheetData("User");
    var absensi = getSheetData("Absensi");
    var dataProduksi = getSheetData("Data_Produksi");
    
    // Format absensi harian
    var absMap = {};
    absensi.forEach(function(row) {
      var tgl = "";
      if (row.tanggal instanceof Date) {
        tgl = Utilities.formatDate(row.tanggal, ss.getSpreadsheetTimeZone(), "yyyy-MM-dd");
      } else {
        var str = String(row.tanggal).trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
          tgl = str.split(" ")[0];
        } else {
          try {
            var d = new Date(str);
            if (!isNaN(d.getTime())) {
              tgl = Utilities.formatDate(d, ss.getSpreadsheetTimeZone(), "yyyy-MM-dd");
            } else {
              tgl = str.split(" ")[0];
            }
          } catch(e) {
            tgl = str.split(" ")[0];
          }
        }
      }
      
      var pId = row.id_penyadap || row.nama_penyadap;
      if (!absMap[tgl]) absMap[tgl] = {};
      absMap[tgl][pId] = { 
        status: row.status_kehadiran || row.status, 
        keterangan: row.aktivitas_kerja || row.keterangan 
      };
    });
    
    // Fallback data mapping for backwards compatibility in frontend views
    var legacyData = dataProduksi.map(function(item) {
      return {
        id: item.id || item.id_produksi,
        tanggal: item.tanggal,
        nama_penyadap: item.nama_penyadap || item.id_penyadap,
        petak: item.petak || item.id_petak,
        estimasi_hasil: parseFloat(item.realisasi_produksi || item.estimasi_hasil) || 0,
        kondisi_lapangan: item.kondisi_lapangan || "Normal",
        kendala: item.kendala || ""
      };
    });
    
    var response = {
      status: "success",
      bkph: bkph,
      rph: rph,
      tpg: tpg,
      petak: petak,
      mandor: mandor,
      penyadap: penyadap,
      targets: targets,
      users: users,
      monitoring: absMap,
      data: legacyData, // legacy compatibility
      data_produksi: dataProduksi
    };
    
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  function getOrCreateSheet(name, headers) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(headers);
    } else {
      var lastCol = sheet.getLastColumn();
      var existingHeaders = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
      if (existingHeaders.length < headers.length) {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      }
    }
    return sheet;
  }
  
  try {
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action || "addTransaction";
    
    // Helper function to save row based on ID column
    function saveRow(sheetName, idColName, headers, item) {
      var sheet = getOrCreateSheet(sheetName, headers);
      var rows = sheet.getDataRange().getValues();
      var headersRow = rows[0];
      var idColIdx = headersRow.indexOf(idColName);
      
      if (idColIdx === -1) {
        throw new Error("Kolom ID '" + idColName + "' tidak ditemukan di sheet " + sheetName);
      }
      
      var foundIdx = -1;
      for (var i = 1; i < rows.length; i++) {
        if (String(rows[i][idColIdx]) === String(item[idColName])) {
          foundIdx = i + 1;
          break;
        }
      }
      
      var valuesRow = headers.map(function(h) {
        return item[h] !== undefined ? item[h] : "";
      });
      
      if (foundIdx > 0) {
        sheet.getRange(foundIdx, 1, 1, headers.length).setValues([valuesRow]);
      } else {
        sheet.appendRow(valuesRow);
      }
    }
    
    // Helper function to delete row based on ID column
    function deleteRow(sheetName, idColName, headers, idValue) {
      var sheet = getOrCreateSheet(sheetName, headers);
      var rows = sheet.getDataRange().getValues();
      var headersRow = rows[0];
      var idColIdx = headersRow.indexOf(idColName);
      
      if (idColIdx === -1) {
        throw new Error("Kolom ID '" + idColName + "' tidak ditemukan di sheet " + sheetName);
      }
      
      for (var i = 1; i < rows.length; i++) {
        if (String(rows[i][idColIdx]) === String(idValue)) {
          sheet.deleteRow(i + 1);
          break;
        }
      }
    }
    
    // 1. DATA PRODUKSI / REALISASI (Add new transaction)
    if (action === "addTransaction") {
      var data = postData.data || postData;
      var sheet = getOrCreateSheet("Data_Produksi", [
        "id", "tanggal", "periode", "bulan", "tahun", 
        "id_bkph", "id_rph", "id_tpg", "id_petak", "anak_petak", 
        "id_mandor", "id_penyadap", "nama_penyadap", "petak", 
        "estimasi_hasil", "realisasi_produksi", "kondisi_lapangan", 
        "kendala", "catatan", "timestamp"
      ]);
      
      // Auto populate fields if missing
      var p = new Date(data.tanggal);
      var periode = p.getDate() <= 15 ? 1 : 2;
      var bulan = p.getMonth() + 1;
      var tahun = p.getFullYear();
      
      sheet.appendRow([
        data.id || "c-" + Math.random().toString(36).substr(2, 9),
        data.tanggal,
        data.periode || periode,
        data.bulan || bulan,
        data.tahun || tahun,
        data.id_bkph || "",
        data.id_rph || "",
        data.id_tpg || "",
        data.id_petak || "",
        data.anak_petak || "",
        data.id_mandor || "",
        data.id_penyadap || "",
        data.nama_penyadap || "",
        data.petak || "",
        data.estimasi_hasil || 0,
        data.realisasi_produksi || data.estimasi_hasil || 0,
        data.kondisi_lapangan || "Normal",
        data.kendala || "",
        data.catatan || "",
        new Date().toISOString()
      ]);
      return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 2. CRUD BKPH
    if (action === "saveBKPH") {
      saveRow("BKPH", "id_bkph", ["id_bkph", "kode_bkph", "nama_bkph", "status"], postData.data);
      return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
    }
    if (action === "deleteBKPH") {
      deleteRow("BKPH", "id_bkph", ["id_bkph", "kode_bkph", "nama_bkph", "status"], postData.id);
      return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 3. CRUD RPH
    if (action === "saveRPH") {
      saveRow("RPH", "id_rph", ["id_rph", "kode_rph", "nama_rph", "id_bkph", "status"], postData.data);
      return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
    }
    if (action === "deleteRPH") {
      deleteRow("RPH", "id_rph", ["id_rph", "kode_rph", "nama_rph", "id_bkph", "status"], postData.id);
      return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 4. CRUD TPG
    if (action === "saveTPG") {
      saveRow("TPG", "id_tpg", ["id_tpg", "kode_tpg", "nama_tpg", "id_rph", "status"], postData.data);
      return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
    }
    if (action === "deleteTPG") {
      deleteRow("TPG", "id_tpg", ["id_tpg", "kode_tpg", "nama_tpg", "id_rph", "status"], postData.id);
      return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 5. CRUD Petak
    if (action === "savePetak") {
      // support legacy 'id' and 'kode' keys alongside 'id_petak' and 'nomor_petak'
      var item = postData.data;
      var cleanItem = {
        id_petak: item.id_petak || item.id,
        nomor_petak: item.nomor_petak || item.kode,
        anak_petak: item.anak_petak || "",
        luas: item.luas || 0,
        id_tpg: item.id_tpg || "t1",
        pohon: item.pohon || 1000,
        status: item.status || "Aktif",
        // legacy compat:
        id: item.id || item.id_petak,
        kode: item.kode || item.nomor_petak
      };
      saveRow("Petak", "id_petak", ["id_petak", "nomor_petak", "anak_petak", "luas", "id_tpg", "pohon", "status", "id", "kode"], cleanItem);
      return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
    }
    if (action === "deletePetak") {
      deleteRow("Petak", "id_petak", ["id_petak", "nomor_petak", "anak_petak", "luas", "id_tpg", "pohon", "status", "id", "kode"], postData.id);
      return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 6. CRUD Mandor
    if (action === "saveMandor") {
      var item = postData.data;
      var petakStr = Array.isArray(item.petak) ? item.petak.join(", ") : (item.petak || "");
      var cleanItem = {
        id_mandor: item.id_mandor || item.id,
        nama_mandor: item.nama_mandor || item.nama,
        id_tpg: item.id_tpg || "t1",
        nomor_hp: item.nomor_hp || item.nik || "",
        status: item.status || "Aktif",
        // legacy compat:
        id: item.id || item.id_mandor,
        nama: item.nama || item.nama_mandor,
        nik: item.nik || item.nomor_hp || "",
        petak: petakStr
      };
      saveRow("Mandor", "id_mandor", ["id_mandor", "nama_mandor", "id_tpg", "nomor_hp", "status", "id", "nama", "nik", "petak"], cleanItem);
      return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
    }
    if (action === "deleteMandor") {
      deleteRow("Mandor", "id_mandor", ["id_mandor", "nama_mandor", "id_tpg", "nomor_hp", "status", "id", "nama", "nik", "petak"], postData.id);
      return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 7. CRUD Penyadap
    if (action === "savePenyadap") {
      var item = postData.data;
      var cleanItem = {
        id_penyadap: item.id_penyadap || item.id,
        nama_penyadap: item.nama_penyadap || item.nama,
        id_mandor: item.id_mandor || "m1",
        id_petak: item.id_petak || item.petak || "b1",
        status: item.status || "Aktif",
        pohon: item.pohon || 800,
        luas: item.luas || 0,
        target: item.target || 0,
        periode1: item.periode1 || 0,
        periode2: item.periode2 || 0,
        // legacy compat:
        id: item.id || item.id_penyadap,
        nama: item.nama || item.nama_penyadap,
        petak: item.petak || item.id_petak
      };
      saveRow("Penyadap", "id_penyadap", ["id_penyadap", "nama_penyadap", "id_mandor", "id_petak", "status", "pohon", "luas", "target", "periode1", "periode2", "id", "nama", "petak"], cleanItem);
      return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
    }
    if (action === "deletePenyadap") {
      deleteRow("Penyadap", "id_penyadap", ["id_penyadap", "nama_penyadap", "id_mandor", "id_petak", "status", "pohon", "luas", "target", "periode1", "periode2", "id", "nama", "petak"], postData.id);
      return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 8. Simpan Target Petak / TPG
    if (action === "saveTarget") {
      var item = postData.data;
      var sheet = getOrCreateSheet("Target", ["id_target", "petak", "tahun", "tahunan", "periode1", "periode2", "id_bkph", "id_rph", "id_tpg", "target_ro", "target_rkap", "target_rtt", "status"]);
      var rows = sheet.getDataRange().getValues();
      
      var petakVal = item.petak || item.id_petak || "";
      var tahunVal = String(item.tahun || "2026");
      
      var foundIdx = -1;
      for (var i = 1; i < rows.length; i++) {
        if (String(rows[i][1]) === petakVal && String(rows[i][2]) === tahunVal) {
          foundIdx = i + 1;
          break;
        }
      }
      
      var valuesRow = [
        item.id_target || item.id || "t-" + petakVal + "-" + tahunVal,
        petakVal,
        tahunVal,
        item.tahunan || 3600,
        item.periode1 || 0,
        item.periode2 || 0,
        item.id_bkph || "b1",
        item.id_rph || "r1",
        item.id_tpg || "t1",
        item.target_ro || item.tahunan || 0,
        item.target_rkap || 0,
        item.target_rtt || 0,
        item.status || "Aktif"
      ];
      
      if (foundIdx > 0) {
        sheet.getRange(foundIdx, 1, 1, valuesRow.length).setValues([valuesRow]);
      } else {
        sheet.appendRow(valuesRow);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 9. CRUD User
    if (action === "saveUser") {
      saveRow("User", "id_user", ["id_user", "nama", "username", "password", "role", "wilayah_akses", "status"], postData.data);
      return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
    }
    if (action === "deleteUser") {
      deleteRow("User", "id_user", ["id_user", "nama", "username", "password", "role", "wilayah_akses", "status"], postData.id);
      return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 10. Simpan Absensi / Monitoring
    if (action === "saveMonitoring") {
      var sheet = getOrCreateSheet("Absensi", ["id_absensi", "tanggal", "periode", "id_penyadap", "nama_penyadap", "status_kehadiran", "aktivitas_kerja", "status", "keterangan"]);
      var tgl = postData.tanggal;
      var records = postData.data;
      
      var pDate = new Date(tgl);
      var periode = pDate.getDate() <= 15 ? 1 : 2;
      
      // Delete old records for this date
      var rows = sheet.getDataRange().getValues();
      for (var i = rows.length - 1; i >= 1; i--) {
        var rowTgl = "";
        if (rows[i][1] instanceof Date) {
          rowTgl = rows[i][1].toISOString().split("T")[0];
        } else {
          rowTgl = String(rows[i][1]).split(" ")[0];
        }
        if (rowTgl === tgl) {
          sheet.deleteRow(i + 1);
        }
      }
      
      // Insert new records
      Object.keys(records).forEach(function(nama) {
        var info = records[nama];
        sheet.appendRow([
          "abs-" + tgl + "-" + nama.replace(/\s+/g, "_"),
          tgl,
          periode,
          info.id_penyadap || "",
          nama,
          info.status || info.status_kehadiran || "Hadir",
          info.keterangan || info.aktivitas_kerja || "",
          info.status || info.status_kehadiran || "Hadir", // legacy compat
          info.keterangan || info.aktivitas_kerja || "" // legacy compat
        ]);
      });
      
      return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Aksi tidak dikenali" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
