import eventEmitter from '@/app/lib/EventEmitter';
import { Transaction } from '@/app/types/transaction';
import { EventType, MempoolUpdateEventType } from '@/app/types/event';

const MAX_MEMPOOL_SIZE = 2000;

class MempoolTracker {
  private mempool: Transaction[] = [];

  public constructor() {
    eventEmitter.on(
      EventType.AddTransactionToMempool,
      (tx) => this.append(tx)
    );
  }

  public resetTracker(): void {
    this.mempool = [];
  }

  private append(tx: Transaction) {
    this.mempool.push(tx);
    eventEmitter.emit(EventType.MempoolUpdate, tx, MempoolUpdateEventType.Add);
    eventEmitter.emit(EventType.AddTransactionToGraph, tx);

    if (this.mempool.length >= MAX_MEMPOOL_SIZE) {
      const to_remove = this.mempool.shift();
      if (to_remove) {
          eventEmitter.emit(EventType.MempoolUpdate, to_remove, MempoolUpdateEventType.Remove);
          eventEmitter.emit(EventType.RemoveTransactionFromGraph, to_remove);
      }
    }
  }
}

export default MempoolTracker;
