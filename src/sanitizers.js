const extract = (keys) => {
  const subExtract = (obj) =>
    Array.isArray(obj)
      ? obj.map(subExtract)
      : keys.reduce((sanitized, key) => ({ ...sanitized, [key]: obj[key] }), {})

  return subExtract
}

export const sanitizeUser = extract([
  "id",
  "firstName",
  "lastName",
  "email",
  "role",
])

export const sanitizeNavigationMenu = extract(["id", "name", "pagesId"])

export const sanitizePage = extract([
  "id",
  "title",
  "content",
  "creatorId",
  "modifiersIds",
  "publishedAt",
  "published",
])
