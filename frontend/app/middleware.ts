
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedPaths = ['/admin', '/employe']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Vérifie si le chemin est dans la liste des routes protégées
  if (protectedPaths.some(path => pathname.startsWith(path))) {
    const role = request.cookies.get('role')?.value

    // Rediriger vers la page de connexion si rôle incorrect
    if (pathname.startsWith('/admin') && role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/connexion'
      return NextResponse.redirect(url)
    }
    if (pathname.startsWith('/employe') && role !== 'employe') {
      const url = request.nextUrl.clone()
      url.pathname = '/connexion'
      return NextResponse.redirect(url)
    }
  }
  return NextResponse.next()
}