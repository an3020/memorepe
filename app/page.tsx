import { supabase } from '@/lib/supabase'

export default async function Home() {
  const { data, error } = await supabase.from('quizzes').select('*')

  return (
    <main style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>Memorepe</h1>
      {error ? (
        <p style={{ color: 'red' }}>Error: {error.message}</p>
      ) : (
        <p style={{ color: 'green' }}>Base de datos conectada. Tablas listas.</p>
      )}
    </main>
  )
}