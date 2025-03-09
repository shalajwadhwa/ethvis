import eventEmitter from '@/app/lib/EventEmitter';
import { Transaction } from '@/app/types/transaction';
import { EventType } from '@/app/types/event';
import NodesTracker from '@/app/lib/NodesTracker';
import GraphHandler from '@/app/lib/GraphHandler';

const MAX_MEMPOOL_SIZE = 200;

class MempoolTracker {
  private mempool: Transaction[] = [];
  private nodes = new NodesTracker();

  constructor() {
    eventEmitter.on(
      EventType.NewPendingTransaction,
      (tx) => this.append(tx)
    )
  }

  public getNode(node: string) {
    return this.nodes.getNode(node);
  }

  public resetTracker(): void {
    this.mempool = [];
    this.nodes.resetTracker();
  }

  private async append(tx: Transaction) {
    this.mempool.push(tx);
    await this.nodes.mempoolUpdate(tx);
    GraphHandler.addTransaction(tx);

    if (this.mempool.length >= MAX_MEMPOOL_SIZE) {
      const to_remove = this.mempool.shift();
      if (to_remove) {
          await this.nodes.mempoolUpdate(to_remove, true);
          // todo: implement removeTransaction
      }
    }
  }
}

export default MempoolTracker;
