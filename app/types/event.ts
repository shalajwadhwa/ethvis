import { Transaction } from '@/app/types/transaction';
import { MinedTransactionResponse } from '@/app/types/response';

export interface NewPendingTransactionEvent {
    type: EventType.NewPendingTransaction;
    tx: Transaction;
}

export interface NewMinedTransactionEvent {
    type: EventType.NewMinedTransaction;
    response: MinedTransactionResponse;
}

export enum EventType {
    NewPendingTransaction = 'newPendingTransactions',
    NewMinedTransaction = 'newMinedTransaction',
    NewTopNode = 'newTopNode',
}