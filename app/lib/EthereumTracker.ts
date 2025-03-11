import TopNodesTracker from '@/app/lib/TopNodesTracker';
import Sigma from "sigma";
import { Attributes, EdgeType } from "@/app/types/graph";
import GraphHandler from '@/app/lib/GraphHandler';
import eventEmitter from './EventEmitter';
import { Transaction } from '../types/transaction';
import { EventType } from '../types/event';

const MAX_MEMPOOL_SIZE = 200;

class EthereumTracker {
    private static instance: EthereumTracker;
    private mempool: Transaction[];
    private graphHandler: GraphHandler | null;
    private topNodesTracker: TopNodesTracker;
    private visualisationType: string;

    constructor() {
        this.mempool = [];
        this.graphHandler = null;
        this.topNodesTracker = new TopNodesTracker();
        this.visualisationType = 'default';

        eventEmitter.on(
            EventType.NewPendingTransaction,
            (tx) => this.append(tx)
        )
    }

    public static getInstance(): EthereumTracker {
        if (!EthereumTracker.instance) {
            EthereumTracker.instance = new EthereumTracker();
        }

        return EthereumTracker.instance;
    }

    public setSigma(sigma: Sigma<Attributes, EdgeType>) { 
        this.graphHandler = new GraphHandler(sigma);

        // todo: make GraphHandler emit an event when an edge is added or removed to update the top nodes
        eventEmitter.on( "topNodes", (node) => this.updateTopNodes(node));
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