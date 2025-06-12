import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const MotivationalPopup = () => {
  const [isVisible, setIsVisible] = useState(true);

  // Hide popup after 6 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 6000);

    return () => clearTimeout(timer);
  }, []);

  // Check localStorage to see if we should show the popup
  useEffect(() => {
    // Show popup once per session
    const lastShown = sessionStorage.getItem('motivationalPopupShown');
    
    if (lastShown) {
      setIsVisible(false);
    } else {
      sessionStorage.setItem('motivationalPopupShown', 'true');
    }
  }, []);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="relative max-w-md bg-card border rounded-lg shadow-lg p-6 text-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ 
              type: "spring", 
              damping: 15, 
              stiffness: 200 
            }}
          >
            <button 
              onClick={() => setIsVisible(false)}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
            >
              <X size={18} />
            </button>
            
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                Remember...
              </h2>
            </motion.div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="space-y-3"
            >
              <p className="text-xl font-medium">
                "Gate Zindagi Nahi hai but Gate Zindagi Badal Sakta Hai"
              </p>
              
              <p className="text-sm text-muted-foreground">
                GATE is not life, but GATE can change your life.
              </p>
            </motion.div>
            
            <motion.div
              className="mt-4"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                type: "spring", 
                damping: 10, 
                stiffness: 100,
                delay: 1.2 
              }}
            >
              <div className="flex space-x-1 justify-center">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-primary"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.7, 1, 0.7],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.1,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MotivationalPopup; 