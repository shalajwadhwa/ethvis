import { Transaction } from "../VisualisationTypes";
import { Alchemy, Network, AlchemySubscription } from "alchemy-sdk"

const INFURA_URL = process.env.INFURA_URL;
const INFURA_WS_URL = process.env.INFURA_WS_URL;

const ALCHEMY_WS_URL = process.env.ALCHEMY_WS_URL;
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

class EthereumApiClient {
    private alchemy: Alchemy;

    constructor() {
        const settings = {
            apiKey: ALCHEMY_API_KEY,
            network: Network.ETH_MAINNET,
          };

        this.alchemy = new Alchemy(settings);
    }

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

    public subscribeToPendingTransactions(onNewTransactions: (transactions: Transaction) => void) {
        console.log('Attempting to subscribe to pending transactions...');

        this.alchemy.ws.on(
            {
                method: AlchemySubscription.PENDING_TRANSACTIONS
            },
            (transaction) => {
              onNewTransactions(this.mapTransaction(transaction));
            }
          );

        console.log('Subscribed to pending transactions');
    }

    public unsubscribeFromPendingTransactions() {
        this.alchemy.ws.off({});
        console.log('Unsubscribed from pending transactions');
    }
}

export default EthereumApiClient;