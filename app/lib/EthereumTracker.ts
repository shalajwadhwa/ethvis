import eventEmitter from '@/app/lib/EventEmitter';
import { Transaction } from '@/app/types/transaction';
import { EventType, MempoolUpdateEventType } from '@/app/types/event';
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
        this.graphHandler = new GraphHandler(sigma);

        eventEmitter.on(
            EventType.UpdateNodeNetBalance, (node) => this.updateTopNodes(node)
        );

        eventEmitter.on(
            EventType.MempoolUpdate,
            (tx, eventType) => this.updateNetBalanceFromTransaction(tx, eventType === MempoolUpdateEventType.Remove)
        )
    }

    public getNodeAttributes(node: string) {
        return this.nodesTracker.getNode(node);
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

    public updateNetBalanceFromTransaction(tx: Transaction, is_removed: boolean = false) {
        const reverse_tx_multiplier = is_removed ? -1 : 1;

        this.nodesTracker.updateNetBalance(tx, -Number(tx.value) * reverse_tx_multiplier, true);
        this.nodesTracker.updateNetBalance(tx, Number(tx.value) * reverse_tx_multiplier, false);
    }
}

export default EthereumTracker;