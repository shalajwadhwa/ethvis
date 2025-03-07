import { Attributes } from '@/app/types/graph';
import eventEmitter from '@/app/lib/EventEmitter';
import { EventType } from '@/app/types/event';

const TOP_NODES_SIZE = 20;

class TopNodesTracker {
    private topNodes: Attributes[] = [];
    private topNodeThreshold: number = 0;

    public getTopNodes(): Attributes[] {
        return this.topNodes;
    }

    public resetTracker(): void {
        this.topNodes = [];
        this.topNodeThreshold = 0;
    }

    private appendTopNodes(nodeAttributes: Attributes): void {
        if (this.topNodes.some(topNode => topNode.address === nodeAttributes.address)) {
            return;
        }

        if (this.topNodes.length >= TOP_NODES_SIZE) {
            this.topNodes.pop();
        }

        this.topNodes.push(nodeAttributes);
    }

    private sortTopNodes(): void {
        this.topNodes.sort((a, b) => b.netBalance! - a.netBalance!);
        const length = this.topNodes.length;
        this.topNodeThreshold = length > 0 ? this.topNodes[length - 1].netBalance : 0;
    }

    public updateTopNodes(nodeAttributes: Attributes): void {
        if (!nodeAttributes) {
            return;
        }

        const value = nodeAttributes.netBalance;
        
        if (value >= this.topNodeThreshold || this.topNodes.length < TOP_NODES_SIZE) {
            this.appendTopNodes(nodeAttributes);
            this.sortTopNodes();
            eventEmitter.emit(EventType.NewTopNode, this.topNodes);
        }
    }
}

export default TopNodesTracker;
