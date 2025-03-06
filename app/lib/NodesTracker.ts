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

    public hasNode(address: string): boolean {
        return this.nodes.has(address);
    }

    private simplifyAttributes(address: string, response: AddressInfoResponse, isContract: boolean): Attributes {
        const result: Attributes = { address: address, isContract, netBalance: 0 };

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

    public getNetBalance(address: string): number {
        return this.nodes.get(address)?.netBalance || 0;
    }

    private setNetBalance(address: string, value: number): void {
        if (!this.nodes.has(address)) {
            // Create a new node if it doesn't exist
            this.nodes.set(address, {
                address: address,
                netBalance: 0,
                isContract: false
            });
        }
        
        this.nodes.get(address)!.netBalance = value;
        eventEmitter.emit(EventType.UpdateNodeNetBalance, address, value);
    }

    public updateNetBalance(tx: Transaction, value: number, is_sender: boolean) {
        const node: string = is_sender ? tx.from : tx.to;

        const prev_balance: number = this.getNetBalance(node);
        this.setNetBalance(node, prev_balance + value);
    }

    public async addNodesFromTransaction(tx: Transaction) {
            if (!this.hasNode(tx.from)) {
                await this.addNewAddress(tx.from);
            }
            if (!this.hasNode(tx.to)) {
                await this.addNewAddress(tx.to, true);
            }
        }
}

export default NodesTracker;
