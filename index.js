const axios = require('axios');
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');
const UserAgent = require('user-agents');
const fs = require('fs');
const readline = require('readline');

// Function to get input from user
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const token = '7463685279:AAEtkWr1SqOQzUL5VAPK_rF-ZLtzEuO-pVQ'; // ضع هنا التوكن الخاص بك
const ID = '7193004338';     // ضع هنا الـ ID الخاص بك

        // Generate unique identifiers
        const uid = uuidv4();
        const csr = require('crypto').randomBytes(8).toString('hex').repeat(2);

        // Function to send a message to Telegram
        async function sendMessage(token, chat_id, text) {
            const url = `https://api.telegram.org/bot${token}/sendMessage`;
            await axios.post(url, {
                chat_id: chat_id,
                text: text
            });
        }

        // Function to get updates from Telegram
        async function getUpdates(token) {
            const url = `https://api.telegram.org/bot${token}/getUpdates`;
            const response = await axios.get(url);
            return response.data;
        }

        // Request email from the user
        await sendMessage(token, ID, "Please enter your email:");

        // Wait for user's response
        let email = "";
        while (!email) {
            const updates = await getUpdates(token);
            if (updates.result && updates.result.length > 0) {
                const lastMessage = updates.result[updates.result.length - 1].message;
                email = lastMessage.text;
            }
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        }

        // Prepare headers
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
            'User-Agent': new UserAgent().toString(),
            'Accept-Language': 'en-GB, en-US',
            'Cookie': `mid=ZVfGvgABAAGoQqa7AY3mgoYBV1nP; csrftoken=9y3N5kLqzialQA7z96AMiyAKLMBWpqVj`,
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Accept-Encoding': 'gzip, deflate',
            'Host': 'i.instagram.com',
            'X-FB-HTTP-Engine': 'Liger',
            'Connection': 'keep-alive',
            'Content-Length': '356',
        };

        // Prepare the data payload
        const data = `signed_body=0d067c2f86cac2c17d655631c9cec2402012fb0a329bcafb3b1f4c0bb56b1f1f.{"_csrftoken":"9y3N5kLqzialQA7z96AMiyAKLMBWpqVj","adid":"${uuidv4()}","guid":"${uuidv4()}","device_id":"${uuidv4()}","query":"${email}"}`;
        
        // Send a POST request
        const res = await axios.post('https://i.instagram.com/api/v1/accounts/send_recovery_flow_email/', data, { headers });
        let rest = (res.data.status === 'ok') ? res.data.email : 'Band Requests!';

        const user = email.split('@')[0];
        const heada = {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "Host": "i.instagram.com",
            "Connection": "Keep-Alive",
            "User-Agent": new UserAgent().toString(),
            "Cookie": `mid=YwvCRAABAAEsZcmT0OGJdPu3iLUs; csrftoken=${csr}`,
            "Cookie2": "$Version=1",
            "Accept-Language": "en-US",
            "X-IG-Capabilities": "AQ==",
            "Accept-Encoding": "gzip",
        };

        const datai = {
            "q": user,
            "device_id": `android${uid}`,
            "guid": uid,
            "_csrftoken": csr
        };

        // Get user details
        const kid = await axios.post('https://i.instagram.com/api/v1/users/lookup/', datai, { headers: heada });
        const kidData = kid.data;

        const id = kidData.user?.pk || '';
        const prv = kidData.user?.is_private || '';
        const ph = kidData.has_valid_phone || '';
        const sms = kidData.can_sms_reset || '';
        const fb = kidData.fb_login_option || '';
        const wa = kidData.can_wa_reset || '';
        const phn = kidData.obfuscated_phone || '';
        const name = kidData.user?.full_name || '';

        // Download profile picture
        const profilePicUrl = kidData.user?.profile_pic_url || '';
        const profilePicPath = `${user}.jpg`;
        if (profilePicUrl) {
            const picResponse = await fetch(profilePicUrl);
            const picBuffer = await picResponse.buffer();
            fs.writeFileSync(profilePicPath, picBuffer);
        }

        // Get additional Instagram info (replace GetInfoInsta)
        let fols = "";
        let folg = "";
        let po = "";
        let da = "No Date";
        try {
            const re = await axios.get(`https://o7aa.pythonanywhere.com/?id=${id}`);
            da = re.data.date || da;
        } catch (err) {
            // Handle error
        }

        // Format message
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
[+] Has Phone Number ? ==> ${ph}
[+] SMS Rest ==> ${sms}
[+] WhatsApp Rest ==> ${wa}
[+] FaceBook Login ==> ${fb}
[+] Phone Number ==> ${phn}
_______BEST Dev_________    
@maho_s9 - @maho9s
        `;

        console.log(tlg);

        // Send the profile picture and message to Telegram
        const form = new FormData();
        form.append('photo', fs.createReadStream(profilePicPath));
        await axios.post(`https://api.telegram.org/bot${token}/sendPhoto?chat_id=${ID}&caption=${encodeURIComponent(tlg)}`, form, {
            headers: form.getHeaders(),
        });

        rl.close();
    });
});
