'use client'
import { useState } from 'react'

export default function Home() {
  const [inputText, setInputText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSummarize(e: React.FormEvent) {
    e.preventDefault()
    if (!inputText.trim() && !file) return

    setLoading(true)
    setSummary('')

    try {
      const formData = new FormData()
      if (file) {
        formData.append('file', file)
      } else {
        formData.append('text', inputText)
      }

      const res = await fetch('/api/summarize', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (res.ok) {
        setSummary(data.summary)
      } else {
        alert(data.error || 'حدث خطأ')
      }
    } catch (err) {
      alert('فشل الاتصال بالسيرفر')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12 dir-rtl text-right">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-extrabold text-gray-800 text-center mb-2">
          🎓 منصة التلخيص والتعلم الذكي
        </h1>
        <p className="text-center text-gray-500 mb-8">
          أدخل نص المحاضرة أو ارفع ملف PDF واستخرج الملخص والأفكار الرئيسية فوراً بالذكاء الاصطناعي
        </p>

        <form onSubmit={handleSummarize} className="space-y-6">
          {/* خيار رفع ملف PDF */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📄 رفع ملف PDF (المحاضرة / الكتاب):
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:outline-none"
            />
          </div>

          <div className="text-center text-gray-400 font-semibold">— أو —</div>

          {/* خيار كتابة النص */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ✏️ أو انسخ ونسب نص الدرس مباشرة:
            </label>
            <textarea
              rows={6}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={!!file}
              placeholder={file ? 'تم اختيار ملف PDF' : 'انسخ النص هنا...'}
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 dir-rtl disabled:bg-gray-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading || (!inputText.trim() && !file)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition duration-200 disabled:opacity-50"
          >
            {loading ? 'جاري قراءة الملف وتحليل المحتوى...' : '✨ استخراج الملخص'}
          </button>
        </form>

        {summary && (
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              📌 الملخص والأفكار الرئيسية:
            </h2>
            <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-xl text-gray-800 whitespace-pre-wrap leading-relaxed">
              {summary}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
