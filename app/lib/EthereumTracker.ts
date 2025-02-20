import eventEmitter from '@/app/lib/EventEmitter';
import { Transaction } from '@/app/types/transaction';
import { EventType } from '@/app/types/event';
import EthereumApiClient from "@/app/lib/EthereumApiClient";
import { AddressInfoResponse } from '@/app/types/graph';

class EthereumTracker {
    private static instance: EthereumTracker;
    private net_balance: Map<string, number> = new Map();
    private mempool: Transaction[] = [];
    private max_mempool_size: number = 2000;

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

    public createAttributesFromResponse(response: AddressInfoResponse) {
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

        return { address, labels, names, websites, nameTags, symbols };
    }

    public async addNewAddress(address: string) {
        const response: AddressInfoResponse = await EthereumApiClient.getInstance().getInfo(address);

        let attributes = {};
        if (response.length > 0) {
            attributes = this.createAttributesFromResponse(response);
        }
        

        console.log("Adding address to graph with attributes", attributes);
        eventEmitter.emit(EventType.AddAddressToGraph, address, attributes);
    }

    public async addPendingTransaction(tx: Transaction) {
        if (this.mempool.length >= this.max_mempool_size) {
            this.shiftMempool();
        }

        if (!this.net_balance.has(tx.from)) {
            await this.addNewAddress(tx.from);
        }
        if (!this.net_balance.has(tx.to)) {
            await this.addNewAddress(tx.to);
        }

        this.appendMempool(tx);
    }

    public updateNetBalance(tx: Transaction, value: number, is_sender: boolean) {
        const node = is_sender ? tx.from : tx.to;

        const prev_balance = this.net_balance.get(node) || 0;
        this.net_balance.set(node, prev_balance + value);
        eventEmitter.emit(EventType.UpdateNodeNetBalance, tx, value, is_sender);
    }

    public updateNetBalanceFromTransaction(tx: Transaction, is_removed: boolean = false) {
        const reverse_tx_multiplier = is_removed ? -1 : 1;

        this.updateNetBalance(tx, -Number(tx.value) * reverse_tx_multiplier, true);
        this.updateNetBalance(tx, Number(tx.value) * reverse_tx_multiplier, false);
    }
}

export default EthereumTracker;