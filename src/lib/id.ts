import { customAlphabet } from "nanoid";

const publicIdGenerator = customAlphabet("23456789abcdefghijkmnpqrstuvwxyz", 12);

export function createPublicId() {
  return publicIdGenerator();
}
