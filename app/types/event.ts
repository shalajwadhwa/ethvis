import { Transaction } from './transaction';

export interface NewPendingTransactionEvent {
    type: 'newPendingTransactions';
    tx: Transaction;
}