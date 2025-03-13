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
    NewTopNode = 'newTopNode',
}