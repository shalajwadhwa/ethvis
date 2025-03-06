import eventEmitter from '@/app/lib/EventEmitter';
import { EventType } from '@/app/types/event';
import EthereumApiClient from "@/app/lib/EthereumApiClient";
import { AddressInfo, AddressInfoResponse, Attributes } from '@/app/types/graph';

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

    public simplifyAttributes(address: string, response: AddressInfoResponse, isContract: boolean): Attributes {
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

    public async fetchAttributesAndSaveNode(address: string, isTo=false): Promise<void> {
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

    public async addNewAddress(address: string, isTo=false): Promise<void> {
        await this.fetchAttributesAndSaveNode(address, isTo);
        const isContract = this.nodes.get(address)?.isContract || false;

        eventEmitter.emit(EventType.AddAddressToGraph, address, isContract);
    }

    public getNetBalance(address: string): number {
        return this.nodes.get(address)?.netBalance || 0;
    }

    public setNetBalance(address: string, value: number): void {
        if (!this.nodes.has(address)) {
            // Create a new node if it doesn't exist
            this.nodes.set(address, {
                address: address,
                netBalance: 0,
                isContract: false
            });
        }
        
        this.nodes.get(address)!.netBalance = value;
    }
}

export default NodesTracker;
