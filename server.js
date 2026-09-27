const express = require('express');
const path = require('path');
const luaparse = require('luaparse');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set EJS sebagai Template Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// =========================================================================
// PENGATURAN & LINK DOWNLOAD CLIENT SA-MP ANDROID (Ubah Link Di Sini!)
// =========================================================================
const androidClients = [
    {
        id: 'alyn',
        name: 'Client Alyn',
        version: 'v2.0',
        desc: 'Client SA-MP Android dengan performa ringan, kestabilan tinggi, dan kustomisasi antarmuka khas.',
        downloadUrl: 'https://example.com/download/client-alyn', // Ganti dengan link unduhan Alyn
        badge: 'Popular',
        badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
        icon: 'fa-mobile-screen-button'
    },
    {
        id: 'nezuko',
        name: 'Client Nezuko',
        version: 'v1.8',
        desc: 'Client Android dengan optimasi grafis halus, tampilan segar, dan fitur pendukung roleplay.',
        downloadUrl: 'https://example.com/download/client-nezuko', // Ganti dengan link unduhan Nezuko
        badge: 'Recommended',
        badgeColor: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
        icon: 'fa-wand-magic-sparkles'
    },
    {
        id: 'james',
        name: 'Client James',
        version: 'v2.5',
        desc: 'Client SA-MP Android yang dirancang khusus untuk FPS tinggi, respon cepat, dan bebas lag.',
        downloadUrl: 'https://example.com/download/client-james', // Ganti dengan link unduhan James
        badge: 'High FPS',
        badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        icon: 'fa-bolt'
    },
    {
        id: 'thunder',
        name: 'Client Thunder',
        version: 'v3.0',
        desc: 'Client Android bertenaga dengan respon sentuhan tinggi dan dukungan modifikasi luas.',
        downloadUrl: 'https://example.com/download/client-thunder', // Ganti dengan link unduhan Thunder
        badge: 'Ultra Fast',
        badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
        icon: 'fa-cloud-bolt'
    }
];

// Pola Deteksi Bahaya / Stealer
const dangerPatterns = [
    { pattern: /loadstring/i, desc: 'Eksekusi kode jarak jauh (`loadstring`)' },
    { pattern: /downloadFile|asyncHttpRequest/i, desc: 'Mencoba mengunduh file otomatis / Request latar belakang' },
    { pattern: /http\.request|socket\.http|copas\.http/i, desc: 'Koneksi HTTP ke luar server' },
    { pattern: /discord\.com\/api\/webhooks/i, desc: 'Potensi Webhook Stealer (Mengirim data ke Discord)' },
    { pattern: /os\.execute|os\.remove|os\.rename/i, desc: 'Akses sistem file / Command Prompt OS' },
    { pattern: /getBotToken|getToken|passWord|sampGetPlayerPassword/i, desc: 'Pencarian data sensitif / Password / Token' },
    { pattern: /string\.char\(\s*\d+(\s*,\s*\d+){5,}\)/i, desc: 'Enkripsi Bytecode (`string.char`) - Kode disamarkan' },
    { pattern: /\\x[0-9a-fA-F]{2}/i, desc: 'Hex Obfuscation (`\\xXX`) - Kode disamarkan' },
    { pattern: /sampGetPlayerNickname|getUsername/i, desc: 'Pengambilan Username / Nickname Pemain' },
    { pattern: /onWindowMessage|getAsyncKeyState|vkeys/i, desc: 'Pencatatan input tombol / Potensi Keylogger' }
];

// Route Utama
app.get('/', (req, res) => {
    res.render('index');
});

// API Endpoint untuk Mendapatkan Daftar Client Android
app.get('/api/clients', (req, res) => {
    return res.json({
        success: true,
        clients: androidClients
    });
});

// API Cek Syntax & Keamanan Lua
app.post('/api/check-lua', (req, res) => {
    const { code } = req.body;
    if (!code || code.trim() === '') {
        return res.json({ success: false, message: 'Kode Lua tidak boleh kosong!' });
    }

    let syntaxValid = false;
    let syntaxError = null;

    try {
        luaparse.parse(code, { luaVersion: '5.1' });
        syntaxValid = true;
    } catch (err) {
        syntaxError = `Error Sintaks pada Baris ${err.line}, Kolom ${err.column}: ${err.message}`;
    }

    const detectedWarnings = [];
    dangerPatterns.forEach(item => {
        if (item.pattern.test(code)) {
            detectedWarnings.push(item.desc);
        }
    });

    return res.json({
        success: true,
        syntaxValid,
        syntaxError,
        warnings: detectedWarnings
    });
});

// API Obfuscate Lua
app.post('/api/obfuscate-lua', (req, res) => {
    const { code } = req.body;
    if (!code || code.trim() === '') {
        return res.json({ success: false, message: 'Kode Lua tidak boleh kosong!' });
    }

    try {
        luaparse.parse(code, { luaVersion: '5.1' });

        const bytes = [];
        for (let i = 0; i < code.length; i++) {
            bytes.push(code.charCodeAt(i));
        }

        const varData = '_0x' + Math.random().toString(36).substring(2, 8);
        const varStr = '_0x' + Math.random().toString(36).substring(2, 8);

        const obfuscatedCode = `-- ===============================================
-- Protected with SAMP-TOOLS VERNOZ
-- Compatible: Moonloader (PC) & Monetloader (Android)
-- ===============================================
local ${varData} = {${bytes.join(',')}}
local ${varStr} = ""
for i = 1, #${varData} do
    ${varStr} = ${varStr} .. string.char(${varData}[i])
end
local _exec = loadstring or load
local _fn, _err = _exec(${varStr})
if not _fn then
    error("Gagal menjalankan script: " .. tostring(_err))
else
    _fn()
end`;

        return res.json({
            success: true,
            result: obfuscatedCode
        });
    } catch (err) {
        return res.json({
            success: false,
            message: `Gagal Obfuscate! Perbaiki error sintaks terlebih dahulu: ${err.message}`
        });
    }
});

// Menjalankan Server
app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`SAMP-TOOLS VERNOZ Aktif di: http://localhost:${PORT}`);
    console.log(`=================================================`);
});
