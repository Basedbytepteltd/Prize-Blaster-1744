import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiLoader, FiAlertCircle, FiMaximize, FiMinimize } = FiIcons;

/**
 * UnityEmbed Component
 * 
 * A production-ready Unity WebGL wrapper for React.
 */
const UnityEmbed = forwardRef(({
  buildUrl = "/unity-build/Build",
  buildName = "Build",
  loaderName,
  companyName = "DefaultCompany",
  productName = "UnityGame",
  productVersion = "1.0",
  showProgressBar = true,
  showControls = true,
  className = "",
  onLoaded,
  onProgress,
  onUnityMessage
}, ref) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [unityInstance, setUnityInstance] = useState(null);

  // Construct file paths
  const _loaderUrl = `${buildUrl}/${loaderName || `${buildName}.loader.js`}`;
  const _dataUrl = `${buildUrl}/${buildName}.data`;
  const _frameworkUrl = `${buildUrl}/${buildName}.framework.js`;
  const _codeUrl = `${buildUrl}/${buildName}.wasm`;

  useImperativeHandle(ref, () => ({
    sendMessage: (gameObjectName, methodName, value) => {
      if (unityInstance) {
        unityInstance.SendMessage(gameObjectName, methodName, value);
      } else {
        console.warn("UnityEmbed: Instance not loaded, cannot send message:", methodName);
      }
    },
    setFullscreen: (enable) => {
      if (enable) requestFullscreen();
      else exitFullscreen();
    },
    getInstance: () => unityInstance
  }));

  useEffect(() => {
    window.unityReceiveMessage = (type, payload) => {
      if (onUnityMessage) {
        onUnityMessage(type, payload);
      }
    };
    return () => {
      window.unityReceiveMessage = null;
    };
  }, [onUnityMessage]);

  const requestFullscreen = () => {
    if (containerRef.current) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      }
    }
  };

  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  };

  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  useEffect(() => {
    let scriptTag = null;
    let instance = null;
    let isMounted = true;

    const loadUnity = async () => {
      try {
        if (window.createUnityInstance && document.querySelector(`script[src="${_loaderUrl}"]`)) {
          // Already loaded logic could go here
        }

        if (!document.querySelector(`script[src="${_loaderUrl}"]`)) {
          scriptTag = document.createElement("script");
          scriptTag.src = _loaderUrl;
          scriptTag.async = true;
          document.body.appendChild(scriptTag);
          await new Promise((resolve, reject) => {
            scriptTag.onload = resolve;
            scriptTag.onerror = () => reject(new Error(`Failed to load Unity loader: ${_loaderUrl}`));
          });
        }

        const config = {
          dataUrl: _dataUrl,
          frameworkUrl: _frameworkUrl,
          codeUrl: _codeUrl,
          streamingAssetsUrl: "StreamingAssets",
          companyName: companyName,
          productName: productName,
          productVersion: productVersion,
          devicePixelRatio: window.devicePixelRatio || 1,
        };

        if (window.createUnityInstance) {
          instance = await window.createUnityInstance(canvasRef.current, config, (prog) => {
            if (isMounted) {
              setProgress(prog);
              if (onProgress) onProgress(prog);
            }
          });
          if (isMounted) {
            setUnityInstance(instance);
            setIsLoaded(true);
            if (onLoaded) onLoaded(instance);
          }
        } else {
          // Only throw if we expected it to load and it didn't
          // throw new Error("createUnityInstance not found.");
          console.warn("Unity Loader script loaded but createUnityInstance not found yet.");
        }
      } catch (err) {
        if (isMounted) {
          console.error("UnityEmbed Error:", err);
          // Don't show error overlay immediately for missing files in dev mode, just log
          if (err.message.includes('Failed to load')) {
             setError("Game files not found. (Build required)");
          }
        }
      }
    };

    loadUnity();

    return () => {
      isMounted = false;
      if (scriptTag && scriptTag.parentNode) {
        scriptTag.parentNode.removeChild(scriptTag);
      }
    };
  }, [_loaderUrl, _dataUrl, _frameworkUrl, _codeUrl]);

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full h-full bg-black overflow-hidden select-none ${className}`}
      style={{ touchAction: 'none' }}
    >
      <canvas 
        ref={canvasRef} 
        id="unity-canvas" 
        className="w-full h-full block outline-none"
        style={{ width: '100%', height: '100%', cursor: 'default' }}
        tabIndex={1}
      />

      <AnimatePresence>
        {!isLoaded && !error && (
          <motion.div 
            initial={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-20"
          >
            <div className="text-6xl mb-6 animate-bounce">🎮</div>
            <h3 className="text-white text-xl font-bold mb-4">Loading Game...</h3>
            {showProgressBar && (
              <div className="w-64 h-4 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
                <motion.div 
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            )}
            <p className="text-gray-400 text-sm mt-2">{Math.round(progress * 100)}%</p>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-30 p-8 text-center">
          <SafeIcon icon={FiAlertCircle} className="text-red-500 w-12 h-12 mb-4" />
          <h3 className="text-white text-xl font-bold mb-2">Game Load Failed</h3>
          <p className="text-gray-400 text-sm mb-4 max-w-md">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors"
          >
            Reload Page
          </button>
        </div>
      )}

      {isLoaded && showControls && (
        <div className="absolute bottom-4 right-4 z-10 flex space-x-2">
          <button 
            onClick={isFullscreen ? exitFullscreen : requestFullscreen}
            className="p-2 bg-black/50 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm transition-all border border-white/10"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            <SafeIcon icon={isFullscreen ? FiMinimize : FiMaximize} className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
});

UnityEmbed.displayName = "UnityEmbed";
export default UnityEmbed;