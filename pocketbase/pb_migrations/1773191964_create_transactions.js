/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const accountsCollection = app.findCollectionByNameOrId("accounts")
  const categoriesCollection = app.findCollectionByNameOrId("categories")

  const collection = new Collection({
    type: "base",
    name: "transactions",
    listRule: "@request.auth.id != '' && user = @request.auth.id",
    viewRule: "@request.auth.id != '' && user = @request.auth.id",
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
        cascadeDelete: false,
      },
      {
        type: "relation",
        name: "account",
        required: true,
        maxSelect: 1,
        collectionId: accountsCollection.id,
        cascadeDelete: false,
      },
      {
        type: "select",
        name: "type",
        required: true,
        maxSelect: 1,
        values: ["income", "expense", "transfer_in", "transfer_out"],
      },
      {
        type: "number",
        name: "amount_centavos",
        required: true,
        onlyInt: true,
        min: 1,
      },
      {
        type: "date",
        name: "date",
        required: true,
      },
      {
        type: "relation",
        name: "category",
        required: false,
        maxSelect: 1,
        collectionId: categoriesCollection.id,
        cascadeDelete: false,
      },
      {
        type: "text",
        name: "note",
        required: false,
        max: 300,
      },
      {
        type: "number",
        name: "exchange_rate_stored",
        required: false,
        onlyInt: true,
        min: 0,
      },
      {
        type: "text",
        name: "transfer_pair_id",
        required: false,
        max: 30,
      },
    ],
  })
  app.save(collection)
}, (app) => {
  app.delete(app.findCollectionByNameOrId("transactions"))
})
