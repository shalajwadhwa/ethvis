import { Transaction } from '../VisualisationTypes';

class EthereumTracker {
    private net_balance: Map<string, number> = new Map();
    private mempool: Transaction[] = [];
    private max_mempool_size: number = 100;

    public shiftMempool() {
        const to_remove: Transaction | undefined = this.mempool.shift();
        if (to_remove) {
            this.updateNetBalanceFromTransaction(to_remove, true);
        }
    }

    public appendMempool(tx: Transaction) {
        this.mempool.push(tx);
        this.updateNetBalanceFromTransaction(tx);
    }

    public addPendingTransaction(tx: Transaction) {
        if (this.mempool.length >= this.max_mempool_size) {
            this.shiftMempool();
        }

        this.appendMempool(tx);
    }

    public updateNetBalance(address: string, value: number) {
        const prev_balance = this.net_balance.get(address) || 0;
        this.net_balance.set(address, prev_balance + value);
    }

    public updateNetBalanceFromTransaction(tx: Transaction, is_removed: boolean = false) {
        const reverse_tx_multiplier = is_removed ? -1 : 1;

        this.updateNetBalance(tx.from, -Number(tx.value) * reverse_tx_multiplier);
        this.updateNetBalance(tx.to, Number(tx.value) * reverse_tx_multiplier);
    }
}

export default EthereumTracker;