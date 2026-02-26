export type Business = {
  id: string;
  name: string;
  address: string;
  type: string;
  createdTime: string;
  buildingId: string;
  customerId: string;
  userIds: string[];
};

export interface BusinessState {
  loading: boolean;
  error: string | null;

  selectedBusinessId: string | null;

  businesses: Business[];
}