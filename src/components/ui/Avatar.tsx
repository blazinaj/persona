import React from 'react';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  name,
  size = 'md',
  className = ''
}) => {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg'
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const sizeClass = sizes[size];
  const classes = `relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gray-200 ${sizeClass} ${className}`;

  return (
    <div className={classes}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
        />
      ) : name ? (
        <span className="font-medium text-gray-600">
          {getInitials(name)}
        </span>
      ) : (
        <span className="font-medium text-gray-600">??</span>
      )}
    </div>
  );
};

export default Avatar;