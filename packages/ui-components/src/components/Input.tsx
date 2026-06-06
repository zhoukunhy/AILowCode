import React from 'react'

export interface InputProps {
  placeholder?: string
  value?: string
  disabled?: boolean
  size?: 'small' | 'middle' | 'large'
  onChange?: (value: string) => void
}

export const Input: React.FC<InputProps> = ({
  placeholder = '请输入',
  value = '',
  disabled = false,
  size = 'middle',
  onChange,
}) => {
  const height = size === 'small' ? '24px' : size === 'large' ? '40px' : '32px'

  const style: React.CSSProperties = {
    width: '100%',
    height,
    padding: '4px 11px',
    fontSize: size === 'small' ? '12px' : size === 'large' ? '16px' : '14px',
    border: '1px solid #d9d9d9',
    borderRadius: '4px',
    outline: 'none',
    transition: 'border-color 0.3s',
  }

  return (
    <input
      type="text"
      style={style}
      placeholder={placeholder}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.value)}
    />
  )
}
