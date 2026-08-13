import React from 'react';
import '../../css/components/Skeleton.css';

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  style?: React.CSSProperties;
  className?: string;
}
const Skeleton: React.FC<SkeletonProps> = ({ width, height, borderRadius, style = {}, className = '' }: SkeletonProps) => {
  return (
    <div
      className={`skeleton-box ${className}`}
      style={{
        width: width || '100%',
        height: height || '20px',
        borderRadius: borderRadius || '4px',
        ...style
      }}
    />
  );
};

export default Skeleton;
