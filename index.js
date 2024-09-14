const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const token = '7463685279:AAEtkWr1SqOQzUL5VAPK_rF-ZLtzEuO-pVQ';
const bot = new TelegramBot(token, { polling: true });

function generateNoise() {
    const versions = ['219.0.0.12.117', '220.0.0.8.115', '221.0.0.15.119'];
    const randomVersion = versions[Math.floor(Math.random() * versions.length)];
    return `Instagram ${randomVersion} Android`;
}

function generateCsr() {
    return crypto.randomBytes(16).toString('hex');
}

function generateUid() {
    return crypto.randomBytes(8).toString('hex');
}

function generateCookies() {
    const mid = crypto.randomBytes(8).toString('hex');
    const igDid = crypto.randomUUID();
    const csrftoken = generateCsr();
    const dsUserId = Math.floor(Math.random() * 1000000000000);
    
    return `mid=${mid}; ig_did=${igDid}; csrftoken=${csrftoken}; ds_user_id=${dsUserId}; rur="VLL"; ig_nrcb=1`;
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

bot.onText(/\/ig (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const user = match[1];

    try {
        const csr = generateCsr();
        const uid = generateUid();
        const cookies = generateCookies();

        const headers = {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "Host": "i.instagram.com",
            "Connection": "Keep-Alive",
            "User-Agent": generateNoise(),
            "Cookie": cookies,
            "Cookie2": "$Version=1",
            "Accept-Language": "en-US",
            "X-IG-Capabilities": "3brTvw==",
            "X-IG-Connection-Type": "WIFI",
            "X-IG-App-ID": "567067343352427",
            "Accept-Encoding": "gzip",
        };

        const data = {
            "username": user,
            "device_id": `android-${uid}`,
            "guid": uid,
            "_csrftoken": csr
        };

        await delay(3000);

        const response = await axios.post('https://i.instagram.com/api/v1/users/lookup/', new URLSearchParams(data).toString(), { headers });
        const res = response.data;

        if (res.status === 'fail' && res.spam) {
            throw new Error('Rate limit reached');
        }

        const profilePicUrl = res.user.profile_pic_url;
        const writer = fs.createWriteStream(path.join(__dirname, 'profile_pic.jpg'));

        const picResponse = await axios({
            url: profilePicUrl,
            method: 'GET',
            responseType: 'stream'
        });

        picResponse.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        const he = {
            'accept': '*/*',
            'accept-encoding': 'gzip, deflate, br',
            'accept-language': 'ar,en;q=0.9',
            'cookie': cookies,
            'referer': `https://www.instagram.com/${user}/?hl=ar`,
            'sec-ch-prefers-color-scheme': 'dark',
            'sec-ch-ua': '"Chromium";v="112", "Google Chrome";v="112", "Not:A-Brand";v="99"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'user-agent': generateNoise(),
            'viewport-width': '1051',
            'x-asbd-id': '198387',
            'x-csrftoken': csr,
            'x-ig-app-id': '936619743392459',
            'x-ig-www-claim': '0',
            'x-requested-with': 'XMLHttpRequest',
        };

       const rr = await axios.get(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${user}`, { headers: he });
        const rrData = rr.data;

        const re = await axios.get(`https://o7aa.pythonanywhere.com/?id=${rrData.data.user.id}`);
        const reData = re.data;
const msgText = `
⋘─────━*معلومات الحساب*━─────⋙
الاسم ⇾ ${userData.full_name}  
اسم المستخدم ⇾ @${user}  
المعرف ⇾ ${userData.id}  
المتابعين ⇾ ${userData.edge_followed_by.count}  
المتابَعون ⇾ ${userData.edge_follow.count}  
السيرة الذاتية ⇾ ${userData.biography || 'غير متاح'}  
التاريخ ⇾ ${new Date().toLocaleDateString()}  
الرابط ⇾ https://www.instagram.com/${user}  
البريد الإلكتروني ⇾ ${obfuscatedEmail}  
الهاتف ⇾ ${obfuscatedPhone}  
الخاص ⇾ ${userData.is_private ? 'نعم' : 'لا'}  
تسجيل دخول فيسبوك ⇾ ${fbLoginOption}  
إعادة ضبط واتساب ⇾ ${canWaReset}  
إعادة ضبط SMS ⇾ ${canSmsReset}  
إعادة ضبط البريد الإلكتروني ⇾ ${canEmailReset}  
الهاتف صالح ⇾ ${hasValidPhone}  
حساب موثق ⇾ ${userData.is_verified ? 'نعم' : 'لا'}  
الدولة ⇾ ${country}  
⋘─────━*معلومات*━─────⋙  
المطور: @SAGD112| @SJGDDW
        `;

        // إرسال الصورة الشخصية مع النص في نفس الوقت
        if (userData.profile_pic_url_hd) {
            await bot.sendPhoto(chatId, userData.profile_pic_url_hd, { 
                caption: msgText, 
                parse_mode: 'HTML' 
            });
        } else {
            await bot.sendMessage(chatId, msgText, { parse_mode: 'HTML' });
        }

    } catch (error) {
        console.error('Error:', error.message);
        bot.sendMessage(chatId, `حدث خطأ أثناء جلب المعلومات لـ ${user}. يرجى المحاولة مرة أخرى لاحقًا.`);
    }
});
