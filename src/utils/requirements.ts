export type Requirements = { required: string[]; preferred: string[] };

const clean = (name: string) => name.split(/\s+/).filter(Boolean).join(" ").slice(0, 60);
const has = (list: string[], name: string) => list.some((n) => n.toLowerCase() === name.toLowerCase());

/** Add a technology to one list, removing it from the other so it is never both required and preferred. */
export function addRequirement(lists: Requirements, raw: string, to: keyof Requirements): Requirements {
  const name = clean(raw);
  if (!name) return lists;
  const other = to === "required" ? "preferred" : "required";
  const target = has(lists[to], name) ? lists[to] : [...lists[to], name].slice(0, 25);
  return { ...lists, [to]: target, [other]: lists[other].filter((n) => n.toLowerCase() !== name.toLowerCase()) } as Requirements;
}

export function removeRequirement(lists: Requirements, name: string): Requirements {
  const keep = (list: string[]) => list.filter((n) => n.toLowerCase() !== name.toLowerCase());
  return { required: keep(lists.required), preferred: keep(lists.preferred) };
}

/** Move a technology between required and preferred. */
export function toggleImportance(lists: Requirements, name: string): Requirements {
  return addRequirement(lists, name, has(lists.required, name) ? "preferred" : "required");
}
