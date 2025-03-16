import Sigma from 'sigma';
import GraphHandler from '@/app/lib/GraphHandler';
import eventEmitter from '@/app/lib/EventEmitter';
import { Transaction, EventType, Attributes, EdgeType } from '@/app/lib/types';

// TODO: use mempoool for static visualisation with infinite size
const MAX_MEMPOOL_SIZE = 2000;

class EthereumTracker {
    private mempool: Transaction[];
    private numTransactions: number;
    private visualisationType: string;
    private graphHandler: GraphHandler;

    constructor(sigma:  Sigma<Attributes, EdgeType>) {
        this.mempool = [];
        this.numTransactions = 0;
        this.visualisationType = 'default';
        this.graphHandler = new GraphHandler(sigma);

        eventEmitter.on(
            EventType.NewPendingTransaction,
            (tx) => this.append(tx)
        )
    }

    private async append(tx: Transaction) {
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
    }

    public selectNode(node: string | null) {
        this.graphHandler.selectNode(node);
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

    public getGraphOrder() {
        return this.graphHandler.getGraphOrder();
    }

    public getGraphSize() {
        return this.graphHandler.getGraphSize();
    }

    public changeVisualisation(type: string) {
        if (type !== this.visualisationType) {
            this.mempool = [];
            this.visualisationType = type;
            this.numTransactions = 0;
            this.graphHandler.resetHandler();
        }
    }

    public getNodeAttributes(node: string) {
        return this.graphHandler.getNodeAttributes(node);
    }

    public getTopNodes() {
        return this.graphHandler.getTopNodes();
    }
}

export default EthereumTracker;