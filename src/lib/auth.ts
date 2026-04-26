import { auth, currentUser } from "@clerk/nextjs/server";

export function hasClerkEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
  );
}

export function isClerkKeylessMode() {
  return !hasClerkEnv();
}

export async function getClerkUserId() {
  try {
    const session = await auth();
    return session.userId ?? null;
  } catch {
    return null;
  }
}

export async function getClerkSessionClaims() {
  try {
    const session = await auth();
    return session.sessionClaims ?? null;
  } catch {
    return null;
  }
}

export async function getClerkUser() {
  try {
    return await currentUser();
  } catch {
    return null;
  }
}
