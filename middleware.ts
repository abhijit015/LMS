import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  // const token = await getToken({ req });

  // console.log('Request URL:', req.nextUrl.pathname);  
  // console.log('Token:', token);  

  // const publicPaths = ['/'];

  // if (!token && !publicPaths.includes(req.nextUrl.pathname)) {
  //   console.log('User is not authenticated, redirecting to /');
  //   return NextResponse.redirect(new URL('/', req.url));
  // }

  // console.log('User is authenticated, allowing access to', req.nextUrl.pathname);
  // return NextResponse.next();
}


export const config = {
  matcher: ['/cap/:path*'],  
};
