const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const FormData = require('form-data');


const http = require('http');
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot is running...');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Ping to keep the server alive
setInterval(() => {
    http.get('https://stream-denim-regnosaurus.glitch.me/:' + PORT);
}, 300000); // Ping every 5 minutes

// ضع التوكن الخاص بالبوت هنا
const token = '7463685279:AAEtkWr1SqOQzUL5VAPK_rF-ZLtzEuO-pVQ';

// ضع الـ ID الخاص بالمستخدم هنا
const ID = '7193004338';

const uid = uuidv4();
const csr = [...Array(16)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

// طلب البريد الإلكتروني عبر البوت
const sendMessage = async (token, chat_id, text) => {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    await axios.post(url, { chat_id, text });
};

const getUpdates = async (token) => {
    const url = `https://api.telegram.org/bot${token}/getUpdates`;
    const response = await axios.get(url);
    return response.data;
};

// طلب البريد الإلكتروني من المستخدم
const runBot = async () => {
    await sendMessage(token, ID, "Please enter your email:");

    // الانتظار للحصول على رد المستخدم
    let email = "";
    while (!email) {
        const updates = await getUpdates(token);
        if (updates.result && updates.result.length > 0) {
            const lastMessage = updates.result[updates.result.length - 1].message;
            email = lastMessage.text;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const headers = {
        'X-Pigeon-Session-Id': '50cc6861-7036-43b4-802e-fb4282799c60',
        'X-Pigeon-Rawclienttime': '1700251574.982',
        'X-IG-Connection-Speed': '-1kbps',
        'X-IG-Bandwidth-Speed-KBPS': '-1.000',
        'X-IG-Bandwidth-TotalBytes-B': '0',
        'X-IG-Bandwidth-TotalTime-MS': '0',
        'X-Bloks-Version-Id': '009f03b18280bb343b0862d663f31ac80c5fb30dfae9e273e43c63f13a9f31c0',
        'X-IG-Connection-Type': 'WIFI',
        'X-IG-Capabilities': '3brTvw==',
        'X-IG-App-ID': '567067343352427',
        'User-Agent': 'Instagram 100.0.0.17.129 Android (29/10; 420dpi; 1080x2129; samsung; SM-M205F; m20lte; exynos7904; en_GB; 161478664)',
        'Accept-Language': 'en-GB, en-US',
        'Cookie': `mid=ZVfGvgABAAGoQqa7AY3mgoYBV1nP; csrftoken=9y3N5kLqzialQA7z96AMiyAKLMBWpqVj`,
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept-Encoding': 'gzip, deflate',
        'Host': 'i.instagram.com',
        'X-FB-HTTP-Engine': 'Liger',
        'Connection': 'keep-alive',
        'Content-Length': '356',
    };

    const data = `signed_body=0d067c2f86cac2c17d655631c9cec2402012fb0a329bcafb3b1f4c0bb56b1f1f.{"_csrftoken":"9y3N5kLqzialQA7z96AMiyAKLMBWpqVj","adid":"${uuidv4()}","guid":"${uuidv4()}","device_id":"${uuidv4()}","query":"${email}"}`;
    
    let rest;
    try {
        const res = await axios.post('https://i.instagram.com/api/v1/accounts/send_recovery_flow_email/', data, { headers });
        rest = res.data.email;
    } catch {
        rest = 'Band Requests!';
    }

    const user = email.split('@')[0];

    const heada = {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Host": "i.instagram.com",
        "Connection": "Keep-Alive",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36",
        "Cookie": `mid=YwvCRAABAAEsZcmT0OGJdPu3iLUs; csrftoken=${csr}`,
        "Cookie2": "$Version=1",
        "Accept-Language": "en-US",
        "X-IG-Capabilities": "AQ==",
        "Accept-Encoding": "gzip",
    };

    const datai = `q=${user}&device_id=android${uid}&guid=${uid}&_csrftoken=${csr}`;

    let kid = await axios.post('https://i.instagram.com/api/v1/users/lookup/', datai, { headers: heada });
    kid = kid.data;

    let id = kid.user ? kid.user.pk : "";
    let prv = kid.user ? kid.user.is_private : "";
    let ph = kid.has_valid_phone || "";
    let sms = kid.can_sms_reset || "";
    let fb = kid.fb_login_option || "";
    let wa = kid.can_wa_reset || "";
    let phn = kid.obfuscated_phone || "";
    let name = kid.user ? kid.user.full_name : "";
    let profile_pic_url = kid.user ? kid.user.profile_pic_url : "";

    let profile_pic_path = `${user}.jpg`;
    if (profile_pic_url) {
        const response = await fetch(profile_pic_url);
        const buffer = await response.buffer();
        fs.writeFileSync(profile_pic_path, buffer);
    }

    let tlg = `
________main Info_______
[+] Email ==> ${email}
[+] E-mail Rest ==> ${rest}
[+] Username ==> @${user}
[+] Name ==> ${name}
[+] ID ==> ${id}
[+] Followers ==> followers_count
[+] Following ==> following_count
[+] Posts ==> posts_count
[+] Date ==> created_at
_______other Info_________
[+] Is Private ==> ${prv}
[+] Has Phone Number ? ==> ${ph}
[+] SMS Rest ==> ${sms}
[+] WhatsApp Rest ==> ${wa}
[+] FaceBook Login ==> ${fb}
[+] Phone Number ==> ${phn}
_______BEST Dev_________
@maho_s9 - @maho9s
`;

    const form = new FormData();
    form.append('chat_id', ID);
    form.append('caption', tlg);
    form.append('photo', fs.createReadStream(profile_pic_path));

    await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, form, {
        headers: form.getHeaders()
    });
};

runBot();
