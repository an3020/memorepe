export default async function EditarQuiz({ params }) {
  const { id } = await params

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Quiz creado correctamente</h1>
      <p style={{ color: '#059669' }}>ID: {id}</p>
      <p style={{ color: '#6b7280', fontSize: '14px' }}>Acá van a ir las preguntas.</p>
    </div>
  )
}