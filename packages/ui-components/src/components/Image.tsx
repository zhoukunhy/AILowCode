import React from 'react'

export interface ImageProps {
  src: string
  alt?: string
  width?: number | string
  height?: number | string
  fit?: 'cover' | 'contain' | 'fill' | 'none'
}

export const Image: React.FC<ImageProps> = ({
  src,
  alt = '图片',
  width = '100%',
  height = 'auto',
  fit = 'cover',
}) => {
  const style: React.CSSProperties = {
    width,
    height,
    objectFit: fit,
  }

  return <img src={src} alt={alt} style={style} />
}
