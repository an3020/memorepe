import Link from 'next/link'
import LoginButton from './components/LoginButton'

export default function Home() {
  return (
    <main className="min-h-screen bg-white">

      {/* Nav */}
      <nav className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
        <div className="text-lg font-medium tracking-tight">
          memo<span className="text-emerald-600">repe</span>
        </div>
        <div className="flex gap-3 items-center">
          <span className="text-sm text-gray-500 cursor-pointer">Explorar</span>
          <LoginButton />
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-2xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl font-medium tracking-tight text-gray-900 leading-tight mb-4">
          Estudiá menos.<br />
          <span className="text-emerald-600">Aprendé más.</span>
        </h1>
        <p className="text-lg text-gray-500 mb-10 leading-relaxed">
          Memorepe usa repetición espaciada para mostrarte exactamente lo que necesitás repasar, justo cuando lo necesitás.
        </p>
        <div className="flex gap-3 justify-center">
          <LoginButton label="Empezar gratis con Google" primary />
          <button className="px-5 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">
            Explorar quizzes
          </button>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-3 mx-6 border border-gray-100 rounded-xl overflow-hidden mb-16">
        <div className="py-6 text-center border-r border-gray-100">
          <div className="text-2xl font-medium text-gray-900">12.4k</div>
          <div className="text-xs text-gray-400 mt-1">Quizzes públicos</div>
        </div>
        <div className="py-6 text-center border-r border-gray-100">
          <div className="text-2xl font-medium text-gray-900">84k</div>
          <div className="text-xs text-gray-400 mt-1">Estudiantes</div>
        </div>
        <div className="py-6 text-center">
          <div className="text-2xl font-medium text-gray-900">2.1M</div>
          <div className="text-xs text-gray-400 mt-1">Preguntas respondidas</div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-2xl mx-auto px-6 mb-20">
        <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-2">Por qué Memorepe</p>
        <h2 className="text-2xl font-medium text-gray-900 mb-2">No es un testeador. Es un sistema de aprendizaje.</h2>
        <p className="text-gray-500 text-sm mb-8">La diferencia está en qué pasa después de que respondés.</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-gray-100 rounded-xl p-5">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg mb-3"></div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">Repetición espaciada</h3>
            <p className="text-xs text-gray-400 leading-relaxed">El algoritmo decide qué repasar hoy según tu historial.</p>
          </div>
          <div className="border border-gray-100 rounded-xl p-5">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg mb-3"></div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">Tu progreso real</h3>
            <p className="text-xs text-gray-400 leading-relaxed">Sabés exactamente qué dominás y qué necesitás reforzar.</p>
          </div>
          <div className="border border-gray-100 rounded-xl p-5">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg mb-3"></div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">Comunidad</h3>
            <p className="text-xs text-gray-400 leading-relaxed">Miles de quizzes creados por estudiantes como vos.</p>
          </div>
          <div className="border border-gray-100 rounded-xl p-5">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg mb-3"></div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">Logros y rachas</h3>
            <p className="text-xs text-gray-400 leading-relaxed">XP, niveles y logros que reflejan tu aprendizaje real.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-5 flex justify-between items-center">
        <div className="text-sm font-medium text-gray-400">
          memo<span className="text-emerald-500">repe</span>
        </div>
        <div className="flex gap-4 text-xs text-gray-300">
          <span>Términos</span>
          <span>Privacidad</span>
          <span>Contacto</span>
        </div>
      </footer>

    </main>
  )
}