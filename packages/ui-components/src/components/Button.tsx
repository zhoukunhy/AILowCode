import React from 'react'

export interface ButtonProps {
  text: string
  type?: 'primary' | 'default' | 'dashed' | 'text' | 'link'
  size?: 'small' | 'middle' | 'large'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
}

export const Button: React.FC<ButtonProps> = ({
  text,
  type = 'default',
  size = 'middle',
  disabled = false,
  loading = false,
  onClick,
}) => {
  const baseStyle: React.CSSProperties = {
    padding: size === 'small' ? '4px 8px' : size === 'large' ? '8px 16px' : '6px 12px',
    fontSize: size === 'small' ? '12px' : size === 'large' ? '16px' : '14px',
    border: type === 'primary' ? 'none' : '1px solid #d9d9d9',
    borderRadius: '4px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    backgroundColor: type === 'primary' ? '#1890ff' : '#fff',
    color: type === 'primary' ? '#fff' : '#333',
  }

  return (
    <button style={baseStyle} disabled={disabled} onClick={onClick}>
      {loading ? '加载中...' : text}
    </button>
  )
}
