/**
 * Cloudflare Workers 兼容的密码加密工具
 * 使用 Web Crypto API (PBKDF2) 替代 bcryptjs
 */

const ITERATIONS = 100000;
const KEY_LENGTH = 256;
const SALT_LENGTH = 16;

// 编码辅助函数
const encoder = new TextEncoder();

// Base64 编码/解码
function toBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function fromBase64(str: string): Uint8Array {
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
}

/**
 * 生成密码哈希
 * @param password 明文密码
 * @returns 格式: "salt:hash" (base64 编码)
 */
export async function hashPassword(password: string): Promise<string> {
  // 生成随机盐值
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  // 导入密码作为密钥材料
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  // 使用 PBKDF2 派生密钥
  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH
  );

  // 返回 "salt:hash" 格式
  return `${toBase64(salt.buffer)}:${toBase64(hash)}`;
}

/**
 * 验证密码
 * @param password 明文密码
 * @param storedHash 存储的哈希 (格式: "salt:hash")
 * @returns 是否匹配
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  try {
    const [saltBase64, hashBase64] = storedHash.split(':');
    if (!saltBase64 || !hashBase64) return false;

    const salt = fromBase64(saltBase64);
    const storedHashBytes = fromBase64(hashBase64);

    // 导入密码作为密钥材料
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    // 使用相同的盐值派生密钥
    const computedHash = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations: ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      KEY_LENGTH
    );

    // 比较哈希值（恒定时间比较）
    const computedBytes = new Uint8Array(computedHash);
    let match = true;
    for (let i = 0; i < storedHashBytes.length; i++) {
      if (computedBytes[i] !== storedHashBytes[i]) {
        match = false;
      }
    }
    return match && computedBytes.length === storedHashBytes.length;
  } catch {
    return false;
  }
}
