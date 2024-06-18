import crypto from 'crypto';
import fetch from 'node-fetch';
import FormData from 'form-data';
import dotenv from 'dotenv';

dotenv.config();

const SUMSUB_APP_TOKEN = process.env.SUMSUB_APP_TOKEN;
const SUMSUB_SECRET_KEY = process.env.SUMSUB_SECRET_KEY;
const SUMSUB_BASE_URL = 'https://api.sumsub.com';

function createSignature(url, method, data = null) {
    const ts = Math.floor(Date.now() / 1000);
    const signature = crypto.createHmac('sha256', SUMSUB_SECRET_KEY);
    signature.update(`${ts}${method.toUpperCase()}${url}`);

    if (data instanceof FormData) {
        signature.update(data.getBuffer());
    } else if (data) {
        signature.update(data);
    }

    const headers = {
        'X-App-Access-Ts': ts,
        'X-App-Access-Sig': signature.digest('hex'),
        'X-App-Token': SUMSUB_APP_TOKEN,
        'Accept': '*/*'
    };

    return headers;
}

async function getWebSDKLink(levelName, userId) {
    const url = `/resources/sdkIntegrations/levels/${encodeURIComponent(levelName)}/websdkLink?externalUserId=${userId}`;
    const method = 'POST';

    const headers = createSignature(url, method);

    const response = await fetch(SUMSUB_BASE_URL + url, {
        method: method,
        headers: headers,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error);
    }

    const data = await response.json();
    return data;
}

async function resetUserProfile(userId) {
    const url = `/resources/applicants/${userId}/reset`;
    const method = 'POST';

    const headers = createSignature(url, method);

    const response = await fetch(SUMSUB_BASE_URL + url, {
        method: method,
        headers: headers,
    });

    if (!response.ok) {
        const error = await response.json();
        console.log(response)
        throw new Error(error);
    }

    const data = await response.json();
    return data;
}

async function checkUserStatus(userId) {
    const url = `/resources/applicants/-;externalUserId=${userId}/one`;
    const method = 'GET';

    const headers = createSignature(url, method);

    const response = await fetch(SUMSUB_BASE_URL + url, {
        method: method,
        headers: headers,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error);
    }

    const data = await response.json();
    return data;
}

async function generate(userId) {
    const externalUserId = userId;
    const levelName = 'basic-kyc-level';

    try {
        const response = await getWebSDKLink(levelName, externalUserId);
        console.log("Web SDK Link Response:\n", response);
        return response.url;
    } catch (error) {
        console.error(error);
    }
}

async function reGenerate(userId) {
    const externalUserId = userId;
    const levelName = 'basic-kyc-level';

    try {
        const userData = await checkUserStatus(externalUserId);
        console.log("User Status Response:\n", userData);

        await resetUserProfile(userData.id);

        const response = await getWebSDKLink(levelName, externalUserId);
        console.log("Web SDK Link Response:\n", response);
        return response.url;
    } catch (error) {
        console.error(error);
    }
}

export { generate, reGenerate };
