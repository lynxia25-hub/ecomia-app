import React from 'react';
import { Bot, Sparkles, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EcomAgentLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export function EcomAgentLogo({ className, size = 'md', showText = true }: EcomAgentLogoProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-5xl'
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative group">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
        
        {/* Main Icon Container */}
        <div className={cn(
          "relative flex items-center justify-center bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-800 shadow-xl",
          sizeClasses[size] === 'w-6 h-6' ? 'p-1' : 'p-2',
          sizeClasses[size]
        )}>
          <Bot className={cn(
            "text-white",
            size === 'sm' ? 'w-4 h-4' : 'w-full h-full'
          )} />
          
          {/* Eye glow */}
          <div className="absolute top-[35%] left-[25%] w-[15%] h-[15%] bg-blue-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(96,165,250,0.8)]" />
          <div className="absolute top-[35%] right-[25%] w-[15%] h-[15%] bg-blue-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(96,165,250,0.8)]" />
          
          {/* Tech badge */}
          <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-[10%] border-2 border-black">
            <Zap className="w-full h-full text-white" />
          </div>
        </div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={cn("font-bold tracking-tight text-white", textSizeClasses[size])}>
            EcomAgent
          </span>
        </div>
      )}
    </div>
  );
}
