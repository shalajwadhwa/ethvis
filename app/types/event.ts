import { Transaction } from './transaction';

export interface NewPendingTransactionEvent {
    type: EventType.NewPendingTransaction;
    tx: Transaction;
}

export enum EventType {
    NewPendingTransaction = 'newPendingTransactions',
}