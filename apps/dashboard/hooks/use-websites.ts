'use client';

import { authClient } from '@databuddy/auth/client';
import type { AppRouter } from '@databuddy/rpc';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { trpc } from '@/lib/trpc';

type RouterInput = inferRouterInputs<AppRouter>;
type RouterOutput = inferRouterOutputs<AppRouter>;

export type Website = RouterOutput['websites']['list'][number];
export type CreateWebsiteData = RouterInput['websites']['create'];
export type UpdateWebsiteData = RouterInput['websites']['update'];

export function useWebsites() {
  const { data: activeOrganization, isPending: isLoadingOrganization } =
    authClient.useActiveOrganization();

  const { data, isLoading, isError, refetch } = trpc.websites.list.useQuery(
    { organizationId: activeOrganization?.id },
    { enabled: !isLoadingOrganization }
  );

  return {
    websites: data || [],
    isLoading: isLoading || isLoadingOrganization,
    isError,
    refetch,
  };
}

export function useWebsite(id: string) {
  return trpc.websites.getById.useQuery({ id }, { enabled: !!id });
}

export function useCreateWebsite() {
  const utils = trpc.useUtils();
  return trpc.websites.create.useMutation({
    onMutate: async (newWebsite) => {
      const queryKey = {
        organizationId: newWebsite.organizationId ?? undefined,
      };
      await utils.websites.list.cancel(queryKey);
      const previousWebsites = utils.websites.list.getData(queryKey);

      utils.websites.list.setData(queryKey, (old) => {
        const optimisticWebsite = {
          ...newWebsite,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        } as Website;
        return old ? [...old, optimisticWebsite] : [optimisticWebsite];
      });

      return { previousWebsites, queryKey };
    },
    onError: (err, newWebsite, context) => {
      if (context?.previousWebsites) {
        utils.websites.list.setData(context.queryKey, context.previousWebsites);
      }
    },
    onSettled: (data, error, variables, context) => {
      utils.websites.list.invalidate(context?.queryKey);
    },
  });
}

export function useUpdateWebsite() {
  const utils = trpc.useUtils();
  return trpc.websites.update.useMutation({
    onMutate: async (updatedWebsite) => {
      const getByIdKey = { id: updatedWebsite.id };
      await utils.websites.getById.cancel(getByIdKey);
      const previousWebsite = utils.websites.getById.getData(getByIdKey);

      const listKey = {
        organizationId: previousWebsite?.organizationId ?? undefined,
      };
      await utils.websites.list.cancel(listKey);
      const previousWebsites = utils.websites.list.getData(listKey);

      utils.websites.list.setData(listKey, (old) =>
        old?.map((website) =>
          website.id === updatedWebsite.id
            ? { ...website, ...updatedWebsite }
            : website
        )
      );
      utils.websites.getById.setData(getByIdKey, (old) =>
        old ? { ...old, ...updatedWebsite } : undefined
      );

      return { previousWebsites, previousWebsite, listKey };
    },
    onError: (err, updatedWebsite, context) => {
      if (context?.previousWebsites && context.listKey) {
        utils.websites.list.setData(context.listKey, context.previousWebsites);
      }
      if (context?.previousWebsite) {
        utils.websites.getById.setData(
          { id: updatedWebsite.id },
          context.previousWebsite
        );
      }
    },
    onSettled: (data, error, variables, context) => {
      utils.websites.list.invalidate(context?.listKey);
      if (data) {
        utils.websites.getById.invalidate({ id: data.id });
      }
    },
  });
}

export function useDeleteWebsite() {
  const utils = trpc.useUtils();
  return trpc.websites.delete.useMutation({
    onMutate: async ({ id }) => {
      const getByIdKey = { id };
      await utils.websites.getById.cancel(getByIdKey);
      const previousWebsite = utils.websites.getById.getData(getByIdKey);

      const listKey = {
        organizationId: previousWebsite?.organizationId ?? undefined,
      };
      await utils.websites.list.cancel(listKey);
      const previousWebsites = utils.websites.list.getData(listKey);

      utils.websites.list.setData(
        listKey,
        (old) => old?.filter((w) => w.id !== id) ?? []
      );
      utils.websites.getById.setData(getByIdKey, undefined);

      return { previousWebsites, previousWebsite, listKey };
    },
    onError: (err, { id }, context) => {
      if (context?.previousWebsites && context.listKey) {
        utils.websites.list.setData(context.listKey, context.previousWebsites);
      }
      if (context?.previousWebsite) {
        utils.websites.getById.setData({ id }, context.previousWebsite);
      }
    },
    onSettled: (data, error, { id }, context) => {
      utils.websites.list.invalidate(context?.listKey);
      utils.websites.getById.invalidate({ id });
    },
  });
}
