import { create } from 'zustand';
import type {
  CampaignSortOption,
  CampaignStatus,
} from '@/features/campaigns/lib/dto';

type CampaignFilterState = {
  status: CampaignStatus | 'all';
  sort: CampaignSortOption;
  location: string;
  category: string;
  page: number;
  pageSize: number;
};

type CampaignFilterActions = {
  setStatus: (status: CampaignFilterState['status']) => void;
  setSort: (sort: CampaignSortOption) => void;
  setLocation: (location: string) => void;
  setCategory: (category: string) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  reset: () => void;
};

const initialState: CampaignFilterState = {
  status: 'recruiting',
  sort: 'recent',
  location: '',
  category: '',
  page: 1,
  pageSize: 12,
};

export const useCampaignFilterStore = create<
  CampaignFilterState & CampaignFilterActions
>((set) => ({
  ...initialState,
  setStatus: (status) =>
    set((state) => ({
      status,
      page: status === state.status ? state.page : 1,
    })),
  setSort: (sort) =>
    set({
      sort,
    }),
  setLocation: (location) =>
    set({
      location,
      page: 1,
    }),
  setCategory: (category) =>
    set({
      category,
      page: 1,
    }),
  setPage: (page) =>
    set({
      page: page < 1 ? 1 : page,
    }),
  setPageSize: (pageSize) =>
    set({
      pageSize,
      page: 1,
    }),
  reset: () => set(initialState),
}));
