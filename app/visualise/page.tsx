'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import EthereumApiClient from '../lib/EthereumApiClient';
import { addTransactionsToGraph } from "@/app/visualise/components/GraphLogic";
import { Transaction } from "@/app/VisualisationTypes";
import { SigmaContainer } from '@react-sigma/core';
import "@react-sigma/core/lib/style.css";
import Sigma from 'sigma';
import { useWorkerLayoutForceAtlas2 } from "@react-sigma/layout-forceatlas2";
import { ForceAtlas2LayoutParameters } from 'graphology-layout-forceatlas2';

type NodeType = { x: number; y: number; label: string; size: number };
type EdgeType = { label: string };

const Fa2Graph = () => {
  const options: ForceAtlas2LayoutParameters = {
    settings: {
      linLogMode: false,
      outboundAttractionDistribution: false,
      adjustSizes: false,
      edgeWeightInfluence: 1,
      scalingRatio: 0.01,
      strongGravityMode: true,
      gravity: 1,
      barnesHutOptimize: true,
      barnesHutTheta: 0.9,
      slowDown: 20,
    },
  };

  const { start, stop, isRunning } = useWorkerLayoutForceAtlas2(options);

  if (!isRunning) {
    console.log("starting FA2");
    start();
  }

  return (
    <div>
    </div>
  );
};

const VisualisePage = () => {
  const [tx, setTx] = useState<Transaction>();
  const client = new EthereumApiClient();
  const count = useRef(0);

  const [sigma, setSigma] = useState<Sigma<NodeType, EdgeType> | null>(null);

  const handleNewBlock = (newTransaction: Transaction) => {
    console.log('New transaction received', newTransaction);
    setTx(newTransaction);
  };

  if (count.current === 0) {
    client.subscribeToPendingTransactions(handleNewBlock);
    console.log("running the container");
    count.current++;
  }

  useEffect(() => {
      if (sigma) {
        const graph = sigma.getGraph();
        sigma.setSetting('labelRenderedSizeThreshold', 100000);
        if (tx) {
          console.log('Graph', graph.order);
          addTransactionsToGraph(graph, [tx]);
        }
      }
  }, [sigma, tx]);

  return (
      <div>
          <h1>Visualization Page</h1>
          <Link href='/'>Back to home</Link>
            <SigmaContainer ref={setSigma} style={{ width: '100vw', height: '100vh' }}>
              <Fa2Graph />
            </SigmaContainer>
      </div>
  );
};

export default VisualisePage;