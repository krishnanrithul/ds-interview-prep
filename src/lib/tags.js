import data from '../data/tags.json'

export const TAGS = data.tags
export const TAG_BY_ID = Object.fromEntries(TAGS.map((t) => [t.id, t]))
export const tagLabel = (id) => TAG_BY_ID[id]?.label || id
