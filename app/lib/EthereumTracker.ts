import eventEmitter from '@/app/lib/EventEmitter';
import { Transaction } from '@/app/types/transaction';
import { EventType } from '@/app/types/event';
import EthereumApiClient from "@/app/lib/EthereumApiClient";
import { AddressInfo, AddressInfoResponse } from '@/app/types/graph';

const MAX_MEMPOOL_SIZE = 2000;

class EthereumTracker {
    private static instance: EthereumTracker;
    private mempool: Transaction[] = [];
    private nodes: Map<string, AddressInfo> = new Map();

    public static getInstance(): EthereumTracker {
        if (!EthereumTracker.instance) {
            EthereumTracker.instance = new EthereumTracker();
        }

        return EthereumTracker.instance;
    }

    public shiftMempool() {
        const to_remove: Transaction | undefined = this.mempool.shift();
        if (to_remove) {
            this.updateNetBalanceFromTransaction(to_remove, true);
        }
    }

    public appendMempool(tx: Transaction) {
        this.mempool.push(tx);
        eventEmitter.emit(EventType.AddTransactionToGraph, tx);
        this.updateNetBalanceFromTransaction(tx);
    }

    public simplifyAttributes(response: AddressInfoResponse, isContract: boolean) {
        if (response.length === 0) {
            return { isContract: isContract };
        }
        const address = response[0].address;
        const labels = new Set();
        const names = new Set();
        const websites = new Set();
        const nameTags = new Set();
        const symbols = new Set();
        for (const entry of response) {
            if (entry.label) {
                labels.add(entry.label);
            }
            if (entry.name) {
                names.add(entry.name);
            }
            if (entry.website) {
                websites.add(entry.website);
            }
            if (entry.nameTag) {
                nameTags.add(entry.nameTag);
            }
            if (entry.symbol) {
                symbols.add(entry.symbol);
            }
        }

        return { address, labels, names, websites, nameTags, symbols, isContract: isContract };
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

        const attributes = this.simplifyAttributes(nodeAttributes, isContract);
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
        if (this.mempool.length >= MAX_MEMPOOL_SIZE) {
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

    public setNetBalance(node: string, value: number) {
        this.nodes.get(node)!.netBalance = value;
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