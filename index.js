const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const fs = require('fs');
const readline = require('readline');
const FormData = require('form-data');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const uid = uuidv4();
const csr = crypto.randomBytes(8).toString('hex').repeat(2);

function generateUserAgent() {
  return 'Instagram 100.0.0.17.129 Android (29/10; 420dpi; 1080x2129; samsung; SM-M205F; m20lte; exynos7904; en_GB; 161478664)';
}

async function sendMessage(token, chatId, text) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  return axios.post(url, { chat_id: chatId, text: text });
}

async function getUpdates(token) {
  const url = `https://api.telegram.org/bot${token}/getUpdates`;
  return axios.get(url);
}

async function GetInfoInsta(username) {
  // Implement Instagram info gathering logic here
  // This is a placeholder and should be replaced with actual implementation
  return {
    id: '12345678',
    followers: '1000',
    following: '500',
    posts: '100'
  };
}

async function main() {
  const token = await new Promise(resolve => rl.question('Enter Token: ', resolve));
  const ID = await new Promise(resolve => rl.question('Enter ID: ', resolve));

  await sendMessage(token, ID, "Please enter your email:");

  let email = "";
  while (!email) {
    const updates = await getUpdates(token);
    if (updates.data.result && updates.data.result.length > 0) {
      const lastMessage = updates.data.result[updates.data.result.length - 1].message;
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
    'User-Agent': generateUserAgent(),
    'Accept-Language': 'en-GB, en-US',
    'Cookie': 'mid=ZVfGvgABAAGoQqa7AY3mgoYBV1nP; csrftoken=9y3N5kLqzialQA7z96AMiyAKLMBWpqVj',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Accept-Encoding': 'gzip, deflate',
    'Host': 'i.instagram.com',
    'X-FB-HTTP-Engine': 'Liger',
    'Connection': 'keep-alive',
    'Content-Length': '356',
  };

  const data = {
    signed_body: `0d067c2f86cac2c17d655631c9cec2402012fb0a329bcafb3b1f4c0bb56b1f1f.{"_csrftoken":"9y3N5kLqzialQA7z96AMiyAKLMBWpqVj","adid":"${uuidv4()}","guid":"${uuidv4()}","device_id":"${uuidv4()}","query":"${email}"}`,
    ig_sig_key_version: '4',
  };

  const res = await axios.post('https://i.instagram.com/api/v1/accounts/send_recovery_flow_email/', data, { headers });
  const rest = res.data.status === 'ok' ? res.data.email : 'Band Requests!';

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

  const kid = await axios.post('https://i.instagram.com/api/v1/users/lookup/', datai, { headers: heada });
  const kidData = kid.data;

  let id, prv, ph, sms, fb, wa, phn, name, profile_pic_url;
  try {
    id = kidData.user.pk;
    prv = kidData.user.is_private;
    ph = kidData.has_valid_phone;
    sms = kidData.can_sms_reset;
    fb = kidData.fb_login_option;
    wa = kidData.can_wa_reset;
    phn = kidData.obfuscated_phone;
    name = kidData.user.full_name;
    profile_pic_url = kidData.user.profile_pic_url;
  } catch (error) {
    console.error('Error extracting data from kidData:', error);
  }

  const profile_pic_path = `${user}.jpg`;
  if (profile_pic_url) {
    try {
      const response = await axios.get(profile_pic_url, { responseType: 'arraybuffer' });
      fs.writeFileSync(profile_pic_path, response.data);
    } catch (error) {
      console.error('Error downloading profile picture:', error);
    }
  }

  const Response = await GetInfoInsta(user);
  let fols, folg, po, da;
  if ('id' in Response) {
    fols = Response.followers;
    folg = Response.following;
    po = Response.posts;
    try {
      const re = await axios.get(`https://o7aa.pythonanywhere.com/?id=${id}`);
      da = re.data.date;
    } catch (error) {
      da = 'No Date';
    }
  }

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

  if (fs.existsSync(profile_pic_path)) {
    const form = new FormData();
    form.append('photo', fs.createReadStream(profile_pic_path));
    form.append('caption', tlg);

    try {
      await axios.post(`https://api.telegram.org/bot${token}/sendPhoto?chat_id=${ID}`, form, {
        headers: form.getHeaders()
      });
    } catch (error) {
      console.error('Error sending photo to Telegram:', error);
    }
  }

  rl.close();
}

main().catch(console.error);
