import { Transaction } from '@/app/types/transaction';
import { Attributes } from '@/app/types/graph';

export interface NewPendingTransactionEvent {
    type: EventType.NewPendingTransaction;
    tx: Transaction;
}

export interface AddTransactionToMempoolEvent {
    type: EventType.AddTransactionToMempool;
    tx: Transaction;
}

export interface AddAddressToGraphEvent {
    type: EventType.AddAddressToGraph;
    address: string;
    isContract: boolean;
}

export interface RemoveAddressFromGraphEvent {
    type: EventType.RemoveAddressFromGraph;
    address: string;
}

export interface AddTransactionToGraphEvent {
    type: EventType.AddTransactionToGraph;
    tx: Transaction;
}

export interface UpdateNodeNetBalanceEvent {
    type: EventType.UpdateNodeNetBalance;
    node: string;
    netBalance: number;
}

export interface NewTopNodeEvent {
    type: EventType.NewTopNode;
    topNodes: Attributes[];
}

export interface MempoolUpdateEvent {
    type: EventType.MempoolUpdate;
    tx: Transaction;
    eventType: MempoolUpdateEventType;
}

export enum MempoolUpdateEventType {
    Add = 'add',
    Remove = 'remove',
}

export enum EventType {
    NewPendingTransaction = 'newPendingTransactions',
    NewMinedTransaction = 'newMinedTransaction',
    AddTransactionToMempool = 'addTransactionToMempool',
    MempoolUpdate = 'mempoolUpdate',
    AddAddressToGraph = 'addAddressToGraph',
    AddTransactionToGraph = 'addTransactionToGraph',
    RemoveAddressFromGraph = 'removeAddressFromGraph',
    UpdateNodeNetBalance = 'updateNodeNetBalance',
    NewTopNode = 'newTopNode',
}