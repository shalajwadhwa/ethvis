import eventEmitter from '@/app/lib/EventEmitter';
import { Transaction } from '@/app/types/transaction';
import { EventType } from '@/app/types/event';
import EthereumApiClient from "@/app/lib/EthereumApiClient";
import { AddressInfo, AddressInfoResponse, Attributes } from '@/app/types/graph';
import TopNodesTracker from '@/app/lib/TopNodesTracker';
import MempoolTracker from '@/app/lib/MempoolTracker';

enum ATTRIBUTES {
    LABEL = 'label',
    NAME = 'name',
    WEBSITE = 'website',
    NAMETAG = 'nameTag',
    SYMBOL = 'symbol',
}

class EthereumTracker {
    private static instance: EthereumTracker;
    private nodes: Map<string, Attributes> = new Map();
    private topNodesTracker: TopNodesTracker = new TopNodesTracker();
    private mempoolTracker: MempoolTracker = new MempoolTracker();

    public static getInstance(): EthereumTracker {
        if (!EthereumTracker.instance) {
            EthereumTracker.instance = new EthereumTracker();
        }

        return EthereumTracker.instance;
    }

    public shiftMempool() {
        const to_remove = this.mempoolTracker.shift();
        if (to_remove) {
            this.updateNetBalanceFromTransaction(to_remove, true);
        }
    }

    public appendMempool(tx: Transaction) {
        this.mempoolTracker.append(tx);
        this.updateNetBalanceFromTransaction(tx);
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

    public async fetchAttributesAndSaveNode(address: string, isTo=false) {
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

    public getNodes() {
        return this.nodes;
    }

    public async addNewAddress(address: string, isTo=false) {
        await this.fetchAttributesAndSaveNode(address, isTo);
        const isContract = this.nodes.get(address)?.isContract || false;

        eventEmitter.emit(EventType.AddAddressToGraph, address, isContract);
    }

    public async addPendingTransaction(tx: Transaction) {
        if (this.mempoolTracker.isAtCapacity()) {
            this.shiftMempool();
        }

        if (!this.nodes.get(tx.from)) {
            await this.addNewAddress(tx.from);
        }
        if (!this.nodes.get(tx.to)) {
            await this.addNewAddress(tx.to, true);
        }

        this.appendMempool(tx);
    }

    public getNetBalance(node: string) {
        return this.nodes.get(node)?.netBalance || 0;
    }

    public getTopNodes() {
        return this.topNodesTracker.getTopNodes();
    }

    public updateTopNodes(node: string) {
        if (!this.nodes.get(node)) {
            return;
        }

        this.topNodesTracker.updateTopNodes(this.nodes.get(node)!);
    }

    public setNetBalance(node: string, value: number) {
        if (!this.nodes.has(node)) {
            // Create a new node if it doesn't exist
            this.nodes.set(node, {
                address: node,
                netBalance: 0,
                isContract: false
            });
        }
        
        // Now we can safely set the netBalance
        this.nodes.get(node)!.netBalance = value;
        this.updateTopNodes(node);
    }

    public updateNetBalance(tx: Transaction, value: number, is_sender: boolean) {
        const node = is_sender ? tx.from : tx.to;

        const prev_balance = this.getNetBalance(node);
        this.setNetBalance(node, prev_balance + value);
        eventEmitter.emit(EventType.UpdateNodeNetBalance, tx, value, is_sender);
    }

    public updateNetBalanceFromTransaction(tx: Transaction, is_removed: boolean = false) {
        const reverse_tx_multiplier = is_removed ? -1 : 1;

        this.updateNetBalance(tx, -Number(tx.value) * reverse_tx_multiplier, true);
        this.updateNetBalance(tx, Number(tx.value) * reverse_tx_multiplier, false);
    }
}

export default EthereumTracker;