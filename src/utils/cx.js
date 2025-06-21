// simple class‑name merger
export function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}
