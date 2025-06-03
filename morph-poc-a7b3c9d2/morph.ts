import { Morph } from "@runmorph/cloud";

if (!process.env.NEXT_PUBLIC_MORPH_PUBLIC_KEY) {
  throw new Error("NEXT_PUBLIC_MORPH_PUBLIC_KEY is not set");
}

if (!process.env.MORPH_SECRET_KEY) {
  throw new Error("MORPH_SECRET_KEY is not set");
}

const morph = Morph({
  publicKey: process.env.NEXT_PUBLIC_MORPH_PUBLIC_KEY,
  secretKey: process.env.MORPH_SECRET_KEY,
});

export { morph };
