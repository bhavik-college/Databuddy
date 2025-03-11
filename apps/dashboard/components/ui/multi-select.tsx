"use client"

import React, { useState, useRef, useEffect } from 'react'
import { X, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export interface Option {
  value: string
  label: string
}

export interface MultiSelectProps {
  options: Option[]
  selected: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  className?: string
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options...",
  className = ""
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])
  
  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(item => item !== value))
    } else {
      onChange([...selected, value])
    }
    setSearchValue("")
  }
  
  const handleRemove = (value: string) => {
    onChange(selected.filter(item => item !== value))
  }
  
  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchValue.toLowerCase())
  )
  
  const selectedOptions = options.filter(option => selected.includes(option.value))
  
  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div 
        className="flex flex-wrap gap-1 p-2 border rounded-md min-h-10 cursor-text"
        onClick={() => setIsOpen(true)}
      >
        {selectedOptions.map(option => (
          <Badge key={option.value} variant="secondary" className="flex items-center gap-1">
            {option.label}
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-muted"
              onClick={(e) => {
                e.stopPropagation()
                handleRemove(option.value)
              }}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Remove {option.label}</span>
            </Button>
          </Badge>
        ))}
        
        <Input
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder={selectedOptions.length === 0 ? placeholder : ""}
          className="flex-1 border-0 p-0 min-w-[120px] focus-visible:ring-0 focus-visible:ring-offset-0"
          onFocus={() => setIsOpen(true)}
        />
        
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto h-4 w-4 p-0"
          onClick={(e) => {
            e.stopPropagation()
            setIsOpen(!isOpen)
          }}
        >
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="sr-only">Toggle menu</span>
        </Button>
      </div>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-md max-h-60 overflow-auto">
          {filteredOptions.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">No options found</div>
          ) : (
            <div className="p-1">
              {filteredOptions.map(option => (
                <div
                  key={option.value}
                  className={`
                    flex items-center justify-between px-2 py-1.5 text-sm rounded-sm cursor-pointer
                    ${selected.includes(option.value) ? 'bg-muted' : 'hover:bg-muted'}
                  `}
                  onClick={() => handleSelect(option.value)}
                >
                  <span>{option.label}</span>
                  {selected.includes(option.value) && (
                    <Check className="h-4 w-4" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
} 