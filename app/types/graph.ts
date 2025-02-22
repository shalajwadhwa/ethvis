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
};

export type AddressInfoResponse = AddressInfo[];

export type NodeType = {
  x: number;
  y: number;
  label: string;
  size: number;
  data: { any };
};

export type EdgeType = { label: string };
