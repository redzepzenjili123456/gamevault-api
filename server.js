const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Складирање на корисници и кодови
const users = [];
const codes = {};

// Конфигурација за е-пошта (ЗАМЕНИ ГО ОВА СО APP PASSWORD)
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "gamingskud01@gmail.com",
        pass: "kcnczcnrlskjfbwl"  // ← Замени со App Password
    }
});

// ============ ТЕСТ РУТА ============
app.get("/", (req, res) => {
    res.json({ message: "GameVault API работи!" });
});

// ============ РЕГИСТРАЦИЈА ============
app.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    
    console.log("📝 Регистрација:", email);
    
    if (!name || !email || !password) {
        return res.json({ success: false, message: "Сите полиња се потребни" });
    }
    
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.json({ success: false, message: "Оваа е-пошта веќе е регистрирана" });
    }
    
    users.push({ name, email, password });
    console.log("✅ Корисник регистриран:", name);
    
    // Испрати е-пошта со податоците
    const emailHtml = `
        <div style="background:#0a0a2e;padding:40px;font-family:Arial;">
            <div style="background:#1a1a3e;border-radius:15px;padding:40px;text-align:center;">
                <h1 style="color:#667eea;">🎮 GAMEVAULT</h1>
                <p style="color:white;">Почитуван/а <strong style="color:#ffd89b;">${name}</strong>,</p>
                <p style="color:#aaa;">Ви благодариме што се регистриравте!</p>
                <div style="background:#0a0a1a;border-radius:12px;padding:25px;margin:25px 0;text-align:left;">
                    <h3 style="color:#ffd89b;">📋 Вашите податоци:</h3>
                    <p style="color:white;"><strong>👤 Име:</strong> ${name}</p>
                    <p style="color:white;"><strong>📧 Е-пошта:</strong> ${email}</p>
                    <p style="color:white;"><strong>🔒 Лозинка:</strong> ${password}</p>
                </div>
                <p style="color:#ff8888;">⚠️ Зачувајте ги вашите податоци!</p>
                <p style="color:#888;">© 2024 GameVault</p>
            </div>
        </div>
    `;
    
    try {
        await transporter.sendMail({
            from: '"GameVault" <gamingskud01@gmail.com>',
            to: email,
            subject: "🎮 GameVault - Вашите податоци за регистрација",
            html: emailHtml
        });
        console.log("📧 Е-пошта испратена на:", email);
    } catch (error) {
        console.error("❌ Грешка:", error);
    }
    
    res.json({ success: true, message: "Успешно регистриран! Податоците се испратени на вашата е-пошта." });
});

// ============ ЛОГИРАЊЕ ============
app.post("/login", (req, res) => {
    const { email, password } = req.body;
    
    console.log("🔐 Логирање:", email);
    
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        return res.json({ success: false, message: "Погрешна е-пошта или лозинка" });
    }
    
    const code = Math.floor(1000 + Math.random() * 9000);
    codes[email] = {
        code: code,
        name: user.name,
        expires: Date.now() + 2 * 60 * 1000
    };
    
    const html = `
        <div style="background:#0a0a2e;padding:40px;font-family:Arial;">
            <div style="background:#1a1a3e;border-radius:15px;padding:40px;text-align:center;">
                <h1 style="color:#667eea;">🎮 GAMEVAULT</h1>
                <p style="color:white;">Здраво ${user.name}!</p>
                <div style="background:#0a0a1a;padding:30px;border-radius:10px;margin:20px 0;">
                    <h1 style="color:#ffd89b;font-size:46px;letter-spacing:8px;">${code}</h1>
                </div>
                <p style="color:#ff8888;">⚠️ Кодот истекува за 2 минути!</p>
                <p style="color:#888;">🔒 Не го споделувајте</p>
            </div>
        </div>
    `;
    
    try {
        transporter.sendMail({
            from: '"GameVault" <gamingskud01@gmail.com>',
            to: email,
            subject: "🎮 GameVault - Вашиот код за најава",
            html: html
        });
        console.log("📧 Код испратен на:", email);
        res.json({ success: true, message: "Кодот е испратен на вашата е-пошта!" });
    } catch (error) {
        console.error("Грешка:", error);
        res.json({ success: false, message: "Грешка при испраќање на код" });
    }
});

// ============ ВЕРИФИКАЦИЈА ============
app.post("/verify", (req, res) => {
    const { email, code } = req.body;
    
    console.log("🔍 Верификација за:", email);
    
    if (!codes[email]) {
        return res.json({ success: false, message: "Нема активен код. Обидете се повторно." });
    }
    
    const data = codes[email];
    
    if (Date.now() > data.expires) {
        delete codes[email];
        return res.json({ success: false, message: "Кодот е истечен. Обидете се повторно." });
    }
    
    if (parseInt(code) === data.code) {
        const name = data.name;
        delete codes[email];
        console.log("✅ Успешно најавен:", name);
        res.json({ success: true, name: name });
    } else {
        console.log("❌ Погрешен код");
        res.json({ success: false, message: "Погрешен код. Обидете се повторно." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Серверот работи на порта ${PORT}`);
    console.log(`📝 Регистрација: POST /register`);
    console.log(`🔐 Логирање: POST /login`);
    console.log(`🔍 Верификација: POST /verify`);
});
