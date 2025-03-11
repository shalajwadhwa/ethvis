import { Transaction } from "@/app/types/transaction";
import { Alchemy, Network, AlchemySubscription } from "alchemy-sdk"
import eventEmitter from "@/app/lib/EventEmitter";
import { EventType } from "@/app/types/event";
import { AddressInfoResponse } from "@/app/types/graph";
import { MinedTransactionResponse } from "@/app/types/response";
import GraphHandler from "@/app/lib/GraphHandler";

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
        this.alchemy.ws.off({ method: AlchemySubscription.PENDING_TRANSACTIONS });
        console.log('Unsubscribed from pending transactions');
    }

    public subscribeToMinedTransactions() {
        console.log('Attempting to subscribe to mined transactions...');
        this.alchemy.ws.on(
            {
                method: AlchemySubscription.MINED_TRANSACTIONS
            },
            (response) => {
                eventEmitter.emit(EventType.NewMinedTransaction, response as MinedTransactionResponse);
            }
        );
        console.log('Subscribed to mined transactions');
    }

    public unsubscribeFromMinedTransactions() {
        this.alchemy.ws.off({ method: AlchemySubscription.MINED_TRANSACTIONS });
        console.log('Unsubscribed from mined transactions');
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

    // todo: refactor into smaller functions
    public getBlocksFromDates(startDate: string, endDate: string): void {
        const options = {method: 'GET', headers: {accept: 'application/json'}};
        
        const startPromise = fetch(`https://api.g.alchemy.com/data/v1/${ALCHEMY_API_KEY}/utility/blocks/by-timestamp?networks=eth-mainnet&timestamp=${startDate}&direction=BEFORE`, options)
            .then(res => res.json())
            .then(res => {
                console.log("Start block response:", res, res.data[0].block.number);
                if (!res || (!res.data && !res.data[0] && !res.data[0].block && !res.data[0].blockNumber)) {
                    throw new Error("Could not determine start block from API response");
                }
                return parseInt(res.data[0].block.number);
            });
            
        const endPromise = fetch(`https://api.g.alchemy.com/data/v1/${ALCHEMY_API_KEY}/utility/blocks/by-timestamp?networks=eth-mainnet&timestamp=${endDate}&direction=AFTER`, options)
            .then(res => res.json())
            .then(res => {
                console.log("End block response:", res, res.data[0].block.number);
                if (!res || (!res.data && !res.data[0] && !res.data[0].block && !res.data[0].blockNumber)) {
                    throw new Error("Could not determine end block from API response");
                }
                return parseInt(res.data[0].block.number);
            });
        
        Promise.all([startPromise, endPromise])
            .then(async ([start, end]) => {
                if (!start || !end) {
                    console.error("Invalid block range: start or end block is undefined");
                    return;
                }
                
                if (end <= start) {
                    console.error("Invalid block range: end block must be greater than start block");
                    return;
                }

                console.log(`Processing blocks from ${start} to ${end}`);
                
                const blockCount = end - start;
                if (blockCount > 1000) {
                    console.warn(`Large block range (${blockCount} blocks) may cause performance issues`);
                }
                
                for (let i = start; i < end; i++) {
                    await this.alchemy.core.getBlockWithTransactions(i)
                        .then(block => {
                            if (block && block.transactions) {
                                console.log(`Emitting ${block.transactions.length} transactions from block ${i}`);
                                block.transactions.forEach(async transaction => {
                                    await GraphHandler.getInstance().updateGraph(transaction as unknown as Transaction);
                                });
                            }
                        })
                        .catch(error => console.log(`Error fetching block ${i}:`, error));

                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            })
    }
}

export default EthereumApiClient;