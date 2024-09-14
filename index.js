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

const token = '6455603203:AAFnlAjQewoM5CMMRwQS388RiI1U0aHIN78';
const bot = new TelegramBot(token, { polling: true });

function generateNoise() {
    const versions = ['219.0.0.12.117', '220.0.0.8.115', '221.0.0.15.119'];
    const randomVersion = versions[Math.floor(Math.random() * versions.length)];
    return `Instagram ${randomVersion} Android`;
}

function generateCookies() {
    const mid = crypto.randomBytes(8).toString('hex');
    const igDid = crypto.randomUUID();
    const csrftoken = crypto.randomBytes(16).toString('hex');
    const dsUserId = Math.floor(Math.random() * 1000000000000);
    
    return `mid=${mid}; ig_did=${igDid}; csrftoken=${csrftoken}; ds_user_id=${dsUserId}; rur="VLL"; ig_nrcb=1`;
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchInstagramData(user) {
    const cookies = generateCookies();
    const headers = {
        "User-Agent": generateNoise(),
        "Cookie": cookies,
        "X-IG-App-ID": "936619743392459",
        "X-IG-WWW-Claim": "0",
    };

    const response = await axios.get(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${user}`, { headers });
    return response.data.data.user;
}

async function fetchAdditionalData(userId) {
    try {
        const response = await axios.get(`https://o7aa.pythonanywhere.com/?id=${userId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching additional ', error.message);
        return null;
    }
}

bot.onText(/\/ig (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const user = match[1];

    try {
        await delay(3000);

        const userData = await fetchInstagramData(user);
        if (!userData) {
            throw new Error('User not found');
        }

        let additionalData = await fetchAdditionalData(userData.id);

        const msgText = `
⋘─────━*معلومات الحساب*━─────⋙
الاسم ⇾ ${userData.full_name}  
اسم المستخدم ⇾ @${user}  
المعرف ⇾ ${userData.id}  
المتابعين ⇾ ${userData.edge_followed_by.count}  
المتابَعون ⇾ ${userData.edge_follow.count}  
المنشورات ⇾ ${userData.edge_owner_to_timeline_media.count}  
السيرة الذاتية ⇾ ${userData.biography || 'غير متاح'}  
التاريخ ⇾ ${new Date().toLocaleDateString()}  
الرابط ⇾ https://www.instagram.com/${user}  
البريد الإلكتروني ⇾ ${additionalData?.email || 'غير متاح'}  
الهاتف ⇾ ${additionalData?.phone || 'غير متاح'}  
الخاص ⇾ ${userData.is_private ? 'نعم' : 'لا'}  
تسجيل دخول فيسبوك ⇾ ${additionalData?.fb_login_option || 'غير متاح'}  
إعادة ضبط واتساب ⇾ ${additionalData?.can_wa_reset ? 'نعم' : 'غير متاح'}  
إعادة ضبط SMS ⇾ ${additionalData?.can_sms_reset ? 'نعم' : 'غير متاح'}  
إعادة ضبط البريد الإلكتروني ⇾ ${additionalData?.can_email_reset ? 'نعم' : 'غير متاح'}  
الهاتف صالح ⇾ ${additionalData?.has_valid_phone ? 'نعم' : 'غير متاح'}  
حساب موثق ⇾ ${userData.is_verified ? 'نعم' : 'لا'}  
الدولة ⇾ ${additionalData?.country || 'غير متاح'}  
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
