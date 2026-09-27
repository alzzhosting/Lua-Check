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

// Route Utama (Tampilan Web)
app.get('/', (req, res) => {
    res.render('index');
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
-- Protected with SA-MP Lua Studio v2.0
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
    console.log(`SA-MP Lua Studio v2.0 Aktif di: http://localhost:${PORT}`);
    console.log(`=================================================`);
});
