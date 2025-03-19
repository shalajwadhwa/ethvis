import EthereumApiClient from '@/app/lib/EthereumApiClient';
import eventEmitter from '@/app/lib/EventEmitter';
import { EventType } from '@/app/lib/types';
import { io } from 'socket.io-client';

// Create a mock socket object that we can reference directly
const mockSocket = {
  on: jest.fn(),
  emit: jest.fn(),
  connected: true,
  id: 'mock-socket-id'
};

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket)
}));

// Mock EventEmitter
jest.mock('../EventEmitter', () => ({
  __esModule: true,
  default: {
    emit: jest.fn()
  }
}));

// Mock fetch
global.fetch = jest.fn();

describe('EthereumApiClient', () => {
  let client: EthereumApiClient;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env.NEXT_PUBLIC_ETHVIS = 'http://localhost:3000';
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset the socket's connected property to true
    mockSocket.connected = true;
    
    // Reset the singleton instance
    // @ts-ignore - accessing private property for testing
    EthereumApiClient.instance = undefined;
    
    // Initialize client
    client = EthereumApiClient.getInstance();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Singleton pattern', () => {
    it('should return the same instance when getInstance is called multiple times', () => {
      const instance1 = EthereumApiClient.getInstance();
      const instance2 = EthereumApiClient.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Socket initialization', () => {
    it('should initialize socket with correct configuration', () => {
      expect(io).toHaveBeenCalledWith('http://localhost:3000', {
        path: '/api/socketio',
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });
    });

    it('should register event handlers for socket events', () => {
      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('newPendingTransaction', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('newMinedTransaction', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });
  });

  describe('setHalt', () => {
    it('should set the halt flag', () => {
      client.setHalt(true);
      // @ts-ignore - accessing private property for testing
      expect(client.halt).toBe(true);
      
      client.setHalt(false);
      // @ts-ignore - accessing private property for testing
      expect(client.halt).toBe(false);
    });
  });

  describe('Subscription methods', () => {
    it('should call emit subscribeToPendingTransactions when connected', () => {
      client.subscribeToPendingTransactions();
      expect(mockSocket.emit).toHaveBeenCalledWith('subscribeToPendingTransactions');
    });

    it('should call emit unsubscribeFromPendingTransactions when connected', () => {
      client.unsubscribeFromPendingTransactions();
      expect(mockSocket.emit).toHaveBeenCalledWith('unsubscribeFromPendingTransactions');
    });

    it('should call emit subscribeToMinedTransactions when connected', () => {
      client.subscribeToMinedTransactions();
      expect(mockSocket.emit).toHaveBeenCalledWith('subscribeToMinedTransactions');
    });

    it('should call emit unsubscribeFromMinedTransactions when connected', () => {
      client.unsubscribeFromMinedTransactions();
      expect(mockSocket.emit).toHaveBeenCalledWith('unsubscribeFromMinedTransactions');
    });

    it('should not emit events when socket is not connected', () => {
      // Set connected to false
      mockSocket.connected = false;
      
      client.subscribeToPendingTransactions();
      client.unsubscribeFromPendingTransactions();
      client.subscribeToMinedTransactions();
      client.unsubscribeFromMinedTransactions();
      
      // Only the last mock.calls check is needed since we want to verify no calls happened after connected was set to false
      expect(mockSocket.emit).not.toHaveBeenCalledWith('subscribeToPendingTransactions');
      expect(mockSocket.emit).not.toHaveBeenCalledWith('unsubscribeFromPendingTransactions');
      expect(mockSocket.emit).not.toHaveBeenCalledWith('subscribeToMinedTransactions');
      expect(mockSocket.emit).not.toHaveBeenCalledWith('unsubscribeFromMinedTransactions');
    });
  });

  describe('API methods', () => {
    it('should fetch isCode correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce({ isCode: true })
      });

      const result = await client.isCode('0x123');
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/ethereum?action=isCode&address=0x123');
    });

    it('should handle errors in isCode', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await client.isCode('0x123');
      expect(result).toBe(false);
    });

    it('should fetch address info correctly', async () => {
      const mockResponse = { balance: '100', txCount: 5 };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse)
      });

      const result = await client.getInfo('0x123');
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith('/api/ethereum?action=addressInfo&address=0x123');
    });

    it('should handle errors in getInfo', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await client.getInfo('0x123');
      expect(result).toBeNull();
    });
  });

  describe('Transaction fetching methods', () => {
    it('should fetch transactions from date range correctly', async () => {
      // Mock getBlockNumberFromTimestamp responses
      // @ts-ignore - accessing private method for testing
      jest.spyOn(client, 'getBlockNumberFromTimestamp')
        .mockResolvedValueOnce(12345)  // Start block
        .mockResolvedValueOnce(12347); // End block

      // Mock processBlock
      // @ts-ignore - accessing private method for testing
      jest.spyOn(client, 'processBlock').mockResolvedValue();

      // Mock validateBlockRange
      // @ts-ignore - accessing private method for testing
      jest.spyOn(client, 'validateBlockRange').mockReturnValue(true);

      await client.getTransactionsFromRange('2023-01-01', '2023-01-02');

      // @ts-ignore - accessing private method for testing
      expect(client.getBlockNumberFromTimestamp).toHaveBeenCalledWith('2023-01-01', 'BEFORE');
      // @ts-ignore - accessing private method for testing
      expect(client.getBlockNumberFromTimestamp).toHaveBeenCalledWith('2023-01-02', 'AFTER');
      // @ts-ignore - accessing private method for testing
      expect(client.validateBlockRange).toHaveBeenCalledWith(12345, 12347);
      // @ts-ignore - accessing private method for testing
      expect(client.processBlock).toHaveBeenCalledTimes(2); // Should process 2 blocks (12345, 12346)
    });

    it('should stop processing blocks when halt is true', async () => {
      // Mock getBlockNumberFromTimestamp responses
      // @ts-ignore - accessing private method for testing
      jest.spyOn(client, 'getBlockNumberFromTimestamp')
        .mockResolvedValueOnce(12345)  // Start block
        .mockResolvedValueOnce(12350); // End block

      // Mock processBlock
      // @ts-ignore - accessing private method for testing
      jest.spyOn(client, 'processBlock').mockResolvedValue();

      // Mock validateBlockRange
      // @ts-ignore - accessing private method for testing
      jest.spyOn(client, 'validateBlockRange').mockReturnValue(true);

      // Set halt to true after first block
      let blockCount = 0;
      // @ts-ignore - accessing private method for testing
      client.processBlock.mockImplementation(() => {
        blockCount++;
        if (blockCount === 1) {
          client.setHalt(true);
        }
      });

      await client.getTransactionsFromRange('2023-01-01', '2023-01-02');

      // @ts-ignore - accessing private method for testing
      expect(client.processBlock).toHaveBeenCalledTimes(1); // Should stop after first block
    });
  });

  describe('Socket event handlers', () => {
    it('should emit events when receiving socket events', () => {
      // Find the socket.on calls and execute the callbacks
      const connectCallback = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
      const connectErrorCallback = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')[1];
      const newPendingTransactionCallback = mockSocket.on.mock.calls.find(call => call[0] === 'newPendingTransaction')[1];
      const newMinedTransactionCallback = mockSocket.on.mock.calls.find(call => call[0] === 'newMinedTransaction')[1];
      const disconnectCallback = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1];
      
      // Mock data
      const mockTransaction = { hash: '0x123', from: '0xabc', to: '0xdef' };
      const mockMinedResponse = { transaction: mockTransaction, blockNumber: 12345 };
      const mockError = new Error('Connection error');
      
      // Execute callbacks
      connectCallback();
      connectErrorCallback(mockError);
      newPendingTransactionCallback(mockTransaction);
      newMinedTransactionCallback(mockMinedResponse);
      disconnectCallback();
      
      // Verify EventEmitter was called correctly
      expect(eventEmitter.emit).toHaveBeenCalledWith(EventType.NewPendingTransaction, mockTransaction);
      expect(eventEmitter.emit).toHaveBeenCalledWith(EventType.NewMinedTransaction, mockMinedResponse);
    });
  });

  describe('Private methods', () => {
    it('should get block number from timestamp correctly', async () => {
      const mockResponse = {
        json: jest.fn().mockResolvedValue({
          data: [{ block: { number: '12345' } }]
        })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      // Access private method for testing
      // @ts-ignore
      const result = await client.getBlockNumberFromTimestamp('2023-01-01', 'BEFORE');
      
      expect(result).toBe(12345);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/ethereum?action=blockFromTimestamp&timestamp=2023-01-01&direction=BEFORE'
      );
    });
    
    it('should handle errors when getting block number from timestamp', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('API error'));
      
      // @ts-ignore
      await expect(client.getBlockNumberFromTimestamp('2023-01-01', 'BEFORE'))
        .rejects.toThrow();
    });
    
    it('should handle invalid response when getting block number', async () => {
      const mockResponse = {
        json: jest.fn().mockResolvedValue({
          data: [] // Empty data array
        })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      // @ts-ignore
      await expect(client.getBlockNumberFromTimestamp('2023-01-01', 'BEFORE'))
        .rejects.toThrow();
    });
    
    it('should validate block range correctly', () => {
      // @ts-ignore
      expect(client.validateBlockRange(100, 200)).toBe(true);
      // @ts-ignore
      expect(client.validateBlockRange(undefined, 200)).toBe(false);
      // @ts-ignore
      expect(client.validateBlockRange(200, undefined)).toBe(false);
      // @ts-ignore
      expect(client.validateBlockRange(200, 200)).toBe(false);
      // @ts-ignore
      expect(client.validateBlockRange(300, 200)).toBe(false);
    });

    it('should warn about large block ranges', () => {
      // Mock console.warn
      const originalConsoleWarn = console.warn;
      console.warn = jest.fn();
      
      try {
        // Test with a large block range (> 1000 blocks)
        // @ts-ignore
        client.validateBlockRange(1000, 2500);
        
        // Verify warning was logged
        expect(console.warn).toHaveBeenCalledWith(
          `Large block range (1500 blocks) may cause performance issues`
        );
        
        // Test with a normal block range
        jest.clearAllMocks();
        // @ts-ignore
        client.validateBlockRange(1000, 1500);
        // This range is only 500 blocks, so no warning should be triggered
        expect(console.warn).not.toHaveBeenCalled();
        
        // Test with a small block range
        jest.clearAllMocks();
        // @ts-ignore
        client.validateBlockRange(1000, 1100);
        expect(console.warn).not.toHaveBeenCalled();
      } finally {
        // Restore original console.warn
        console.warn = originalConsoleWarn;
      }
    });

    it('should stop block processing if end block before start block', async () => {
      // Mock getBlockNumberFromTimestamp responses
      // @ts-ignore - accessing private method for testing
      jest.spyOn(client, 'getBlockNumberFromTimestamp')
        .mockResolvedValueOnce(12347)  // Start block (higher)
        .mockResolvedValueOnce(12345); // End block (lower)

      // Mock processBlock
      // @ts-ignore - accessing private method for testing
      jest.spyOn(client, 'processBlock').mockResolvedValue();

      // Mock validateBlockRange
      // @ts-ignore - accessing private method for testing
      jest.spyOn(client, 'validateBlockRange').mockReturnValue(false);

      await client.getTransactionsFromRange('2023-01-01', '2023-01-02');

      // @ts-ignore - accessing private method for testing
      expect(client.getBlockNumberFromTimestamp).toHaveBeenCalledWith('2023-01-01', 'BEFORE');
      // @ts-ignore - accessing private method for testing
      expect(client.getBlockNumberFromTimestamp).toHaveBeenCalledWith('2023-01-02', 'AFTER');
      // @ts-ignore - accessing private method for testing
      expect(client.validateBlockRange).toHaveBeenCalledWith(12347, 12345);
      // @ts-ignore - accessing private method for testing
      expect(client.processBlock).not.toHaveBeenCalled(); // Should not process any blocks
    });
    
    it('should process block correctly', async () => {
      const mockBlock = {
        transactions: [
          { hash: '0x123', from: '0xabc', to: '0xdef' },
          { hash: '0x456', from: '0xghi', to: '0xjkl' }
        ]
      };
      
      const mockResponse = {
        json: jest.fn().mockResolvedValue(mockBlock)
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      // @ts-ignore
      await client.processBlock(12345);
      
      expect(global.fetch).toHaveBeenCalledWith('/api/ethereum?action=blockWithTransactions&blockNumber=12345');
      expect(eventEmitter.emit).toHaveBeenCalledTimes(2);
      expect(eventEmitter.emit).toHaveBeenCalledWith(EventType.TransactionFromBlock, mockBlock.transactions[0]);
      expect(eventEmitter.emit).toHaveBeenCalledWith(EventType.TransactionFromBlock, mockBlock.transactions[1]);
    });
    
    it('should handle errors when processing block', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('API error'));
      
      // @ts-ignore
      await client.processBlock(12345);
      
      // Should not throw and should log the error
      expect(global.fetch).toHaveBeenCalledWith('/api/ethereum?action=blockWithTransactions&blockNumber=12345');
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
    
    it('should stop processing block transactions when halt is true', async () => {
      const mockBlock = {
        transactions: [
          { hash: '0x123', from: '0xabc', to: '0xdef' },
          { hash: '0x456', from: '0xghi', to: '0xjkl' }
        ]
      };
      
      const mockResponse = {
        json: jest.fn().mockResolvedValue(mockBlock)
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      // Set halt to true after first transaction
      let transactionCount = 0;
      (eventEmitter.emit as jest.Mock).mockImplementation(() => {
        transactionCount++;
        if (transactionCount === 1) {
          client.setHalt(true);
        }
      });
      
      // @ts-ignore
      await client.processBlock(12345);
      
      expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
      expect(eventEmitter.emit).toHaveBeenCalledWith(EventType.TransactionFromBlock, mockBlock.transactions[0]);
      expect(eventEmitter.emit).not.toHaveBeenCalledWith(EventType.TransactionFromBlock, mockBlock.transactions[1]);
    });

    it('should handle missing block number in API response', async () => {
      // Mock response where block exists but number is missing
      const mockResponse = {
        json: jest.fn().mockResolvedValue({
          data: [{ block: {} }] // Block exists but number is missing
        })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      // @ts-ignore
      await expect(client.getBlockNumberFromTimestamp('2023-01-01', 'BEFORE'))
        .rejects.toThrow('Could not determine start block from API response');
    });
    
    it('should handle missing block in API response', async () => {
      // Mock response where data exists but block is missing
      const mockResponse = {
        json: jest.fn().mockResolvedValue({
          data: [{}] // Data exists but block is missing
        })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      // @ts-ignore
      await expect(client.getBlockNumberFromTimestamp('2023-01-01', 'BEFORE'))
        .rejects.toThrow('Could not determine start block from API response');
    });
    
    it('should handle empty block with no transactions', async () => {
      // Mock a block with no transactions
      const mockBlock = {
        transactions: [] // Empty transactions array
      };
      
      const mockResponse = {
        json: jest.fn().mockResolvedValue(mockBlock)
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      // Mock console.log to verify it's called
      const originalConsoleLog = console.log;
      console.log = jest.fn();
      
      try {
        // @ts-ignore
        await client.processBlock(12345);
        
        expect(global.fetch).toHaveBeenCalledWith('/api/ethereum?action=blockWithTransactions&blockNumber=12345');
        expect(console.log).toHaveBeenCalledWith('Emitting 0 transactions from block 12345');
        expect(eventEmitter.emit).not.toHaveBeenCalled();
      } finally {
        // Restore original console.log
        console.log = originalConsoleLog;
      }
    });
    
    it('should handle null response when processing block', async () => {
      // Mock a null block response
      const mockResponse = {
        json: jest.fn().mockResolvedValue(null)
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      // @ts-ignore
      await client.processBlock(12345);
      
      expect(global.fetch).toHaveBeenCalledWith('/api/ethereum?action=blockWithTransactions&blockNumber=12345');
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should use correct direction labels based on BEFORE/AFTER parameter', async () => {
      // Test for BEFORE direction (should use "start" label)
      const beforeResponse = {
        json: jest.fn().mockResolvedValue({
          data: [] // Empty data to trigger error
        })
      };
      (global.fetch as jest.Mock).mockResolvedValue(beforeResponse);
      
      // Mock console.error
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      try {
        // For BEFORE direction, should use "start" in the error message
        // @ts-ignore
        await expect(client.getBlockNumberFromTimestamp('2023-01-01', 'BEFORE'))
          .rejects.toThrow('Could not determine start block from API response');
        
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching start block:',
          expect.any(Object)
        );
        
        // Clear mocks for the next test
        jest.clearAllMocks();
        
        // Test for AFTER direction (should use "end" label)
        const afterResponse = {
          json: jest.fn().mockResolvedValue({
            data: [] // Empty data to trigger error
          })
        };
        (global.fetch as jest.Mock).mockResolvedValue(afterResponse);
        
        // For AFTER direction, should use "end" in the error message
        // @ts-ignore
        await expect(client.getBlockNumberFromTimestamp('2023-01-02', 'AFTER'))
          .rejects.toThrow('Could not determine end block from API response');
        
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching end block:',
          expect.any(Object)
        );
      } finally {
        // Restore original console.error
        console.error = originalConsoleError;
      }
    });
  });

  describe('Error handling in getTransactionsFromRange', () => {
    it('should handle errors in getTransactionsFromRange', async () => {
      // Mock an error during block fetch
      // @ts-ignore
      jest.spyOn(client, 'getBlockNumberFromTimestamp').mockRejectedValue(new Error('API error'));
      
      // Mock console.error
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      try {
        await client.getTransactionsFromRange('2023-01-01', '2023-01-02');
        
        // Verify error was logged
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining('Error in getBlocksFromDates'),
          expect.any(Error)
        );
      } finally {
        // Restore original console.error
        console.error = originalConsoleError;
      }
    });
  });
});
