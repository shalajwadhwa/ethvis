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
  x?: number;
  y?: number;
  address: string;
  label?: Set<string>;
  name?: Set<string>;
  website?: Set<string>;
  symbol?: Set<string>;
  nameTag?: Set<string>;
  netBalance: number;
  isContract: boolean;
  numTransactions: number;
  size?: number;
  color?: string;
  type?: string;
  highlighted?: boolean;
}

export type EdgeType = { 
  label?: string;
  color: string;
  pendingTx: string[];
  minedTx: string[];
  containsRejectedTx?: boolean;
};
