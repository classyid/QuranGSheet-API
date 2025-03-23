/**
 * API Al-Quran dari Google Spreadsheet
 * Dibuat dengan Google Apps Script
 */

// Konstanta untuk ID Spreadsheet - ganti dengan ID spreadsheet Anda
const SPREADSHEET_ID = '<ID-SPREADSHEET>';

// Nama sheet yang berisi daftar surah
const SURAH_SHEET_NAME = 'surahQuran';

// Nama sheet yang berisi ayat-ayat Al-Quran
const AYAT_SHEET_NAME = 'ayatQuran';

// Konstanta untuk cache
const CACHE_EXPIRATION = 21600; // 6 jam dalam detik

// Properti untuk Analytics
const PROPERTY_STORE = PropertiesService.getScriptProperties();

/**
 * Fungsi doGet untuk menangani permintaan GET ke web app
 * @param {Object} e - Parameter request
 * @return {TextOutput} - JSON response
 */
function doGet(e) {
  // Set CORS headers untuk akses dari domain manapun
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  
  // Parameter yang diterima dari request
  const action = e.parameter.action;
  
  let result;
  
  // Router untuk berbagai endpoint API
  switch (action) {
    case 'getAllSurah':
      result = getAllSurah();
      trackAnalytics('getAllSurah');
      break;
    case 'getSurah':
      const surahNumber = e.parameter.number;
      result = getSurah(surahNumber);
      trackAnalytics('getSurah', { surah: surahNumber });
      break;
    case 'getAyat':
      const surahNum = e.parameter.surah;
      const ayatNum = e.parameter.ayat;
      result = getAyat(surahNum, ayatNum);
      trackAnalytics('getAyat', { surah: surahNum, ayat: ayatNum });
      break;
    case 'search':
      const keyword = e.parameter.q;
      result = searchQuran(keyword);
      trackAnalytics('search', { keyword: keyword });
      break;
    case 'getJuz':
      const juzNumber = e.parameter.number;
      result = getJuz(juzNumber);
      trackAnalytics('getJuz', { juz: juzNumber });
      break;
    case 'getPage':
      const pageNumber = e.parameter.number;
      result = getPage(pageNumber);
      trackAnalytics('getPage', { page: pageNumber });
      break;
    case 'getAudio':
      const audioSurah = e.parameter.surah;
      const audioAyat = e.parameter.ayat;
      const qari = e.parameter.qari || 'default';
      result = getAudio(audioSurah, audioAyat, qari);
      trackAnalytics('getAudio', { surah: audioSurah, ayat: audioAyat, qari: qari });
      break;
    case 'getAnalytics':
      // Endpoint khusus untuk admin dengan kunci API
      const apiKey = e.parameter.key;
      result = getAnalyticsData(apiKey);
      break;
    default:
      // Default: berikan informasi tentang API
      result = {
        status: 'success',
        message: 'API Al-Quran',
        endpoints: [
          { path: '?action=getAllSurah', description: 'Mendapatkan daftar semua surah' },
          { path: '?action=getSurah&number=1', description: 'Mendapatkan satu surah berdasarkan nomor' },
          { path: '?action=getAyat&surah=1&ayat=1', description: 'Mendapatkan satu ayat berdasarkan nomor surah dan ayat' },
          { path: '?action=search&q=keyword', description: 'Mencari ayat berdasarkan kata kunci' },
          { path: '?action=getJuz&number=1', description: 'Mendapatkan ayat-ayat dalam satu juz' },
          { path: '?action=getPage&number=1', description: 'Mendapatkan ayat-ayat dalam satu halaman mushaf' },
          { path: '?action=getAudio&surah=1&ayat=1&qari=default', description: 'Mendapatkan URL audio untuk satu ayat' }
        ]
      };
  }
  
  output.setContent(JSON.stringify(result));
  return output;
}

/**
 * Mendapatkan semua data surah dari spreadsheet
 * @return {Object} Objek JSON yang berisi daftar surah
 */
function getAllSurah() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SURAH_SHEET_NAME);
    
    // Mendapatkan semua data dari sheet
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    // Mendapatkan header (nama kolom)
    const headers = values[0];
    
    // Array untuk menyimpan semua surah
    const surahList = [];
    
    // Loop mulai dari baris kedua (indeks 1) karena baris pertama adalah header
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const surah = {};
      
      // Membuat objek surah dengan pasangan key-value berdasarkan header
      for (let j = 0; j < headers.length; j++) {
        surah[headers[j]] = row[j];
      }
      
      surahList.push(surah);
    }
    
    return {
      status: 'success',
      data: surahList
    };
  } catch (error) {
    return {
      status: 'error',
      message: error.toString()
    };
  }
}

/**
 * Mendapatkan satu surah berdasarkan nomor
 * @param {string|number} surahNumber - Nomor surah yang diminta
 * @return {Object} Objek JSON yang berisi informasi surah dan ayat-ayatnya
 */
function getSurah(surahNumber) {
  try {
    if (!surahNumber) {
      throw new Error('Parameter nomor surah diperlukan');
    }
    
    // Konversi ke number untuk perbandingan
    const surahNum = parseInt(surahNumber);
    
    // Dapatkan metadata surah
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const surahSheet = spreadsheet.getSheetByName(SURAH_SHEET_NAME);
    const surahData = surahSheet.getDataRange().getValues();
    const surahHeaders = surahData[0];
    
    let surahInfo = null;
    
    // Cari surah berdasarkan nomor
    for (let i = 1; i < surahData.length; i++) {
      if (surahData[i][0] === surahNum) {
        surahInfo = {};
        for (let j = 0; j < surahHeaders.length; j++) {
          surahInfo[surahHeaders[j]] = surahData[i][j];
        }
        break;
      }
    }
    
    if (!surahInfo) {
      throw new Error(`Surah dengan nomor ${surahNumber} tidak ditemukan`);
    }
    
    // Dapatkan ayat-ayat dari surah tersebut
    const ayatSheet = spreadsheet.getSheetByName(AYAT_SHEET_NAME);
    const ayatData = ayatSheet.getDataRange().getValues();
    const ayatHeaders = ayatData[0];
    
    const ayatList = [];
    
    // Cari semua ayat dengan surah yang sesuai
    for (let i = 1; i < ayatData.length; i++) {
      if (ayatData[i][0] === surahNum) {
        const ayat = {};
        for (let j = 0; j < ayatHeaders.length; j++) {
          ayat[ayatHeaders[j]] = ayatData[i][j];
        }
        ayatList.push(ayat);
      }
    }
    
    return {
      status: 'success',
      data: {
        surah: surahInfo,
        ayat: ayatList
      }
    };
  } catch (error) {
    return {
      status: 'error',
      message: error.toString()
    };
  }
}

/**
 * Mendapatkan satu ayat berdasarkan nomor surah dan ayat
 * @param {string|number} surahNumber - Nomor surah
 * @param {string|number} ayatNumber - Nomor ayat
 * @return {Object} Objek JSON yang berisi informasi ayat
 */
function getAyat(surahNumber, ayatNumber) {
  try {
    if (!surahNumber || !ayatNumber) {
      throw new Error('Parameter nomor surah dan ayat diperlukan');
    }
    
    // Konversi ke number untuk perbandingan
    const surahNum = parseInt(surahNumber);
    const ayatNum = parseInt(ayatNumber);
    
    // Dapatkan metadata surah
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const surahSheet = spreadsheet.getSheetByName(SURAH_SHEET_NAME);
    const surahData = surahSheet.getDataRange().getValues();
    const surahHeaders = surahData[0];
    
    let surahInfo = null;
    
    // Cari surah berdasarkan nomor
    for (let i = 1; i < surahData.length; i++) {
      if (surahData[i][0] === surahNum) {
        surahInfo = {};
        for (let j = 0; j < surahHeaders.length; j++) {
          surahInfo[surahHeaders[j]] = surahData[i][j];
        }
        break;
      }
    }
    
    if (!surahInfo) {
      throw new Error(`Surah dengan nomor ${surahNumber} tidak ditemukan`);
    }
    
    // Dapatkan ayat yang diminta
    const ayatSheet = spreadsheet.getSheetByName(AYAT_SHEET_NAME);
    const ayatData = ayatSheet.getDataRange().getValues();
    const ayatHeaders = ayatData[0];
    
    let ayatInfo = null;
    
    // Cari ayat berdasarkan nomor surah dan ayat
    for (let i = 1; i < ayatData.length; i++) {
      if (ayatData[i][0] === surahNum && ayatData[i][1] === ayatNum) {
        ayatInfo = {};
        for (let j = 0; j < ayatHeaders.length; j++) {
          ayatInfo[ayatHeaders[j]] = ayatData[i][j];
        }
        break;
      }
    }
    
    if (!ayatInfo) {
      throw new Error(`Ayat dengan nomor ${ayatNumber} pada Surah ${surahNumber} tidak ditemukan`);
    }
    
    return {
      status: 'success',
      data: {
        surah: surahInfo,
        ayat: ayatInfo
      }
    };
  } catch (error) {
    return {
      status: 'error',
      message: error.toString()
    };
  }
}

/**
 * Mencari ayat berdasarkan kata kunci
 * @param {string} keyword - Kata kunci pencarian
 * @return {Object} Objek JSON yang berisi hasil pencarian
 */
function searchQuran(keyword) {
  try {
    if (!keyword) {
      throw new Error('Parameter kata kunci diperlukan');
    }
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const ayatSheet = spreadsheet.getSheetByName(AYAT_SHEET_NAME);
    const ayatData = ayatSheet.getDataRange().getValues();
    const ayatHeaders = ayatData[0];
    
    const results = [];
    
    // Cari di semua kolom teks (Arab, Latin, dan Text/Terjemahan)
    const textColumnIndices = [2, 3, 4]; // Sesuaikan dengan indeks kolom yang berisi teks
    
    // Loop melalui semua ayat
    for (let i = 1; i < ayatData.length; i++) {
      let found = false;
      
      // Periksa setiap kolom teks
      for (let colIdx of textColumnIndices) {
        if (ayatData[i][colIdx] && ayatData[i][colIdx].toString().toLowerCase().includes(keyword.toLowerCase())) {
          found = true;
          break;
        }
      }
      
      if (found) {
        const ayat = {};
        for (let j = 0; j < ayatHeaders.length; j++) {
          ayat[ayatHeaders[j]] = ayatData[i][j];
        }
        results.push(ayat);
      }
    }
    
    return {
      status: 'success',
      keyword: keyword,
      count: results.length,
      data: results
    };
  } catch (error) {
    return {
      status: 'error',
      message: error.toString()
    };
  }
}

/**
 * Mendapatkan ayat-ayat dalam satu juz
 * @param {string|number} juzNumber - Nomor juz
 * @return {Object} Objek JSON yang berisi ayat-ayat dalam juz
 */
function getJuz(juzNumber) {
  try {
    if (!juzNumber) {
      throw new Error('Parameter nomor juz diperlukan');
    }
    
    // Konversi ke number untuk perbandingan
    const juzNum = parseInt(juzNumber);
    
    // Validasi rentang juz (1-30)
    if (juzNum < 1 || juzNum > 30) {
      throw new Error('Nomor juz harus antara 1 dan 30');
    }
    
    // Dapatkan semua ayat
    const ayatData = getCachedSheet(AYAT_SHEET_NAME);
    const ayatHeaders = ayatData[0];
    
    // Indeks kolom juz (sesuaikan dengan struktur data)
    const juzColumnIndex = ayatHeaders.indexOf('Juz');
    
    if (juzColumnIndex === -1) {
      throw new Error('Kolom Juz tidak ditemukan di sheet');
    }
    
    const results = [];
    
    // Cari semua ayat dengan juz yang sesuai
    for (let i = 1; i < ayatData.length; i++) {
      if (ayatData[i][juzColumnIndex] === juzNum) {
        const ayat = {};
        for (let j = 0; j < ayatHeaders.length; j++) {
          ayat[ayatHeaders[j]] = ayatData[i][j];
        }
        results.push(ayat);
      }
    }
    
    return {
      status: 'success',
      juz: juzNum,
      count: results.length,
      data: results
    };
  } catch (error) {
    return {
      status: 'error',
      message: error.toString()
    };
  }
}

/**
 * Mendapatkan ayat-ayat dalam satu halaman mushaf
 * @param {string|number} pageNumber - Nomor halaman
 * @return {Object} Objek JSON yang berisi ayat-ayat dalam halaman
 */
function getPage(pageNumber) {
  try {
    if (!pageNumber) {
      throw new Error('Parameter nomor halaman diperlukan');
    }
    
    // Konversi ke number untuk perbandingan
    const pageNum = parseInt(pageNumber);
    
    // Dapatkan semua ayat
    const ayatData = getCachedSheet(AYAT_SHEET_NAME);
    const ayatHeaders = ayatData[0];
    
    // Indeks kolom halaman (sesuaikan dengan struktur data)
    const pageColumnIndex = ayatHeaders.indexOf('Page');
    
    if (pageColumnIndex === -1) {
      throw new Error('Kolom Page tidak ditemukan di sheet');
    }
    
    const results = [];
    
    // Cari semua ayat dengan halaman yang sesuai
    for (let i = 1; i < ayatData.length; i++) {
      if (ayatData[i][pageColumnIndex] === pageNum) {
        const ayat = {};
        for (let j = 0; j < ayatHeaders.length; j++) {
          ayat[ayatHeaders[j]] = ayatData[i][j];
        }
        results.push(ayat);
      }
    }
    
    return {
      status: 'success',
      page: pageNum,
      count: results.length,
      data: results
    };
  } catch (error) {
    return {
      status: 'error',
      message: error.toString()
    };
  }
}

/**
 * Mendapatkan URL audio untuk suatu ayat
 * @param {string|number} surahNumber - Nomor surah
 * @param {string|number} ayatNumber - Nomor ayat
 * @param {string} qari - Qari yang dipilih (default: 'default')
 * @return {Object} Objek JSON yang berisi URL audio
 */
function getAudio(surahNumber, ayatNumber, qari = 'default') {
  try {
    if (!surahNumber) {
      throw new Error('Parameter nomor surah diperlukan');
    }
    
    // Konversi ke number untuk perbandingan
    const surahNum = parseInt(surahNumber);
    
    // Dapatkan data ayat untuk mendapatkan URL audio
    const ayatData = getCachedSheet(AYAT_SHEET_NAME);
    const ayatHeaders = ayatData[0];
    
    // Indeks kolom audio (sesuaikan dengan struktur data)
    const audioColumnIndex = ayatHeaders.indexOf('Audio');
    
    if (audioColumnIndex === -1) {
      throw new Error('Kolom Audio tidak ditemukan di sheet');
    }
    
    let audioUrl = null;
    let ayatInfo = null;
    
    if (ayatNumber) {
      // Jika nomor ayat diberikan, cari ayat spesifik
      const ayatNum = parseInt(ayatNumber);
      
      for (let i = 1; i < ayatData.length; i++) {
        if (ayatData[i][0] === surahNum && ayatData[i][1] === ayatNum) {
          audioUrl = ayatData[i][audioColumnIndex];
          
          // Buat objek ayat dengan semua informasi
          ayatInfo = {};
          for (let j = 0; j < ayatHeaders.length; j++) {
            ayatInfo[ayatHeaders[j]] = ayatData[i][j];
          }
          break;
        }
      }
      
      if (!audioUrl) {
        throw new Error(`Ayat dengan nomor ${ayatNumber} pada Surah ${surahNumber} tidak ditemukan`);
      }
      
      // Jika qari tidak default, modifikasi URL audio sesuai qari
      // Ini tergantung pada struktur URL audio Anda
      if (qari !== 'default') {
        // Contoh: ganti bagian dari URL dengan qari yang dipilih
        // audioUrl = audioUrl.replace('/default/', `/${qari}/`);
      }
      
      return {
        status: 'success',
        surah: surahNum,
        ayat: parseInt(ayatNumber),
        qari: qari,
        audio_url: audioUrl,
        ayat_info: ayatInfo
      };
    } else {
      // Jika nomor ayat tidak diberikan, kumpulkan semua URL audio untuk surah tersebut
      const audioUrls = [];
      const ayatInfoList = [];
      
      for (let i = 1; i < ayatData.length; i++) {
        if (ayatData[i][0] === surahNum) {
          const currentAudioUrl = ayatData[i][audioColumnIndex];
          
          // Buat objek ayat dengan semua informasi
          const currentAyatInfo = {};
          for (let j = 0; j < ayatHeaders.length; j++) {
            currentAyatInfo[ayatHeaders[j]] = ayatData[i][j];
          }
          
          audioUrls.push({
            ayat: ayatData[i][1],
            audio_url: currentAudioUrl
          });
          
          ayatInfoList.push(currentAyatInfo);
        }
      }
      
      if (audioUrls.length === 0) {
        throw new Error(`Surah dengan nomor ${surahNumber} tidak ditemukan`);
      }
      
      return {
        status: 'success',
        surah: surahNum,
        qari: qari,
        count: audioUrls.length,
        audio_data: audioUrls,
        ayat_info: ayatInfoList
      };
    }
  } catch (error) {
    return {
      status: 'error',
      message: error.toString()
    };
  }
}

/**
 * Melacak penggunaan API untuk analytics
 * @param {string} endpoint - Nama endpoint yang diakses
 * @param {Object} params - Parameter yang digunakan (opsional)
 */
function trackAnalytics(endpoint, params = {}) {
  try {
    // Dapatkan tanggal saat ini dalam format YYYY-MM-DD
    const today = new Date();
    const dateStr = Utilities.formatDate(today, 'GMT', 'yyyy-MM-dd');
    
    // Kunci untuk menyimpan data analytics harian
    const analyticsKey = `analytics_${dateStr}`;
    
    // Dapatkan data analytics yang sudah ada, atau buat objek baru jika belum ada
    let analyticsData = {};
    const existingData = PROPERTY_STORE.getProperty(analyticsKey);
    
    if (existingData) {
      analyticsData = JSON.parse(existingData);
    }
    
    // Inisialisasi endpoint jika belum ada
    if (!analyticsData[endpoint]) {
      analyticsData[endpoint] = {
        count: 0,
        params: {}
      };
    }
    
    // Tambahkan hit untuk endpoint
    analyticsData[endpoint].count++;
    
    // Tambahkan hit untuk parameter
    for (const key in params) {
      const value = params[key];
      const paramKey = `${key}_${value}`;
      
      if (!analyticsData[endpoint].params[paramKey]) {
        analyticsData[endpoint].params[paramKey] = 0;
      }
      
      analyticsData[endpoint].params[paramKey]++;
    }
    
    // Simpan data kembali ke property store
    PROPERTY_STORE.setProperty(analyticsKey, JSON.stringify(analyticsData));
    
    // Membersihkan data analytics yang sudah lebih dari 30 hari
    cleanupOldAnalytics();
  } catch (error) {
    console.error('Error tracking analytics:', error);
    // Jangan gagalkan respons API karena kesalahan analytics
  }
}

/**
 * Membersihkan data analytics yang sudah lebih dari 30 hari
 */
function cleanupOldAnalytics() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Dapatkan semua properti
    const allProperties = PROPERTY_STORE.getProperties();
    
    // Cari properti analytics yang sudah lebih dari 30 hari
    for (const key in allProperties) {
      if (key.startsWith('analytics_')) {
        const dateStr = key.substring(10); // 'analytics_2023-01-01' -> '2023-01-01'
        const dateParts = dateStr.split('-');
        
        if (dateParts.length === 3) {
          const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
          
          if (date < thirtyDaysAgo) {
            PROPERTY_STORE.deleteProperty(key);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up old analytics:', error);
  }
}

/**
 * Mendapatkan data analytics (hanya untuk admin dengan kunci API)
 * @param {string} apiKey - Kunci API untuk otentikasi
 * @return {Object} Objek JSON yang berisi data analytics
 */
function getAnalyticsData(apiKey) {
  try {
    // Periksa kunci API (ganti dengan kunci yang sebenarnya)
    const ADMIN_API_KEY = '<ADMIN-KEY>';
    
    if (!apiKey || apiKey !== ADMIN_API_KEY) {
      throw new Error('Kunci API tidak valid');
    }
    
    // Dapatkan semua properti
    const allProperties = PROPERTY_STORE.getProperties();
    
    // Kumpulkan data analytics
    const analyticsData = {};
    
    for (const key in allProperties) {
      if (key.startsWith('analytics_')) {
        const dateStr = key.substring(10); // 'analytics_2023-01-01' -> '2023-01-01'
        analyticsData[dateStr] = JSON.parse(allProperties[key]);
      }
    }
    
    return {
      status: 'success',
      data: analyticsData
    };
  } catch (error) {
    return {
      status: 'error',
      message: error.toString()
    };
  }
}

/**
 * Fungsi bantuan untuk mendapatkan sheet cache jika tersedia
 * @param {string} sheetName - Nama sheet
 * @return {Array} Data sheet dalam bentuk array 2D
 */
function getCachedSheet(sheetName) {
  const cache = CacheService.getScriptCache();
  const cacheKey = `sheet_${sheetName}`;
  const cachedData = cache.get(cacheKey);
  
  if (cachedData !== null) {
    return JSON.parse(cachedData);
  }
  
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  
  // Cache data selama 6 jam (ditingkatkan dari 15 menit)
  try {
    cache.put(cacheKey, JSON.stringify(data), CACHE_EXPIRATION);
  } catch (e) {
    // Jika data terlalu besar untuk di-cache, coba chunk data
    try {
      const chunks = chunkString(JSON.stringify(data), 100000); // ~100KB per chunk
      for (let i = 0; i < chunks.length; i++) {
        cache.put(`${cacheKey}_${i}`, chunks[i], CACHE_EXPIRATION);
      }
      cache.put(`${cacheKey}_count`, chunks.length.toString(), CACHE_EXPIRATION);
    } catch (e2) {
      console.log('Data terlalu besar untuk chunked cache:', e2);
    }
  }
  
  return data;
}

/**
 * Fungsi bantuan untuk memecah string menjadi chunk yang lebih kecil
 * @param {string} str - String yang akan dipecah
 * @param {number} size - Ukuran maksimal per chunk
 * @return {Array<string>} Array dari chunk string
 */
function chunkString(str, size) {
  const numChunks = Math.ceil(str.length / size);
  const chunks = new Array(numChunks);
  
  for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
    chunks[i] = str.substr(o, size);
  }
  
  return chunks;
}

/**
 * Fungsi inisialisasi untuk membuat cache dan sheet terkait saat deployment
 */
function doPost(e) {
  // Fungsi ini dipanggil untuk menangani POST request, bisa digunakan untuk admin API
  // Contoh: Menambahkan/mengubah data, membersihkan cache, dll.
  return ContentService.createTextOutput(JSON.stringify({
    status: 'error',
    message: 'POST requests are not supported for public API'
  })).setMimeType(ContentService.MimeType.JSON);
}
