const encoder = new TextEncoder()

interface JwtHeader {
  alg: 'HS256'
  typ: 'JWT'
}

interface JwtPayload {
  [key: string]: any
  exp: number
}

export interface SessionUser {
  id: string
  email: string
}

function toBase64Url(input: ArrayBuffer | Uint8Array): string {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(input: string): Uint8Array {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))
  const binary = atob(normalized + padding)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

async function hmac(secret: string, data: string): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  return crypto.subtle.sign('HMAC', key, encoder.encode(data))
}

async function verifyHmac(secret: string, data: string, signature: Uint8Array): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  )
  const signatureBuffer = signature.buffer.slice(
    signature.byteOffset,
    signature.byteOffset + signature.byteLength
  ) as ArrayBuffer
  return crypto.subtle.verify('HMAC', key, signatureBuffer, encoder.encode(data))
}

export async function signJwt(payload: JwtPayload, secret: string): Promise<string> {
  const header: JwtHeader = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = toBase64Url(encoder.encode(JSON.stringify(header)))
  const encodedPayload = toBase64Url(encoder.encode(JSON.stringify(payload)))
  const message = `${encodedHeader}.${encodedPayload}`
  const signature = await hmac(secret, message)
  return `${message}.${toBase64Url(signature)}`
}

export async function verifyJwt<T = any>(token: string, secret: string): Promise<T | null> {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [encodedHeader, encodedPayload, encodedSignature] = parts
  const message = `${encodedHeader}.${encodedPayload}`
  const signatureBytes = fromBase64Url(encodedSignature)
  const validSig = await verifyHmac(secret, message, signatureBytes)
  if (!validSig) return null

  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(encodedPayload)))
    if (!payload?.exp || Math.floor(Date.now() / 1000) > payload.exp) return null
    return payload as T
  } catch {
    return null
  }
}

export function getCookie(request: Request, key: string): string | null {
  const cookieHeader = request.headers.get('Cookie')
  if (!cookieHeader) return null
  const chunks = cookieHeader.split(';')
  for (const chunk of chunks) {
    const [rawName, ...rawValue] = chunk.trim().split('=')
    if (rawName === key) return rawValue.join('=')
  }
  return null
}

export function makeSessionCookie(token: string): string {
  const maxAge = 60 * 60 * 24 * 30
  return `wf_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`
}

export function clearSessionCookie(): string {
  return 'wf_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'
}

export async function requireSessionUser(request: Request, jwtSecret: string): Promise<SessionUser | null> {
  const token = getCookie(request, 'wf_session')
  if (!token) return null
  const payload = await verifyJwt<{ sub: string; email: string; exp: number }>(token, jwtSecret)
  if (!payload?.sub || !payload?.email) return null
  return { id: payload.sub, email: payload.email }
}
