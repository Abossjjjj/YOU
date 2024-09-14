const sqlite3 = require('sqlite3').verbose();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const crypto = require('crypto');
const uuidv4 = require('uuid').v4;
const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot is running...');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// متغيرات البريد الإلكتروني ومعرّفات الجلسة
let email = "sjgddw";
let token = "7463685279:AAEtkWr1SqOQzUL5VAPK_rF-ZLtzEuO-pVQ";
let chatId = "7193004338";

// استعلام البريد الإلكتروني من خلال Telegram API
async function getEmailFromTelegram() {
    while (!email) {
        try {
            const response = await axios.get(`https://api.telegram.org/bot${token}/getUpdates`);
            const updates = response.data;

            if (updates.result && updates.result.length > 0) {
                const lastMessage = updates.result[updates.result.length - 1].message;
                email = lastMessage.text;
            }
        } catch (error) {
            console.error("Error fetching Telegram updates:", error);
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

// دالة للحصول على معلومات حساب Instagram
async function getInstagramInfo() {
    const csr = uuidv4().replace(/-/g, '');

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
        'User-Agent': 'Instagram 100.0.0.17.129 Android',
        'Accept-Language': 'en-GB, en-US',
        'Cookie': `mid=ZVfGvgABAAGoQqa7AY3mgoYBV1nP; csrftoken=${csr}`,
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept-Encoding': 'gzip, deflate',
        'Host': 'i.instagram.com',
        'X-FB-HTTP-Engine': 'Liger',
        'Connection': 'keep-alive',
    };

    const data = new URLSearchParams({
        'signed_body': `0d067c2f86cac2c17d655631c9cec2402012fb0a329bcafb3b1f4c0bb56b1f1f.{{"_csrftoken":"${csr}","adid":"${uuidv4()}","guid":"${uuidv4()}","device_id":"${uuidv4()}","query":"${email}"}}`,
        'ig_sig_key_version': '4',
    });

    try {
        const res = await axios.post('https://i.instagram.com/api/v1/accounts/send_recovery_flow_email/', data, { headers });

        if (res.data.status === 'ok') {
            return res.data.email;
        } else {
            return 'Band Requests!';
        }
    } catch (error) {
        console.error("Error during Instagram request:", error);
        return 'Error fetching email';
    }
}

// دالة للحصول على تفاصيل حساب Instagram
async function getInstagramUserDetails(user) {
    const csr = uuidv4().replace(/-/g, '');
    const uid = uuidv4();

    const headers = {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Host": "i.instagram.com",
        "Connection": "Keep-Alive",
        "User-Agent": 'Instagram 100.0.0.17.129 Android',
        "Cookie": `mid=YwvCRAABAAEsZcmT0OGJdPu3iLUs; csrftoken=${csr}`,
        "Accept-Language": "en-US",
        "X-IG-Capabilities": "AQ==",
        "Accept-Encoding": "gzip",
    };

    const data = new URLSearchParams({
        "q": user,
        "device_id": `android${uid}`,
        "guid": uid,
        "_csrftoken": csr
    });

    try {
        const res = await axios.post('https://i.instagram.com/api/v1/users/lookup/', data, { headers });
        return res.data.user || {};
    } catch (error) {
        console.error("Error during user lookup:", error);
        return {};
    }
}

// دالة لجلب معلومات Instagram الكاملة
async function fetchInstagramData() {
    // جلب البريد الإلكتروني
    await getEmailFromTelegram();

    // جلب البريد الإلكتروني المرتبط بحساب Instagram
    const recoveryEmail = await getInstagramInfo();

    // استخراج اسم المستخدم من البريد الإلكتروني
    const user = email.split('@')[0];

    // جلب معلومات المستخدم
    const userInfo = await getInstagramUserDetails(user);

    const id = userInfo.pk || '';
    const isPrivate = userInfo.is_private || false;
    const hasPhone = userInfo.has_valid_phone || false;
    const canSMSReset = userInfo.can_sms_reset || false;
    const canWaReset = userInfo.can_wa_reset || false;
    const fbLoginOption = userInfo.fb_login_option || false;
    const obfuscatedPhone = userInfo.obfuscated_phone || '';
    const name = userInfo.full_name || '';
    const profilePicUrl = userInfo.profile_pic_url || '';
    let followers = "";
    let following = "";
    let posts = "";
    let date = "";

    // جلب المتابعين والمنشورات وتاريخ الإنشاء
    try {
        const response = await axios.get(`https://o7aa.pythonanywhere.com/?id=${id}`);
        const instaInfo = response.data;
        date = instaInfo.date || 'No Date';
    } catch (error) {
        console.error("Error fetching date from o7aa API:", error);
        date = 'No Date';
    }

    // جلب صورة الحساب
    if (profilePicUrl) {
        const profilePicPath = `${user}.jpg`;
        const response = await axios.get(profilePicUrl, { responseType: 'stream' });
        const writer = fs.createWriteStream(profilePicPath);
        response.data.pipe(writer);
        writer.on('finish', () => console.log('Profile picture saved.'));
    }

    // إرسال المعلومات عبر Telegram
    const tlgMessage = `
________main Info_______
[+] Email ==> ${email}
[+] E-mail Rest ==> ${recoveryEmail}
[+] Username ==> @${user}
[+] Name ==> ${name}
[+] ID ==> ${id}
[+] Followers ==> ${followers}
[+] Following ==> ${following}
[+] Posts ==> ${posts}
[+] Date ==> ${date}
_______other Info_________    
[+] Is Private ==> ${isPrivate}
[+] Has Phone Number ? ==> ${hasPhone}
[+] SMS Rest ==> ${canSMSReset}
[+] WhatsApp Rest ==> ${canWaReset}
[+] FaceBook Login ==> ${fbLoginOption}
[+] Obfuscated Phone ==> ${obfuscatedPhone}
_______BEST Dev_________    
@maho_s9 - @maho9s
    `;

    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
        chat_id: chatId,
        text: tlgMessage
    });
}

// استدعاء الدوال
fetchInstagramData();
