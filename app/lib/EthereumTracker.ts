import eventEmitter from '@/app/lib/EventEmitter';
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
    private visualisationType: string = 'default';

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
    }

    public changeVisualisation(type: string) {
        if (type !== this.visualisationType) {
            this.nodesTracker.resetTracker();
            this.topNodesTracker.resetTracker();
            this.mempoolTracker.resetTracker();
            this.graphHandler?.resetHandler();
            this.visualisationType = type;
        }
    }

    public getNodeAttributes(node: string) {
        return this.nodesTracker.getNode(node);
    }

    public getTopNodes() {
        return this.topNodesTracker.getTopNodes();
    }

    public updateTopNodes(node: string) {
        // todo: drop nodes when they are no longer in the graph
        const nodeAttributes = this.nodesTracker.getNode(node);
        if (!nodeAttributes) {
            return;
        }

        this.topNodesTracker.updateTopNodes(nodeAttributes);
    }
}

export default EthereumTracker;