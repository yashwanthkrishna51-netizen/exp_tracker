export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Allow login page and API
  if (pathname === '/login.html' || pathname.startsWith('/api/')) {
    return;
  }
  
  // Check for auth cookie
  const authCookie = request.cookies.get('spent_session');
  
  if (!authCookie || !authCookie.value) {
    // Not authenticated - redirect to login
    return Response.redirect(new URL('/login.html', request.url));
  }
  
  // Authenticated - allow access
  return;
}

export const config = {
  matcher: [
    '/((?!login.html|api/|_next/static|favicon.ico|robots.txt).*)',
  ],
};
