import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Decision } from "@/types/app";
import { useAuth } from "./useAuth";
import { decisionService } from "@/lib/supabase-backend";

export const useDecisions = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!profile?.uid) return;

    const unsubscribe = decisionService.watchByUser(profile.uid, (decisions) => {
      queryClient.setQueryData(["decisions", profile.uid], decisions);
    });

    return () => {
      unsubscribe();
    };
  }, [profile?.uid, queryClient]);

  return useQuery({
    queryKey: ["decisions", profile?.uid],
    queryFn: async () => {
      if (!profile?.uid) return [];
      return decisionService.fetchByUser(profile.uid);
    },
    enabled: !!profile?.uid,
    staleTime: 5 * 60 * 1000, // 5min
  });
};

export const useCreateDecision = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newDecision: Omit<Decision, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!profile?.uid) {
        throw new Error("You must be logged in to create a decision.");
      }

      return decisionService.create(profile.uid, newDecision);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["decisions", profile?.uid] }),
  });
};

export const useUpdateDecision = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Omit<Decision, "id" | "createdAt">> }) => {
      if (!profile?.uid) {
        throw new Error("You must be logged in to update a decision.");
      }

      await decisionService.update(profile.uid, id, updates);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["decisions", profile?.uid] }),
  });
};

export const useDeleteDecision = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!profile?.uid) {
        throw new Error("You must be logged in to delete a decision.");
      }

      await decisionService.remove(profile.uid, id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["decisions", profile?.uid] }),
  });
};

