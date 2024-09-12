const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
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

const ADMIN_ID = '7193004338'; // ضع معرف الشات الخاص بالمدير

let usersData = {}; // لتخزين بيانات المستخدمين بشكل منفصل
let usedBefore = {}; // لتخزين المستخدمين الذين استخدموا البوت من قبل
const forcedChannels = ['@SJGDDW', '@YYY_A12', '@YEMENCYBER101'];

const token = '6455603203:AAGYSBJ_hybQ_lWfQszylVQOEW9Pzrz9Bw0';
const bot = new TelegramBot(token, { polling: true });

const uid = uuidv4();
const csr = crypto.randomBytes(8).toString('hex').repeat(2);

function generateUserAgent() {
    return 'Mozilla/5.0 (Linux; Android 8.0.0; Plume L2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.88 Mobile Safari/537.36';
}

async function getCountryInfo(countryCode) {
    try {
        const response = await axios.get(`https://restcountries.com/v3.1/alpha/${countryCode}`);
        const countryData = response.data[0];
        return {
            name: countryData.name.common,
            flag: countryData.flag
        };
    } catch (error) {
        console.error("Error fetching country info:", error);
        return { name: "Unknown", flag: "🏳️" };
    }
}

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;

    const isSubscribed = await checkSubscriptions(chatId);

    if (!isSubscribed) {
        // المستخدم غير مشترك، لن يتم إظهار الأزرار
        return;
    }

    const opts = {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'المطور - Developer', url: 'https://t.me/SAGD112' }],
                [{ text: 'قناة المطور - Channel Developer', url: 'https://t.me/SJGDDW'}]
            ]
        },
        parse_mode: 'HTML'
    };

    if (!usedBefore[chatId]) {
        // إذا لم يستخدم البوت من قبل، أرسل إشعارًا إلى المدير
        usedBefore[chatId] = true; // تسجيل أن المستخدم استخدم البوت

        const userName = msg.from.first_name || 'غير متاح';
        const userUsername = msg.from.username || 'غير متاح';
        const userId = msg.from.id;
        const currentTime = new Date().toLocaleString();

        const adminMessage = `مرحبا مديري قام شخص باستخدام البوت
ـــــــــــــــــــــــــــــــــــــــ
اسم المستخدم: ${userName}
يوزر المستخدم: @${userUsername}
ايدي المستخدم: ${userId}
رقم المستخدم: غير متاح
الوقت: ${currentTime}`;

        await bot.sendMessage(ADMIN_ID, adminMessage);
    }

    const message = `<strong>
اهلا بك🎉
في بوت معرفه معلومات تيك توك او انستجرام من يوزر.

There is a bot to find out information about Tik Tok or Instagram from User.

Kullanıcıdan Tik Tok veya Instagram hakkında bilgi almak için bir bot var.

/helpar لكي اعطيك الاوامر بالعربيه
/helpen For Orders in English
/helptr Türkçe sipariş almak için
</strong>`;

    bot.sendMessage(chatId, message, opts);
});

bot.onText(/\/helpar/, (msg) => {
    const chatId = msg.chat.id;
    const message = `<strong>
الاوامر: 🔰
1 -⚜️
لمعرفه معلومات حساب الانتسجرام كامله قد يصحب مع ذلك عمل ريست للحساب
                ( /ig اليوزر )
مثال 
/ig mahos 
2 - ✴️
لمعرفه معلومات حساب التيك توك كامله
             ( /tik اليوزر )
مثال 
/tik M02MM 
</strong>`;
    
    bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
});

bot.onText(/\/helpen/, (msg) => {
    const chatId = msg.chat.id;
    const message = `<strong>
Commands: 🔰
 1 - ⚜️ To know the complete information of the Instagram account, it may be accompanied by a reset of the account 
(/ig user), 
example /ig mahos
 2 - ✴️ To know the complete information of the Tik Tok account
(/tik the user), example
 /tik M02MM
</strong>`;
    
    bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
});

bot.onText(/\/helptr/, (msg) => {
    const chatId = msg.chat.id;
    const message = `<strong>
Komutlar: 🔰 
1 - ⚜️ Instagram hesabının tüm bilgilerini öğrenmek için, 
buna hesabın sıfırlanması 
(/ig kullanıcısı) 
eşlik edebilir, örnek /ig mahos 
2 - ✴️ Tik Tok hesabının tüm bilgilerini bilmek için 
( /tik kullanıcı), örnek /tik M02MM .
</strong>`;
    
    bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
});

async function checkSubscriptions(userId) {
    for (let channel of forcedChannels) {
        try {
            const member = await bot.getChatMember(channel, userId);
            if (member.status === 'left' || member.status === 'kicked') {
                await bot.sendMessage(userId, `عذراً، يجب عليك الانضمام إلى قناة ${channel} لاستخدام البوت:`, {
                    reply_markup: {
                        inline_keyboard: [[{ text: `انضم إلى ${channel}`, url: `https://t.me/${channel.slice(1)}` }]]
                    }
                });
                return false;
            }
        } catch (error) {
            console.error(`خطأ أثناء التحقق من عضوية القناة ${channel}:`, error);
            return false;
        }
    }
    return true;
}


bot.onText(/\/tik (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const fm = match[1].includes('@') ? match[1].replace('@', '') : match[1];

    try {
        const headers = {
            "Host": "www.tiktok.com",
            "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"99\", \"Google Chrome\";v=\"99\"",
            "sec-ch-ua-mobile": "?1",
            "sec-ch-ua-platform": "\"Android\"",
            "upgrade-insecure-requests": "1",
            "user-agent": generateUserAgent(),
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "sec-fetch-site": "none",
            "sec-fetch-mode": "navigate",
            "sec-fetch-user": "?1",
            "sec-fetch-dest": "document",
            "accept-language": "en-US,en;q=0.9,ar-DZ;q=0.8,ar;q=0.7,fr;q=0.6,hu;q=0.5,zh-CN;q=0.4,zh;q=0.3"
        };
        
        const response = await axios.get(`https://www.tiktok.com/@${fm}`, { headers });
        const tikinfo = response.data;
        
        const getting = tikinfo.split('webapp.user-detail"')[1].split('"RecommendUserList"')[0];
        
        const id = getting.split('id":"')[1].split('",')[0];
        const name = getting.split('nickname":"')[1].split('",')[0];
        const bio = getting.split('signature":"')[1].split('",')[0];
        const country = getting.split('region":"')[1].split('",')[0];
        const private = getting.split('privateAccount":')[1].split(',"')[0];
        const followers = getting.split('followerCount":')[1].split(',"')[0];
        const following = getting.split('followingCount":')[1].split(',"')[0];
        const like = getting.split('heart":')[1].split(',"')[0];
        const video = getting.split('videoCount":')[1].split(',"')[0];
        const secid = getting.split('secUid":"')[1].split('"')[0];
        
        const countryInfo = await getCountryInfo(country);
        const countryn = countryInfo.name;
        const countryf = countryInfo.flag;
        
        const binary = parseInt(id).toString(2);
        const bits = binary.slice(0, 31);
        const timestamp = parseInt(bits, 2);
        
        let cdt = "";
        try {
            cdt = new Date(timestamp * 1000).toISOString();
        } catch (error) {
            console.error("Error converting timestamp:", error);
        }
        
        const msg = `═════════𝚃𝙸𝙺𝚃𝙾𝙺═══════════
الاسم ⇾ ${name}
الهوية ⇾ ${id}
اسم المستخدم ⇾ @${fm}
المتابعون ⇾ ${followers}
المتابَعون ⇾ ${following}
الإعجابات ⇾ ${like}
الفيديوهات ⇾ ${video}
الدولة ⇾ ${country}
اسم الدولة ⇾ ${countryn}
العلم ⇾ ${countryf}
خاص ⇾ ${private}
السيرة الذاتية ⇾ ${bio}
تاريخ الإنشاء ⇾ ${cdt}
الهوية الآمنة ⇾ ${secid}
الرابط ⇾ https://www.tiktok.com/@${fm}
═════════𝚃𝙸𝙺𝚃𝙾𝙺═══════════`;

        bot.sendMessage(chatId, msg, { parse_mode: "HTML" });
        bot.sendMessage(chatId, "اضغط [ /start ] للرجوع الى القائمه", { parse_mode: "HTML" });
    } catch (error) {
        console.error(error);
        const msger = `Error Username 🚫 ⇾ ${fm}\nTry again`;
        bot.sendMessage(chatId, msger, { parse_mode: "HTML" });
        bot.sendMessage(chatId, "اضغط [ /start ] للرجوع الى القائمه", { parse_mode: "HTML" });
    }
});

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function generateNoise() {
    const userAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.5615.138 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.5615.138 Safari/537.36",
        "Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.5615.138 Mobile Safari/537.36",
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
}

const getLocationInfo = async (userId) => {
    try {
        // استدعاء API لجلب معلومات الموقع بناءً على معرف الحساب أو البيانات الأخرى
        const response = await axios.get(`http://ip-api.com/json/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching location info:', error);
        return {};
    }
};


bot.onText(/\/ig (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const user = match[1];

    try {
        const headers = {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "Host": "i.instagram.com",
            "Connection": "Keep-Alive",
            "User-Agent": generateNoise(),
            "Cookie": `mid=YwvCRAABAAEsZcmT0OGJdPu3iLUs; csrftoken=${csr}`,
            "Cookie2": "$Version=1",
            "Accept-Language": "en-US",
            "X-IG-Capabilities": "AQ==",
            "Accept-Encoding": "gzip",
        };

        const data = {
            "q": user,
            "device_id": `android${uid}`,
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
        const profilePicPath = path.join(__dirname, `${user}.jpg`);
        const writer = fs.createWriteStream(profilePicPath);

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
            'cookie': `ig_did=${uuidv4()}; datr=8J8TZD9P4GjWjawQJMcnRdV_; mid=ZBOf_gALAAGhvjQbR29aVENHIE4Z; ig_nrcb=1; csrftoken=5DoPPeHPd4nUej9JiwCdkvwwmbmkDWpy; ds_user_id=56985317140; dpr=1.25`,
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
            'x-csrftoken': '5DoPPeHPd4nUej9JiwCdkvwwmbmkDWpy',
            'x-ig-app-id': '936619743392459',
            'x-ig-www-claim': '0',
            'x-requested-with': 'XMLHttpRequest',
        };

        await delay(2000);  

        const rr = await axios.get(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${user}`, { headers: he });
        const rrData = rr.data;

        const re = await axios.get(`https://o7aa.pythonanywhere.com/?id=${rrData.data.user.id}`);
        const reData = re.data;

        // إضافة طلب لمعرفة الدولة بناءً على معرف الحساب
        const locationInfo = await getLocationInfo(res.user.id);

        const msg = `
⋘─────━*معلومات الحساب*━─────⋙
الاسم ⇾ ${rrData.data.user.full_name}  
اسم المستخدم ⇾ @${user}  
المعرف ⇾ ${rrData.data.user.id}  
المتابعين ⇾ ${rrData.data.user.edge_followed_by.count}  
المتابَعون ⇾ ${rrData.data.user.edge_follow.count}  
السيرة الذاتية ⇾ ${rrData.data.user.biography || 'غير متاح'}  
التاريخ ⇾ ${reData.date || 'غير متاح'}  
الرابط ⇾ https://www.instagram.com/${user}  
البريد الإلكتروني ⇾ ${res.obfuscated_email || 'غير متاح'}  
الهاتف ⇾ ${res.obfuscated_phone || 'غير متاح'}  
الخاص ⇾ ${res.user.is_private ? 'نعم' : 'لا'}  
تسجيل دخول فيسبوك ⇾ ${res.fb_login_option || 'غير متاح'}  
إعادة ضبط واتساب ⇾ ${res.can_wa_reset ? 'نعم' : 'غير متاح'}  
إعادة ضبط SMS ⇾ ${res.can_sms_reset ? 'نعم' : 'غير متاح'}  
إعادة ضبط البريد الإلكتروني ⇾ ${res.can_email_reset ? 'نعم' : 'غير متاح'}  
الهاتف صالح ⇾ ${res.has_valid_phone ? 'نعم' : 'غير متاح'}  
حساب موثق ⇾ ${res.user.is_verified ? 'نعم' : 'لا'}  
الدولة ⇾ ${locationInfo.country || 'غير متاح'}  
⋘─────━*معلومات*━─────⋙  
المطور: @SAGD112| @SJGDDW
`;

        await bot.sendPhoto(chatId, profilePicPath, { caption: msg, parse_mode: 'HTML' });
        fs.unlinkSync(profilePicPath);

    } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, `Error fetching info for ${user}`);
    }
});

console.log('Bot is running...');
