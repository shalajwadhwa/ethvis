import { Alchemy, Network, AlchemySubscription } from "alchemy-sdk";
import type { Server } from "socket.io";

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

export class WebSocketManager {
  private static instance: WebSocketManager;
  private alchemy: Alchemy;
  private io: Server | null = null;
  private pendingSubscribers: Set<string> = new Set();
  private minedSubscribers: Set<string> = new Set();
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
        if (this.pendingSubscribers.has(socket.id)) {
          console.log(`Client ${socket.id} already subscribed to pending transactions`);
          return;
        }
        this.pendingSubscribers.add(socket.id);
        console.log(`Client ${socket.id} requested pending transactions subscription (total: ${this.pendingSubscribers.size})`);
        this.subscribeToPendingTransactions();
      });

      socket.on('subscribeToMinedTransactions', () => {
        if (this.minedSubscribers.has(socket.id)) {
          console.log(`Client ${socket.id} already subscribed to mined transactions`);
          return;
        }
        this.minedSubscribers.add(socket.id);
        console.log(`Client ${socket.id} requested mined transactions subscription (total: ${this.minedSubscribers.size})`);
        this.subscribeToMinedTransactions();
      });

      socket.on('unsubscribeFromPendingTransactions', () => {
        if (!this.pendingSubscribers.has(socket.id)) {
          console.log(`Client ${socket.id} tried to unsubscribe from pending transactions but wasn't subscribed`);
          return;
        }
        
        this.pendingSubscribers.delete(socket.id);
        console.log(`Client ${socket.id} unsubscribed from pending transactions (remaining: ${this.pendingSubscribers.size})`);
        
        if (this.pendingSubscribers.size === 0) {
          this.unsubscribeFromPendingTransactions();
        }
      });

      socket.on('unsubscribeFromMinedTransactions', () => {
        if (!this.minedSubscribers.has(socket.id)) {
          console.log(`Client ${socket.id} tried to unsubscribe from mined transactions but wasn't subscribed`);
          return;
        }
        
        this.minedSubscribers.delete(socket.id);
        console.log(`Client ${socket.id} unsubscribed from mined transactions (remaining: ${this.minedSubscribers.size})`);
        
        if (this.minedSubscribers.size === 0) {
          this.unsubscribeFromMinedTransactions();
        }
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        
        const wasPendingSubscriber = this.pendingSubscribers.has(socket.id);
        const wasMinedSubscriber = this.minedSubscribers.has(socket.id);
        
        if (wasPendingSubscriber) {
          this.pendingSubscribers.delete(socket.id);
          console.log(`Removed disconnected client ${socket.id} from pending subscribers (remaining: ${this.pendingSubscribers.size})`);
          
          if (this.pendingSubscribers.size === 0) {
            this.unsubscribeFromPendingTransactions();
          }
        }
        
        if (wasMinedSubscriber) {
          this.minedSubscribers.delete(socket.id);
          console.log(`Removed disconnected client ${socket.id} from mined subscribers (remaining: ${this.minedSubscribers.size})`);
          
          if (this.minedSubscribers.size === 0) {
            this.unsubscribeFromMinedTransactions();
          }
        }
      });
    });
  }

  private subscribeToPendingTransactions(): void {
    if (this.isSubscribedToPending) return;
    
    try {
      this.alchemy.ws.on(
        { method: AlchemySubscription.PENDING_TRANSACTIONS },
        (transaction) => {
          if (!this.io || this.pendingSubscribers.size === 0) return;
          
          for (const clientId of this.pendingSubscribers) {
            const clientSocket = this.io.sockets.sockets.get(clientId);
            if (clientSocket && clientSocket.connected) {
              clientSocket.emit('newPendingTransaction', transaction);
            } else {
              console.log(`Removing stale client reference: ${clientId}`);
              this.pendingSubscribers.delete(clientId);
            }
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
          if (!this.io || this.minedSubscribers.size === 0) return;
          
          for (const clientId of this.minedSubscribers) {
            const clientSocket = this.io.sockets.sockets.get(clientId);
            if (clientSocket && clientSocket.connected) {
              clientSocket.emit('newMinedTransaction', response);
            } else {
              console.log(`Removing stale client reference: ${clientId}`);
              this.minedSubscribers.delete(clientId);
            }
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
