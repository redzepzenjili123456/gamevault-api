const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const codes = {};

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "gamingskud01@gmail.com",
        pass: "kcnczcnrlskjfbwl"
    }
});

app.get("/", (req, res) => {
    res.json({ message: "GameVault API работи!" });
});

app.post("/send-code", async (req, res) => {
    const { email, username } = req.body;
    
    if (!email || !username) {
        return res.json({ success: false, message: "Е-пошта и име се потребни" });
    }
    
    const code = Math.floor(1000 + Math.random()  * 9000);
    
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
        res.json({ success: true, message: "Кодот е испратен!" });
    } catch (error) {
        res.json({ success: false, message: "Грешка при испраќање" });
    }
});

app.post("/verify-code", (req, res) => {
    const { email, code } = req.body;
    
    if (!codes[email]) {
        return res.json({ success: false, message: "Нема активен код" });
    }
    
    const data = codes[email];
    
    if (Date.now() > data.expires) {
        delete codes[email];
        return res.json({ success: false, message: "Кодот е истечен" });
    }
    
    if (parseInt(code) === data.code) {
        const username = data.username;
        delete codes[email];
        res.json({ success: true, username: username });
    } else {
        res.json({ success: false, message: "Погрешен код" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Серверот работи на порта ${PORT}`);
});
