import eventEmitter from "@/app/lib/EventEmitter";
import { EventType, Transaction, MinedTransactionResponse, AddressInfoResponse } from "@/app/lib/types";
import { io, Socket } from "socket.io-client";

class EthereumApiClient {
    private static instance: EthereumApiClient;
    private halt: boolean = false;
    private socket: Socket | null = null;

    constructor() {
        const socketUrl = process.env.NEXT_PUBLIC_ETHVIS;
        console.log(`Initializing Socket.IO client connecting to: ${socketUrl}`);
        
        this.socket = io(socketUrl, {
            path: '/api/socketio',
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        this.socket.on('connect', () => {
            console.log('Connected to Socket.IO server with ID:', this.socket?.id);
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket.IO connection error:', error);
        });

        this.socket.on('newPendingTransaction', (transaction) => {
            console.log('Received pending transaction');
            eventEmitter.emit(EventType.NewPendingTransaction, transaction as Transaction);
        });

        this.socket.on('newMinedTransaction', (response) => {
            console.log('Received mined transaction');
            eventEmitter.emit(EventType.NewMinedTransaction, response as MinedTransactionResponse);
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from Socket.IO server');
        });
    }

    public static getInstance(): EthereumApiClient {
        if (!EthereumApiClient.instance) {
            EthereumApiClient.instance = new EthereumApiClient();
        }

        return EthereumApiClient.instance;
    }

    public setHalt(halt: boolean) {
        this.halt = halt;
    }

    public subscribeToPendingTransactions() {
        if (this.socket && this.socket.connected) {
            this.socket.emit('subscribeToPendingTransactions');
            console.log('Subscribed to pending transactions');
        } else {
            console.error('Socket not connected, cannot subscribe to pending transactions');
        }
    }

    public unsubscribeFromPendingTransactions() {
        if (this.socket && this.socket.connected) {
            this.socket.emit('unsubscribeFromPendingTransactions');
            console.log('Unsubscribed from pending transactions');
        }
    }

    public subscribeToMinedTransactions() {
        if (this.socket && this.socket.connected) {
            this.socket.emit('subscribeToMinedTransactions');
            console.log('Subscribed to mined transactions');
        } else {
            console.error('Socket not connected, cannot subscribe to mined transactions');
        }
    }

    public unsubscribeFromMinedTransactions() {
        if (this.socket && this.socket.connected) {
            this.socket.emit('unsubscribeFromMinedTransactions');
            console.log('Unsubscribed from mined transactions');
        }
    }

    public isCode(address: string): Promise<boolean | void> {
        return fetch(`/api/ethereum?action=isCode&address=${address}`)
            .then(response => response.json())
            .then(data => data.isCode)
            .catch(error => {
                console.log("Error fetching code", error);
                return false;
            });
    }

    public getInfo(address: string): Promise<AddressInfoResponse> {
        return fetch(`/api/ethereum?action=addressInfo&address=${address}`)
            .then(response => response.json())
            .catch(error => {
                console.log("Error fetching address info", error);
                return null;
            });
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
                if (this.halt) {
                    console.log("Halting block processing");
                    return;
                }
                await this.processBlock(i);
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        } catch (error) {
            console.error("Error in getBlocksFromDates:", error);
        }
    }

    private async getBlockNumberFromTimestamp(timestamp: string, direction: 'BEFORE' | 'AFTER'): Promise<number> {
        const directionLabel = direction === 'BEFORE' ? 'Start' : 'End';
        
        try {
            const response = await fetch(
                `/api/ethereum?action=blockFromTimestamp&timestamp=${timestamp}&direction=${direction}`
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
            const response = await fetch(`/api/ethereum?action=blockWithTransactions&blockNumber=${blockNumber}`);
            const block = await response.json();
            
            if (block && block.transactions) {
                console.log(`Emitting ${block.transactions.length} transactions from block ${blockNumber}`);
                
                for (const transaction of block.transactions) {
                    if (this.halt) {
                        console.log("Halting block processing");
                        return;
                    }
                    eventEmitter.emit(EventType.TransactionFromBlock, transaction as unknown as Transaction);
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            }
        } catch (error) {
            console.log(`Error fetching block ${blockNumber}:`, error);
        }
    }
}

export default EthereumApiClient;