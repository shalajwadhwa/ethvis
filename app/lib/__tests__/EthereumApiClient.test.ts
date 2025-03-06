import EthereumApiClient from "@/app/lib/EthereumApiClient";
import { EventType } from "@/app/types/event";
import { AddressInfoResponse } from "@/app/types/graph";

// Define proper types for mocks
interface MockAlchemyCore {
    getCode: jest.Mock;
}

interface MockAlchemyWs {
    on: jest.Mock;
    off: jest.Mock;
}

interface MockAlchemy {
    ws: MockAlchemyWs;
    core: MockAlchemyCore;
}

jest.mock('alchemy-sdk', () => ({
    Alchemy: jest.fn().mockImplementation(() => ({
        ws: {
            on: jest.fn(),
            off: jest.fn()
        },
        core: {
            getCode: jest.fn()
        }
    })),
    Network: {
        ETH_MAINNET: 'eth-mainnet'
    },
    AlchemySubscription: {
        PENDING_TRANSACTIONS: 'pending-transactions'
    }
}));

jest.mock('@/app/lib/EventEmitter', () => ({
    __esModule: true,
    default: {
        emit: jest.fn()
    }
}));

import eventEmitter from "@/app/lib/EventEmitter";
import { Alchemy, Network, AlchemySubscription } from 'alchemy-sdk';

describe('EthereumApiClient', () => {
    let mockAlchemy: MockAlchemy;
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
        // Reset singleton instance - using unknown type as safer alternative to any
        (EthereumApiClient as unknown as { instance: EthereumApiClient | undefined }).instance = undefined;

        // Setup mock for Alchemy with proper types
        mockAlchemy = {
            ws: {
                on: jest.fn(),
                off: jest.fn()
            },
            core: {
                getCode: jest.fn()
            }
        };

        (Alchemy as jest.Mock).mockImplementation(() => mockAlchemy);

        // Mock fetch
        global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

        // Mock console.log
        consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        // Clear all mocks
        jest.clearAllMocks();
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    describe('getInstance', () => {
        it('should return the same instance when called multiple times', () => {
            const instance1 = EthereumApiClient.getInstance();
            const instance2 = EthereumApiClient.getInstance();
            expect(instance1).toBe(instance2);
        });

        it('should create instance with correct Alchemy settings', () => {
            EthereumApiClient.getInstance();
            expect(Alchemy).toHaveBeenCalledWith({
                apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
                network: Network.ETH_MAINNET
            });
        });
    });

    describe('subscribeToPendingTransactions', () => {
        it('should subscribe to pending transactions', () => {
            const client = EthereumApiClient.getInstance();
            client.subscribeToPendingTransactions();

            expect(mockAlchemy.ws.on).toHaveBeenCalledWith(
                { method: AlchemySubscription.PENDING_TRANSACTIONS },
                expect.any(Function)
            );
        });

        it('should emit events when transactions are received', () => {
            const client = EthereumApiClient.getInstance();
            client.subscribeToPendingTransactions();

            // Get the callback function passed to alchemy.ws.on
            const callback = mockAlchemy.ws.on.mock.calls[0][1];

            // Simulate transaction received
            const mockTransaction = { hash: '0x123456' };
            callback(mockTransaction);

            expect(eventEmitter.emit).toHaveBeenCalledWith(
                EventType.NewPendingTransaction,
                mockTransaction
            );
        });
    });

    describe('unsubscribeFromPendingTransactions', () => {
        it('should call alchemy.ws.off with empty object', () => {
            const client = EthereumApiClient.getInstance();
            client.unsubscribeFromPendingTransactions();

            expect(mockAlchemy.ws.off).toHaveBeenCalledWith({});
        });
    });

    describe('isCode', () => {
        it('should call alchemy.core.getCode with the address', async () => {
            const address = '0xabc123';
            const expectedCode = '0x606060';
            mockAlchemy.core.getCode.mockResolvedValue(expectedCode);

            const client = EthereumApiClient.getInstance();
            const result = await client.isCode(address);

            expect(mockAlchemy.core.getCode).toHaveBeenCalledWith(address);
            expect(result).toBe(expectedCode);
        });
    });

    describe('getInfo', () => {
        it('should fetch address info from correct URL', async () => {
            const address = '0xdef456';
            const mockResponse: AddressInfoResponse = [{ address: address, name: 'Test Contract' }];

            (global.fetch as jest.MockedFunction<() => Promise<Response>>).mockResolvedValue(
                {
                    json: jest.fn().mockResolvedValue(mockResponse),
                    headers: new Headers(),
                    ok: true,
                    redirected: false,
                    status: 200,
                    statusText: 'OK',
                    type: 'basic',
                    url: '',
                    clone: jest.fn(),
                    body: null,
                    bodyUsed: false,
                    arrayBuffer: jest.fn(),
                    blob: jest.fn(),
                    formData: jest.fn(),
                    text: jest.fn()
                } as unknown as Response
            );

            const client = EthereumApiClient.getInstance();
            const result = await client.getInfo(address);

            expect(global.fetch).toHaveBeenCalledWith(`http://localhost:3001/labels/${address}`);
            expect(result).toEqual(mockResponse);
        });

        it('should handle errors when fetching address info', async () => {
            const address = '0xdef456';
            const mockError = new Error('Network error');

            (global.fetch as jest.MockedFunction<() => Promise<Response>>).mockRejectedValue(mockError);

            const client = EthereumApiClient.getInstance();
            const result = await client.getInfo(address);

            expect(console.log).toHaveBeenCalledWith('Error fetching address info', mockError);
            expect(result).toBeUndefined();
        });
    });
});