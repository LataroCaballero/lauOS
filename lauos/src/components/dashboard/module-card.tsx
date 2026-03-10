'use client'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import type { Module } from '@/lib/modules'
import { cn } from '@/lib/utils'

type ModuleCardProps = {
  module: Module
  isActive?: boolean
}

export default function ModuleCard({ module, isActive }: ModuleCardProps) {
  return (
    <Link
      href={module.href}
      data-testid={`module-card-${module.id}`}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
    >
      <Card
        className={cn(
          'h-full transition-transform hover:scale-[1.03] cursor-pointer',
          isActive && 'ring-2 ring-primary'
        )}
      >
        <CardContent className="flex flex-col gap-3 p-5">
          <module.Icon className="h-6 w-6 text-primary" />
          <div>
            <p className="font-semibold leading-tight">{module.name}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{module.description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
