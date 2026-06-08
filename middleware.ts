export const config = {
  matcher: '/(.*)',
};

const VALID = 'YWRtaW46MTYwNXN0dWRpbw=='; // admin:1605studio

export default function middleware(req: Request): Response | undefined {
  const auth = req.headers.get('authorization');

  if (auth?.startsWith('Basic ') && auth.slice(6) === VALID) {
    return undefined; // pass through
  }

  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Ontos Docs", charset="UTF-8"',
    },
  });
}
