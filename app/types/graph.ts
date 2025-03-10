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

export type Attributes = {
  address: string;
  label?: Set<string>;
  name?: Set<string>;
  website?: Set<string>;
  symbol?: Set<string>;
  nameTag?: Set<string>;
  netBalance: number;
  isContract: boolean;
  numTransactions: number;
}

export type NodeType = {
  x: number;
  y: number;
  label: string;
  size: number;
  isContract: boolean;
};

export type EdgeType = { label: string };
