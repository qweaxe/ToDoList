/**
 * 客户端 API 请求封装
 *
 * 统一为所有 API 请求注入 X-Timezone 头（IANA 时区名，如 "Asia/Shanghai"），
 * 服务端通过该头计算"今天/本周/本月"等日期边界，实现：
 * - 服务器端统一 UTC 存储；
 * - 每个用户使用自己设备的本地时区。
 *
 * 用法：客户端代码一律调用 `apiFetch`（签名与全局 fetch 相同），
 * 不要直接使用全局 fetch 调用本站 /api 接口。
 */

/** 获取浏览器当前时区（IANA 名称），失败时回退 UTC */
export function getClientTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * 带时区头的 fetch 封装。
 * 仅用于同源 /api 请求；对外部 URL 请使用原生 fetch。
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const timeZone = getClientTimeZone();
  const headers = new Headers(init?.headers);
  if (!headers.has('X-Timezone')) {
    headers.set('X-Timezone', timeZone);
  }
  return fetch(input, { ...init, headers });
}
