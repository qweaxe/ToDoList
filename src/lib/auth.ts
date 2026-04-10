// Re-export auth function for server components
// In next-auth v5, call: const session = await auth()
export { auth, signIn, signOut } from "@/auth";

// Helper function for getting session (deprecated, use auth() directly)
export const getAuthSession = async () => {
  const { auth } = await import("@/auth");
  return auth();
};
