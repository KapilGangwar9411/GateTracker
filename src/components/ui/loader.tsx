import React from 'react';
import styled from 'styled-components';

interface LoaderProps {
  className?: string;
  variant?: 'default' | 'primary' | 'minimal';
  size?: 'default' | 'sm' | 'lg';
  text?: string;
  secondaryText?: string;
  logo?: boolean;
}

const Loader = ({
  className,
  variant = 'default',
  size = 'default',
  text = "Loading...",
  secondaryText = "Please wait",
  logo = true,
  ...props
}: LoaderProps) => {
  return (
    <StyledWrapper className={className} variant={variant} size={size} {...props}>
      <div className="loader-container">
        <div className="loader">
          <div className="box">
            <div className="logo">
              <img 
                src="/favicons/android-chrome-192x192.png" 
                alt="GATE Tracker Logo" 
                className="favicon-logo"
              />
            </div>
          </div>
          <div className="box" />
          <div className="box" />
          <div className="box" />
          <div className="box" />
        </div>
      </div>
    </StyledWrapper>
  );
};

interface StyledWrapperProps {
  variant?: 'default' | 'primary' | 'minimal';
  size?: 'default' | 'sm' | 'lg';
}

const StyledWrapper = styled.div<StyledWrapperProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  
  ${props => props.size === 'default' && `
    height: 100vh;
  `}
  
  ${props => props.size === 'sm' && `
    height: 16rem;
  `}
  
  ${props => props.size === 'lg' && `
    height: 80vh;
  `}
  
  ${props => props.variant === 'default' && `
    background-color: var(--background);
  `}
  
  ${props => props.variant === 'primary' && `
    background: linear-gradient(to bottom, var(--background), rgba(79, 70, 229, 0.1));
  `}
  
  .loader-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
  }
  
  .text-center {
    text-align: center;
  }
  
  .space-y-1 > * + * {
    margin-top: 0.25rem;
  }
  
  .mt-6 {
    margin-top: 1.5rem;
  }
  
  .text-base {
    font-size: 1rem;
    line-height: 1.5rem;
  }
  
  .text-xs {
    font-size: 0.75rem;
    line-height: 1rem;
  }
  
  .font-medium {
    font-weight: 500;
  }
  
  .text-muted {
    color: #6b7280;
  }
  
  .dark .text-muted {
    color: #9ca3af;
  }

  .loader {
    --size: 250px;
    --duration: 2s;
    --logo-color: #4f46e5;
    --background: linear-gradient(
      0deg,
      rgba(79, 70, 229, 0.2) 0%,
      rgba(99, 102, 241, 0.2) 100%
    );
    height: var(--size);
    aspect-ratio: 1;
    position: relative;
  }

  .dark .loader {
    --logo-color: #818cf8;
    --background: linear-gradient(
      0deg,
      rgba(79, 70, 229, 0.3) 0%,
      rgba(99, 102, 241, 0.3) 100%
    );
  }

  .loader .box {
    position: absolute;
    background: rgba(99, 102, 241, 0.1);
    background: var(--background);
    border-radius: 50%;
    border-top: 1px solid rgba(99, 102, 241, 0.8);
    box-shadow: rgba(0, 0, 0, 0.3) 0px 10px 10px -0px;
    backdrop-filter: blur(5px);
    animation: ripple var(--duration) infinite ease-in-out;
  }

  .loader .box:nth-child(1) {
    inset: 40%;
    z-index: 99;
  }

  .loader .box:nth-child(2) {
    inset: 30%;
    z-index: 98;
    border-color: rgba(99, 102, 241, 0.8);
    animation-delay: 0.2s;
  }

  .loader .box:nth-child(3) {
    inset: 20%;
    z-index: 97;
    border-color: rgba(99, 102, 241, 0.6);
    animation-delay: 0.4s;
  }

  .loader .box:nth-child(4) {
    inset: 10%;
    z-index: 96;
    border-color: rgba(99, 102, 241, 0.4);
    animation-delay: 0.6s;
  }

  .loader .box:nth-child(5) {
    inset: 0%;
    z-index: 95;
    border-color: rgba(99, 102, 241, 0.2);
    animation-delay: 0.8s;
  }

  .loader .logo {
    position: absolute;
    inset: 0;
    display: grid;
    place-content: center;
    padding: 30%;
  }

  .loader .logo .favicon-logo {
    width: 100%;
    height: 100%;
    object-fit: contain;
    animation: color-change var(--duration) infinite ease-in-out;
  }

  @keyframes ripple {
    0% {
      transform: scale(1);
      box-shadow: rgba(0, 0, 0, 0.3) 0px 10px 10px -0px;
    }
    50% {
      transform: scale(1.3);
      box-shadow: rgba(0, 0, 0, 0.3) 0px 30px 20px -0px;
    }
    100% {
      transform: scale(1);
      box-shadow: rgba(0, 0, 0, 0.3) 0px 10px 10px -0px;
    }
  }

  @keyframes color-change {
    0% {
      fill: var(--logo-color);
    }
    50% {
      fill: white;
    }
    100% {
      fill: var(--logo-color);
    }
  }
`;

export { Loader, type LoaderProps }; 