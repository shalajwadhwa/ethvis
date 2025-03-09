import EthereumApiClient from "@/app/lib/EthereumApiClient";
import { AddressInfo, AddressInfoResponse, Attributes } from '@/app/types/graph';
import { Transaction } from '@/app/types/transaction';
import GraphHandler from './GraphHandler';

enum ATTRIBUTES {
    LABEL = 'label',
    NAME = 'name',
    WEBSITE = 'website',
    NAMETAG = 'nameTag',
    SYMBOL = 'symbol',
}

class NodesTracker {
    private nodes: Map<string, Attributes> = new Map();

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

        GraphHandler.addNode(address, isContract);
    }

    private updateNode(node: string, value: number, remove: boolean): void {
        const attributes: Attributes | undefined = this.nodes.get(node);
        
        if (!attributes) return;
        
        attributes.numTransactions += remove ? -1 : 1;
        
        if (attributes.numTransactions === 0) {
            this.nodes.delete(node);
            GraphHandler.removeNode(node);
            return;
        }
        
        const newBalance = attributes.netBalance + value;
        attributes.netBalance = newBalance;
        GraphHandler.updateNodeColour(node, newBalance);
    }

    public async mempoolUpdate(tx: Transaction, remove: boolean = false) {
        await this.addNodesFromTransaction(tx);
        // todo: fix ghost nodes issue (nodes without transactions)
        const reverse_tx_multiplier = remove ? -1 : 1;

        this.updateNode(tx.to, -Number(tx.value) * reverse_tx_multiplier, remove);
        this.updateNode(tx.from, Number(tx.value) * reverse_tx_multiplier, remove);
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
