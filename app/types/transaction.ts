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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapTransaction(tx: any): Transaction {
    return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        gas: tx.gas,
        gasPrice: tx.gasPrice,
        input: tx.input,
        nonce: tx.nonce,
        blockHash: tx.blockHash,
        blockNumber: tx.blockNumber,
        transactionIndex: tx.transactionIndex,
        v: tx.v,
        r: tx.r,
        s: tx.s
    } as Transaction;
}