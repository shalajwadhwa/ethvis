import React from 'react'
import { AddressInfo } from '@/app/types/graph'

const PanelItem = ({ addressInfo }: { addressInfo: AddressInfo }) => {
  return (
    <div style={{ border: '1px solid black', padding: '10px', borderRadius: '5px' }}>
      <ul>
      {Object.entries(addressInfo).map(([key, value]) => (
        <li key={key}>
        {key}: {value}
        </li>
      ))}
      </ul>
    </div>
  )
}

export default PanelItem