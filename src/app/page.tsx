'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

// --- TYPES ---
interface TimeLeft {
  hours: number
  minutes: number
  seconds: number
}

interface BatchCounts {
  'Batch 1': number
  'Batch 2': number
  'Batch 3': number
}

interface FormData {
  full_name: string
  phone_number: string
  email: string
  telegram_username: string
  academic_level: string
  batch_selection: string
  payment_reference: string
  receipt_url: string
}

interface Message {
  type: 'success' | 'error' | ''
  text: string
}

interface CourseItem {
  day: string
  title: string
}

const courseOutline: CourseItem[] = [
  { day: 'Day 1',  title: 'ቴክኖሎጂ ለምን? በዘርፉ ለመስራት ምን ያስፈልጋል? (የMindset ዝግጅት)' },
  { day: 'Day 2',  title: 'ከስዕል እስከ ሙሉ መተግበሪያ (Web, Mobile & Design: Frontend, Backend, Full-stack, UI/UX)' },
  { day: 'Day 3',  title: 'የወደፊቱ የቴክኖሎጂ አቅጣጫ (Data, AI & Cloud: Data Science, ML, Cloud Computing)' },
  { day: 'Day 4',  title: 'ዲጂታሉን አለም ከሌቦች መጠበቅ (Security & Systems: Cybersecurity, Ethical Hacking, Network)' },
  { day: 'Day 5',  title: 'ያለ ኮዲንግ በቴክኖሎጂ አለም መሪ መሆን (Digital & Emerging Tech: Digital Marketing, Product Management, Tech Support)' },
  { day: 'Day 6',  title: 'የቴክኖሎጂው የጀርባ አጥንቶች እና ደህንነቱ የተጠበቀ ዳታ (Blockchain, DevOps, DataOps)' },
  { day: 'Day 7',  title: 'ማዕበሉን መለየት - የትኛው ዘርፍ ያዋጣል? (Local vs Global Market & Freelancing Reality)' },
  { day: 'Day 8',  title: 'ያንተን ኮምፓስ ያዝ (The Critical Stream Matching Test & Specialized Roadmap PDFs Distribution)' },
  { day: 'Day 9',  title: 'ዘመናዊው የቴክኖሎጂ ተማሪ መሳሪያዎች (AI Tools, GitHub & Portfolio Mastery)' },
  { day: 'Day 10', title: 'ጉዞው አሁን ይጀምራል! (የስነ-ልቦና ስንቅ, Digital Certificate Award & Lifetime Community Group)' },
]

const BATCH_LIMIT = 50
const TOTAL_LIMIT = 150

export default function Home() {
  // --- STATE ---
  const [timeLeft, setTimeLeft]           = useState<TimeLeft>({ hours: 23, minutes: 58, seconds: 44 })
  const [totalRegistered, setTotalRegistered] = useState<number>(0)
  const [batchCounts, setBatchCounts]     = useState<BatchCounts>({ 'Batch 1': 0, 'Batch 2': 0, 'Batch 3': 0 })
  const [currentStep, setCurrentStep]     = useState<number>(1)
  const [loading, setLoading]             = useState<boolean>(false)
  const [message, setMessage]             = useState<Message>({ type: '', text: '' })
  const [activeAccordion, setActiveAccordion] = useState<number | null>(null)
  const [receiptFile, setReceiptFile]     = useState<File | null>(null)
  const fileInputRef                      = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<FormData>({
    full_name:          '',
    phone_number:       '',
    email:              '',
    telegram_username:  '',
    academic_level:     'High School',
    batch_selection:    'Batch 1',
    payment_reference:  '',
    receipt_url:        'Pending Verification',
  })

  // --- COUNTDOWN TIMER ---
  useEffect(() => {
    const targetTime = Date.now() + 24 * 60 * 60 * 1000
    const interval = setInterval(() => {
      const diff = targetTime - Date.now()
      if (diff <= 0) {
        clearInterval(interval)
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 })
      } else {
        setTimeLeft({
          hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / (1000 * 60)) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        })
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // ከ component ውጭ (ከ interfaces ጋር አብሮ)
interface RegistrationCounts {
  total: number
  batch_1: number
  batch_2: number
  batch_3: number
}

// --- FETCH REGISTRATION COUNTS ---
const fetchCounts = async (): Promise<void> => {
  const { data, error } = await supabase.rpc('get_registration_counts') as {
    data: RegistrationCounts | null
    error: unknown
  }
  if (!error && data) {
    setTotalRegistered(data.total)
    setBatchCounts({
      'Batch 1': data.batch_1,
      'Batch 2': data.batch_2,
      'Batch 3': data.batch_3,
    })
  }
}
  useEffect(() => { fetchCounts() }, [])

  // --- HANDLERS ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleNextStep = (): void => {
    if (
      currentStep === 1 &&
      (!formData.full_name || !formData.phone_number || !formData.email || !formData.telegram_username)
    ) {
      setMessage({ type: 'error', text: 'እባክሽ ሁሉንም የግል መረጃዎች በትክክል ሙሉ!' })
      return
    }
    setMessage({ type: '', text: '' })
    setCurrentStep(s => s + 1)
  }

  const uploadReceipt = async (file: File): Promise<string> => {
    const fileExt  = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${fileExt}`
    const filePath = `receipts/${fileName}`

    const { error } = await supabase.storage.from('receipts').upload(filePath, file)
    if (error) throw error

    const { data: publicUrlData } = supabase.storage.from('receipts').getPublicUrl(filePath)
    return publicUrlData.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()

    if (!formData.payment_reference) {
      setMessage({ type: 'error', text: 'እባክዎ የባንክ ማረጋገጫ ቁጥር (FT) ያስገቡ!' })
      return
    }
    if (!receiptFile) {
      setMessage({ type: 'error', text: 'እባክዎ ደረሰኝ (receipt) ያስገቡ!' })
      return
    }

    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const receiptUrl = await uploadReceipt(receiptFile)

      const { error } = await supabase
        .from('registrations')
        .insert([{ ...formData, receipt_url: receiptUrl, status: 'pending' }])

      if (error) throw error

      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isAdminNotification: true,
          studentName:         formData.full_name,
          studentEmail:        formData.email,
          batch_selection:     formData.batch_selection,
        }),
      })

      setMessage({
        type: 'success',
        text: 'እንኳን ደስ አሎት!🥳 የምዝገባ ጥያቄዎ በፔንዲንግ (Pending) ተይዟል። ክፍያዎ ሲረጋገጥ ትምህርቱን የሚወስዱበት የቴሌግራም ሊንክ በኢሜይል ይላክሎታል።',
      })

      setTimeout(() => {
        setCurrentStep(1)
        setFormData({
          full_name:         '',
          phone_number:      '',
          email:             '',
          telegram_username: '',
          academic_level:    'High School',
          batch_selection:   'Batch 1',
          payment_reference: '',
          receipt_url:       'Pending Verification',
        })
        setReceiptFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        fetchCounts()
      }, 4000)

    } catch (err: unknown) {
      console.error('ሙሉ ስህተቱ ይሄ ነው:', err)
      const anyErr = err as { code?: string; message?: string }
      if (anyErr.code === '23505') {
        setMessage({ type: 'error', text: 'ይህ ኢሜይል ቀደም ብሎ ተመዝግቧል።' })
      } else {
        setMessage({ type: 'error', text: `ስህተት ተከስቷል: ${anyErr.message ?? 'እባክዎ እንደገና ይሞክሩ።'}` })
      }
    } finally {
      setLoading(false)
    }
  }

  const isSystemFull = totalRegistered >= TOTAL_LIMIT

  // --- UI HELPERS ---
  const pad = (n: number): string => String(n).padStart(2, '0')

  const batchStyle = (batch: keyof BatchCounts): string => {
    const full = batchCounts[batch] >= BATCH_LIMIT
    const selected = formData.batch_selection === batch
    if (full)     return 'border-red-900/30 bg-red-950/10 opacity-40 pointer-events-none'
    if (selected) return 'border-[#00DF89] bg-[#00DF89]/5 shadow-[0_0_12px_rgba(0,223,137,0.1)]'
    return 'border-white/5 bg-black hover:border-white/15'
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white antialiased selection:bg-[#00DF89] selection:text-black font-sans overflow-x-hidden relative pt-24">

      {/* 🛡️ Secure Badge Bar */}
      <div className="w-full bg-[#0a1410] border-b border-[#00DF89]/10 py-2.5 px-4 text-center text-xs text-[#00DF89] font-mono flex items-center justify-center gap-2 absolute top-0 left-0 z-50">
        <span className="w-1.5 h-1.5 bg-[#00DF89] rounded-full animate-pulse" />
        <span>🛡️ SSL Secure Connection &amp; Encrypted Database Active</span>
      </div>

      {/* HEADER */}
      <header style={{ position: 'absolute', top: '38px', left: 0, width: '100%', zIndex: 40 }} className="border-b border-white/5 bg-[#050505]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl border border-[#00DF89]/30 overflow-hidden relative shadow-[0_0_15px_rgba(0,223,137,0.1)]">
              <Image src="/logo.jpg" alt="Logo" fill className="object-cover" />
            </div>
            <span className="font-mono tracking-wider font-black text-base text-[#00DF89]">AISHA TECH</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-xs uppercase tracking-wider font-mono text-gray-400">
            <a href="#about"     className="hover:text-[#00DF89] transition">About</a>
            <a href="#logistics" className="hover:text-[#00DF89] transition">Logistics</a>
            <a href="#outline"   className="hover:text-[#00DF89] transition">Outline</a>
            <a href="#mentors"   className="hover:text-[#00DF89] transition">Coaches</a>
          </nav>
          <a href="#register" className="bg-[#00DF89] hover:bg-[#00c478] text-black font-black px-4 py-2 rounded-lg text-xs transition shadow-[0_4px_15px_rgba(0,223,137,0.15)]">
            አሁኑኑ ይመዝገቡ
          </a>
        </div>
      </header>

      {/* HERO */}
      <section id="about" className="max-w-4xl mx-auto text-center px-4 pt-20 pb-12 relative">
        <div className="w-24 h-24 rounded-full border-2 border-[#00DF89] overflow-hidden bg-black mx-auto mb-6 shadow-[0_0_25px_rgba(0,223,137,0.2)] relative">
          <Image src="/logo.jpg" alt="Logo" fill className="object-cover" priority />
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight mb-4 leading-tight font-mono">
          A10TC (Aisha's 10-day <br/> Tech Challenge) Program
        </h1>
        <div className="w-16 h-1 bg-[#00DF89] mx-auto mb-8 rounded-full" />

        <p className="text-gray-300 text-sm sm:text-base md:text-lg max-w-3xl mx-auto mb-10 leading-relaxed font-light px-2">
          &quot;ይህ የ Aisha&apos;s 10-day Tech Challenge ለሁሉም የtechnology አፍቃሪያን በሙሉ የተዘጋጀ ልዩ program ነው። ይሄ ከየት ልጀምር ስለ ምን ልማር እና የትኛውን ልምረጥና ልወቅ እያለ ምን ማድረግ እንዳለበት ግራ ለገባው ማንኛውም ሰው የተዘጋጀ ሲሆን ስልጠናውን ለ10 ተከታታይ ቀናቶች ሰልጥናቹህ ሰርተፍኬታችሁን እና የመረጣችሁትን የtechnology አይነት ይዛቹህ መንገዳችሁን በራሳችሁ እንድትቀጥሉ በሩን ከፋች ነው።&quot;
        </p>

        {/* Audio promo */}
        <div className="bg-[#0c0c0f] border border-white/5 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 max-w-xl mx-auto mb-10 shadow-lg">
          <span className="text-xs text-gray-400 flex items-center gap-2 shrink-0">ℹ️ የማስታወቂያ ማብራሪያ ድምፅ፡</span>
          <audio controls className="w-full h-8 accent-[#00DF89]">
            <source src="/promo.mp3" type="audio/mpeg" />
          </audio>
        </div>

        {/* Countdown */}
        <div className="max-w-sm mx-auto bg-[#0c0c0f] border border-white/5 p-6 rounded-2xl shadow-xl backdrop-blur-md mb-10">
          <p className="text-gray-400 font-bold mb-4 uppercase tracking-widest text-[11px]">ይህ ዙር ምዝገባ ለመዘጋት የቀረው ጊዜ</p>
          <div className="grid grid-cols-3 gap-3 font-mono">
            {(['hours', 'minutes', 'seconds'] as const).map((unit, i) => (
              <div key={unit} className="bg-[#121216] p-3 rounded-xl border border-white/5">
                <span className="text-2xl sm:text-3xl font-black text-[#00DF89]">{pad(timeLeft[unit])}</span>
                <p className="text-[10px] text-gray-500 mt-1">{['Hours', 'Minutes', 'Seconds'][i]}</p>
              </div>
            ))}
          </div>
        </div>

        <a href="#register" className="inline-block bg-[#00DF89] hover:bg-[#00c478] text-black font-black px-10 py-4 rounded-xl text-lg transition duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_30px_rgba(0,223,137,0.25)] font-mono">
          JOIN CHALLENGE
        </a>
      </section>

      {/* LOGISTICS */}
      <section id="logistics" className="max-w-5xl mx-auto px-6 py-16 border-t border-white/5 text-center">
        <h2 className="text-2xl sm:text-3xl font-black tracking-wider font-mono uppercase">CLASS LOGISTICS</h2>
        <div className="w-12 h-1 bg-[#00DF89] mx-auto mt-2 mb-10 rounded-full" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto text-left mb-6">
          <div className="bg-[#0c0c0f] border border-white/5 p-6 rounded-xl">
            <h3 className="text-sm font-bold text-[#00DF89] uppercase tracking-wider mb-2">⏳ Duration</h3>
            <p className="text-sm sm:text-base text-gray-300">10 Consecutive Days of comprehensive immersive training.</p>
          </div>
          <div className="bg-[#0c0c0f] border border-white/5 p-6 rounded-xl">
            <h3 className="text-sm font-bold text-[#00DF89] uppercase tracking-wider mb-2">📢 Delivery</h3>
            <p className="text-sm sm:text-base text-gray-300">Hosted on a Private Telegram Group with Live Video Chats + Screen Sharing.</p>
          </div>
        </div>
        <div className="max-w-4xl mx-auto bg-[#0f1412] border border-dashed border-[#00DF89]/20 p-4 rounded-xl text-left">
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            💡 <strong className="text-white">IMPORTANT NOTE:</strong> &quot;ክፍያ ፈጽመው እንደጨረሱ፣ ባረጋገጡ በ24 ሰዓት ጊዜ ውስጥ ወደ training የሚሰጥበት የግል (Private) ቴሌግራም ግሩፕ በቀጥታ ይካተታሉ።&quot;
          </p>
        </div>
      </section>

      {/* COURSE OUTLINE */}
      <section id="outline" className="max-w-4xl mx-auto px-6 py-16 border-t border-white/5 text-center">
        <h2 className="text-2xl sm:text-3xl font-black tracking-wider font-mono uppercase">COURSE OUTLINE</h2>
        <div className="w-12 h-1 bg-[#00DF89] mx-auto mt-2 mb-10 rounded-full" />

        <div className="space-y-3 text-left max-w-3xl mx-auto">
          {courseOutline.map((item, index) => (
            <div key={index} className="border border-white/5 rounded-xl bg-[#0c0c0f] overflow-hidden">
              <button
                onClick={() => setActiveAccordion(activeAccordion === index ? null : index)}
                className="w-full p-4 flex justify-between items-center text-left text-sm font-bold hover:bg-white/[0.02] transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[#00DF89] font-mono text-xs bg-[#00DF89]/10 px-2.5 py-1 rounded-md">{item.day}</span>
                  <span className="text-gray-200 truncate max-w-[220px] sm:max-w-none">{item.title}</span>
                </div>
                <span className="text-gray-600 text-xs">{activeAccordion === index ? '▲' : '▼'}</span>
              </button>
              {activeAccordion === index && (
                <div className="p-4 bg-black/40 border-t border-white/5 text-xs text-gray-400 leading-relaxed">
                  ይህ የ {item.day} ስልጠና ጥልቅ ማብራሪያዎችን፣ ከተግባራዊ ማሳያ መስኮቶችና ጠቃሚ ግብዓቶች ጋር አካቶ በቴሌግራም ላይ በቪዲዮ ይሰጣል።
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* MENTORS */}
      <section id="mentors" className="max-w-5xl mx-auto px-6 py-16 border-t border-white/5 text-center">
        <h2 className="text-2xl sm:text-3xl font-black tracking-wider font-mono uppercase">FOUNDER &amp; MENTORS</h2>
        <div className="w-12 h-1 bg-[#00DF89] mx-auto mt-2 mb-10 rounded-full" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
          {/* Mentor Card */}
          {[
            {
              src: '/aisha.jpg', name: 'Aisha Abubeker',
              role: 'Founder of A10TC & Full-Stack Developer',
              bio: 'በ Full-Stack Web Development እና በዲጂታል ይዘት ፈጠራ (Content Creation) ዘርፍ ላይ በመሰማራት፣ ዘመናዊና ስልታዊ የቴክኖሎጂ መፍትሄዎችን ትገነባለች። በ Aisha Tech (@Aisha_tech1) አማካኝነት፣ ጀማሪዎች የቴክኖሎጂውን ዓለም በቀላሉ እንዲረዱ፣ ትክክለኛውን የስራ መስመር እንዲመርጡ እና ክህሎታቸውን እንዲያሳድጉ ትመክራለች።',
              borderColor: 'border-[#00DF89]',
            },
            {
              src: '/zikra.jpg', name: 'Zikra Lbase',
              role: 'Mentor | Frontend Developer',
              bio: 'የ4ኛ ዓመት የሶፍትዌር ኢንጂነሪንግ (Software Engineering) ተማሪ እና በ Frontend Developer ዘርፍ ላይ በከፍተኛ ብቃት እየሰራች ያለች ጎበዝ ባለሙያ ናት። በዘርፉ ያላትን ጥልቅ እውቀት በማጣመር፣ ተማሪዎች መንገዳቸውን ከመነሻቸው መርጠው እንዲጓዙ ማስተር እንዲያደርጉ በቅርበት ትመክራለች።',
              borderColor: 'border-[#00DF89]/50',
            },
          ].map(m => (
            <div key={m.name} className="bg-[#0c0c0f] border border-white/5 p-6 rounded-2xl flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className={`w-20 h-20 rounded-full overflow-hidden relative border-2 ${m.borderColor} shrink-0 bg-gray-900 shadow-[0_0_15px_rgba(0,223,137,0.15)]`}>
                <Image src={m.src} alt={m.name} fill className="object-cover" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-0.5">{m.name}</h3>
                <p className="text-[11px] text-[#00DF89] font-mono mb-3">{m.role}</p>
                <p className="text-xs text-gray-400 leading-relaxed font-light">{m.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="max-w-4xl mx-auto px-6 py-12 border-t border-white/5 text-center">
        <div className="bg-gradient-to-b from-[#0c0c0f] to-black border border-[#00DF89]/20 p-8 rounded-3xl max-w-xl mx-auto shadow-xl relative">
          <span className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#00DF89] text-black font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-widest font-mono">Special Promo</span>
          <h3 className="text-lg font-bold mb-3 text-gray-300">የአባልነት ክፍያ መግቢያ</h3>
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="text-gray-600 line-through text-lg font-mono">400 ETB</span>
            <span className="text-4xl font-black font-mono text-[#00DF89] drop-shadow-[0_0_15px_rgba(0,223,137,0.3)]">320 ETB</span>
          </div>
          <p className="text-xs text-purple-400 font-semibold mb-4 font-mono">⚠️ 20% Off for First Round Students Only!</p>

          <div className="bg-[#121217] border border-white/5 text-left text-xs p-4 rounded-xl text-gray-400 leading-relaxed">
            🎁 <strong className="text-white">የነፃ እድል ማሳወቂያ፦</strong> የመክፈል አቅሙ ለሌላቸው ቀድመው ላሳወቁ 6 ተማሪዎች የነፃ ስልጠና አዘጋጅተናል እባኮ ይህንን  የtelegram link በመጠቀም ያሳውቁን፡{' '}
            <a href="https://t.me/Aisha_abuki" target="_blank" rel="noreferrer" className="text-[#00DF89] underline font-bold">@Aisha_abuki</a>
          </div>

          <div className="mt-5 flex items-center justify-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-white/5 text-xs w-fit mx-auto font-mono">
            <span className="w-1.5 h-1.5 bg-[#00DF89] rounded-full animate-pulse" />
            <span className="text-gray-400">ጠቅላላ የምዝገባ ገደብ፡ <strong className="text-white font-mono">{totalRegistered}/{TOTAL_LIMIT} Max</strong></span>
          </div>
        </div>
      </section>

      {/* REGISTRATION FORM */}
      <section id="register" className="max-w-4xl mx-auto px-4 py-16 border-t border-white/5 text-center">
        <h2 className="text-2xl sm:text-3xl font-black tracking-wider font-mono uppercase">REGISTRATION FORM</h2>
        <div className="w-12 h-1 bg-[#00DF89] mx-auto mt-2 mb-12 rounded-full" />

        {isSystemFull ? (
          <div className="bg-red-950/20 border border-red-500/30 p-8 rounded-2xl max-w-md mx-auto text-center shadow-xl">
            <h3 className="text-xl font-bold text-red-400 mb-2">Registration Closed!</h3>
            <p className="text-gray-300 text-sm mb-4">ለዚህ ዙር የተመደበው 150 ቦታ ሙሉ በሙሉ አልቋል። ለቀጣይ ዙር መረጃ መስራቹን በቴሌግራም ያግኙ።</p>
            <a href="https://t.me/Aisha_abuki" target="_blank" rel="noreferrer" className="bg-red-500 text-black font-bold px-6 py-2 rounded-xl text-sm inline-block">@Aisha_abuki</a>
          </div>
        ) : (
          <div className="bg-[#0c0c0f] border border-white/5 rounded-2xl p-6 sm:p-10 max-w-xl mx-auto text-left shadow-2xl relative">

            {/* Step Progress */}
            <div className="mb-8">
              <div className="flex justify-between text-[11px] font-mono text-gray-500 mb-2">
                {(['Step 1 Profile', 'Step 2 Batch', 'Step 3 Payment'] as const).map((label, i) => (
                  <span key={label} className={currentStep >= i + 1 ? 'text-[#00DF89] font-bold' : ''}>{label}</span>
                ))}
              </div>
              <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                <div className="bg-[#00DF89] h-full transition-all duration-300" style={{ width: `${(currentStep / 3) * 100}%` }} />
              </div>
            </div>

            {message.text && (
              <div className={`p-4 rounded-xl mb-5 text-xs font-medium border ${
                message.type === 'success'
                  ? 'bg-[#0a1812] text-[#00DF89] border-[#00DF89]/20'
                  : 'bg-[#1c1012] text-red-400 border-red-500/20'
              }`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* ── STEP 1 ── */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-[#00DF89]">📍 Step 1: Personal Profile</h3>

                  {(
                    [
                      { label: 'Full Name',          name: 'full_name',          type: 'text',  placeholder: 'John Doe' },
                      { label: 'Phone Number',        name: 'phone_number',       type: 'tel',   placeholder: '09xxxxxxxx' },
                      { label: 'Gmail Address',       name: 'email',              type: 'email', placeholder: 'example@gmail.com' },
                      { label: 'Telegram Username',   name: 'telegram_username',  type: 'text',  placeholder: '@username' },
                    ] as { label: string; name: keyof FormData; type: string; placeholder: string }[]
                  ).map(field => (
                    <div key={field.name}>
                      <label className="block text-xs text-gray-400 mb-1.5 font-medium">{field.label}</label>
                      <input
                        type={field.type}
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleChange}
                        required
                        placeholder={field.placeholder}
                        className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:border-[#00DF89] focus:outline-none text-sm transition font-mono placeholder:text-gray-700"
                      />
                    </div>
                  ))}

                  <button type="button" onClick={handleNextStep} className="w-full bg-[#00DF89] hover:bg-[#00c478] text-black font-black p-3.5 rounded-xl mt-2 transition text-sm cursor-pointer shadow-[0_4px_15px_rgba(0,223,137,0.15)]">
                    ቀጣይ ገጽ ➔
                  </button>
                </div>
              )}

              {/* ── STEP 2 ── */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-[#00DF89]">📍 Step 2: Education &amp; Time Selection</h3>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium">Academic Level</label>
                    <select name="academic_level" value={formData.academic_level} onChange={handleChange} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:border-[#00DF89] focus:outline-none text-sm transition">
                      {['High School', '12th Grade Graduate', 'Remedial', 'Freshman', 'Non-Tech Graduate', 'Other'].map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-2 font-medium">Batch Selection</label>
                    <div className="space-y-2.5">
                      {(
                        [
                          { key: 'Batch 1', label: 'Batch 1 (Morning)',   time: '4:30 AM – 5:30 AM Local' },
                          { key: 'Batch 2', label: 'Batch 2 (Afternoon)', time: '10:30 PM – 11:30 PM Local' },
                          { key: 'Batch 3', label: 'Batch 3 (Evening)',   time: '2:30 PM – 3:30 PM Local' },
                        ] as { key: keyof BatchCounts; label: string; time: string }[]
                      ).map(b => (
                        <label key={b.key} className={`block border p-3 rounded-xl cursor-pointer transition ${batchStyle(b.key)}`}>
                          <div className="flex justify-between items-center text-xs sm:text-sm">
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="batch_selection"
                                value={b.key}
                                checked={formData.batch_selection === b.key}
                                onChange={handleChange}
                                disabled={batchCounts[b.key] >= BATCH_LIMIT}
                                className="accent-[#00DF89]"
                              />
                              <span className="font-bold">{b.label}</span>
                            </div>
                            <span className="text-[10px] font-mono text-gray-500">{b.time}</span>
                          </div>
                          <div className="text-[10px] text-gray-500 mt-1 pl-5 flex justify-between font-mono">
                            <span>Registered: {batchCounts[b.key]}/{BATCH_LIMIT}</span>
                            {batchCounts[b.key] >= BATCH_LIMIT && <span className="text-red-400 font-bold">Full</span>}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setCurrentStep(1)} className="w-1/3 bg-white/5 hover:bg-white/10 text-white font-bold p-3 rounded-xl text-xs transition">ተመለስ</button>
                    <button type="button" onClick={handleNextStep} className="w-2/3 bg-[#00DF89] hover:bg-[#00c478] text-black font-bold p-3 rounded-xl text-xs transition">ቀጣይ ገጽ ➔</button>
                  </div>
                </div>
              )}

              {/* ── STEP 3 ── */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-[#00DF89]">📍 Step 3: Payment Verification</h3>

                  <div className="bg-[#121815] border border-[#00DF89]/20 p-3 rounded-xl text-[11px] text-gray-300 leading-relaxed">
                    ✨ <strong>Discount Banner:</strong> This current 20% discount applies ONLY to Round 1 and will disappear permanently afterwards.
                  </div>

                  <div className="bg-black border border-white/5 p-4 rounded-xl space-y-1">
                    <p className="text-[10px] uppercase font-mono tracking-wider text-gray-500">Commercial Bank of Ethiopia (CBE)</p>
                    <p className="text-xs sm:text-sm font-bold text-[#00DF89]">Account Name: Zebiba Adem Ali</p>
                    <p className="text-sm sm:text-base font-mono font-black text-white select-all">Account Number: 1000279427657</p>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium">Payment Reference Number (FT) *</label>
                    <input
                      type="text"
                      name="payment_reference"
                      value={formData.payment_reference}
                      onChange={handleChange}
                      required
                      placeholder="FTXXXXXXXXX"
                      className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:border-[#00DF89] focus:outline-none text-sm font-mono placeholder:text-gray-700"
                    />
                  </div>

                  {/* File upload */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium">Upload Bank Receipt</label>
                    <div className="border border-dashed border-white/10 rounded-xl p-4 text-center bg-black/40">
                      <p className="text-xs text-gray-400 mb-1">📸 Click to select image or PDF</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setReceiptFile(e.target.files?.[0] ?? null)
                        }}
                        className="text-[10px] text-gray-600 max-w-full mx-auto cursor-pointer"
                      />
                      {receiptFile && (
                        <p className="text-[10px] text-[#00DF89] mt-1">
                          ✅ {receiptFile.name} ({(receiptFile.size / 1024).toFixed(1)} KB)
                        </p>
                      )}
                      <p className="text-[9px] text-[#00DF89]/60 mt-1">
                        *ማሳሰቢያ፡ አድሚኑ ደረሰኙን በሪፈረንስ ቁጥር (FT) ያረጋግጣል
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setCurrentStep(2)} disabled={loading} className="w-1/3 bg-white/5 hover:bg-white/10 text-white font-bold p-3 rounded-xl text-xs transition">ተመለስ</button>
                    <button type="submit" disabled={loading} className="w-2/3 bg-[#00DF89] hover:bg-[#00c478] text-black font-black p-3 rounded-xl text-xs transition cursor-pointer disabled:opacity-60">
                      {loading ? 'በማረጋገጥ ላይ...' : 'ምዝገባን ጨርስ'}
                    </button>
                  </div>

                  <p className="text-[10px] text-gray-500 text-center mt-2 font-mono">🔒 Secure &amp; Encrypted Connection. Data privacy 100% guaranteed.</p>
                </div>
              )}

            </form>
          </div>
        )}
      </section>

      {/* CONTACT */}
      <section className="max-w-4xl mx-auto px-6 py-16 border-t border-white/5 text-center">
        <h2 className="text-2xl sm:text-3xl font-black tracking-wider font-mono uppercase">CONTACT INFO</h2>
        <div className="w-12 h-1 bg-[#00DF89] mx-auto mt-2 mb-10 rounded-full" />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-[#0c0c0f] p-4 rounded-xl border border-white/5">
            <span className="block text-xl mb-1">📧</span>
            <p className="text-gray-500 mb-1">Gmail</p>
            <a href="mailto:aishatech19@gmail.com" className="text-[#00DF89] hover:underline block truncate">aishatech19@gmail.com</a>
          </div>
          <div className="bg-[#0c0c0f] p-4 rounded-xl border border-white/5">
            <span className="block text-xl mb-1">📞</span>
            <p className="text-gray-500 mb-1">Phone</p>
            <a href="tel:0978488625" className="text-[#00DF89]">0978488625</a>
          </div>
          <div className="bg-[#0c0c0f] p-4 rounded-xl border border-white/5">
            <span className="block text-xl mb-1">📍</span>
            <p className="text-gray-500 mb-1">Address</p>
            <span className="text-gray-300">Addis Ababa, Ethiopia</span>
          </div>
          <div className="bg-[#0c0c0f] p-4 rounded-xl border border-white/5">
            <span className="block text-xl mb-1">✈️</span>
            <p className="text-gray-500 mb-1">Telegram</p>
            <a href="https://t.me/Aisha_abuki" target="_blank" rel="noreferrer" className="text-[#00DF89] font-bold">@Aisha_abuki</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-8 text-center text-xs text-gray-600 font-mono">
        <p>© 2026 Aisha&apos;s Tech. All rights reserved. | A10TC Program</p>
      </footer>
    </main>
  )
}
