import { GoogleGenAI } from '@google/genai'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

// @ts-ignore
const pdfParse = require('pdf-parse')

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })



export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const text = formData.get('text') as string
    const file = formData.get('file') as File | null

    let contentToSummarize = text || ''

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const pdfData = await pdfParse(buffer)
      contentToSummarize = pdfData.text
    }

    if (!contentToSummarize.trim()) {
      return NextResponse.json({ error: 'يرجى إدخال نص أو رفع ملف PDF للتلخيص' }, { status: 400 })
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `أنت مساعد تعليمي ذكي للطلاب. قم بتلخيص النص التالي المستخرج من المحاضرة/الملف باللغة العربية بشكل منظم جداً، واستخرج النقاط الرئيسية والمفاهيم المهمة والأفكار الأساسية بشكل واضح للتدريس والاستذكار:\n\n${contentToSummarize}`,
    })

    return NextResponse.json({ summary: response.text })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'حدث خطأ أثناء التلخيص' }, { status: 500 })
  }
}
