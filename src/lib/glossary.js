import data from '../data/glossary.json'

export const GLOSSARY = Object.fromEntries(data.terms.map((t) => [t.id, t]))
