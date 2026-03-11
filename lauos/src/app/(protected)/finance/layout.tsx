import React from 'react'
import { FinanceSubNav } from './finance-sub-nav'

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <FinanceSubNav />
      {children}
    </div>
  )
}
