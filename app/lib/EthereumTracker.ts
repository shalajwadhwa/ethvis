import Sigma from 'sigma';
import GraphHandler from '@/app/lib/GraphHandler';
import eventEmitter from '@/app/lib/EventEmitter';
import { Transaction, EventType, Attributes, EdgeType, VisualisationType, MinedTransactionResponse } from '@/app/lib/types';
import { Mutex } from 'async-mutex';

const MAX_MEMPOOL_SIZE_DEFAULT = 2000;
const MAX_MEMPOOL_SIZE_RANGE = Infinity;

class EthereumTracker {
    private mempool: Transaction[];
    private numTransactions: number;
    private visualisationType: string;
    private graphHandler: GraphHandler;
    private maxMempoolSize: number;
    private mutex;
    private handlePendingTransaction: (tx: Transaction) => Promise<void>;
    private handleMinedTransaction: (response: MinedTransactionResponse) => Promise<void>;
    private handleBlockTransaction: (tx: Transaction) => Promise<void>;

    constructor(sigma:  Sigma<Attributes, EdgeType>, visualisationType: VisualisationType) {
        this.mempool = [];
        this.numTransactions = 0;
        this.visualisationType = visualisationType;
        this.graphHandler = new GraphHandler(sigma);
        this.maxMempoolSize = visualisationType === VisualisationType.RANGE ? 
            MAX_MEMPOOL_SIZE_RANGE : MAX_MEMPOOL_SIZE_DEFAULT;
        
        this.handlePendingTransaction = this.append.bind(this);
        this.handleMinedTransaction = this.colourMinedTransaction.bind(this);
        this.handleBlockTransaction = this.append.bind(this);
        
        this.changeVisualisation(visualisationType);
        this.mutex = new Mutex();
    }

    private async append(tx: Transaction) {
        const release = await this.mutex.acquire();
        try {
            this.mempool.push(tx);
            this.numTransactions += 1;
            await this.graphHandler.updateGraph(tx);
        
            if (this.mempool.length >= this.maxMempoolSize) {
                console.log('Mempool full, removing oldest transaction');
                const toRemove = this.mempool.shift();
                if (toRemove) {
                    await this.graphHandler.updateGraph(toRemove, true);
                    this.numTransactions -= 1;
                }
            }
        } finally {
            release(); 
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
        eventEmitter.off(EventType.NewPendingTransaction, this.handlePendingTransaction);
        eventEmitter.off(EventType.NewMinedTransaction, this.handleMinedTransaction);
        eventEmitter.off(EventType.TransactionFromBlock, this.handleBlockTransaction);
        
        if (type !== this.visualisationType) {
            this.mempool = [];
            this.visualisationType = type;
            this.numTransactions = 0;
            this.graphHandler.resetHandler();
            
            this.maxMempoolSize = type === VisualisationType.RANGE ? 
                MAX_MEMPOOL_SIZE_RANGE : MAX_MEMPOOL_SIZE_DEFAULT;
        }

        if (type === VisualisationType.DEFAULT) {
            eventEmitter.on(EventType.NewPendingTransaction, this.handlePendingTransaction);
            eventEmitter.on(EventType.NewMinedTransaction, this.handleMinedTransaction);
        } else if (type === VisualisationType.RANGE) {
            eventEmitter.on(EventType.TransactionFromBlock, this.handleBlockTransaction);
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