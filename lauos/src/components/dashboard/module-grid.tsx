import { MODULES } from '@/lib/modules'
import ModuleCard from '@/components/dashboard/module-card'

type ModuleGridProps = {
  currentPath?: string
}

export default function ModuleGrid({ currentPath }: ModuleGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
      {MODULES.map((mod) => (
        <ModuleCard
          key={mod.id}
          module={mod}
          isActive={currentPath ? currentPath.startsWith(mod.href) : false}
        />
      ))}
    </div>
  )
}
