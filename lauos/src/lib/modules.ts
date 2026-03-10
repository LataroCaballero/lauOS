import { Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type Module = {
  id: string
  name: string
  description: string
  Icon: LucideIcon
  href: string
}

export const MODULES: Module[] = [
  {
    id: 'finance',
    name: 'Finanzas',
    description: 'Cuentas, transacciones y resumen financiero',
    Icon: Wallet,
    href: '/finance',
  },
]
