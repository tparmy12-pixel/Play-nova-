import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles,
  User,
  Users,
  Mic,
  Play,
  Loader2,
  Download,
  RefreshCw,
  Volume2,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Avatar {
  id: string;
  imageUrl: string;
  label: string;
}

interface BrowserVoice {
  name: string;
  lang: string;
  voice: SpeechSynthesisVoice;
}

const BUTTON_STYLES = [
  { id: "gradient", label: "Gradient Neon", className: "bg-gradient-to-r from-pink-500 to-purple-600 text-white" },
  { id: "outline", label: "Outline Glow", className: "border-2 border-pink-500 text-pink-500" },
  { id: "solid-blue", label: "Solid Blue", className: "bg-blue-500 text-white" },
  { id: "solid-purple", label: "Solid Purple", className: "bg-purple-600 text-white" },
];

const AIAdGenerator: React.FC<{ onVideoGenerated: (file: File) => void }> = ({ onVideoGenerated }) => {
  const { toast } = useToast();

  // Steps
  const [genStep, setGenStep] = useState(1);

  // Step 1: Avatar
  const [gender, setGender] = useState<"male" | "female">("female");
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loadingAvatars, setLoadingAvatars] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);

  // Step 2: App details
  const [adAppName, setAdAppName] = useState("");
  const [adAppLink, setAdAppLink] = useState("");
  const [adButtonStyle, setAdButtonStyle] = useState("gradient");
  const [adButtonText, setAdButtonText] = useState("Install Now");

  // Step 3: Voiceover
  const [voiceScript, setVoiceScript] = useState("");
  const [voices, setVoices] = useState<BrowserVoice[]>([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Step 4: Generate
  const [generating, setGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const allVoices = speechSynthesis.getVoices();
      const filtered = allVoices
        .filter((v) => v.lang.startsWith("en") || v.lang.startsWith("hi"))
        .slice(0, 12)
        .map((v) => ({ name: v.name, lang: v.lang, voice: v }));
      if (filtered.length > 0) setVoices(filtered);
    };
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
    return () => { speechSynthesis.onvoiceschanged = null; };
  }, []);

  const generateAvatars = async () => {
    setLoadingAvatars(true);
    setAvatars([]);
    setSelectedAvatar(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-ad-avatars", {
        body: { gender },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAvatars(data.avatars || []);
      if (!data.avatars?.length) {
        toast({ title: "No avatars generated", description: "Dobara try karein", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Avatar generation failed", variant: "destructive" });
    } finally {
      setLoadingAvatars(false);
    }
  };

  const previewVoice = () => {
    if (!voiceScript || voices.length === 0) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(voiceScript);
    utterance.voice = voices[selectedVoiceIndex].voice;
    utterance.rate = 0.95;
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    speechSynthesis.speak(utterance);
  };

  const generateVideo = useCallback(async () => {
    if (!selectedAvatar || !adAppName || !voiceScript) {
      toast({ title: "Error", description: "Saari details fill karein", variant: "destructive" });
      return;
    }

    setGenerating(true);

    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas not found");
      const ctx = canvas.getContext("2d")!;
      canvas.width = 720;
      canvas.height = 1280;

      // Load avatar image
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Image load failed"));
        img.src = selectedAvatar.imageUrl;
      });

      // Setup MediaRecorder
      const stream = canvas.captureStream(30);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9",
        videoBitsPerSecond: 2500000,
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const recordingDone = new Promise<Blob>((resolve) => {
        mediaRecorder.onstop = () => {
          resolve(new Blob(chunks, { type: "video/webm" }));
        };
      });

      mediaRecorder.start();

      // Start TTS
      const utterance = new SpeechSynthesisUtterance(voiceScript);
      utterance.voice = voices[selectedVoiceIndex].voice;
      utterance.rate = 0.9;

      const speechDone = new Promise<void>((resolve) => {
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
      });
      speechSynthesis.speak(utterance);

      // Animation frames
      const buttonStyleObj = BUTTON_STYLES.find((s) => s.id === adButtonStyle);
      let frame = 0;
      const totalDuration = Math.max(5000, voiceScript.length * 80);
      const startTime = Date.now();

      const drawFrame = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / totalDuration, 1);
        frame++;

        // Background gradient
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, "#0f0f23");
        grad.addColorStop(0.5, "#1a1a3e");
        grad.addColorStop(1, "#0f0f23");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Animated particles
        for (let i = 0; i < 20; i++) {
          const x = ((i * 73 + frame * 0.5) % canvas.width);
          const y = ((i * 97 + frame * 0.3) % canvas.height);
          const alpha = 0.1 + Math.sin(frame * 0.02 + i) * 0.1;
          ctx.fillStyle = `rgba(168, 85, 247, ${alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, 2 + Math.sin(frame * 0.05 + i) * 2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Avatar with fade-in
        const avatarAlpha = Math.min(progress * 3, 1);
        ctx.globalAlpha = avatarAlpha;
        const avatarSize = 300;
        const avatarX = (canvas.width - avatarSize) / 2;
        const avatarY = 100;

        // Circular clip for avatar
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();

        // Glow ring around avatar
        ctx.globalAlpha = avatarAlpha;
        ctx.strokeStyle = `rgba(236, 72, 153, ${0.5 + Math.sin(frame * 0.05) * 0.3})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.globalAlpha = 1;

        // App Name with slide-in
        const nameY = avatarY + avatarSize + 80;
        const nameOffset = Math.max(0, (1 - progress * 4) * 100);
        ctx.font = "bold 48px sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText(adAppName, canvas.width / 2 + nameOffset, nameY);

        // Description text (voiceover script preview)
        if (progress > 0.2) {
          const descAlpha = Math.min((progress - 0.2) * 5, 1);
          ctx.globalAlpha = descAlpha;
          ctx.font = "20px sans-serif";
          ctx.fillStyle = "#a0a0c0";

          const words = voiceScript.split(" ");
          let line = "";
          let lineY = nameY + 60;
          const maxWidth = canvas.width - 80;

          for (const word of words) {
            const testLine = line + word + " ";
            if (ctx.measureText(testLine).width > maxWidth) {
              ctx.fillText(line.trim(), canvas.width / 2, lineY);
              line = word + " ";
              lineY += 30;
              if (lineY > nameY + 200) break;
            } else {
              line = testLine;
            }
          }
          if (line) ctx.fillText(line.trim(), canvas.width / 2, lineY);
          ctx.globalAlpha = 1;
        }

        // Install button with bounce
        if (progress > 0.4) {
          const btnAlpha = Math.min((progress - 0.4) * 5, 1);
          const bounce = Math.sin(frame * 0.08) * 5;
          const btnY = canvas.height - 250 + bounce;
          const btnW = 280;
          const btnH = 60;
          const btnX = (canvas.width - btnW) / 2;

          ctx.globalAlpha = btnAlpha;

          // Button background
          const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY);
          btnGrad.addColorStop(0, "#ec4899");
          btnGrad.addColorStop(1, "#8b5cf6");
          ctx.fillStyle = btnGrad;
          ctx.beginPath();
          ctx.roundRect(btnX, btnY, btnW, btnH, 30);
          ctx.fill();

          // Button glow
          ctx.shadowColor = "rgba(236, 72, 153, 0.5)";
          ctx.shadowBlur = 20;
          ctx.fill();
          ctx.shadowBlur = 0;

          // Button text
          ctx.font = "bold 22px sans-serif";
          ctx.fillStyle = "#ffffff";
          ctx.fillText(adButtonText, canvas.width / 2, btnY + 38);
          ctx.globalAlpha = 1;
        }

        // App link at bottom
        if (progress > 0.6) {
          ctx.globalAlpha = Math.min((progress - 0.6) * 5, 0.6);
          ctx.font = "16px sans-serif";
          ctx.fillStyle = "#8888aa";
          ctx.fillText(adAppLink || adAppName, canvas.width / 2, canvas.height - 100);
          ctx.globalAlpha = 1;
        }

        // Progress bar
        ctx.fillStyle = "rgba(236, 72, 153, 0.3)";
        ctx.fillRect(0, canvas.height - 4, canvas.width, 4);
        ctx.fillStyle = "#ec4899";
        ctx.fillRect(0, canvas.height - 4, canvas.width * progress, 4);

        if (elapsed < totalDuration) {
          requestAnimationFrame(drawFrame);
        } else {
          setTimeout(() => mediaRecorder.stop(), 500);
        }
      };

      drawFrame();

      await Promise.all([speechDone, recordingDone.then(() => {})]);
      const blob = await recordingDone;

      const videoUrl = URL.createObjectURL(blob);
      setGeneratedVideoUrl(videoUrl);

      // Convert to File
      const file = new File([blob], `ai-ad-${Date.now()}.webm`, { type: "video/webm" });
      onVideoGenerated(file);

      toast({ title: "Video Generated! 🎬", description: "Aapka AI ad ready hai" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Video generation failed", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }, [selectedAvatar, adAppName, adAppLink, adButtonStyle, adButtonText, voiceScript, voices, selectedVoiceIndex, onVideoGenerated, toast]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-5 w-5 text-neon-pink" />
        <h3 className="font-display font-bold text-lg">AI Ad Generator</h3>
      </div>

      {/* Sub-steps */}
      <div className="flex gap-2 mb-4">
        {[1, 2, 3, 4].map((s) => (
          <button
            key={s}
            onClick={() => setGenStep(s)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              genStep === s
                ? "gradient-neon text-primary-foreground"
                : genStep > s
                ? "bg-neon-pink/20 text-neon-pink"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {s === 1 ? "👤 Avatar" : s === 2 ? "📱 Details" : s === 3 ? "🎙️ Voice" : "🎬 Generate"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Avatar Selection */}
        {genStep === 1 && (
          <motion.div key="avatar" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="glass border-border/50">
              <CardContent className="pt-4 space-y-4">
                <div className="flex gap-3">
                  <Button
                    variant={gender === "male" ? "default" : "outline"}
                    onClick={() => setGender("male")}
                    className="flex-1"
                  >
                    <User className="h-4 w-4 mr-1" /> Male
                  </Button>
                  <Button
                    variant={gender === "female" ? "default" : "outline"}
                    onClick={() => setGender("female")}
                    className="flex-1"
                  >
                    <Users className="h-4 w-4 mr-1" /> Female
                  </Button>
                </div>

                <Button
                  onClick={generateAvatars}
                  disabled={loadingAvatars}
                  className="w-full gradient-neon text-primary-foreground"
                >
                  {loadingAvatars ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating Avatars...</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-2" /> Generate AI Avatars</>
                  )}
                </Button>

                {avatars.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {avatars.map((avatar) => (
                      <button
                        key={avatar.id}
                        onClick={() => setSelectedAvatar(avatar)}
                        className={`relative rounded-xl overflow-hidden border-2 transition-all aspect-square ${
                          selectedAvatar?.id === avatar.id
                            ? "border-neon-pink neon-glow scale-105"
                            : "border-border/50 hover:border-border"
                        }`}
                      >
                        <img
                          src={avatar.imageUrl}
                          alt={avatar.label}
                          className="w-full h-full object-cover"
                        />
                        {selectedAvatar?.id === avatar.id && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full gradient-neon flex items-center justify-center">
                            <Check className="h-4 w-4 text-primary-foreground" />
                          </div>
                        )}
                        <p className="absolute bottom-0 left-0 right-0 bg-background/80 text-xs py-1 text-center">
                          {avatar.label}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {avatars.length > 0 && (
                  <Button variant="ghost" onClick={generateAvatars} disabled={loadingAvatars} className="w-full text-muted-foreground">
                    <RefreshCw className="h-4 w-4 mr-2" /> Regenerate
                  </Button>
                )}

                <Button
                  onClick={() => setGenStep(2)}
                  disabled={!selectedAvatar}
                  className="w-full"
                >
                  Next → App Details
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: App Details */}
        {genStep === 2 && (
          <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="glass border-border/50">
              <CardContent className="pt-4 space-y-4">
                <div>
                  <Label>App Name *</Label>
                  <Input
                    placeholder="Your App Name"
                    value={adAppName}
                    onChange={(e) => setAdAppName(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>App Link *</Label>
                  <Input
                    placeholder="https://your-app.com"
                    value={adAppLink}
                    onChange={(e) => setAdAppLink(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Button Text</Label>
                  <Input
                    placeholder="Install Now"
                    value={adButtonText}
                    onChange={(e) => setAdButtonText(e.target.value)}
                    maxLength={30}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Button Style</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {BUTTON_STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setAdButtonStyle(style.id)}
                        className={`p-2 rounded-lg border-2 transition-all ${
                          adButtonStyle === style.id ? "border-neon-pink" : "border-border/50"
                        }`}
                      >
                        <div className={`px-3 py-1.5 rounded-md text-xs font-medium text-center ${style.className}`}>
                          {adButtonText || "Install"}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setGenStep(1)} className="flex-1">← Back</Button>
                  <Button
                    onClick={() => setGenStep(3)}
                    disabled={!adAppName}
                    className="flex-1 gradient-neon text-primary-foreground"
                  >
                    Next → Voiceover
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Voiceover */}
        {genStep === 3 && (
          <motion.div key="voice" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="glass border-border/50">
              <CardContent className="pt-4 space-y-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <Mic className="h-4 w-4 text-neon-pink" /> Voiceover Script *
                  </Label>
                  <Textarea
                    placeholder="Apne app ke baare mein script likhein... e.g. 'Download the best gaming app now! Amazing features, smooth gameplay, and free rewards!'"
                    value={voiceScript}
                    onChange={(e) => setVoiceScript(e.target.value)}
                    maxLength={500}
                    rows={4}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{voiceScript.length}/500</p>
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" /> Select Voice
                  </Label>
                  {voices.length === 0 ? (
                    <p className="text-xs text-muted-foreground mt-2">Loading voices...</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 mt-2 max-h-48 overflow-y-auto">
                      {voices.map((v, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedVoiceIndex(idx)}
                          className={`flex items-center justify-between p-2 rounded-lg border transition-all text-left ${
                            selectedVoiceIndex === idx
                              ? "border-neon-pink bg-neon-pink/10"
                              : "border-border/50 hover:border-border"
                          }`}
                        >
                          <div>
                            <p className="text-sm font-medium">{v.name.split(" ").slice(0, 3).join(" ")}</p>
                            <p className="text-xs text-muted-foreground">{v.lang}</p>
                          </div>
                          {selectedVoiceIndex === idx && <Check className="h-4 w-4 text-neon-pink" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  onClick={previewVoice}
                  disabled={!voiceScript || isPlaying}
                  variant="outline"
                  className="w-full"
                >
                  {isPlaying ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Playing...</>
                  ) : (
                    <><Play className="h-4 w-4 mr-2" /> Preview Voice</>
                  )}
                </Button>

                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setGenStep(2)} className="flex-1">← Back</Button>
                  <Button
                    onClick={() => setGenStep(4)}
                    disabled={!voiceScript}
                    className="flex-1 gradient-neon text-primary-foreground"
                  >
                    Next → Generate
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 4: Generate */}
        {genStep === 4 && (
          <motion.div key="generate" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="glass border-border/50">
              <CardContent className="pt-4 space-y-4">
                {/* Preview Summary */}
                <div className="p-4 rounded-xl bg-muted/20 border border-border/50 space-y-3">
                  <p className="text-xs text-muted-foreground font-bold">Ad Preview Summary:</p>
                  <div className="flex items-center gap-3">
                    {selectedAvatar && (
                      <img src={selectedAvatar.imageUrl} alt="avatar" className="w-12 h-12 rounded-full object-cover border-2 border-neon-pink" />
                    )}
                    <div>
                      <p className="font-bold text-sm">{adAppName}</p>
                      <p className="text-xs text-muted-foreground truncate">{adAppLink}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground italic">"{voiceScript.slice(0, 100)}..."</p>
                  <p className="text-xs text-muted-foreground">
                    Voice: {voices[selectedVoiceIndex]?.name || "Default"}
                  </p>
                </div>

                <canvas ref={canvasRef} className="hidden" />

                {generatedVideoUrl ? (
                  <div className="space-y-3">
                    <video
                      src={generatedVideoUrl}
                      controls
                      className="w-full rounded-xl border border-border/50"
                      style={{ maxHeight: 400 }}
                    />
                    <div className="flex gap-2">
                      <a
                        href={generatedVideoUrl}
                        download={`ai-ad-${Date.now()}.webm`}
                        className="flex-1"
                      >
                        <Button variant="outline" className="w-full">
                          <Download className="h-4 w-4 mr-2" /> Download
                        </Button>
                      </a>
                      <Button
                        onClick={() => {
                          setGeneratedVideoUrl(null);
                          generateVideo();
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" /> Regenerate
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      ✅ Video auto-attached as your promotion video
                    </p>
                  </div>
                ) : (
                  <Button
                    onClick={generateVideo}
                    disabled={generating}
                    className="w-full gradient-neon text-primary-foreground neon-glow"
                    size="lg"
                  >
                    {generating ? (
                      <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Generating Video...</>
                    ) : (
                      <><Sparkles className="h-5 w-5 mr-2" /> Generate AI Ad Video 🎬</>
                    )}
                  </Button>
                )}

                <Button variant="ghost" onClick={() => setGenStep(3)} className="w-full text-muted-foreground">
                  ← Back to Voiceover
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIAdGenerator;
