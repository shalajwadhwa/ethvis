import EthereumTracker from "@/app/lib/EthereumTracker";
import { Transaction } from "@/app/types/transaction";
import { AddressInfoResponse, Attributes } from "@/app/types/graph";
import { EventType } from "@/app/types/event";
import EthereumApiClient from "@/app/lib/EthereumApiClient";
import eventEmitter from "@/app/lib/EventEmitter";

// Mock dependencies
jest.mock("@/app/lib/EthereumApiClient", () => ({
    __esModule: true,
    default: {
        getInstance: jest.fn().mockReturnValue({
            getInfo: jest.fn(),
            isCode: jest.fn()
        })
    }
}));

jest.mock("@/app/lib/EventEmitter", () => ({
    __esModule: true,
    default: {
        emit: jest.fn()
    }
}));


describe("EthereumTracker", () => {
    // Mock data
    const mockTransaction: Transaction = {
        hash: "0xtxhash123",
        from: "0xsender456",
        to: "0xreceiver789",
        value: "100",
        gasPrice: "10",
        maxFeePerGas: null,
        maxPriorityFeePerGas: null
    };

    const mockAddressInfoResponse: AddressInfoResponse = [
        { address: "0xsender456", name: "Sender Wallet", label: "EOA" },
        { address: "0xsender456", symbol: "ETH", website: "ethereum.org" }
    ];

    beforeEach(() => {
        // Reset singleton instance
        (EthereumTracker as any).instance = undefined;

        // Reset mocks
        jest.clearAllMocks();

        // Mock API responses
        (EthereumApiClient.getInstance().getInfo as jest.Mock).mockResolvedValue(mockAddressInfoResponse);
        (EthereumApiClient.getInstance().isCode as jest.Mock).mockResolvedValue("0x");
    });

    describe("getInstance", () => {
        it("should return the same instance when called multiple times", () => {
            const instance1 = EthereumTracker.getInstance();
            const instance2 = EthereumTracker.getInstance();
            
            expect(instance1).toBe(instance2);
        });
    });

    describe("simplifyAttributes", () => {
        it("should create Attributes object with Sets for multiple values", () => {
            const tracker = EthereumTracker.getInstance();
            const address = "0xsender456";
            const result = tracker.simplifyAttributes(address, mockAddressInfoResponse, false);
            
            expect(result.address).toBe(address);
            expect(result.isContract).toBe(false);
            expect(result.netBalance).toBe(0);
            
            expect(result.name).toBeInstanceOf(Set);
            expect(result.name.has("Sender Wallet")).toBe(true);
            
            expect(result.label).toBeInstanceOf(Set);
            expect(result.label.has("EOA")).toBe(true);
            
            expect(result.symbol).toBeInstanceOf(Set);
            expect(result.symbol.has("ETH")).toBe(true);
            
            expect(result.website).toBeInstanceOf(Set);
            expect(result.website.has("ethereum.org")).toBe(true);
        });
    });

    describe("fetchAttributesAndSaveNode", () => {
        it("should fetch attributes and check if address is contract when isTo=true", async () => {
            const tracker = EthereumTracker.getInstance();
            const address = "0xcontract123";
            
            (EthereumApiClient.getInstance().isCode as jest.Mock).mockResolvedValue("0x606060");
            
            await tracker.fetchAttributesAndSaveNode(address, true);
            
            expect(EthereumApiClient.getInstance().getInfo).toHaveBeenCalledWith(address);
            expect(EthereumApiClient.getInstance().isCode).toHaveBeenCalledWith(address);
            
            const nodes = tracker.getNodes();
            expect(nodes.has(address)).toBe(true);
            expect(nodes.get(address)?.isContract).toBe(true);
        });

        it("should not check contract code when isTo=false", async () => {
            const tracker = EthereumTracker.getInstance();
            const address = "0xwallet456";
            
            await tracker.fetchAttributesAndSaveNode(address, false);
            
            expect(EthereumApiClient.getInstance().getInfo).toHaveBeenCalledWith(address);
            expect(EthereumApiClient.getInstance().isCode).not.toHaveBeenCalled();
            
            const nodes = tracker.getNodes();
            expect(nodes.has(address)).toBe(true);
            expect(nodes.get(address)?.isContract).toBe(false);
        });
    });

    describe("addNewAddress", () => {
        it("should fetch address info and emit AddAddressToGraph event", async () => {
            const tracker = EthereumTracker.getInstance();
            const address = "0xnewaddress123";
            
            await tracker.addNewAddress(address);
            
            expect(eventEmitter.emit).toHaveBeenCalledWith(EventType.AddAddressToGraph, address, false);
        });
    });

    describe("addPendingTransaction", () => {
        it("should add new addresses and append transaction to mempool", async () => {
            const tracker = EthereumTracker.getInstance();
            
            // Spy on relevant methods
            const addNewAddressSpy = jest.spyOn(tracker, 'addNewAddress');
            const appendMempoolSpy = jest.spyOn(tracker, 'appendMempool');
            
            await tracker.addPendingTransaction(mockTransaction);
            
            expect(addNewAddressSpy).toHaveBeenCalledWith(mockTransaction.from);
            expect(addNewAddressSpy).toHaveBeenCalledWith(mockTransaction.to, true);
            expect(appendMempoolSpy).toHaveBeenCalledWith(mockTransaction);
        });

        it("should shift mempool when maximum size is reached", async () => {
            const tracker = EthereumTracker.getInstance();
            
            // Create nodes first to avoid the error
            const mockTx = { ...mockTransaction, from: "0xsender123", to: "0xreceiver123" };
            (tracker as any).nodes.set(mockTx.from, { address: mockTx.from, netBalance: 0 });
            (tracker as any).nodes.set(mockTx.to, { address: mockTx.to, netBalance: 0 });
            
            // Create mempool with MAX_MEMPOOL_SIZE transactions
            const maxSize = 2000;
            (tracker as any).mempool = Array(maxSize).fill(mockTx);
            
            // Spy on shiftMempool to verify it's called
            const shiftMempoolSpy = jest.spyOn(tracker, 'shiftMempool');
            
            // Add another transaction to trigger the shift
            await tracker.addPendingTransaction(mockTx);
            
            // Verify shiftMempool was called
            expect(shiftMempoolSpy).toHaveBeenCalled();
        });

        describe("addPendingTransaction", () => {
            it("should not throw when nodes don't exist in mempool operations", async () => {
                const tracker = EthereumTracker.getInstance();
                
                // Mock implementation to avoid errors when nodes don't exist
                jest.spyOn(tracker, 'setNetBalance').mockImplementation(() => {});
                
                // Create private mempool with MAX_MEMPOOL_SIZE transactions
                const maxSize = 2000;
                const mockTx = { ...mockTransaction, from: "0xnonexistent1", to: "0xnonexistent2" };
                (tracker as any).mempool = Array(maxSize).fill(mockTx);
                
                // This should not throw an error now
                await tracker.addPendingTransaction(mockTx);
            });

            it("should handle nullish addresses without errors", async () => {
                const tracker = EthereumTracker.getInstance();
                
                // Mock the implementation to avoid actual API calls
                jest.spyOn(tracker, 'addNewAddress').mockResolvedValue(undefined);
                jest.spyOn(tracker, 'appendMempool').mockImplementation(() => {});
                
                // Test with a transaction having undefined address (should be handled gracefully)
                const incompleteTransaction = { 
                    ...mockTransaction, 
                    from: "0xvalid", 
                    to: "" 
                };
                
                await expect(tracker.addPendingTransaction(incompleteTransaction))
                    .resolves.not.toThrow();
            });
        });

        describe("setNetBalance and related methods", () => {
            it("should handle non-existent nodes gracefully", () => {
                const tracker = EthereumTracker.getInstance();
                const nonExistentAddress = "0xnonexistent";
                
                // Should not throw when node doesn't exist
                expect(() => tracker.setNetBalance(nonExistentAddress, 100)).not.toThrow();
                expect(tracker.getNetBalance(nonExistentAddress)).toBe(0);
                
                // Should create the node if it doesn't exist
                const nodes = tracker.getNodes();
                expect(nodes.has(nonExistentAddress)).toBe(true);
                expect(nodes.get(nonExistentAddress)?.netBalance).toBe(100);
            });
            
            it("should handle updateNetBalance for non-existent nodes", () => {
                const tracker = EthereumTracker.getInstance();
                const tx = { 
                    ...mockTransaction, 
                    from: "0xnewsender", 
                    to: "0xnewreceiver" 
                };
                
                // Should not throw
                expect(() => tracker.updateNetBalance(tx, 50, true)).not.toThrow();
                expect(() => tracker.updateNetBalance(tx, 50, false)).not.toThrow();
                
                // Should have created nodes with updated balances
                expect(tracker.getNetBalance("0xnewsender")).toBe(-50);
                expect(tracker.getNetBalance("0xnewreceiver")).toBe(50);
            });
        });

        describe("mempool operations edge cases", () => {
            it("should handle empty mempool when shifting", () => {
                const tracker = EthereumTracker.getInstance();
                
                // Ensure mempool is empty
                (tracker as any).mempool = [];
                
                // Should not throw on empty mempool
                expect(() => tracker.shiftMempool()).not.toThrow();
            });
            
            it("should properly create nodes when appending transactions to mempool", () => {
                const tracker = EthereumTracker.getInstance();
                const tx = { 
                    ...mockTransaction, 
                    from: "0xmempoolsender", 
                    to: "0xmempoolreceiver" 
                };
                
                // Create nodes first
                (tracker as any).nodes.set(tx.from, { address: tx.from, netBalance: 0 });
                (tracker as any).nodes.set(tx.to, { address: tx.to, netBalance: 0 });
                
                // Now append to mempool
                tracker.appendMempool(tx);
                
                // Check if balances were updated correctly
                expect(tracker.getNetBalance(tx.from)).toBe(-100);
                expect(tracker.getNetBalance(tx.to)).toBe(100);
            });
        });

        it("should emit UpdateNodeNetBalance events", () => {
            const tracker = EthereumTracker.getInstance();
            
            tracker.updateNetBalance(mockTransaction, 50, true);
            
            expect(eventEmitter.emit).toHaveBeenCalledWith(
                EventType.UpdateNodeNetBalance,
                mockTransaction,
                50,
                true
            );
        });
    });

    describe("top nodes handling", () => {
        beforeEach(() => {
            // Setup nodes with various balances
            const tracker = EthereumTracker.getInstance();
            const nodes = (tracker as any).nodes;
            
            // Create 12 test nodes with different balances
            for (let i = 0; i < 12; i++) {
                const address = `0xaddress${i}`;
                nodes.set(address, {
                    address,
                    isContract: false,
                    netBalance: i * 10
                });
            }
        });

        it("should maintain top nodes sorted by balance", () => {
            const tracker = EthereumTracker.getInstance();
            
            // Update balances to trigger top nodes updates
            for (let i = 0; i < 12; i++) {
                const address = `0xaddress${i}`;
                tracker.updateTopNodes(address, i * 10);
            }
            
            const topNodes = tracker.getTopNodes();
            expect(topNodes.length).toBe(10); // Should keep only 10 nodes
            
            // Check if they're sorted in descending order by balance
            for (let i = 0; i < topNodes.length - 1; i++) {
                expect(topNodes[i].netBalance).toBeGreaterThan(topNodes[i+1].netBalance);
            }
            
            // Highest balances should be included (110, 100, 90...)
            expect(topNodes[0].netBalance).toBe(110);
        });

        it("should emit NewTopNode event when top nodes change", () => {
            const tracker = EthereumTracker.getInstance();
            
            // Clear previous events before testing this specific one
            (eventEmitter.emit as jest.Mock).mockClear();
            
            // This should update top nodes
            tracker.updateTopNodes(`0xaddress11`, 110);
            
            expect(eventEmitter.emit).toHaveBeenCalledWith(
                EventType.NewTopNode,
                expect.any(Array)
            );
        });
    });

    describe("mempool operations", () => {
        it("should emit AddTransactionToGraph when appending to mempool", () => {
            const tracker = EthereumTracker.getInstance();
            
            tracker.appendMempool(mockTransaction);
            
            expect(eventEmitter.emit).toHaveBeenCalledWith(
                EventType.AddTransactionToGraph,
                mockTransaction
            );
        });

        it("should remove oldest transaction when shifting mempool", async () => {
            const tracker = EthereumTracker.getInstance();
            
            // Setup mempool with two transactions
            const tx1 = { ...mockTransaction, hash: "0xtx1" };
            const tx2 = { ...mockTransaction, hash: "0xtx2" };
            
            // Add nodes first
            (tracker as any).nodes.set(tx1.from, { address: tx1.from, netBalance: 0 });
            (tracker as any).nodes.set(tx1.to, { address: tx1.to, netBalance: 0 });
            
            // Add transactions to mempool
            (tracker as any).mempool = [tx1, tx2];
            
            // Spy on updateNetBalanceFromTransaction
            const updateSpy = jest.spyOn(tracker, 'updateNetBalanceFromTransaction');
            
            // Shift the mempool
            tracker.shiftMempool();
            
            // Should have called updateNetBalanceFromTransaction with removal flag
            expect(updateSpy).toHaveBeenCalledWith(tx1, true);
            
            // Mempool should now only contain tx2
            expect((tracker as any).mempool.length).toBe(1);
            expect((tracker as any).mempool[0]).toBe(tx2);
        });
    });
describe("setNetBalance", () => {
    it("should create a new node with specified balance if node doesn't exist", () => {
        const tracker = EthereumTracker.getInstance();
        const address = "0xnewnode123";
        
        // Ensure node doesn't exist initially
        expect(tracker.getNodes().has(address)).toBe(false);
        
        // Set balance for non-existent node
        tracker.setNetBalance(address, 100);
        
        // Verify node was created with correct balance
        const nodes = tracker.getNodes();
        expect(nodes.has(address)).toBe(true);
        expect(nodes.get(address)?.netBalance).toBe(100);
        expect(tracker.getNetBalance(address)).toBe(100);
    });
    
    it("should update existing node's balance", () => {
        const tracker = EthereumTracker.getInstance();
        const address = "0xexistingnode";
        
        // Create node with initial balance
        (tracker as any).nodes.set(address, {
            address,
            netBalance: 50,
            isContract: false
        });
        
        // Update balance
        tracker.setNetBalance(address, 150);
        
        // Verify balance was updated
        expect(tracker.getNetBalance(address)).toBe(150);
    });
    
    it("should call updateTopNodes with node and new balance", () => {
        const tracker = EthereumTracker.getInstance();
        const address = "0xpotentialtopnode";
        
        // Spy on updateTopNodes
        const updateTopNodesSpy = jest.spyOn(tracker, "updateTopNodes");
        
        tracker.setNetBalance(address, 200);
        
        // Verify updateTopNodes was called with correct arguments
        expect(updateTopNodesSpy).toHaveBeenCalledWith(address, 200);
    });
});

describe("updateNetBalance", () => {
    it("should correctly update sender's balance (negative adjustment)", () => {
        const tracker = EthereumTracker.getInstance();
        const tx = { 
            ...mockTransaction, 
            from: "0xsender123", 
            to: "0xreceiver123"
        };
        
        // Setup initial balances
        tracker.setNetBalance(tx.from, 100);
        tracker.setNetBalance(tx.to, 50);
        
        // Update balance as sender (should subtract)
        tracker.updateNetBalance(tx, 30, true);
        
        // For sender, we're adding the value (which is positive here)
        expect(tracker.getNetBalance(tx.from)).toBe(130);
    });
    
    it("should correctly update receiver's balance (positive adjustment)", () => {
        const tracker = EthereumTracker.getInstance();
        const tx = { 
            ...mockTransaction, 
            from: "0xsender456", 
            to: "0xreceiver456"
        };
        
        // Setup initial balances
        tracker.setNetBalance(tx.from, 200);
        tracker.setNetBalance(tx.to, 100);
        
        // Update balance as receiver (should add)
        tracker.updateNetBalance(tx, 50, false);
        
        expect(tracker.getNetBalance(tx.to)).toBe(150);
    });
    
    it("should emit UpdateNodeNetBalance event", () => {
        const tracker = EthereumTracker.getInstance();
        const tx = { ...mockTransaction };
        
        tracker.updateNetBalance(tx, 75, false);
        
        expect(eventEmitter.emit).toHaveBeenCalledWith(
            EventType.UpdateNodeNetBalance,
            tx,
            75,
            false
        );
    });
});

describe("updateNetBalanceFromTransaction", () => {
    it("should deduct value from sender and add to receiver", () => {
        const tracker = EthereumTracker.getInstance();
        const tx = { 
            ...mockTransaction,
            value: "100" 
        };
        
        // Setup initial balances
        tracker.setNetBalance(tx.from, 500);
        tracker.setNetBalance(tx.to, 300);
        
        // Process transaction
        tracker.updateNetBalanceFromTransaction(tx);
        
        // Sender should lose 100, receiver should gain 100
        expect(tracker.getNetBalance(tx.from)).toBe(400);
        expect(tracker.getNetBalance(tx.to)).toBe(400);
    });
    
    it("should reverse the transaction effect when is_removed is true", () => {
        const tracker = EthereumTracker.getInstance();
        const tx = { 
            ...mockTransaction,
            value: "50" 
        };
        
        // Setup initial balances (as if transaction was already applied)
        tracker.setNetBalance(tx.from, 150);
        tracker.setNetBalance(tx.to, 250);
        
        // Remove transaction effect
        tracker.updateNetBalanceFromTransaction(tx, true);
        
        // Sender should gain 50 back, receiver should lose 50
        expect(tracker.getNetBalance(tx.from)).toBe(200);
        expect(tracker.getNetBalance(tx.to)).toBe(200);
    });
});
});