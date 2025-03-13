import TopNodesTracker from '@/app/lib/TopNodesTracker';
import GraphHandler from '@/app/lib/GraphHandler';
import eventEmitter from '@/app/lib/EventEmitter';
import { Transaction } from '@/app/types/transaction';
import { EventType } from '@/app/types/event';
import { Mutex } from 'async-mutex';

// TODO: use mempoool for static visualisation with infinite size
const MAX_MEMPOOL_SIZE = 200;

class EthereumTracker {
    private mempool: Transaction[];
    private numTransactions: number;
    private topNodesTracker: TopNodesTracker;
    private visualisationType: string;
    private graphHandler: GraphHandler;
    private lock = new Mutex();

    constructor(graphHandler: GraphHandler) {
        this.mempool = [];
        this.numTransactions = 0;
        this.topNodesTracker = new TopNodesTracker();
        this.visualisationType = 'default';
        this.graphHandler = graphHandler;

        eventEmitter.on(
            EventType.NewPendingTransaction,
            (tx) => this.append(tx)
        )
        eventEmitter.on(
            "topNodes",
            (node) => this.updateTopNodes(node)
        )
    }

    private async append(tx: Transaction) {
        const release = await this.lock.acquire();
        this.mempool.push(tx);
        this.numTransactions += 1;
        await this.graphHandler.updateGraph(tx);
    
        if (this.mempool.length >= MAX_MEMPOOL_SIZE) {
          const toRemove = this.mempool.shift();
          if (toRemove) {
              await this.graphHandler.updateGraph(toRemove, true);
              this.numTransactions -= 1;
          }
        }
        release();
    }

    public getNumTransactions() {
        return this.numTransactions;
    }

    public getNumContracts() {
        return this.graphHandler.getNumContracts();
    }

    public getNumContractExecutions() {
        return this.graphHandler.getContractExecutions();
    }

    public changeVisualisation(type: string) {
        if (type !== this.visualisationType) {
            this.graphHandler.resetHandler();
            this.mempool = [];
            this.topNodesTracker.resetTracker();
            this.visualisationType = type;
            this.numTransactions = 0;
        }
    }

    public getNodeAttributes(node: string) {
        return this.graphHandler.getNodeAttributes(node);
    }

    public getTopNodes() {
        return this.topNodesTracker.getTopNodes();
    }

    public updateTopNodes(node: string) {
        // TODO: drop nodes when they are no longer in the graph
        const nodeAttributes = this.graphHandler.getNodeAttributes(node);
        if (!nodeAttributes) {
            return;
        }

        this.topNodesTracker.updateTopNodes(nodeAttributes);
    }
}

export default EthereumTracker;