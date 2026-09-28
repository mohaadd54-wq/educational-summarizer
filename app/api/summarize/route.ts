import { GoogleGenAI } from '@google/genai'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

// @ts-ignore
import pdfParse from 'pdf-parse'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const text = formData.get('text') as string
    const file = formData.get('file') as File | null

    let contentToSummarize = text || ''

    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      // التاكد من دالة pdfParse
      const parseFunc = typeof pdfParse === 'function' ? pdfParse : (pdfParse as any).default || pdfParse
      const pdfData = await parseFunc(buffer)
      contentToSummarize = pdfData.text
    }

    if (!contentToSummarize.trim()) {
      return NextResponse.json({ error: 'لم يتم العثور على نص أو ملف صالح للتلخيص' }, { status: 400 })
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `قم بتلخيص النص التالي باللغة العربية بطريقة تعليمية مبسطة مع استخراج أهم النقاط الرئيسية:\n\n${contentToSummarize}`,
    })

    return NextResponse.json({ summary: response.text })
  } catch (error: any) {
    console.error('Summarize API Error:', error)
    return NextResponse.json({ error: error?.message || 'حدث خطأ أثناء معالجة الطلب' }, { status: 500 })
  }
}

