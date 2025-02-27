import { Transaction } from "../types/transaction";
import { Alchemy, Network, AlchemySubscription } from "alchemy-sdk"
import eventEmitter from "./EventEmitter";
import { EventType } from "../types/event";
import { AddressInfoResponse } from "../types/graph";

const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
const ETH_LABELS_URL = 'http://localhost:3001/labels/'

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

    public subscribeToPendingTransactions() {
        console.log('Attempting to subscribe to pending transactions...');

        this.alchemy.ws.on(
            {
                method: AlchemySubscription.PENDING_TRANSACTIONS
            },
            (transaction) => {
              eventEmitter.emit(EventType.NewPendingTransaction, transaction as Transaction);
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

    public getInfo(address: string): Promise<AddressInfoResponse> {
        console.log('Fetching address info for', address);
        return fetch(`${ETH_LABELS_URL}${address}`)
            .then(
                response => response.json()
            )
            .catch(
                error => console.log("Error fetching address info", error)
            );
    }
}

export default EthereumApiClient;