import { createContext, type Context } from "react";

type Registry = Map<string, Context<unknown>>;
const holder = globalThis as typeof globalThis & { __devzgoContexts?: Registry };
const registry: Registry = (holder.__devzgoContexts ??= new Map());

/**
 * createContext that returns the same object every time the module is evaluated. In development,
 * hot reload can load a second copy of a provider's module; a fresh context would leave pages that
 * import the new copy outside the provider already on screen.
 */
export function stableContext<T>(key: string, initial: T): Context<T> {
  const existing = registry.get(key);
  if (existing) return existing as Context<T>;
  const created = createContext<T>(initial);
  created.displayName = key;
  registry.set(key, created as Context<unknown>);
  return created;
}
