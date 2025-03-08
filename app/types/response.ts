import { Transaction } from "@/app/types/transaction";

export interface MinedTransactionResponse {
    isRemoved: boolean;
    transaction: Transaction;
    subscription: string;
}