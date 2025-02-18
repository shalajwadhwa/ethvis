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
}

export type AddressInfoResponse = AddressInfo[];