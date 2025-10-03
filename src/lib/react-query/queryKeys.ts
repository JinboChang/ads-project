export const queryKeys = {
  campaigns: {
    advertiser: {
      base: ['campaigns', 'advertiser', 'list'] as const,
      list: (params?: { status?: string | null }) =>
        ['campaigns', 'advertiser', 'list', params ?? {}] as const,
      detail: (campaignId: number | string) =>
        ['campaigns', 'advertiser', 'detail', String(campaignId)] as const,
    },
  },
  applications: {
    mine: (params?: { status?: string }) =>
      ['applications', 'mine', params ?? {}] as const,
  },
  mutations: {
    campaigns: {
      advertiser: {
        create: ['campaigns', 'advertiser', 'create'] as const,
        close: (campaignId: number | string) =>
          ['campaigns', 'advertiser', 'close', String(campaignId)] as const,
        approve: (campaignId: number | string) =>
          ['campaigns', 'advertiser', 'approve', String(campaignId)] as const,
        reopen: (campaignId: number | string) =>
          ['campaigns', 'advertiser', 'reopen', String(campaignId)] as const,
      },
    },
  },
} as const;

export type CampaignAdvertiserListKey = ReturnType<
  typeof queryKeys.campaigns.advertiser.list
>;

export type InfluencerApplicationsKey = ReturnType<
  typeof queryKeys.applications.mine
>;
