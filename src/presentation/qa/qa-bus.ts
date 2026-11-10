export type QaInjection = "negative-hogares" | "future-fecha" | "empty-form";

type QaListener = (injection: QaInjection) => void;

const listeners = new Set<QaListener>();

/** The QA bar emits; the incident form subscribes. No prop drilling. */
export function emitQaInjection(injection: QaInjection): void {
  for (const listener of [...listeners]) {
    listener(injection);
  }
}

export function subscribeQaInjection(listener: QaListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
