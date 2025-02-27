export type AddressInfo = {
  chainId?: string;
  address?: string;
  label?: string;
  name?: string;
  website?: string;
  symbol?: string;
  nameTag?: string;
  offset?: string;
  limit?: string;
  isContract?: boolean;
  netBalance?: number;
};

export type AddressInfoResponse = AddressInfo[];

export type NodeType = {
  x: number;
  y: number;
  label: string;
  size: number;
  isContract: boolean;
};

export type EdgeType = { label: string };
