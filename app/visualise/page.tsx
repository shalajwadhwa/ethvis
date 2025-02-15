'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import EthereumApiClient from '../lib/EthereumApiClient';
import GraphHandler from "@/app/lib/GraphHandler";
import { SigmaContainer } from '@react-sigma/core';
import "@react-sigma/core/lib/style.css";
import Sigma from 'sigma';
import { useWorkerLayoutForceAtlas2 } from "@react-sigma/layout-forceatlas2";
import { ForceAtlas2LayoutParameters } from 'graphology-layout-forceatlas2';
import eventEmitter from '../lib/EventEmitter';
import { EventType } from '../types/event';
import EthereumTracker from '../lib/EthereumTracker';
import './style.css';

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
  const [sigma, setSigma] = useState<Sigma<NodeType, EdgeType> | null>(null);
  const client = useRef(EthereumApiClient.getInstance());
  const ethereumTracker = useRef(new EthereumTracker());

  useEffect(() => {
      if (sigma) {
        client.current.subscribeToPendingTransactions();
        sigma.setSetting('labelRenderedSizeThreshold', 100000);
        eventEmitter.on(EventType.NewPendingTransaction, (tx) => ethereumTracker.current.addPendingTransaction(tx));
        eventEmitter.on(EventType.AddTransactionToGraph, (tx) => GraphHandler.addTransaction(sigma, tx));
        eventEmitter.on(EventType.UpdateNodeNetBalance, (tx, netBalance, is_sender) => GraphHandler.updateNodeColour(sigma, tx, netBalance, is_sender));
      }
}, [sigma]);

  return (
      <div className='dark-mode'>
          <h1>Visualization Page</h1>
          <Link href='/'>Back to home</Link>
            <SigmaContainer ref={setSigma} style={{ width: '100vw', height: '100vh' }}>
              <Fa2Graph />
            </SigmaContainer>
      </div>
  );
};

export default VisualisePage;