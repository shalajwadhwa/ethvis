export interface Transaction {
    hash: string;
    nonce: string;
    blockHash?: string;
    blockNumber?: string;
    transactionIndex?: string;
    from: string;
    to: string;
    value: string;
    gasPrice: string;
    gas: string;
    input: string;
    v?: string;
    r?: string;
    s?: string;
}