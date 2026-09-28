import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// دالة تأخير لمنع تجاوز معدل الطلبات (Rate Limit)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function generateWithRetry(contents: any[], retries = 3) {
  const models = ['gemini-1.5-flash', 'gemini-1.5-pro']
  
  for (let attempt = 0; attempt < retries; attempt++) {
    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName })
        const result = await model.generateContent(contents)
        const responseText = result.response.text()
        if (responseText) return responseText
      } catch (err: any) {
        console.warn(`Attempt with ${modelName} failed:`, err?.message)
      }
    }
    // الانتظار ثانية واحدة قبل محاولة الإعادة
    await delay(1000)
  }
  throw new Error('جميع محاولات الاتصال بالنموذج فشلت، يرجى التحقق من المفتاح أو المحاولة لاحقاً.')
}

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

    const summary = await generateWithRetry(contents)
    return NextResponse.json({ summary })
  } catch (error: any) {
    console.error('Summarize API Error:', error)
    return NextResponse.json(
      { error: error?.message || 'حدث خطأ غير متوقع أثناء المعالجة' },
      { status: 500 }
    )
  }
}
