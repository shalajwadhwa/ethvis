import { Transaction } from './transaction';

export interface NewPendingTransactionEvent {
    type: EventType.NewPendingTransaction;
    tx: Transaction;
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
    AddTransactionToGraph = 'addTransactionToGraph',
    UpdateNodeNetBalance = 'updateNodeNetBalance',
}