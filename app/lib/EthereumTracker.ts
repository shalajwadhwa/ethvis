import TopNodesTracker from '@/app/lib/TopNodesTracker';
import GraphHandler from '@/app/lib/GraphHandler';
import eventEmitter from '@/app/lib/EventEmitter';
import { Transaction } from '@/app/types/transaction';
import { EventType } from '@/app/types/event';

const MAX_MEMPOOL_SIZE = 200;

class EthereumTracker {
    private static instance: EthereumTracker;
    private mempool: Transaction[];
    private topNodesTracker: TopNodesTracker;
    private visualisationType: string;

    constructor() {
        this.mempool = [];
        this.topNodesTracker = new TopNodesTracker();
        this.visualisationType = 'default';

        eventEmitter.on(
            EventType.NewPendingTransaction,
            (tx) => this.append(tx)
        )
        eventEmitter.on(
            "topNodes",
            (node) => this.updateTopNodes(node)
        )
    }

    public static getInstance(): EthereumTracker {
        if (!EthereumTracker.instance) {
            EthereumTracker.instance = new EthereumTracker();
        }

        return EthereumTracker.instance;
    }

    private async append(tx: Transaction) {
        this.mempool.push(tx);
        await GraphHandler.getInstance().updateGraph(tx);
    
        if (this.mempool.length >= MAX_MEMPOOL_SIZE) {
          const toRemove = this.mempool.shift();
          if (toRemove) {
              await GraphHandler.getInstance().updateGraph(toRemove, true);
          }
        }
    }

    public changeVisualisation(type: string) {
        if (type !== this.visualisationType) {
            GraphHandler.getInstance().resetHandler();
            this.mempool = [];
            this.topNodesTracker.resetTracker();
            this.visualisationType = type;
        }
    }

    public getNodeAttributes(node: string) {
        return GraphHandler.getInstance().getNodeAttributes(node);
    }

    public getTopNodes() {
        return this.topNodesTracker.getTopNodes();
    }

    public updateTopNodes(node: string) {
        // todo: drop nodes when they are no longer in the graph
        const nodeAttributes = GraphHandler.getInstance().getNodeAttributes(node);
        if (!nodeAttributes) {
            return;
        }

        this.topNodesTracker.updateTopNodes(nodeAttributes);
    }
}

export default EthereumTracker;