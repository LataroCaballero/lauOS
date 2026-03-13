'use client'
import Link from 'next/link'
import * as Icons from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import type { Module } from '@/lib/modules'
import { cn } from '@/lib/utils'

type ModuleCardProps = {
  module: Module
  isActive?: boolean
}

export default function ModuleCard({ module, isActive }: ModuleCardProps) {
  const Icon = (Icons[module.icon as keyof typeof Icons] as React.ComponentType<LucideProps>) ?? Icons.Box

  return (
    <Link
      href={module.href}
      data-testid={`module-card-${module.id}`}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl"
    >
      <div
        className={cn(
          'frosted-glass group h-full rounded-2xl p-5 transition-all duration-200',
          'hover:-translate-y-0.5',
          isActive && '!border-primary/50'
        )}
      >
        <div className="flex flex-col gap-4">
          <div className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
            'bg-primary/15 text-primary group-hover:bg-primary/25'
          )}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-base leading-tight">{module.name}</p>
            <p className="text-sm text-muted-foreground mt-1 leading-snug">{module.description}</p>
          </div>
        </div>
      </div>
    </Link>
  )
}
