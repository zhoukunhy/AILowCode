import React from 'react'

export interface TextProps {
  content: string
  fontSize?: number
  fontWeight?: 'normal' | 'bold'
  color?: string
  align?: 'left' | 'center' | 'right'
}

export const Text: React.FC<TextProps> = ({
  content,
  fontSize = 14,
  fontWeight = 'normal',
  color = '#333',
  align = 'left',
}) => {
  const style: React.CSSProperties = {
    fontSize: `${fontSize}px`,
    fontWeight,
    color,
    textAlign: align,
  }

  return <p style={style}>{content}</p>
}
