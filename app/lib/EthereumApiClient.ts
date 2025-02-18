import { Transaction } from "../types/transaction";
import { Alchemy, Network, AlchemySubscription } from "alchemy-sdk"
import eventEmitter from "./EventEmitter";
import { EventType } from "../types/event";

const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

class EthereumApiClient {
    private static instance: EthereumApiClient;
    private alchemy: Alchemy;

    constructor() {
        const settings = {
            apiKey: ALCHEMY_API_KEY,
            network: Network.ETH_MAINNET,
          };

        this.alchemy = new Alchemy(settings);
    }

    public static getInstance(): EthereumApiClient {
        if (!EthereumApiClient.instance) {
            EthereumApiClient.instance = new EthereumApiClient();
        }

        return EthereumApiClient.instance;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private mapTransaction(tx: any): Transaction {
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

    public subscribeToPendingTransactions() {
        console.log('Attempting to subscribe to pending transactions...');

        this.alchemy.ws.on(
            {
                method: AlchemySubscription.PENDING_TRANSACTIONS
            },
            (transaction) => {
              eventEmitter.emit(EventType.NewPendingTransaction, this.mapTransaction(transaction));
            }
          );

        console.log('Subscribed to pending transactions');
    }

    public unsubscribeFromPendingTransactions() {
        this.alchemy.ws.off({});
        console.log('Unsubscribed from pending transactions');
    }

    public isCode(address: string): Promise<string> {
        return this.alchemy.core.getCode(address);
    }
}

export default EthereumApiClient;