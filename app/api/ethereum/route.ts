import { NextResponse } from 'next/server';

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const ETH_LABELS = process.env.ETH_LABELS;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const address = searchParams.get('address');
  const timestamp = searchParams.get('timestamp');
  const direction = searchParams.get('direction');
  const blockNumber = searchParams.get('blockNumber');

  try {
    switch (action) {
      case 'isCode':
        if (!address) return NextResponse.json({ error: 'Address is required' }, { status: 400 });
        
        try {          
          const response = await fetch(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'User-Agent': 'ethvis-server'
            },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'eth_getCode',
              params: [address, 'latest']
            }),
            referrerPolicy: 'no-referrer' as ReferrerPolicy
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error response from Alchemy: ${response.status} - ${errorText}`);
            throw new Error(`eth_getCode failed with status ${response.status}`);
          }
          
          const result = await response.json();
          
          if (result.error) {
            throw new Error(`JSON-RPC error: ${result.error.message || JSON.stringify(result.error)}`);
          }
          
          return NextResponse.json({ isCode: result.result !== '0x' });
        } catch (error) {
          console.error('eth_getCode error:', error);
          return NextResponse.json({ isCode: false, error: 'Failed to check code' });
        }

      case 'addressInfo':
        if (!address) return NextResponse.json({ error: 'Address is required' }, { status: 400 });
        
        try {
          const response = await fetch(`http://${ETH_LABELS}/labels/${address}`);
          
          if (!response.ok) {
            throw new Error(`Address info fetch failed with status ${response.status}`);
          }
          
          const data = await response.json();
          return NextResponse.json(data);
        } catch (error) {
          console.error('Address info fetch error:', error);
          return NextResponse.json([]);
        }

      case 'blockFromTimestamp':
        if (!timestamp || !direction) 
          return NextResponse.json({ error: 'Timestamp and direction are required' }, { status: 400 });
        
        try {
          const options = { 
            method: 'GET', 
            headers: { 
              'accept': 'application/json',
              'User-Agent': 'ethvis-server' 
            },
            referrerPolicy: 'no-referrer' as ReferrerPolicy
          };
          
          const url = `https://api.g.alchemy.com/data/v1/${ALCHEMY_API_KEY}/utility/blocks/by-timestamp?networks=eth-mainnet&timestamp=${timestamp}&direction=${direction}`;
          
          const timestampResponse = await fetch(url, options);
          
          if (!timestampResponse.ok) {
            throw new Error(`Block timestamp fetch failed with status ${timestampResponse.status}`);
          }
          
          const timestampData = await timestampResponse.json();
          return NextResponse.json(timestampData);
        } catch (error) {
          console.error('Block timestamp fetch error:', error);
          return NextResponse.json({ error: 'Failed to fetch block by timestamp' }, { status: 500 });
        }

      case 'blockWithTransactions':
        if (!blockNumber) return NextResponse.json({ error: 'Block number is required' }, { status: 400 });
        
        try {
          console.log(`Fetching block with transactions: ${blockNumber}`);
          
          const blockHex = `0x${parseInt(blockNumber).toString(16)}`;
          
          const response = await fetch(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'User-Agent': 'ethvis-server'
            },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'eth_getBlockByNumber',
              params: [blockHex, true]
            }),
            referrerPolicy: 'no-referrer' as ReferrerPolicy
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error response from Alchemy: ${response.status} - ${errorText}`);
            throw new Error(`Block fetch failed with status ${response.status}`);
          }
          
          const result = await response.json();
          
          if (result.error) {
            throw new Error(`JSON-RPC error: ${result.error.message || JSON.stringify(result.error)}`);
          }
          
          if (!result.result) {
            throw new Error('No block data returned');
          }
          
          return NextResponse.json({
            hash: result.result.hash,
            parentHash: result.result.parentHash,
            number: parseInt(result.result.number, 16),
            timestamp: parseInt(result.result.timestamp, 16),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            transactions: result.result.transactions.map((tx: any) => ({
              hash: tx.hash,
              from: tx.from,
              to: tx.to || null,
              value: tx.value,
              gasPrice: tx.gasPrice,
              maxFeePerGas: tx.maxFeePerGas,
              maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
              gas: tx.gas,
              input: tx.input,
              nonce: parseInt(tx.nonce, 16),
            }))
          });
        } catch (error) {
          console.error('Block with transactions fetch error:', error);
          return NextResponse.json({ 
            error: `Failed to fetch block with transactions: ${error instanceof Error ? error.message : 'Unknown error'}` 
          }, { status: 500 });
        }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
