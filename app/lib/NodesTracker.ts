import eventEmitter from '@/app/lib/EventEmitter';
import { EventType } from '@/app/types/event';
import EthereumApiClient from "@/app/lib/EthereumApiClient";
import { AddressInfo, AddressInfoResponse, Attributes } from '@/app/types/graph';
import { Transaction } from '@/app/types/transaction';

enum ATTRIBUTES {
    LABEL = 'label',
    NAME = 'name',
    WEBSITE = 'website',
    NAMETAG = 'nameTag',
    SYMBOL = 'symbol',
}

class NodesTracker {
    private nodes: Map<string, Attributes> = new Map();

    public getNodes(): Map<string, Attributes> {
        return this.nodes;
    }

    public getNode(address: string): Attributes | undefined {
        return this.nodes.get(address);
    }

    public resetTracker(): void {
        this.nodes.clear();
    }

    private simplifyAttributes(address: string, response: AddressInfoResponse, isContract: boolean): Attributes {
        const result: Attributes = { address: address, isContract, netBalance: 0, numTransactions: 0 };

        if (!response) {
            return result;
        }

        for (const entry of response) {
            for (const attribute of Object.values(ATTRIBUTES)) {
                const value = entry[attribute as keyof AddressInfo];
                if (value) {
                    if (!result[attribute]) {
                        result[attribute] = new Set();
                    }
                    if (typeof value === 'string') {
                        result[attribute].add(value);
                    }
                }
            }
        }

        return result;
    }

    private async fetchAttributesAndSaveNode(address: string, isTo=false): Promise<void> {
        const nodeAttributes: AddressInfoResponse = await EthereumApiClient.getInstance().getInfo(address);

        let isContract = false;
        if (isTo) {
            const contract = await EthereumApiClient.getInstance().isCode(address);
            if (contract !== '0x') {
                isContract = true; 
            }
        }

        const attributes = this.simplifyAttributes(address, nodeAttributes, isContract);
        this.nodes.set(address, attributes);
    }

    private async addNewAddress(address: string, isTo=false): Promise<void> {
        await this.fetchAttributesAndSaveNode(address, isTo);
        const isContract = this.nodes.get(address)?.isContract || false;

        eventEmitter.emit(EventType.AddAddressToGraph, address, isContract);
    }

    private updateNode(tx: Transaction, value: number, is_sender: boolean, is_removed: boolean): void {
        const address: string = is_sender ? tx.from : tx.to;
        const node = this.nodes.get(address);
        
        if (!node) return;
        
        node.numTransactions += is_removed ? -1 : 1;
        
        if (node.numTransactions === 0) {
            this.nodes.delete(address);
            eventEmitter.emit(EventType.RemoveAddressFromGraph, address);
            return;
        }
        
        const newBalance = node.netBalance + value;
        node.netBalance = newBalance;
        eventEmitter.emit(EventType.UpdateNodeNetBalance, address, newBalance);
    }

    public async updateNodesFromTransaction(tx: Transaction, is_removed: boolean = false) {
        await this.addNodesFromTransaction(tx);
        // todo: fix ghost nodes issue (nodes without transactions)
        const reverse_tx_multiplier = is_removed ? -1 : 1;

        this.updateNode(tx, -Number(tx.value) * reverse_tx_multiplier, true, is_removed);
        this.updateNode(tx, Number(tx.value) * reverse_tx_multiplier, false, is_removed);
    }

    private async addNodesFromTransaction(tx: Transaction) {
        if (!this.nodes.has(tx.from)) {
            await this.addNewAddress(tx.from);
        }
        if (!this.nodes.has(tx.to)) {
            await this.addNewAddress(tx.to, true);
        }
    }
}

export default NodesTracker;
