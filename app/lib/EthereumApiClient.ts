import { Alchemy, Network, AlchemySubscription } from "alchemy-sdk"
import { eventEmitter } from "@/app/lib/";
import { EventType, Transaction, MinedTransactionResponse, AddressInfoResponse } from "@/app/types/";

const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
const ETH_LABELS_URL = 'http://localhost:3001/labels/'

export class EthereumApiClient {
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

    public isCode(address: string): Promise<boolean | void> {
        return this.alchemy.core.getCode(address)
            .then(
                response => response !== '0x'
            )
            .catch(
                error => console.log("Error fetching code", error)
            );
    }

    public getInfo(address: string): Promise<AddressInfoResponse> {
        return fetch(`${ETH_LABELS_URL}${address}`)
            .then(
                response => response.json()
            )
            .catch(
                error => console.log("Error fetching address info", error)
            );
    }

    public async getTransactionsFromRange(startDate: string, endDate: string): Promise<void> {
        try {
            const [startBlock, endBlock] = await Promise.all([
                this.getBlockNumberFromTimestamp(startDate, 'BEFORE'),
                this.getBlockNumberFromTimestamp(endDate, 'AFTER')
            ]);
            
            if (!this.validateBlockRange(startBlock, endBlock)) {
                return;
            }
            
            for (let i = startBlock; i < endBlock; i++) {
                await this.processBlock(i);
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        } catch (error) {
            console.error("Error in getBlocksFromDates:", error);
        }
    }

    private async getBlockNumberFromTimestamp(timestamp: string, direction: 'BEFORE' | 'AFTER'): Promise<number> {
        const options = {method: 'GET', headers: {accept: 'application/json'}};
        const directionLabel = direction === 'BEFORE' ? 'Start' : 'End';
        
        try {
            const response = await fetch(
                `https://api.g.alchemy.com/data/v1/${ALCHEMY_API_KEY}/utility/blocks/by-timestamp?networks=eth-mainnet&timestamp=${timestamp}&direction=${direction}`, 
                options
            );
            
            const data = await response.json();
            
            if (!data || !data.data || !data.data[0] || !data.data[0].block || !data.data[0].block.number) {
                throw new Error(`Could not determine ${directionLabel.toLowerCase()} block from API response`);
            }
            
            return parseInt(data.data[0].block.number);
        } catch (error) {
            console.error(`Error fetching ${directionLabel.toLowerCase()} block:`, error);
            throw error;
        }
    }

    private validateBlockRange(start: number | undefined, end: number | undefined): boolean {
        if (!start || !end) {
            console.error("Invalid block range: start or end block is undefined");
            return false;
        }
        
        if (end <= start) {
            console.error("Invalid block range: end block must be greater than start block");
            return false;
        }
        
        const blockCount = end - start;
        if (blockCount > 1000) {
            console.warn(`Large block range (${blockCount} blocks) may cause performance issues`);
        }
        
        return true;
    }

    private async processBlock(blockNumber: number): Promise<void> {
        try {
            const block = await this.alchemy.core.getBlockWithTransactions(blockNumber);
            
            if (block && block.transactions) {
                console.log(`Emitting ${block.transactions.length} transactions from block ${blockNumber}`);
                
                for (const transaction of block.transactions) {
                    // TODO: replace with event
                    eventEmitter.emit("staticVisualisation", transaction as unknown as Transaction);
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            }
        } catch (error) {
            console.log(`Error fetching block ${blockNumber}:`, error);
        }
    }
}
