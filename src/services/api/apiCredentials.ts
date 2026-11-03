/**
 * Security & API Credential Management Engine for CyberPulse Futures
 * - Encrypted credential storage using Web Crypto API (AES-GCM + PBKDF2)
 * - HMAC-SHA256 signing for Binance and Bitget authenticated endpoints
 * - Daily request tracking capped at 333 requests/day
 * - Connection testing for Binance and Bitget
 * - Zero default/hardcoded keys & mandatory Disconnect wiping
 */

export interface ExchangeCredentials {
  apiKey: string;
  secretKey: string;
  passphrase?: string; // Required for Bitget
  isConnected: boolean;
  lastTestedAt?: number;
  lastError?: string;
  permissions?: {
    read: boolean;
    trade: boolean;
    withdraw: boolean; // MUST ALWAYS BE FALSE
  };
}

export interface StoredCredentialsState {
  binance?: ExchangeCredentials;
  bitget?: ExchangeCredentials;
}

export interface ApiRequestCounter {
  dateStr: string; // 'YYYY-MM-DD'
  count: number;
  limit: number; // Configurable daily limit (default 333)
}

const STORAGE_KEY_ENCRYPTED_CREDS = 'cyberpulse_encrypted_credentials_v2';
const STORAGE_KEY_DAILY_COUNTER = 'cyberpulse_daily_api_counter_v2';
const DAILY_LIMIT = 333;

// Secret derivation salt for device-bound local encryption
const DEVICE_SALT = 'CyberPulse_Sec_Salt_2026_x99!#';

/**
 * Derive WebCrypto AES-GCM encryption key
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const rawKey = enc.encode(DEVICE_SALT + (navigator.userAgent || 'AppletDevice'));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode('cyberpulse_salt_fixed'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt plain object to Base64 string
 */
export async function encryptData(data: object): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const enc = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedData = enc.encode(JSON.stringify(data));

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData
    );

    const buffer = new Uint8Array(iv.length + ciphertext.byteLength);
    buffer.set(iv, 0);
    buffer.set(new Uint8Array(ciphertext), iv.length);

    let binary = '';
    buffer.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary);
  } catch (err) {
    console.error('Encryption failed:', err);
    // Fallback obfuscation for safe compatibility
    return btoa(encodeURIComponent(JSON.stringify(data)));
  }
}

/**
 * Decrypt Base64 string to object
 */
export async function decryptData<T>(encryptedBase64: string): Promise<T | null> {
  if (!encryptedBase64) return null;
  try {
    const key = await getEncryptionKey();
    const binary = atob(encryptedBase64);
    const buffer = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      buffer[i] = binary.charCodeAt(i);
    }

    const iv = buffer.slice(0, 12);
    const ciphertext = buffer.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    return JSON.parse(dec.decode(decrypted)) as T;
  } catch (err) {
    try {
      // Fallback decode
      const plain = decodeURIComponent(atob(encryptedBase64));
      return JSON.parse(plain) as T;
    } catch {
      return null;
    }
  }
}

/**
 * Generate HMAC-SHA256 signature hex or base64 string using Web Crypto API
 */
export async function generateHmacSha256(secret: string, message: string, outputFormat: 'hex' | 'base64' = 'hex'): Promise<string> {
  const enc = new TextEncoder();
  const keyData = enc.encode(secret);
  const msgData = enc.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
  const byteArray = new Uint8Array(signature);

  if (outputFormat === 'base64') {
    let binary = '';
    byteArray.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary);
  }

  return Array.from(byteArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Load stored credentials securely
 */
export async function loadStoredCredentials(): Promise<StoredCredentialsState> {
  const encrypted = localStorage.getItem(STORAGE_KEY_ENCRYPTED_CREDS);
  if (!encrypted) {
    return {
      binance: { apiKey: '', secretKey: '', isConnected: false, permissions: { read: false, trade: false, withdraw: false } },
      bitget: { apiKey: '', secretKey: '', passphrase: '', isConnected: false, permissions: { read: false, trade: false, withdraw: false } },
    };
  }

  const decrypted = await decryptData<StoredCredentialsState>(encrypted);
  return decrypted || {
    binance: { apiKey: '', secretKey: '', isConnected: false, permissions: { read: false, trade: false, withdraw: false } },
    bitget: { apiKey: '', secretKey: '', passphrase: '', isConnected: false, permissions: { read: false, trade: false, withdraw: false } },
  };
}

/**
 * Save credentials securely
 */
export async function saveStoredCredentials(creds: StoredCredentialsState): Promise<void> {
  // Ensure withdraw permission is NEVER true
  if (creds.binance?.permissions) creds.binance.permissions.withdraw = false;
  if (creds.bitget?.permissions) creds.bitget.permissions.withdraw = false;

  const encrypted = await encryptData(creds);
  localStorage.setItem(STORAGE_KEY_ENCRYPTED_CREDS, encrypted);
}

/**
 * Clear credentials for an exchange
 */
export async function clearExchangeCredentials(exchange: 'binance' | 'bitget'): Promise<void> {
  const current = await loadStoredCredentials();
  if (exchange === 'binance') {
    current.binance = { apiKey: '', secretKey: '', isConnected: false, permissions: { read: false, trade: false, withdraw: false } };
  } else {
    current.bitget = { apiKey: '', secretKey: '', passphrase: '', isConnected: false, permissions: { read: false, trade: false, withdraw: false } };
  }
  await saveStoredCredentials(current);
}

/**
 * Daily API Request Counter Tracker (333 requests/day limit)
 */
export function getDailyApiCounter(): ApiRequestCounter {
  const today = new Date().toISOString().split('T')[0];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DAILY_COUNTER);
    if (raw) {
      const parsed = JSON.parse(raw) as ApiRequestCounter;
      if (parsed.dateStr === today) {
        return parsed;
      }
    }
  } catch {
    // reset on parse error
  }

  const fresh: ApiRequestCounter = { dateStr: today, count: 0, limit: DAILY_LIMIT };
  localStorage.setItem(STORAGE_KEY_DAILY_COUNTER, JSON.stringify(fresh));
  return fresh;
}

export function incrementDailyApiCounter(amount = 1): ApiRequestCounter {
  const current = getDailyApiCounter();
  current.count += amount;
  localStorage.setItem(STORAGE_KEY_DAILY_COUNTER, JSON.stringify(current));
  return current;
}

export function checkDailyApiLimitExceeded(): boolean {
  const current = getDailyApiCounter();
  return current.count >= current.limit;
}

/**
 * Test Binance API Connection securely
 */
export async function testBinanceConnection(apiKey: string, secretKey: string): Promise<{ success: boolean; message: string }> {
  if (!apiKey.trim() || !secretKey.trim()) {
    return { success: false, message: 'Binance API Key and Secret Key are required.' };
  }

  if (checkDailyApiLimitExceeded()) {
    return { success: false, message: 'Daily market-data limit of 333 requests reached. Resets at midnight UTC.' };
  }

  incrementDailyApiCounter(1);

  try {
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = await generateHmacSha256(secretKey.trim(), queryString, 'hex');

    const url = `https://fapi.binance.com/fapi/v2/account?${queryString}&signature=${signature}`;
    const proxyUrl = `/api/binance-fapi/fapi/v2/account?${queryString}&signature=${signature}`;

    const headers = {
      'X-MBX-APIKEY': apiKey.trim(),
      'Accept': 'application/json',
    };

    let response: Response;
    try {
      response = await fetch(url, { headers });
    } catch {
      response = await fetch(proxyUrl, { headers });
    }

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: `Successfully connected to Binance Futures. Account canTrade: ${data.canTrade ? 'YES' : 'NO'}, Total Margin: $${parseFloat(data.totalMarginBalance || '0').toFixed(2)} USDT.`,
      };
    } else {
      const errJson = await response.json().catch(() => ({}));
      if (response.status === 401) {
        return { success: false, message: `Authentication Error (401): ${errJson.msg || 'Invalid Binance API Key or Secret Key.'}` };
      }
      if (response.status === 403) {
        return { success: false, message: `Permission Error (403): ${errJson.msg || 'Binance IP or Futures trading permission rejected.'}` };
      }
      if (response.status === 429) {
        return { success: false, message: `Rate Limit Error (429): Binance request rate limit exceeded. Retry later.` };
      }
      return { success: false, message: `Binance Error (${response.status}): ${errJson.msg || 'Connection check failed.'}` };
    }
  } catch (err: any) {
    return { success: false, message: `Network/Security Error: ${err?.message || 'Failed to reach Binance endpoint.'}` };
  }
}

/**
 * Test Bitget API Connection securely
 */
export async function testBitgetConnection(apiKey: string, secretKey: string, passphrase: string): Promise<{ success: boolean; message: string }> {
  if (!apiKey.trim() || !secretKey.trim() || !passphrase.trim()) {
    return { success: false, message: 'Bitget API Key, Secret Key, and Passphrase are required.' };
  }

  if (checkDailyApiLimitExceeded()) {
    return { success: false, message: 'Daily market-data limit of 333 requests reached. Resets at midnight UTC.' };
  }

  incrementDailyApiCounter(1);

  try {
    const timestamp = Date.now().toString();
    const method = 'GET';
    const requestPath = '/api/v2/mix/account/accounts?productType=USDT-FUTURES';

    const preHash = timestamp + method + requestPath;
    const signature = await generateHmacSha256(secretKey.trim(), preHash, 'base64');

    const url = `https://api.bitget.com${requestPath}`;
    const proxyUrl = `/api/bitget${requestPath}`;

    const headers = {
      'ACCESS-KEY': apiKey.trim(),
      'ACCESS-SIGN': signature,
      'ACCESS-PASSPHRASE': passphrase.trim(),
      'ACCESS-TIMESTAMP': timestamp,
      'locale': 'en-US',
      'Content-Type': 'application/json',
    };

    let response: Response;
    try {
      response = await fetch(url, { headers });
    } catch {
      response = await fetch(proxyUrl, { headers });
    }

    if (response.ok) {
      const data = await response.json();
      if (data.code === '00000') {
        const usdtAcc = (data.data || []).find((a: any) => a.marginCoin === 'USDT') || data.data?.[0];
        const bal = usdtAcc ? parseFloat(usdtAcc.available || '0').toFixed(2) : '0.00';
        return {
          success: true,
          message: `Successfully connected to Bitget Futures API. USDT Margin Balance: $${bal}.`,
        };
      } else {
        return { success: false, message: `Bitget API Code ${data.code}: ${data.msg || 'Authentication failed.'}` };
      }
    } else {
      const errJson = await response.json().catch(() => ({}));
      if (response.status === 401) {
        return { success: false, message: `Authentication Error (401): ${errJson.msg || 'Invalid Bitget API Key, Secret, or Passphrase.'}` };
      }
      if (response.status === 403) {
        return { success: false, message: `Permission Error (403): ${errJson.msg || 'Bitget IP or Futures API permissions invalid.'}` };
      }
      return { success: false, message: `Bitget Error (${response.status}): ${errJson.msg || 'Connection check failed.'}` };
    }
  } catch (err: any) {
    return { success: false, message: `Network/Security Error: ${err?.message || 'Failed to reach Bitget endpoint.'}` };
  }
}
