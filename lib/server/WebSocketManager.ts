import { Alchemy, Network, AlchemySubscription } from "alchemy-sdk";
import type { Server } from "socket.io";

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

export class WebSocketManager {
  private static instance: WebSocketManager;
  private alchemy: Alchemy;
  private io: Server | null = null;
  private pendingSubscribersCount = 0;
  private minedSubscribersCount = 0;
  private isSubscribedToPending = false;
  private isSubscribedToMined = false;
  
  constructor() {
    const settings = {
      apiKey: ALCHEMY_API_KEY,
      network: Network.ETH_MAINNET,
      referrer: undefined
    };
    
    try {
      this.alchemy = new Alchemy(settings);
      console.log('Alchemy SDK initialized successfully');
    } catch (error) {
      console.error('Error initializing Alchemy SDK:', error);
      throw error;
    }
  }

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      try {
        WebSocketManager.instance = new WebSocketManager();
      } catch (error) {
        console.error('Error creating WebSocketManager instance:', error);
        throw error;
      }
    }
    return WebSocketManager.instance;
  }

  public initialize(io: Server): void {
    this.io = io;

    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('subscribeToPendingTransactions', () => {
        this.pendingSubscribersCount++;
        console.log(`Client requested pending transactions subscription (total: ${this.pendingSubscribersCount})`);
        this.subscribeToPendingTransactions();
      });

      socket.on('subscribeToMinedTransactions', () => {
        this.minedSubscribersCount++;
        console.log(`Client requested mined transactions subscription (total: ${this.minedSubscribersCount})`);
        this.subscribeToMinedTransactions();
      });

      socket.on('unsubscribeFromPendingTransactions', () => {
        if (this.pendingSubscribersCount > 0) {
          this.pendingSubscribersCount--;
        }
        console.log(`Client unsubscribed from pending transactions (remaining: ${this.pendingSubscribersCount})`);
        if (this.pendingSubscribersCount === 0) {
          this.unsubscribeFromPendingTransactions();
        }
      });

      socket.on('unsubscribeFromMinedTransactions', () => {
        if (this.minedSubscribersCount > 0) {
          this.minedSubscribersCount--;
        }
        console.log(`Client unsubscribed from mined transactions (remaining: ${this.minedSubscribersCount})`);
        if (this.minedSubscribersCount === 0) {
          this.unsubscribeFromMinedTransactions();
        }
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        if (this.pendingSubscribersCount > 0) this.pendingSubscribersCount--;
        if (this.minedSubscribersCount > 0) this.minedSubscribersCount--;
        
        if (this.pendingSubscribersCount === 0) this.unsubscribeFromPendingTransactions();
        if (this.minedSubscribersCount === 0) this.unsubscribeFromMinedTransactions();
      });
    });
  }

  private subscribeToPendingTransactions(): void {
    if (this.isSubscribedToPending) return;
    
    try {
      this.alchemy.ws.on(
        { method: AlchemySubscription.PENDING_TRANSACTIONS },
        (transaction) => {
          if (this.io) {
            this.io.emit('newPendingTransaction', transaction);
          }
        }
      );

      this.isSubscribedToPending = true;
      console.log('Server subscribed to pending transactions');
    } catch (error) {
      console.error('Error subscribing to pending transactions:', error);
    }
  }

  private unsubscribeFromPendingTransactions(): void {
    if (!this.isSubscribedToPending) return;
    
    this.alchemy.ws.off({ method: AlchemySubscription.PENDING_TRANSACTIONS });
    this.isSubscribedToPending = false;
    console.log('Server unsubscribed from pending transactions');
  }

  private subscribeToMinedTransactions(): void {
    if (this.isSubscribedToMined) return;
    
    try {
      this.alchemy.ws.on(
        { method: AlchemySubscription.MINED_TRANSACTIONS },
        (response) => {
          if (this.io) {
            this.io.emit('newMinedTransaction', response);
          }
        }
      );

      this.isSubscribedToMined = true;
      console.log('Server subscribed to mined transactions');
    } catch (error) {
      console.error('Error subscribing to mined transactions:', error);
    }
  }

  private unsubscribeFromMinedTransactions(): void {
    if (!this.isSubscribedToMined) return;
    
    this.alchemy.ws.off({ method: AlchemySubscription.MINED_TRANSACTIONS });
    this.isSubscribedToMined = false;
    console.log('Server unsubscribed from mined transactions');
  }
}
