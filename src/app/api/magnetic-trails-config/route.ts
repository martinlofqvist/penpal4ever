import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readFile } from 'fs/promises'
import path from 'path'

const CONFIG_PATH = path.join(process.cwd(), 'public', 'animation', 'magnetic-trails-config.json')

export async function GET () {
  try {
    const raw = await readFile(CONFIG_PATH, 'utf-8')
    return NextResponse.json(JSON.parse(raw))
  } catch {
    return NextResponse.json({})
  }
}

export async function POST (req: NextRequest) {
  try {
    const body = await req.json()
    await writeFile(CONFIG_PATH, JSON.stringify(body, null, 2), 'utf-8')
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
