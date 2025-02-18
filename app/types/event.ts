import { Transaction } from '@/app/types/transaction';

export interface NewPendingTransactionEvent {
    type: EventType.NewPendingTransaction;
    tx: Transaction;
}

export interface AddAddressToGraphEvent {
    type: EventType.AddAddressToGraph;
    address: string;
    attributes: any;
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

export enum EventType {
    NewPendingTransaction = 'newPendingTransactions',
    AddAddressToGraph = 'addAddressToGraph',
    AddTransactionToGraph = 'addTransactionToGraph',
    UpdateNodeNetBalance = 'updateNodeNetBalance',
}