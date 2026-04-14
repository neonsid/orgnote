import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || ''

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = request.nextUrl.searchParams.get('url')
  const filename = request.nextUrl.searchParams.get('filename') || 'download'

  if (!url) {
    return NextResponse.json(
      { error: 'Missing url parameter' },
      { status: 400 }
    )
  }

  if (!R2_PUBLIC_URL || !url.startsWith(R2_PUBLIC_URL)) {
    return NextResponse.json({ error: 'Invalid file URL' }, { status: 400 })
  }

  const response = await fetch(url)
  if (!response.ok) {
    return NextResponse.json(
      { error: 'Failed to fetch file' },
      { status: response.status }
    )
  }

  const blob = await response.blob()
  const contentType =
    response.headers.get('content-type') || 'application/octet-stream'

  return new NextResponse(blob, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  })
}
