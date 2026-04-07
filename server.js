const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();

// CORS за Netlify
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));
app.options('*', cors());

app.use(express.json());

const codes = {};

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "gamingskud01@gmail.com",
        pass: "kcnczcnrlskjfbwl"  // Замени со App Password ако не работи
    }
});

// ТЕСТ РУТА (работи на GET)
app.get("/", (req, res) => {
    res.json({ message: "GameVault API работи!" });
});

// ========== ГЛАВНА РУТА ЗА ПРАЌАЊЕ КОД (РАБОТИ НА POST) ==========
app.post("/send-code", async (req, res) => {
    const { email, username } = req.body;
    
    console.log("📨 Примен POST барање за:", email, username);
    
    if (!email || !username) {
        return res.status(400).json({ success: false, message: "Е-пошта и име се потребни" });
    }
    
    const code = Math.floor(1000 + Math.random() * 9000);
    
    codes[email] = {
        code: code,
        username: username,
        expires: Date.now() + 2 * 60 * 1000
    };
    
    const html = `
        <div style="background:#0a0a2e;padding:40px;font-family:Arial;">
            <div style="background:#1a1a3e;border-radius:15px;padding:40px;text-align:center;">
                <h1 style="color:#667eea;">🎮 GAMEVAULT</h1>
                <p style="color:white;">Здраво ${username}!</p>
                <div style="background:#0a0a1a;padding:30px;border-radius:10px;margin:20px 0;">
                    <h1 style="color:#ffd89b;font-size:46px;letter-spacing:8px;">${code}</h1>
                </div>
                <p style="color:#ff8888;">⚠️ Кодот истекува за 2 минути!</p>
                <p style="color:#888;">🔒 Не го споделувајте</p>
            </div>
        </div>
    `;
    
    try {
        await transporter.sendMail({
            from: '"GameVault" <gamingskud01@gmail.com>',
            to: email,
            subject: "🎮 GameVault - Вашиот код",
            html: html
        });
        
        console.log("✅ Е-пошта испратена на:", email);
        res.json({ success: true, message: "Кодот е испратен!" });
    } catch (error) {
        console.error("❌ Грешка при испраќање:", error);
        res.json({ success: false, message: "Грешка при испраќање на е-пошта. Обидете се повторно." });
    }
});

// РУТА ЗА ВЕРИФИКАЦИЈА
app.post("/verify-code", (req, res) => {
    const { email, code } = req.body;
    
    console.log("🔍 Проверка на код за:", email);
    
    if (!codes[email]) {
        return res.json({ success: false, message: "Нема активен код. Испратете нов." });
    }
    
    const data = codes[email];
    
    if (Date.now() > data.expires) {
        delete codes[email];
        return res.json({ success: false, message: "Кодот е истечен (2 минути)." });
    }
    
    if (parseInt(code) === data.code) {
        const username = data.username;
        delete codes[email];
        console.log("✅ Успешно најавен:", username);
        res.json({ success: true, username: username });
    } else {
        console.log("❌ Погрешен код:", code);
        res.json({ success: false, message: "Погрешен код. Обидете се повторно." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Серверот работи на порта ${PORT}`);
    console.log(`📡 CORS е овозможен за сите домени`);
    console.log(`📧 POST /send-code - за испраќање код`);
    console.log(`🔐 POST /verify-code - за верификација`);
});
