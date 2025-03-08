import eventEmitter from '@/app/lib/EventEmitter';
import { Transaction } from '@/app/types/transaction';
import { EventType } from '@/app/types/event';
import NodesTracker from './NodesTracker';

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
    await this.nodes.updateNodesFromTransaction(tx);
    eventEmitter.emit(EventType.AddTransactionToGraph, tx);

    if (this.mempool.length >= MAX_MEMPOOL_SIZE) {
      const to_remove = this.mempool.shift();
      if (to_remove) {
          await this.nodes.updateNodesFromTransaction(to_remove, true);
          eventEmitter.emit(EventType.RemoveTransactionFromGraph, to_remove);
      }
    }
  }
}

export default MempoolTracker;
