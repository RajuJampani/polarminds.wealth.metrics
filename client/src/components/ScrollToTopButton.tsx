import React, { useState, useEffect } from 'react';
import { Fab, Zoom } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

interface ScrollToTopButtonProps {
  threshold?: number; // Scroll threshold to show the button
}

const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({ threshold = 300 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Check both window scroll and main content scroll
      const windowScrolled = window.pageYOffset > threshold;
      const mainContent = document.querySelector('[data-main-content]') as HTMLElement;
      const mainContentScrolled = mainContent ? mainContent.scrollTop > threshold : false;
      
      setIsVisible(windowScrolled || mainContentScrolled);
    };

    // Add scroll listeners
    window.addEventListener('scroll', toggleVisibility);
    const mainContent = document.querySelector('[data-main-content]');
    if (mainContent) {
      mainContent.addEventListener('scroll', toggleVisibility);
    }

    // Cleanup
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
      if (mainContent) {
        mainContent.removeEventListener('scroll', toggleVisibility);
      }
    };
  }, [threshold]);

  const scrollToTop = () => {
    // Scroll both window and main content to top
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    const mainContent = document.querySelector('[data-main-content]') as HTMLElement;
    if (mainContent) {
      mainContent.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  return (
    <Zoom in={isVisible}>
      <Fab
        color="primary"
        size="medium"
        aria-label="scroll back to top"
        onClick={scrollToTop}
        sx={{
          position: 'fixed',
          bottom: { xs: 16, sm: 24 },
          right: { xs: 16, sm: 24 },
          zIndex: 1000,
          boxShadow: 3,
          '&:hover': {
            boxShadow: 6,
            transform: 'scale(1.05)'
          },
          transition: 'all 0.2s ease-in-out'
        }}
      >
        <KeyboardArrowUpIcon />
      </Fab>
    </Zoom>
  );
};

export default ScrollToTopButton;