const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const token = '6455603203:AAFnlAjQewoM5CMMRwQS388RiI1U0aHIN78';
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
            "User-Agent": generateNoise(),
            "Cookie": cookies,
            "X-IG-App-ID": "936619743392459",
            "X-IG-WWW-Claim": "0",
        };

        await delay(3000);

        const response = await axios.get(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${user}`, { headers });
        const userData = response.data.data.user;

        if (!userData) {
            throw new Error('User not found');
        }

        const reResponse = await axios.get(`https://o7aa.pythonanywhere.com/?id=${userData.id}`);
        const reData = reResponse.data;

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
البريد الإلكتروني ⇾ ${reData.email || 'غير متاح'}  
الهاتف ⇾ ${reData.phone || 'غير متاح'}  
الخاص ⇾ ${userData.is_private ? 'نعم' : 'لا'}  
تسجيل دخول فيسبوك ⇾ ${reData.fb_login_option || 'غير متاح'}  
إعادة ضبط واتساب ⇾ ${reData.can_wa_reset ? 'نعم' : 'غير متاح'}  
إعادة ضبط SMS ⇾ ${reData.can_sms_reset ? 'نعم' : 'غير متاح'}  
إعادة ضبط البريد الإلكتروني ⇾ ${reData.can_email_reset ? 'نعم' : 'غير متاح'}  
الهاتف صالح ⇾ ${reData.has_valid_phone ? 'نعم' : 'غير متاح'}  
حساب موثق ⇾ ${userData.is_verified ? 'نعم' : 'لا'}  
الدولة ⇾ ${reData.country || 'غير متاح'}  
⋘─────━*معلومات*━─────⋙  
المطور: @SAGD112| @SJGDDW
        `;

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
