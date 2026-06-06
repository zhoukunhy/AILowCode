import React from 'react'

export interface ContainerProps {
  children?: React.ReactNode
  width?: number | string
  height?: number | string
  padding?: number | string
  backgroundColor?: string
  borderRadius?: number
}

export const Container: React.FC<ContainerProps> = ({
  children,
  width = '100%',
  height = 'auto',
  padding = 16,
  backgroundColor = '#fff',
  borderRadius = 4,
}) => {
  const style: React.CSSProperties = {
    width,
    height,
    padding,
    backgroundColor,
    borderRadius,
    boxSizing: 'border-box',
  }

  return <div style={style}>{children}</div>
}
