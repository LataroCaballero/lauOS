'use client'
import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
// Store wired in Plan 02-02
export default function ThemeToggle() {
  return (
    <Button variant="ghost" size="icon" data-testid="theme-toggle" aria-label="Toggle theme">
      <Sun className="h-4 w-4" />
    </Button>
  )
}
