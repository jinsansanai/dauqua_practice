const loginPage = (error = false) => `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>합창단 연습 녹음</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
           background: #f5f5f5; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .box { background: #fff; padding: 32px; border-radius: 12px;
           box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 320px; max-width: 90vw; }
    h2 { margin-bottom: 20px; font-size: 1.2rem; text-align: center; }
    input { width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px;
            font-size: 1rem; margin-bottom: 12px; outline: none; }
    input:focus { border-color: #2563eb; }
    button { width: 100%; padding: 12px; background: #2563eb; color: white;
             border: none; border-radius: 8px; font-size: 1rem; cursor: pointer; }
    button:hover { background: #1d4ed8; }
    .error { color: #dc2626; font-size: 0.9rem; margin-bottom: 12px; text-align: center; }
  </style>
</head>
<body>
  <div class="box">
    <h2>🎵 합창단 연습 녹음</h2>
    ${error ? '<p class="error">비밀번호가 틀렸습니다.</p>' : ''}
    <form method="POST" action="/_login">
      <input type="password" name="password" placeholder="비밀번호 입력" autofocus autocomplete="current-password">
      <button type="submit">입장</button>
    </form>
  </div>
</body>
</html>`

export default async function handler(request, context) {
  const url = new URL(request.url)
  const password = Deno.env.get('SITE_PASSWORD')

  if (!password) {
    return context.next()
  }

  // 로그인 POST 처리
  if (request.method === 'POST' && url.pathname === '/_login') {
    let submitted = ''
    try {
      const formData = await request.formData()
      submitted = formData.get('password') || ''
    } catch {
      // ignore
    }

    if (submitted === password) {
      return new Response(null, {
        status: 302,
        headers: {
          'Location': '/',
          'Set-Cookie': `site-auth=${encodeURIComponent(password)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=2592000`
        }
      })
    }

    return new Response(loginPage(true), {
      status: 401,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  }

  // 쿠키 확인
  const cookieHeader = request.headers.get('cookie') || ''
  const authMatch = cookieHeader.split(';').find(c => c.trim().startsWith('site-auth='))
  const authValue = authMatch
    ? decodeURIComponent(authMatch.split('=').slice(1).join('=').trim())
    : null

  if (authValue === password) {
    return context.next()
  }

  return new Response(loginPage(false), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  })
}

export const config = { path: '/*' }
