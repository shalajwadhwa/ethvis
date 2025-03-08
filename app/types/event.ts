import { Transaction } from '@/app/types/transaction';
import { Attributes } from '@/app/types/graph';
import { MinedTransactionResponse } from '@/app/types/response';

export interface NewPendingTransactionEvent {
    type: EventType.NewPendingTransaction;
    tx: Transaction;
}

export interface NewMinedTransactionEvent {
    type: EventType.NewMinedTransaction;
    response: MinedTransactionResponse;
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

export interface RemoveTransactionFromGraphEvent {
    type: EventType.RemoveTransactionFromGraph;
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

export enum MempoolUpdateEventType {
    Add = 'add',
    Remove = 'remove',
}

export enum EventType {
    NewPendingTransaction = 'newPendingTransactions',
    NewMinedTransaction = 'newMinedTransaction',
    AddAddressToGraph = 'addAddressToGraph',
    AddTransactionToGraph = 'addTransactionToGraph',
    RemoveTransactionFromGraph = 'removeTransactionFromGraph',
    RemoveAddressFromGraph = 'removeAddressFromGraph',
    UpdateNodeNetBalance = 'updateNodeNetBalance',
    NewTopNode = 'newTopNode',
}