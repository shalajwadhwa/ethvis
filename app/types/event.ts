import { Transaction } from '@/app/types/transaction';
import { Attributes } from '@/app/types/graph';

export interface NewPendingTransactionEvent {
    type: EventType.NewPendingTransaction;
    tx: Transaction;
}

export interface AddAddressToGraphEvent {
    type: EventType.AddAddressToGraph;
    address: string;
    isContract: boolean;
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

export enum EventType {
    NewPendingTransaction = 'newPendingTransactions',
    AddAddressToGraph = 'addAddressToGraph',
    AddTransactionToGraph = 'addTransactionToGraph',
    UpdateNodeNetBalance = 'updateNodeNetBalance',
    NewTopNode = 'newTopNode',
}