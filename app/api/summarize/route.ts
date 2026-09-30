import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'مفتاح GEMINI_API_KEY غير معرف' },
        { status: 500 }
      )
    }

    const genAI = new GoogleGenerativeAI(apiKey)
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

    // الاعتماد المباشر على النموذج المطلوب في الخطأ: gemini-3.8-flash
    const model = genAI.getGenerativeModel({ model: 'gemini-3.8-flash' })
    const result = await model.generateContent(contents)
    const responseText = result.response.text()

    return NextResponse.json({ summary: responseText })
  } catch (error: any) {
    console.error('Summarize API Error:', error)
    return NextResponse.json(
      { error: error?.message || 'حدث خطأ أثناء معالجة الطلب' },
      { status: 500 }
    )
  }
}
