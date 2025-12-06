import React from 'react';

const GlobalBanner = () => {
  // For the web version, we can either return null to have no banner
  // or return a placeholder for where a Google AdSense banner would go.
  
  // Returning null to keep the UI clean as per request to remove AdMob work
  // If you want to add AdSense later, you can uncomment the div below.
  return null;

  /*
  return (
    <div className="fixed bottom-0 left-0 right-0 h-[50px] bg-gray-800 border-t border-gray-700 flex items-center justify-center z-[100]">
      <span className="text-gray-500 text-xs">Advertisement Space</span>
    </div>
  );
  */
};

export default GlobalBanner;