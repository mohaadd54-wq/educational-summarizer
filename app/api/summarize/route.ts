import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const text = formData.get('text') as string
    const file = formData.get('file') as File | null

    const contents: any[] = []

    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer()
      const base64Data = Buffer.from(arrayBuffer).toString('base64')

      contents.push({
        inlineData: {
          mimeType: file.type || 'application/pdf',
          data: base64Data,
        },
      })
    }

    if (text && text.trim()) {
      contents.push(text)
    } else {
      contents.push('قم بتلخيص هذا المستند بشكل واضح ومبسط باللغة العربية مع استخراج أهم النقاط والمفاهيم الرئيسية.')
    }

    if (contents.length === 0) {
      return NextResponse.json({ error: 'يرجى تقديم نص أو رفع ملف للتلخيص' }, { status: 400 })
    }

    // محاولة الاستدلال بالنموذج الأساسي أولاً، وفي حال وجود ضغط (503) يتم التبديل تلقائياً
    let responseText = ''
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-3.8-flash' })
      const result = await model.generateContent(contents)
      responseText = result.response.text()
    } catch (primaryError: any) {
      console.warn('Primary model busy, switching to fallback model...', primaryError)
      const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
      const fallbackResult = await fallbackModel.generateContent(contents)
      responseText = fallbackResult.response.text()
    }

    return NextResponse.json({ summary: responseText })
  } catch (error: any) {
    console.error('Summarize API Error:', error)
    return NextResponse.json(
      { error: 'السيرفر مشغول حالياً بسبب الضغط العالي، يرجى إعادة المحاولة بعد ثوانٍ قليلة.' },
      { status: 500 }
    )
  }
}
