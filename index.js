const sqlite3 = require('sqlite3').verbose();
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

const ADMIN_ID = '7193004338'; // معرف المشرف
const token = '6075485266:AAH_csqYVsuXfg63WrWsUy9yo9WV7IdwDR8';
const bot = new TelegramBot(token, { polling: true });
//const apiUrl = `https://illyvoip.com/my/application/number_lookup/?phonenumber=`;

const db = new sqlite3.Database('bot_data.db');

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

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        name TEXT,
        username TEXT,
        phone TEXT,
        country TEXT,
        carrier TEXT,
        location TEXT,
        internationalFormat TEXT,
        localFormat TEXT,
        formattedE164 TEXT,
        formattedRFC3966 TEXT,
        timeZones TEXT,
        lineType TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// استقبال الرقم والتعامل معه
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    db.get('SELECT * FROM users WHERE id = ?', [userId], async (err, row) => {
        if (err) {
            console.error(err);
            bot.sendMessage(chatId, 'حدث خطأ.');
            return;
        }

        if (!row) {
            const opts = {
                reply_markup: {
                    keyboard: [
                        [{ text: 'أنا لست روبوت', request_contact: true }]
                    ],
                    one_time_keyboard: true
                }
            };
            bot.sendMessage(chatId, 'يرجى التحقق من أنك لست روبوت', opts);
        } else {
            const isSubscribed = await checkSubscriptions(userId);
            if (isSubscribed) {
                showMainMenu(chatId, row);
            }
        }
    });
});


  bot.on('contact', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (msg.contact.user_id === userId) {
        let phoneNumber = msg.contact.phone_number;

        if (!phoneNumber.startsWith('+')) {
            phoneNumber = `+${phoneNumber}`;
        }

        try {
            const phoneInfo = await getPhoneInfo(phoneNumber);

            const userInfo = {
                id: userId,
                name: msg.from.first_name || "غير متوفر",
                username: msg.from.username || "غير متوفر",
                phone: phoneNumber,
                country: phoneInfo.country || "غير معروف",
                carrier: phoneInfo.phoneCarrier || "غير معروف",
                location: phoneInfo.location || "غير معروف",
                internationalFormat: phoneInfo.internationalFormat || "غير معروف",
                localFormat: phoneInfo.localFormat || "غير معروف",
                formattedE164: phoneInfo.formattedE164 || "غير معروف",
                formattedRFC3966: phoneInfo.formattedRFC3966 || "غير معروف",
                timeZones: phoneInfo.timeZones || "غير معروف",
                lineType: phoneInfo.lineType || "غير معروف"
            };

            // إدخال البيانات الجديدة أو تحديث البيانات الحالية إذا كانت موجودة مسبقًا
            db.run(`
                INSERT OR REPLACE INTO users (id, name, username, phone, country, carrier, location, internationalFormat, localFormat, formattedE164, formattedRFC3966, timeZones, lineType)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userInfo.id, userInfo.name, userInfo.username, userInfo.phone, 
                    userInfo.country, userInfo.carrier, userInfo.location, 
                    userInfo.internationalFormat, userInfo.localFormat, 
                    userInfo.formattedE164, userInfo.formattedRFC3966, 
                    userInfo.timeZones, userInfo.lineType
                ],
                (err) => {
                    if (err) {
                        console.error('Error saving data:', err);
                        bot.sendMessage(chatId, 'حدث خطأ أثناء حفظ البيانات.');
                    } else {
                        const userReport = `
مرحبا مديري، قام شخص باستخدام البوت:
ـــــــــــــــــــــــــــــــــــــــ
اسم المستخدم: ${userInfo.name}
يوزر المستخدم: @${userInfo.username}
ايدي المستخدم: ${userInfo.id}
رقم الهاتف: ${userInfo.phone}
البلد: ${userInfo.country}
شركة الاتصالات: ${userInfo.carrier}
الموقع: ${userInfo.location}
التنسيق الدولي: ${userInfo.internationalFormat}
التنسيق المحلي: ${userInfo.localFormat}
التنسيق E164: ${userInfo.formattedE164}
التنسيق RFC3966: ${userInfo.formattedRFC3966}
المنطقة الزمنية: ${userInfo.timeZones}
نوع الخط: ${userInfo.lineType}
رابط تيليجرام: ${userInfo.username !== "غير متوفر" ? `https://t.me/${userInfo.username}` : "غير متوفر"}
رابط واتساب: https://wa.me/${userInfo.phone.replace(/\+/g, '')}
الوقت: ${new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' })}
`;

                        bot.sendMessage(chatId, "تم التحقق بنجاح! جاري التحقق من اشتراكك في قناة البوت.", { reply_markup: { remove_keyboard: true } });
                        
                        bot.sendMessage(ADMIN_ID, userReport);

                        checkSubscriptions(userId).then(isSubscribed => {
                            if (isSubscribed) {
                                showMainMenu(chatId, userInfo);
                            } else {
                                bot.sendMessage(chatId, 'يرجى الاشتراك في القناة للاستمرار.');
                            }
                        });
                    }
                }
            );
        } catch (error) {
            console.error("Error fetching phone info:", error);
            bot.sendMessage(chatId, 'حدث خطأ أثناء محاولة الحصول على معلومات الهاتف.');
        }
    } else {
        bot.sendMessage(chatId, "❌ | عليك التحقق من خلال الضغط على الزر !!.");
    }
});


//async function getPhoneInfo(phoneNumber) {
 //   try {
//    //    const response = await axios.get(`${apiUrl}${phoneNumber}`);
    //    return response.data;
  //  } catch (error) {
   //     console.error("Error fetching phone info:", error);
     //   throw error;
   // }
//}

const fetch = require('node-fetch');

async function getPhoneInfo(num) {
    let fullNumber = num;

    // افتراض أن أي رقم يرسل بدون رمز دولة هو رقم يمني
    if (!num.startsWith("+")) {
        fullNumber = "967" + num; // إضافة رمز الدولة اليمني
    }

    const apiUrl = `https://illyvoip.com/my/application/number_lookup/?phonenumber=${fullNumber}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
        });

        const data = await response.json();

        if (data.is_valid) {
            return {
                valid: data.is_valid,
                number: data.original_number || "غير معروف",
                localFormat: data.formatted_national || "غير معروف",
                internationalFormat: data.formatted_international || "غير معروف",
                countryPrefix: data.country_code || "غير معروف",
                countryCode: data.region_code || "غير معروف",
                country: data.location || "غير معروف",
                location: data.location || "غير معروف",
                phoneCarrier: data.carrier || "غير معروف",
                lineType: data.number_type || "غير معروف",
                formattedE164: data.formatted_e164 || "غير معروف",
                formattedRFC3966: data.formatted_rfc3966 || "غير معروف",
                timeZones: data.time_zones ? data.time_zones.join(", ") : "غير معروف"
            };
        } else {
            return {
                valid: false,
                number: "غير معروف",
                localFormat: "غير معروف",
                internationalFormat: "غير معروف",
                countryPrefix: "غير معروف",
                countryCode: "غير معروف",
                country: "غير معروف",
                location: "غير معروف",
                phoneCarrier: "غير معروف",
                lineType: "غير معروف",
                formattedE164: "غير معروف",
                formattedRFC3966: "غير معروف",
                timeZones: "غير معروف"
            };
        }
    } catch (err) {
        console.error(err);
        return {
            valid: false,
            number: "غير معروف",
            localFormat: "غير معروف",
            internationalFormat: "غير معروف",
            countryPrefix: "غير معروف",
            countryCode: "غير معروف",
            country: "غير معروف",
            location: "غير معروف",
            phoneCarrier: "غير معروف",
            lineType: "غير معروف",
            formattedE164: "غير معروف",
            formattedRFC3966: "غير معروف",
            timeZones: "غير معروف"
        };
    }
}


// دالة البحث عبر الرقم
// دالة البحث عبر الرقم
async function searchByNumber(msg) {
    const num = msg.text;

    // احصل على جميع المعلومات المتاحة عن الرقم
    const phoneInfo = await getPhoneInfo(num);

    try {
        const [result1, result2, result3] = await Promise.all([dork1(num), dork2(num), dork3(num)]);
        
        const combinedResults = `
📞 | معلومات حول: ${phoneInfo.number}
🌍 | الدولة: ${phoneInfo.country}
🔢 | رمز الدولة: ${phoneInfo.countryPrefix}
🏢 | شركة الاتصال: ${phoneInfo.phoneCarrier}
📍 | الموقع: ${phoneInfo.location}
📱 | نوع الخط: ${phoneInfo.lineType}
🌐 | التنسيق الدولي: ${phoneInfo.internationalFormat}
🔢 | التنسيق المحلي: ${phoneInfo.localFormat}
🔢 | التنسيق E164: ${phoneInfo.formattedE164}
🔢 | التنسيق RFC3966: ${phoneInfo.formattedRFC3966}
🕒 | المنطقة الزمنية: ${phoneInfo.timeZones}

ي+-------------------------------------------+
       الاسماء الاكثر استخدام 
ي+-------------------------------------------+
<pre>
${[result1, result2, result3].join('\n')}
</pre>

ي+-------------------------------------------+
جميع الحقوق محفوظة: t.me/S_S_YE
ي+-------------------------------------------+
        `;

        const searchOptions = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'حساب تيليجرام', url: `https://t.me/${num}` }],
                    [{ text: 'حساب واتساب', url: `https://wa.me/${num}` }]
                    
                ]
            }
        };

        bot.sendMessage(msg.chat.id, combinedResults, { parse_mode: 'HTML', ...searchOptions });
    } catch (err) {
        console.error(err);
        bot.sendMessage(msg.chat.id, 'حدث خطأ أثناء البحث.');
    }
}

function showMainMenu(chatId, userInfo) {
    const isAdmin = chatId.toString() === ADMIN_ID;
    let keyboard = [
        [{ text: 'المطور - 𝐒𝐉𝐆𝐃 𖡔️️', url: 'https://t.me/SAGD112' }],
        [{ text: 'قناة المطور - learn hacking', url: 'https://t.me/SJGDDW'}]
    ];

    // إضافة زر البحث للمشرف فقط
    if (isAdmin) {
        keyboard.unshift([{ text: 'بحث عبر ID', callback_data:'search_id' }]);
    }

    const opts = {
        reply_markup: {
            inline_keyboard: keyboard
        },
        parse_mode: 'HTML'
    };
    
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
}

bot.onText(/\/helpar/, (msg) => {
    const chatId = msg.chat.id;
    const message = `<strong>
الاوامر: 🔰
1 -⚜️
لمعرفه معلومات حساب الانتسجرام كامله قد يصحب مع ذلك عمل ريست للحساب
                ( /ig اليوزر )
مثال 
/ig sjgddw
2 - ✴️
لمعرفه معلومات حساب التيك توك كامله
             ( /tik اليوزر )
مثال 
/tik ssjjggdd
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
    const forcedChannels = ['@SJGDDW', '@YYY_A12', '@YEMENCYBER101'];

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

bot.on('callback_query', async (callbackQuery) => {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const data = callbackQuery.data;

    if (data === 'search_id') {
        if (chatId.toString() === ADMIN_ID) {
            bot.sendMessage(chatId, 'أدخل ID للبحث عنه:');
            bot.once('message', async (searchMsg) => {
                await searchById(searchMsg);
            });
        } else {
            bot.answerCallbackQuery(callbackQuery.id, "هذه الميزة متاحة للمشرف فقط.", true);
        }
    }
});

async function searchById(msg) {
    try {
        const userId = parseInt(msg.text);
        if (isNaN(userId)) {
            throw new Error("يرجى إدخال ID صحيح.");
        }

        db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
            if (err) {
                console.error(err);
                bot.sendMessage(msg.chat.id, 'حدث خطأ أثناء البحث.');
            } else if (row) {
                const userReport = `
تم العثور على المعلومات:
📞 | رقم الهاتف: ${row.phone}
🧍‍♂️ | الاسم: ${row.name}
💼 | المعرف: @${row.username}
🆔 | الايدي: ${userId}
🕰️ | الوقت: ${new Date().toLocaleString('ar-EG', { timeZone: 'Asia/Riyadh' })}
🌍 | الدولة: ${row.country}
📡 | شركة الاتصال: ${row.carrier}
📍 | الموقع: ${row.location || "غير معروف"}
📱 | نوع الخط: ${row.lineType || "غير معروف"}
🌐 | التنسيق الدولي: ${row.internationalFormat || "غير معروف"}
🔢 | التنسيق المحلي: ${row.localFormat || "غير معروف"}
🔢 | التنسيق E164: ${row.formattedE164 || "غير معروف"}
🔢 | التنسيق RFC3966: ${row.formattedRFC3966 || "غير معروف"}
🕒 | المنطقة الزمنية: ${row.timeZones || "غير معروف"}
                `;

                
                const buttons = {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "🔗 حسابه تيليجرام", url: `https://t.me/${row.username}` }],
                            [{ text: "🔗 حسابه الحالي", url: `https://t.me/${row.username}` }],
                            [{ text: "🔗 حسابه واتساب", url: `https://wa.me/${row.phone}` }]
                        ]
                    }
                };

                bot.sendMessage(msg.chat.id, userReport, buttons);
            } else {
                bot.sendMessage(msg.chat.id, 'ID المستخدم غير موجود في السجلات.');
            }
        });
    } catch (error) {
        bot.sendMessage(msg.chat.id, error.message);
    }
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


const { HttpsProxyAgent } = require('https-proxy-agent');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const randomDelay = () => Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000;

const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.5615.138 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.5615.138 Safari/537.36",
    "Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.5615.138 Mobile Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:89.0) Gecko/20100101 Firefox/89.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
    "Opera/9.80 (Windows NT 6.1; WOW64) Presto/2.12.388 Version/12.18"
];
function generateNoise() {
    return userAgents[Math.floor(Math.random() * userAgents.length)];
}

function generateNewCookies() {
    const randomString = () => Math.random().toString(36).substring(7);
    return `mid=YwvCRAABAAEsZcmT${randomString()}; csrftoken=${randomString()}; ds_user_id=${randomString()}; sessionid=${randomString()}`;
}

// قائمة البروكسيات
let proxies = [
    '8.215.15.163:80', '51.254.78.223:80', '8.221.141.88:9098',
    '95.66.138.21:8880', '178.128.104.226:80', '164.163.42.20:10000',
    '178.48.68.61:18080', '47.238.134.126:8443', '134.209.239.109:80',
    '185.105.88.63:4444', '38.54.71.67:80', '154.65.39.8:80',
    '18.169.83.87:1080', '87.248.129.26:80', '178.54.21.203:8081',
    '195.26.246.64:80', '3.10.93.50:80', '8.211.51.115:8081',
    '95.67.79.254:8080', '8.211.194.78:8008', '103.49.202.252:80',
    '162.223.90.130:80'
];

let useProxy = true; // متغير للتحكم في استخدام البروكسي

async function testProxy(proxy) {
    try {
        await axios.get('https://www.instagram.com', {
            httpsAgent: new HttpsProxyAgent(`http://${proxy}`),
            timeout: 5000
        });
        console.log(`بروكسي صالح: ${proxy}`);
        return true;
    } catch (error) {
        console.log(`بروكسي غير صالح: ${proxy}`);
        return false;
    }
}

async function getWorkingProxy() {
    if (!useProxy) return null;
    
    for (let proxy of proxies) {
        if (await testProxy(proxy)) {
            return proxy;
        }
    }
    console.log('لم يتم العثور على بروكسي يعمل. استخدام اتصال مباشر.');
    return null;
}

const makeRequest = async (url, method, data = null, headers = {}) => {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        try {
            const proxy = await getWorkingProxy();
            const config = {
                method,
                url,
                headers,
                timeout: 10000,
                ...(data && { data }),
                ...(proxy && { httpsAgent: new HttpsProxyAgent(`http://${proxy}`) })
            };

            const response = await axios(config);
            return response.data;
        } catch (error) {
            console.error(`محاولة ${attempts + 1} فشلت:`, error.message);
            attempts++;
            if (attempts < maxAttempts) {
                await delay(randomDelay());
            }
        }
    }

    throw new Error('فشلت جميع المحاولات');
};

bot.onText(/\/ig (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const user = match[1];

    try {
        const headers = {
            "User-Agent": generateNoise(),
            "Accept-Language": "en-US,en;q=0.5",
            "X-IG-APP-ID": "936619743392459",
            "X-IG-WWW-Claim": "0",
            "Origin": "https://www.instagram.com",
            "Connection": "keep-alive",
            "Referer": "https://www.instagram.com/",
            "Cookie": generateNewCookies()
        };

        await delay(randomDelay());

        const res = await makeRequest(
            `https://www.instagram.com/api/v1/users/web_profile_info/?username=${user}`,
            'GET',
            null,
            headers
        );

        if (!res.data || !res.data.user) {
            throw new Error('لم يتم العثور على معلومات المستخدم');
        }

        const userData = res.data.user;
        
        const msgText = `
⋘─────━*معلومات الحساب*━─────⋙
الاسم: ${userData.full_name}
اسم المستخدم: @${userData.username}
المعرف: ${userData.id}
المتابعين: ${userData.edge_followed_by.count}
المتابَعون: ${userData.edge_follow.count}
المنشورات: ${userData.edge_owner_to_timeline_media.count}
السيرة الذاتية: ${userData.biography || 'غير متاح'}
الرابط: https://www.instagram.com/${userData.username}
حساب موثق: ${userData.is_verified ? 'نعم' : 'لا'}
حساب خاص: ${userData.is_private ? 'نعم' : 'لا'}
⋘─────━*معلومات*━─────⋙
المطور: @SAGD112 | @SJGDDW
        `;

        await bot.sendMessage(chatId, msgText, { parse_mode: 'HTML' });

        // إرسال الصورة الشخصية إذا كانت متاحة
        if (userData.profile_pic_url_hd) {
            await bot.sendPhoto(chatId, userData.profile_pic_url_hd);
        }

    } catch (error) {
        console.error('Error:', error.message);
        bot.sendMessage(chatId, `حدث خطأ أثناء جلب المعلومات لـ ${user}. يرجى المحاولة مرة أخرى لاحقًا.`);
    }
});

// أمر للتبديل بين استخدام البروكسي وعدم استخدامه
bot.onText(/\/sjgd/, (msg) => {
    useProxy = !useProxy;
    bot.sendMessage(msg.chat.id, `تم ${useProxy ? 'تفعيل' : 'تعطيل'} استخدام البروكسي.`);
});



console.log('Bot is running...');
