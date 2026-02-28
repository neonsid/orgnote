import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

export function useHasPassword(enabled: boolean) {
  return useQuery({
    queryKey: ["user", "password-check"],
    queryFn: async () => {
      const result = await authClient.listAccounts();
      if (!result.data) return false;
      return result.data.some((account) => account.providerId === "credential");
    },
    enabled,
  });
}
