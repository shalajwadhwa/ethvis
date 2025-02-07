import eventEmitter from './EventEmitter';
import { Transaction } from '../types/transaction';
import { EventType } from '../types/event';

class EthereumTracker {
    private net_balance: Map<string, number> = new Map();
    private mempool: Transaction[] = [];
    private max_mempool_size: number = 2000;

    public shiftMempool() {
        const to_remove: Transaction | undefined = this.mempool.shift();
        if (to_remove) {
            this.updateNetBalanceFromTransaction(to_remove, true);
        }
    }

    public appendMempool(tx: Transaction) {
        this.mempool.push(tx);
        eventEmitter.emit(EventType.AddTransactionToGraph, tx);
        this.updateNetBalanceFromTransaction(tx);
    }

    public addPendingTransaction(tx: Transaction) {
        if (this.mempool.length >= this.max_mempool_size) {
            this.shiftMempool();
        }

        this.appendMempool(tx);
    }

    public updateNetBalance(tx: Transaction, value: number, is_sender: boolean) {
        const node = is_sender ? tx.from : tx.to;

        const prev_balance = this.net_balance.get(node) || 0;
        this.net_balance.set(node, prev_balance + value);
        eventEmitter.emit(EventType.UpdateNodeNetBalance, tx, value, is_sender);
    }

    public updateNetBalanceFromTransaction(tx: Transaction, is_removed: boolean = false) {
        const reverse_tx_multiplier = is_removed ? -1 : 1;

        this.updateNetBalance(tx, -Number(tx.value) * reverse_tx_multiplier, true);
        this.updateNetBalance(tx, Number(tx.value) * reverse_tx_multiplier, false);
    }
}

export default EthereumTracker;