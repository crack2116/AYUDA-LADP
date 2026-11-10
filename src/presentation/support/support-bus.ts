type OpenListener = () => void;

const listeners = new Set<OpenListener>();

/** Lets any route (including /login) open the floating support chat. */
export function requestOpenSupportChat(): void {
  for (const listener of [...listeners]) {
    listener();
  }
}

export function subscribeOpenSupportChat(listener: OpenListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
