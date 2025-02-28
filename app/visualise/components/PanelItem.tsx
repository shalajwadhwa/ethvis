import React from 'react'
import { Attributes } from '@/app/types/graph'

const PanelItem = ({ attributes }: { attributes: Attributes }) => {
  return (
    <div style={{ border: '1px solid black', padding: '10px', borderRadius: '5px', background: "rgba(0,0,0,0.7)", wordWrap: 'break-word' }}>
      <ul>
      {Object.entries(attributes).map(([key, value]) => (
      <li key={key}>
      {key}: {key === 'isContract' ? value.toString() : key === 'netBalance' ? (Number(value) / 10**18).toString() : key === 'address' ? <a href={`https://etherscan.io/address/${value}`} target="_blank" rel="noopener noreferrer" style={{ color: 'blue' }}>{value}</a> : value}
      </li>
      ))}
      </ul>
    </div>
  )
}

export default PanelItem