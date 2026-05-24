// =========================================================================
// SINKRONISASI DATA MASTER - SIPENA PINUS
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
    var transactions = getSheetData("Data_Produksi");
    var penyadap = getSheetData("Penyadap");
    var petak = getSheetData("Petak");
    var mandor = getSheetData("Mandor");
    var targets = getSheetData("Target");
    var monitoring = getSheetData("Absensi");
    
    // Format data mandor
    mandor = mandor.map(function(m) {
      if (typeof m.petak === "string") {
        m.petak = m.petak ? m.petak.split(",").map(function(s) { return s.trim(); }) : [];
      } else if (!m.petak) {
        m.petak = [];
      }
      return m;
    });

    // Format monitoring harian (Absensi)
    var monMap = {};
    monitoring.forEach(function(row) {
      var tgl = "";
      if (row.tanggal instanceof Date) {
        tgl = row.tanggal.toISOString().split("T")[0];
      } else {
        tgl = String(row.tanggal).split(" ")[0];
      }
      if (!monMap[tgl]) monMap[tgl] = {};
      monMap[tgl][row.nama_penyadap] = { status: row.status, keterangan: row.keterangan };
    });
    
    var response = {
      status: "success",
      data: transactions, // kompatibilitas form mobile HP
      penyadap: penyadap,
      petak: petak,
      mandor: mandor,
      targets: targets,
      monitoring: monMap
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
    }
    return sheet;
  }
  
  try {
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action || "addTransaction";
    
    // 1. Tambah Transaksi Timbangan (Default)
    if (action === "addTransaction") {
      var data = postData.data || postData;
      var sheet = getOrCreateSheet("Data_Produksi", ["id", "tanggal", "nama_penyadap", "petak", "estimasi_hasil", "kondisi_lapangan", "kendala", "timestamp"]);
      sheet.appendRow([
        data.id || "c-" + Math.random().toString(36).substr(2, 9),
        data.tanggal,
        data.nama_penyadap,
        data.petak,
        data.estimasi_hasil,
        data.kondisi_lapangan,
        data.kendala,
        new Date().toISOString()
      ]);
      return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 2. CRUD Penyadap
    if (action === "savePenyadap") {
      var item = postData.data;
      var sheet = getOrCreateSheet("Penyadap", ["id", "nama", "petak", "status", "pohon"]);
      var rows = sheet.getDataRange().getValues();
      var foundIdx = -1;
      for (var i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === String(item.id)) {
          foundIdx = i + 1;
          break;
        }
      }
      if (foundIdx > 0) {
        var oldNama = rows[foundIdx - 1][1];
        sheet.getRange(foundIdx, 2, 1, 4).setValues([[item.nama, item.petak, item.status, item.pohon]]);
        
        // Integritas: Update nama penyadap di sheet Absensi jika berubah
        if (oldNama !== item.nama) {
          var absensiSheet = ss.getSheetByName("Absensi");
          if (absensiSheet) {
            var aRows = absensiSheet.getDataRange().getValues();
            for (var j = 1; j < aRows.length; j++) {
              if (String(aRows[j][1]) === String(oldNama)) {
                absensiSheet.getRange(j + 1, 2).setValue(item.nama);
              }
            }
          }
        }
      } else {
        sheet.appendRow([item.id, item.nama, item.petak, item.status, item.pohon]);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "deletePenyadap") {
      var sheet = getOrCreateSheet("Penyadap", ["id", "nama", "petak", "status", "pohon"]);
      var rows = sheet.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === String(postData.id)) {
          sheet.deleteRow(i + 1);
          break;
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 3. CRUD Petak
    if (action === "savePetak") {
      var item = postData.data;
      var sheet = getOrCreateSheet("Petak", ["id", "kode", "luas", "pohon"]);
      var rows = sheet.getDataRange().getValues();
      var foundIdx = -1;
      for (var i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === String(item.id)) {
          foundIdx = i + 1;
          break;
        }
      }
      
      if (foundIdx > 0) {
        var oldKode = rows[foundIdx - 1][1];
        sheet.getRange(foundIdx, 2, 1, 3).setValues([[item.kode, item.luas, item.pohon]]);
        
        // Integritas: Update kode petak di sheet Penyadap, Target, dan Mandor jika berubah
        if (oldKode !== item.kode) {
          // A. Penyadap
          var penyadapSheet = ss.getSheetByName("Penyadap");
          if (penyadapSheet) {
            var pRows = penyadapSheet.getDataRange().getValues();
            for (var j = 1; j < pRows.length; j++) {
              if (String(pRows[j][2]) === String(oldKode)) {
                penyadapSheet.getRange(j + 1, 3).setValue(item.kode);
              }
            }
          }
          
          // B. Target
          var targetSheet = ss.getSheetByName("Target");
          if (targetSheet) {
            var tRows = targetSheet.getDataRange().getValues();
            for (var k = 1; k < tRows.length; k++) {
              if (String(tRows[k][0]) === String(oldKode)) {
                targetSheet.getRange(k + 1, 1).setValue(item.kode);
              }
            }
          }
          
          // C. Mandor
          var mandorSheet = ss.getSheetByName("Mandor");
          if (mandorSheet) {
            var mRows = mandorSheet.getDataRange().getValues();
            for (var l = 1; l < mRows.length; l++) {
              var petakStr = String(mRows[l][3]);
              if (petakStr) {
                var petaks = petakStr.split(",").map(function(s) { return s.trim(); });
                var updated = false;
                for (var m = 0; m < petaks.length; m++) {
                  if (petaks[m] === oldKode) {
                    petaks[m] = item.kode;
                    updated = true;
                  }
                }
                if (updated) {
                  mandorSheet.getRange(l + 1, 4).setValue(petaks.join(", "));
                }
              }
            }
          }
        }
      } else {
        sheet.appendRow([item.id, item.kode, item.luas, item.pohon]);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "deletePetak") {
      var sheet = getOrCreateSheet("Petak", ["id", "kode", "luas", "pohon"]);
      var rows = sheet.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === String(postData.id)) {
          sheet.deleteRow(i + 1);
          break;
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 4. CRUD Mandor
    if (action === "saveMandor") {
      var item = postData.data;
      var petakStr = Array.isArray(item.petak) ? item.petak.join(", ") : "";
      var sheet = getOrCreateSheet("Mandor", ["id", "nama", "nik", "petak"]);
      var rows = sheet.getDataRange().getValues();
      var foundIdx = -1;
      for (var i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === String(item.id)) {
          foundIdx = i + 1;
          break;
        }
      }
      if (foundIdx > 0) {
        sheet.getRange(foundIdx, 2, 1, 3).setValues([[item.nama, item.nik, petakStr]]);
      } else {
        sheet.appendRow([item.id, item.nama, item.nik, petakStr]);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "deleteMandor") {
      var sheet = getOrCreateSheet("Mandor", ["id", "nama", "nik", "petak"]);
      var rows = sheet.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === String(postData.id)) {
          sheet.deleteRow(i + 1);
          break;
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 5. Simpan Target Petak
    if (action === "saveTarget") {
      var item = postData.data;
      var sheet = getOrCreateSheet("Target", ["petak", "tahun", "tahunan", "periode1", "periode2"]);
      var rows = sheet.getDataRange().getValues();
      var foundIdx = -1;
      for (var i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === String(item.petak) && String(rows[i][1]) === String(item.tahun)) {
          foundIdx = i + 1;
          break;
        }
      }
      if (foundIdx > 0) {
        sheet.getRange(foundIdx, 3, 1, 3).setValues([[item.tahunan, item.periode1, item.periode2]]);
      } else {
        sheet.appendRow([item.petak, item.tahun, item.tahunan, item.periode1, item.periode2]);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 6. Simpan Absensi Harian
    if (action === "saveMonitoring") {
      var sheet = getOrCreateSheet("Absensi", ["tanggal", "nama_penyadap", "status", "keterangan"]);
      var tgl = postData.tanggal;
      var records = postData.data;
      
      var rows = sheet.getDataRange().getValues();
      for (var i = rows.length - 1; i >= 1; i--) {
        var rowTgl = "";
        if (rows[i][0] instanceof Date) {
          rowTgl = rows[i][0].toISOString().split("T")[0];
        } else {
          rowTgl = String(rows[i][0]).split(" ")[0];
        }
        if (rowTgl === tgl) {
          sheet.deleteRow(i + 1);
        }
      }
      
      Object.keys(records).forEach(function(nama) {
        sheet.appendRow([tgl, nama, records[nama].status, records[nama].keterangan || ""]);
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
