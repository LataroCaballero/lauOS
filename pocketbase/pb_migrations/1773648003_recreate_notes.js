/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Delete whatever broken version exists
  try {
    const old = app.findCollectionByNameOrId("notes")
    app.delete(old)
  } catch (_) {
    // didn't exist — fine
  }

  // Recreate with correct schema
  const collection = new Collection({
    name: "notes",
    type: "base",
    listRule:   "@request.auth.id != '' && user = @request.auth.id",
    viewRule:   "@request.auth.id != '' && user = @request.auth.id",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != '' && user = @request.auth.id",
    deleteRule: "@request.auth.id != '' && user = @request.auth.id",
    fields: [
      {
        type: "relation",
        name: "user",
        required: true,
        maxSelect: 1,
        collectionId: "_pb_users_auth_",
        cascadeDelete: true,
      },
      {
        type: "text",
        name: "title",
        required: true,
        max: 500,
      },
      {
        type: "text",
        name: "body",
        required: false,
        max: 100000,
      },
      {
        type: "autodate",
        name: "created_at",
        onCreate: true,
        onUpdate: false,
      },
    ],
  })

  return app.save(collection)
}, (app) => {
  try {
    app.delete(app.findCollectionByNameOrId("notes"))
  } catch (_) {}
})
