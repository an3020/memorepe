// Las pantallas de estudio (incluido el modo invitado) no se indexan en Google:
// la página pública de cada banco es /q/[slug]. 'follow' deja que Google siga los links.
export const metadata = {
  robots: { index: false, follow: true },
}

export default function EstudiarLayout({ children }) {
  return children
}
