type PuterAuth = {
  isSignedIn: () => boolean;
  signIn: () => Promise<void>;
};

type PuterKV = {
  set: (key: string, value: unknown) => Promise<void>;
  get: (key: string) => Promise<unknown>;
};

type PuterFSReadResult = {
  text: () => Promise<string>;
};

type PuterFS = {
  write: (path: string, content: string | Blob) => Promise<unknown>;
  read: (path: string) => Promise<PuterFSReadResult>;
};

type PuterAI = {
  chat: (prompt: string, options?: Record<string, unknown>) => Promise<unknown>;
};

type PuterHosting = {
  create: (subdomain: string, dirPath: string) => Promise<{ subdomain: string }>;
};

export type Puter = {
  auth?: PuterAuth;
  kv?: PuterKV;
  fs?: PuterFS;
  ai?: PuterAI;
  hosting?: PuterHosting;
};

declare global {
  interface Window {
    puter: Puter;
  }
}
export {};
