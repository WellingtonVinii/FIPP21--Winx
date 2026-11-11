import { NextResponse } from 'next/server';

export function middleware(request) {
    const token = request.cookies.get('token')?.value;
    const { pathname } = request.nextUrl;

    const rotasProtegidas = ['/salas', '/mesa'];
    const ehRotaProtegida = rotasProtegidas.some(rota => pathname.startsWith(rota));

    // Se o usuário tentar acessar uma rota da área restrita sem token, vai para login
    if (ehRotaProtegida && !token) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Se já estiver logado e tentar acessar login ou cadastro, vai para as salas
    if ((pathname === '/login' || pathname === '/cadastro') && token) {
        return NextResponse.redirect(new URL('/salas', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/salas/:path*', '/mesa/:path*', '/login', '/cadastro']
};

