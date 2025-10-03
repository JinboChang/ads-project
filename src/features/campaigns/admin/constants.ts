export const advertiserCampaignsApiPath = '/api/advertisers/campaigns' as const;

export const buildAdvertiserCampaignDetailPath = (
  campaignId: number | string,
) => `${advertiserCampaignsApiPath}/${campaignId}`;

export const buildAdvertiserCampaignClosePath = (
  campaignId: number | string,
) => `${buildAdvertiserCampaignDetailPath(campaignId)}/close`;

export const buildAdvertiserCampaignApprovePath = (
  campaignId: number | string,
) => `${buildAdvertiserCampaignDetailPath(campaignId)}/approve`;

export const buildAdvertiserCampaignReopenPath = (
  campaignId: number | string,
) => `${buildAdvertiserCampaignDetailPath(campaignId)}/reopen`;
