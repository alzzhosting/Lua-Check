const express = require('express');
const path = require('path');
const luaparse = require('luaparse');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware Parse JSON dan Form Data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set EJS sebagai Template Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// =========================================================================
// 1. PENGATURAN LINK DOWNLOAD CLIENT SA-MP ANDROID
// =========================================================================
const androidClients = [
    {
        id: 'alyn',
        name: 'Client Alyn',
        version: 'v20.7.8',
        desc: 'Client SA-MP Android dengan performa ringan, kestabilan tinggi, dan kustomisasi antarmuka khas.',
        downloadUrl: 'https://alynsampmobile.pro/', // Ganti dengan link unduhan Alyn
        badge: 'Popular',
        badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
        icon: 'fa-mobile-screen-button'
    },
    {
        id: 'nezuko',
        name: 'Client Nezuko',
        version: 'v1.0.1 (BETA)',
        desc: 'Client Android dengan optimasi grafis halus, tampilan segar, dan fitur pendukung roleplay. (Support Mobilador)',
        downloadUrl: 'https://www.mediafire.com/file/f6ci0mzgmi1hkr1/SAMP_Nezuko_1.0.1_%28BETA%29.apk/file', // Ganti dengan link unduhan Nezuko
        badge: 'Recommended',
        badgeColor: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
        icon: 'fa-wand-magic-sparkles'
    },
    {
        id: 'james',
        name: 'Client James',
        version: 'v1.0.7',
        desc: 'Client SA-MP Android yang dirancang khusus untuk FPS tinggi, respon cepat, dan bebas lag.',
        downloadUrl: 'https://www.mediafire.com/file/48jadgil26sukeg/SAMP+Mobile_1.0.7.apk/file', // Ganti dengan link unduhan James
        badge: 'Stable',
        badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        icon: 'fa-bolt'
    },
    {
        id: 'thunder',
        name: 'Client Thunder',
        version: 'v2.1',
        desc: 'Client Android bertenaga dengan respon sentuhan tinggi dan dukungan modifikasi luas. (Laiks PC)',
        downloadUrl: 'https://thunder-samp.com/', // Ganti dengan link unduhan Thunder
        badge: 'Ultra Fast',
        badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
        icon: 'fa-cloud-bolt'
    }
];

// =========================================================================
// 2. DETEKTOR POLA KODE LUA BERBAHAYA / STEALER
// =========================================================================
const dangerPatterns = [
    { pattern: /loadstring/i, desc: 'Eksekusi kode jarak jauh (`loadstring`)' },
    { pattern: /downloadFile|asyncHttpRequest/i, desc: 'Pengunduhan file otomatis di latar belakang' },
    { pattern: /http\.request|socket\.http|copas\.http/i, desc: 'Koneksi jaringan HTTP ke luar' },
    { pattern: /discord\.com\/api\/webhooks/i, desc: 'Potensi Discord Webhook Stealer' },
    { pattern: /os\.execute|os\.remove|os\.rename/i, desc: 'Akses langsung ke perintah sistem operasi' },
    { pattern: /getBotToken|getToken|passWord|sampGetPlayerPassword/i, desc: 'Pencarian kata sandi atau token sensitif' },
    { pattern: /string\.char\(\s*\d+(\s*,\s*\d+){5,}\)/i, desc: 'Enkripsi Bytecode (`string.char`) disamarkan' },
    { pattern: /\\x[0-9a-fA-F]{2}/i, desc: 'Hex Obfuscation disamarkan' },
    { pattern: /sampGetPlayerNickname|getUsername/i, desc: 'Pengambilan nama pengguna pemain' },
    { pattern: /onWindowMessage|getAsyncKeyState|vkeys/i, desc: 'Pencatat tombol keyboard (Keylogger)' }
];

// =========================================================================
// 3. ROUTE DAN API ENDPOINTS
// =========================================================================

// Halaman Utama
app.get('/', (req, res) => {
    res.render('index');
});

// API Get Client Android
app.get('/api/clients', (req, res) => {
    return res.json({ success: true, clients: androidClients });
});

// API Bypass Link Shortener (sfl.gl)
app.post('/api/bypass-url', async (req, res) => {
    const { url } = req.body;

    if (!url || url.trim() === '') {
        return res.json({ success: false, message: 'URL tidak boleh kosong!' });
    }

    try {
        const response = await fetch('https://zennq.my.id/api/bypass', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': 'zq_s3utsc8yfqw2ung1w8rybkqxr9fl1gcb'
            },
            body: JSON.stringify({ url: url.trim() })
        });

        if (!response.ok) {
            throw new Error(`Server API merespons dengan status ${response.status}`);
        }

        const data = await response.json();

        if (data && data.data && data.data.bypassedUrl) {
            return res.json({ success: true, bypassedUrl: data.data.bypassedUrl });
        } else {
            return res.json({ success: false, message: 'Format tautan tidak didukung atau gagal di-bypass.' });
        }
    } catch (err) {
        return res.json({ success: false, message: `Gagal terhubung ke server bypass: ${err.message}` });
    }
});

// API Cek Syntax Lua
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

    return res.json({ success: true, syntaxValid, syntaxError, warnings: detectedWarnings });
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
-- Protected with SAMP-TOOLS VERNOZ v5.0
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

        return res.json({ success: true, result: obfuscatedCode });
    } catch (err) {
        return res.json({ success: false, message: `Gagal Obfuscate! Perbaiki sintaks terlebih dahulu: ${err.message}` });
    }
});

// Jalankan Server
app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`SAMP-TOOLS VERNOZ v5.0 Berjalan di: http://localhost:${PORT}`);
    console.log(`=================================================`);
});
