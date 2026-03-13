export type Module = {
  id: string
  name: string
  description: string
  icon: string
  href: string
}

export const MODULES: Module[] = [
  {
    id: 'finance',
    name: 'Finanzas',
    description: 'Cuentas, transacciones y resumen financiero',
    icon: 'Wallet',
    href: '/finance',
  },
  {
    id: 'notes',
    name: 'Notas',
    description: 'Diario personal con entradas en Markdown',
    icon: 'BookOpen',
    href: '/notes',
  },
]
