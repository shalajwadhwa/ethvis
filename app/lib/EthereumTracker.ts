import eventEmitter from '@/app/lib/EventEmitter';
import { Transaction } from '@/app/types/transaction';
import { EventType } from '@/app/types/event';
import TopNodesTracker from '@/app/lib/TopNodesTracker';
import MempoolTracker from '@/app/lib/MempoolTracker';
import NodesTracker from '@/app/lib/NodesTracker';
import Sigma from "sigma";
import { NodeType, EdgeType } from "@/app/types/graph";
import GraphHandler from '@/app/lib/GraphHandler';

class EthereumTracker {
    private static instance: EthereumTracker;
    private nodesTracker: NodesTracker = new NodesTracker();
    private topNodesTracker: TopNodesTracker = new TopNodesTracker();
    private mempoolTracker: MempoolTracker = new MempoolTracker();
    private graphHandler: GraphHandler | null = null;

    public static getInstance(): EthereumTracker {
        if (!EthereumTracker.instance) {
            EthereumTracker.instance = new EthereumTracker();
        }

        return EthereumTracker.instance;
    }

    public setSigma(sigma: Sigma<NodeType, EdgeType>) { 
        eventEmitter.on(EventType.NewPendingTransaction, (tx) =>
            this.addPendingTransaction(tx)
          );

        this.graphHandler = new GraphHandler(sigma);
    }

    public shiftMempool() {
        const to_remove = this.mempoolTracker.shift();
        if (to_remove) {
            this.updateNetBalanceFromTransaction(to_remove, true);
        }
    }

    public appendMempool(tx: Transaction) {
        this.mempoolTracker.append(tx);
        this.updateNetBalanceFromTransaction(tx);
    }

    public getNodes() {
        return this.nodesTracker.getNodes();
    }

    public async addPendingTransaction(tx: Transaction) {
        if (this.mempoolTracker.isAtCapacity()) {
            this.shiftMempool();
        }

        await this.nodesTracker.addNodesFromTransaction(tx);

        this.appendMempool(tx);
    }

    public getNetBalance(node: string) {
        return this.nodesTracker.getNetBalance(node);
    }

    public getTopNodes() {
        return this.topNodesTracker.getTopNodes();
    }

    public updateTopNodes(node: string) {
        const nodeAttributes = this.nodesTracker.getNode(node);
        if (!nodeAttributes) {
            return;
        }

        this.topNodesTracker.updateTopNodes(nodeAttributes);
    }

    public setNetBalance(node: string, value: number) {
        this.nodesTracker.setNetBalance(node, value);
        this.updateTopNodes(node);
    }

    public updateNetBalance(tx: Transaction, value: number, is_sender: boolean) {
        const node = is_sender ? tx.from : tx.to;

        const prev_balance = this.getNetBalance(node);
        this.setNetBalance(node, prev_balance + value);
        eventEmitter.emit(EventType.UpdateNodeNetBalance, tx, value, is_sender);
    }

    public updateNetBalanceFromTransaction(tx: Transaction, is_removed: boolean = false) {
        const reverse_tx_multiplier = is_removed ? -1 : 1;

        this.updateNetBalance(tx, -Number(tx.value) * reverse_tx_multiplier, true);
        this.updateNetBalance(tx, Number(tx.value) * reverse_tx_multiplier, false);
    }
}

export default EthereumTracker;