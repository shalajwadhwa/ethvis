import React from 'react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const VisualisationSelector = ({ setVisualisationType } : { setVisualisationType: React.Dispatch<React.SetStateAction<string>> }) => {
  return (
    <div className="absolute top-4 right-4 z-10 graph-overlay">
            <Select onValueChange={(value) => setVisualisationType(value)}>
              <SelectTrigger className="w">
                <SelectValue placeholder="Settings" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Settings</SelectLabel>
                  <SelectItem value="default">Real-time (default)</SelectItem>
                  <SelectItem value="validation">Real-time with Validation</SelectItem>
                  <SelectItem value="static">Static</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
  )
}

export default VisualisationSelector