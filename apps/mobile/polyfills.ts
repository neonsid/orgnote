if (typeof globalThis.SharedArrayBuffer === "undefined") {
  Object.defineProperty(globalThis, "SharedArrayBuffer", {
    value: ArrayBuffer,
    configurable: true,
  });
}

const stringProto = String.prototype as String & {
  toWellFormed?: () => string;
  isWellFormed?: () => boolean;
};

if (typeof stringProto.toWellFormed !== "function") {
  Object.defineProperty(String.prototype, "toWellFormed", {
    value: function toWellFormed(this: string) {
      return String(this);
    },
    configurable: true,
    writable: true,
  });
}

if (typeof stringProto.isWellFormed !== "function") {
  Object.defineProperty(String.prototype, "isWellFormed", {
    value: function isWellFormed(this: string) {
      return true;
    },
    configurable: true,
    writable: true,
  });
}

const arrayBufferProto = ArrayBuffer.prototype as ArrayBuffer & {
  byteLength: number;
};
const sharedArrayBufferCtor = globalThis.SharedArrayBuffer as
  | typeof SharedArrayBuffer
  | undefined;

const ensureGetter = (target: object, property: string, get: () => unknown) => {
  if (!Object.getOwnPropertyDescriptor(target, property)) {
    Object.defineProperty(target, property, {
      get,
      configurable: true,
    });
  }
};

ensureGetter(arrayBufferProto, "resizable", () => false);
ensureGetter(arrayBufferProto, "maxByteLength", () => arrayBufferProto.byteLength);

if (sharedArrayBufferCtor?.prototype) {
  const sharedProto = sharedArrayBufferCtor.prototype as SharedArrayBuffer & {
    byteLength: number;
  };
  ensureGetter(sharedProto, "growable", () => false);
  ensureGetter(sharedProto, "maxByteLength", () => sharedProto.byteLength);
}
