import { getDb } from '../db'

export interface NextcloudConnection {
  user_id: string
  server_url: string
  nextcloud_user_id: string
  access_token: string
  refresh_token: string | null
  expires_at: string | null
}

interface NextcloudTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in?: number
  user_id?: string
}

export function getNextcloudConfig() {
  const url = process.env.NEXTCLOUD_URL?.replace(/\/+$/, '')
  const clientId = process.env.NEXTCLOUD_CLIENT_ID
  const clientSecret = process.env.NEXTCLOUD_CLIENT_SECRET

  if (!url || !clientId || !clientSecret) {
    throw createError({ statusCode: 500, message: 'Nextcloud is not configured on this server' })
  }

  return { url, clientId, clientSecret }
}

export function buildAuthorizeUrl(state: string, redirectUri: string): string {
  const { url, clientId } = getNextcloudConfig()
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
  })
  return `${url}/apps/oauth2/authorize?${params.toString()}`
}

async function requestToken(body: Record<string, string>): Promise<NextcloudTokenResponse> {
  const { url, clientId, clientSecret } = getNextcloudConfig()
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch(`${url}/apps/oauth2/api/v1/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams(body).toString(),
  })

  if (!res.ok) {
    throw createError({ statusCode: 502, message: `Nextcloud token request failed: ${res.status}` })
  }

  return res.json()
}

export function exchangeCodeForToken(code: string, redirectUri: string) {
  return requestToken({ grant_type: 'authorization_code', code, redirect_uri: redirectUri })
}

export function refreshAccessToken(refreshToken: string) {
  return requestToken({ grant_type: 'refresh_token', refresh_token: refreshToken })
}

export function expiresAtFrom(expiresIn: number | undefined): string | null {
  if (!expiresIn) return null
  return new Date(Date.now() + expiresIn * 1000).toISOString()
}

async function refreshConnection(connection: NextcloudConnection): Promise<NextcloudConnection> {
  if (!connection.refresh_token) {
    throw createError({ statusCode: 401, message: 'Nextcloud session expired — please reconnect' })
  }

  const token = await refreshAccessToken(connection.refresh_token)
  const updated: NextcloudConnection = {
    ...connection,
    access_token: token.access_token,
    refresh_token: token.refresh_token ?? connection.refresh_token,
    expires_at: expiresAtFrom(token.expires_in),
  }

  const sql = getDb()
  await sql`
    UPDATE nextcloud_connections
    SET access_token = ${updated.access_token}, refresh_token = ${updated.refresh_token}, expires_at = ${updated.expires_at}
    WHERE user_id = ${updated.user_id}
  `

  return updated
}

async function webdavRequest(
  connection: NextcloudConnection,
  method: string,
  path: string,
  body?: string,
): Promise<{ response: Response; connection: NextcloudConnection }> {
  const doRequest = (conn: NextcloudConnection) =>
    fetch(`${conn.server_url}/remote.php/dav/files/${encodeURIComponent(conn.nextcloud_user_id)}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${conn.access_token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body,
    })

  let current = connection
  let response = await doRequest(current)

  if (response.status === 401) {
    current = await refreshConnection(current)
    response = await doRequest(current)
  }

  return { response, connection: current }
}

export async function webdavPut(connection: NextcloudConnection, path: string, body: string): Promise<NextcloudConnection> {
  const { response, connection: current } = await webdavRequest(connection, 'PUT', path, body)
  if (!response.ok) {
    throw createError({ statusCode: 502, message: `Nextcloud upload failed for ${path}: ${response.status}` })
  }
  return current
}

export async function webdavGet(connection: NextcloudConnection, path: string): Promise<{ body: string | null; connection: NextcloudConnection }> {
  const { response, connection: current } = await webdavRequest(connection, 'GET', path)
  if (response.status === 404) return { body: null, connection: current }
  if (!response.ok) {
    throw createError({ statusCode: 502, message: `Nextcloud download failed for ${path}: ${response.status}` })
  }
  return { body: await response.text(), connection: current }
}

export async function webdavMkcol(connection: NextcloudConnection, path: string): Promise<NextcloudConnection> {
  const { response, connection: current } = await webdavRequest(connection, 'MKCOL', path)
  // 405 = already exists — that's fine
  if (!response.ok && response.status !== 405) {
    throw createError({ statusCode: 502, message: `Nextcloud folder creation failed for ${path}: ${response.status}` })
  }
  return current
}
