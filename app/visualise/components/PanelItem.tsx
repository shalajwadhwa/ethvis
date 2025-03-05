import React from 'react'
import { Attributes } from '@/app/types/graph'

const PanelItem = ({ attributes }: { attributes: Attributes }) => {
  return (
      <ul className="p-2.5 border rounded-md break-all">
        {Object.entries(attributes).map(([key, value]) => (
          <li key={key}>
            {key}: {key === 'isContract' ? value.toString() : 
                    key === 'netBalance' ? (Number(value) / 10**18).toString() : 
                    key === 'address' ? 
                    <a href={`https://etherscan.io/address/${value}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-500 dark:text-blue-400 hover:underline">{value}</a> 
                    : value}
          </li>
        ))}
      </ul>
  )
}

export default PanelItem