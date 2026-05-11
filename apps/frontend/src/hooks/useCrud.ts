import { useState } from "react";
import { getErrorMessage } from "../lib/error";

export function useCrud(onSuccess: () => Promise<void>) {
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run<T>(operation: () => Promise<T>, errorMessage: string): Promise<T | undefined> {
    setIsMutating(true);
    setError(null);
    try {
      const result = await operation();
      await onSuccess();
      return result;
    } catch (err) {
      setError(getErrorMessage(err, errorMessage));
      return undefined;
    } finally {
      setIsMutating(false);
    }
  }

  return { isMutating, error, clearError: () => setError(null), run };
}
