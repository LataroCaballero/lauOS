/// <reference path="../pb_data/types.d.ts" />

onRecordAfterCreateSuccess((e) => {
  try {
    const categoriesCollection = e.app.findCollectionByNameOrId("categories")

    const defaults = [
      { name: "Vivienda",         icon: "🏠", color: "#6366f1" },
      { name: "Alimentación",     icon: "🛒", color: "#22c55e" },
      { name: "Transporte",       icon: "🚗", color: "#f59e0b" },
      { name: "Salud",            icon: "💊", color: "#ef4444" },
      { name: "Sueldo",           icon: "💼", color: "#3b82f6" },
      { name: "Entretenimiento",  icon: "🎮", color: "#a855f7" },
      { name: "Educación",        icon: "📚", color: "#14b8a6" },
      { name: "Ropa",             icon: "👕", color: "#f97316" },
      { name: "Servicios",        icon: "⚡", color: "#64748b" },
      { name: "Otros",            icon: "📦", color: "#94a3b8" },
    ]

    for (const cat of defaults) {
      const record = new Record(categoriesCollection)
      record.set("user", e.record.id)
      record.set("name", cat.name)
      record.set("icon", cat.icon)
      record.set("color", cat.color)
      e.app.save(record)
    }
  } catch (err) {
    // Log but don't block user creation if categories collection is missing
    console.error("seed_categories hook error:", err)
  }

  e.next()
}, "users")
