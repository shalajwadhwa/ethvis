import eventEmitter from '@/app/lib/EventEmitter';
import { Transaction } from '@/app/types/transaction';
import { EventType } from '@/app/types/event';

const MAX_MEMPOOL_SIZE = 2000;

class MempoolTracker {
  private mempool: Transaction[] = [];
  
  public getMempool(): Transaction[] {
    return this.mempool;
  }
  
  public getMempoolSize(): number {
    return this.mempool.length;
  }
  
  public shift(): Transaction | undefined {
    return this.mempool.shift();
  }
  
  public append(tx: Transaction): void {
    this.mempool.push(tx);
    eventEmitter.emit(EventType.AddTransactionToGraph, tx);
  }
  
  public isAtCapacity(): boolean {
    return this.mempool.length >= MAX_MEMPOOL_SIZE;
  }
}

export default MempoolTracker;
