import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VideoAdProps {
  videoUrl: string;
  onComplete: () => void;
  onSkip: () => void;
  skipAfterSeconds?: number;
}

const VideoAd: React.FC<VideoAdProps> = ({ videoUrl, onComplete, onSkip, skipAfterSeconds = 4 }) => {
  const [secondsLeft, setSecondsLeft] = useState(skipAfterSeconds);
  const [canSkip, setCanSkip] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (secondsLeft <= 0) {
      setCanSkip(true);
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
      >
        {/* Ad label */}
        <div className="absolute top-4 left-4 bg-muted/80 text-muted-foreground text-xs px-3 py-1 rounded-full font-medium">
          Ad • Promoted App
        </div>

        {/* Skip / Timer button */}
        <div className="absolute top-4 right-4">
          {canSkip ? (
            <button
              onClick={onSkip}
              className="flex items-center gap-1.5 bg-foreground/20 hover:bg-foreground/30 text-foreground px-4 py-2 rounded-full text-sm font-medium transition-colors backdrop-blur-sm"
            >
              Skip Ad <X className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-foreground/10 text-foreground/70 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
              Skip in {secondsLeft}s
            </div>
          )}
        </div>

        {/* Video */}
        <video
          ref={videoRef}
          src={videoUrl}
          autoPlay
          playsInline
          onEnded={onComplete}
          className="max-w-full max-h-[80vh] rounded-xl"
          style={{ objectFit: "contain" }}
        />

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/30">
          <motion.div
            className="h-full gradient-neon"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 15, ease: "linear" }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VideoAd;
