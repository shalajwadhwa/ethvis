import Sigma from 'sigma';
import GraphHandler from '@/app/lib/GraphHandler';
import eventEmitter from '@/app/lib/EventEmitter';
import { Transaction, EventType, Attributes, EdgeType, VisualisationType, MinedTransactionResponse } from '@/app/lib/types';

const MAX_MEMPOOL_SIZE_DEFAULT = 2000;
const MAX_MEMPOOL_SIZE_RANGE = Infinity;

class EthereumTracker {
    private mempool: Transaction[];
    private numTransactions: number;
    private visualisationType: string;
    private graphHandler: GraphHandler;
    private maxMempoolSize: number;

    constructor(sigma:  Sigma<Attributes, EdgeType>, visualisationType: VisualisationType) {
        this.mempool = [];
        this.numTransactions = 0;
        this.visualisationType = visualisationType;
        this.graphHandler = new GraphHandler(sigma);
        this.maxMempoolSize = visualisationType === VisualisationType.RANGE ? 
            MAX_MEMPOOL_SIZE_RANGE : MAX_MEMPOOL_SIZE_DEFAULT;
        this.changeVisualisation(visualisationType);
    }

    private async append(tx: Transaction) {
        this.mempool.push(tx);
        this.numTransactions += 1;
        await this.graphHandler.updateGraph(tx);
    
        if (this.mempool.length >= this.maxMempoolSize) {
          const toRemove = this.mempool.shift();
          if (toRemove) {
              await this.graphHandler.updateGraph(toRemove, true);
              this.numTransactions -= 1;
          }
        }
    }

    private async colourMinedTransaction(response: MinedTransactionResponse) {
        await this.graphHandler.colourMinedTransaction(response);
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
            eventEmitter.off(
                EventType.NewPendingTransaction,
                (tx) => this.append(tx)
            )
            eventEmitter.off(
                EventType.NewMinedTransaction,
                (response) => this.colourMinedTransaction(response)
            )
            eventEmitter.off(
                EventType.TransactionFromBlock,
                (tx) => this.append(tx)
            )
            
            this.maxMempoolSize = type === VisualisationType.RANGE ? 
                MAX_MEMPOOL_SIZE_RANGE : MAX_MEMPOOL_SIZE_DEFAULT;
        }

        if (type === VisualisationType.DEFAULT) {
            eventEmitter.on(
                EventType.NewPendingTransaction,
                (tx) => this.append(tx)
            )
            eventEmitter.on(
                EventType.NewMinedTransaction,
                (response) => this.colourMinedTransaction(response)
            )
        } else if (type === VisualisationType.RANGE) {
            eventEmitter.on(
                EventType.TransactionFromBlock,
                (tx) => this.append(tx)
            )
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