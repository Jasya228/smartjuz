import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Camera, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../config';

const KioskScanner = () => {
  const videoRef = useRef(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [scanResult, setScanResultState] = useState(null); 
  const scanResultRef = useRef(null);
  
  const setScanResult = (val) => {
    scanResultRef.current = val;
    setScanResultState(val);
  };

  const faceMatcherRef = useRef(null);
  const isScanning = useRef(true);
  const audioCtxRef = useRef(null);

  const [selectedLocation, setSelectedLocationState] = useState('MAIN BLOCK');
  const locationRef = useRef('MAIN BLOCK');

  const setSelectedLocation = (loc) => {
    locationRef.current = loc;
    setSelectedLocationState(loc);
  };

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  };

  const playTone = (type) => {
    if (!audioCtxRef.current) return;
    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();
    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);
    
    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtxRef.current.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, audioCtxRef.current.currentTime + 0.1);
      gain.gain.setValueAtTime(0.5, audioCtxRef.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtxRef.current.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtxRef.current.currentTime + 0.3);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, audioCtxRef.current.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, audioCtxRef.current.currentTime + 0.2);
      gain.gain.setValueAtTime(0.5, audioCtxRef.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtxRef.current.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtxRef.current.currentTime + 0.3);
    }
  };

  const loadFaceData = async () => {
    try {
      const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
      const token = adminInfo.token || 'DEMO_TOKEN'; // Подставляем демо-токен для тестов
      const res = await fetch(`${API_BASE_URL}/students/descriptors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const students = await res.json();
        if (students.length === 0) return;
        const labeledDescriptors = students.map(student => {
          const arr = new Float32Array(student.faceDescriptor);
          return new faceapi.LabeledFaceDescriptors(student._id, [arr]);
        });
        const matcher = new faceapi.FaceMatcher(labeledDescriptors, 0.55);
        faceMatcherRef.current = matcher;
      }
    } catch (error) {
      console.error('Failed to load DB', error);
    }
  };

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => console.error(err));
  };

  const captureAndReportThreat = async (videoElement) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      canvas.getContext('2d').drawImage(videoElement, 0, 0);
      const base64Image = canvas.toDataURL('image/jpeg');

      const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
      await fetch(`${API_BASE_URL}/security/threats`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminInfo.token || ''}`
        },
        body: JSON.stringify({ image: base64Image })
      });
    } catch (err) {
      console.error('Failed to report threat', err);
    }
  };

  const handleVideoPlay = async () => {
    while (isScanning.current) {
      if (videoRef.current && !scanResultRef.current) {
        const detection = await faceapi.detectSingleFace(
          videoRef.current, 
          new faceapi.TinyFaceDetectorOptions()
        ).withFaceLandmarks().withFaceDescriptor();

        if (detection) {
          if (!faceMatcherRef.current) {
            playTone('error');
            setScanResult({ status: 'error', message: 'ОШИБКА', details: 'База лиц пуста' });
            setTimeout(() => setScanResult(null), 4000);
          } else {
            const match = faceMatcherRef.current.findBestMatch(detection.descriptor);
            if (match.label !== 'unknown') {
              await logAttendance(match.label, match.distance);
            } else {
              captureAndReportThreat(videoRef.current);
              playTone('error');
              
              const msg = new SpeechSynthesisUtterance('Доступ запрещен. Лицо не найдено.');
              msg.lang = 'ru-RU';
              window.speechSynthesis.speak(msg);

              setScanResult({ status: 'error', message: 'ДОСТУП ЗАПРЕЩЕН', details: 'Лицо не найдено' });
              setTimeout(() => setScanResult(null), 4000);
            }
          }
        }
      }
      await new Promise(r => setTimeout(r, 800));
    }
  };

  const logAttendance = async (studentId, distance) => {
    try {
      const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
      const res = await fetch(`${API_BASE_URL}/attendance`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminInfo.token || ''}`
        },
        body: JSON.stringify({
          studentId,
          confidenceScore: 1 - distance,
          location: selectedLocation
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        const firstName = data.student?.fullName ? data.student.fullName.split(' ')[0] : 'Студент';
        playTone('success');
        
        // Voice greeting
        const msg = new SpeechSynthesisUtterance(`Добро пожаловать, ${firstName}`);
        msg.lang = 'ru-RU';
        msg.rate = 1.1;
        window.speechSynthesis.speak(msg);

        setScanResult({
          status: 'success',
          message: 'ДОСТУП РАЗРЕШЕН',
          details: `Привет, ${firstName}!`
        });
      } else {
        playTone('error');
        
        const msg = new SpeechSynthesisUtterance('Ошибка доступа');
        msg.lang = 'ru-RU';
        window.speechSynthesis.speak(msg);

        setScanResult({ status: 'error', message: 'ОШИБКА', details: 'Попробуйте позже' });
      }
      setTimeout(() => setScanResult(null), 3000);
    } catch (error) {
      console.error(error);
    }
  };

  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (hasStarted) {
      isScanning.current = true;
      const loadModels = async () => {
        try {
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
            faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
            faceapi.nets.faceRecognitionNet.loadFromUri('/models')
          ]);
          await loadFaceData();
          setIsModelLoaded(true);
          startVideo();
        } catch (err) {
          console.error('Error loading models', err);
        }
      };
      loadModels();
    }
    return () => {
      isScanning.current = false;
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, [hasStarted]);

  return (
    <div className="h-screen w-full bg-black relative overflow-hidden flex flex-col items-center justify-center">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-primary/5"></div>
      </div>

      {/* Header - Compact for Mobile */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-50 bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/10">
        <div className="flex items-center gap-2">
          <Camera size={20} className="text-primary" />
          <h1 
            onDoubleClick={() => {
              localStorage.removeItem('adminInfo');
              window.location.href = '/';
            }}
            className="text-lg font-black text-white tracking-tighter select-none cursor-default"
          >
            SMART<span className="text-primary">JUZ</span>
          </h1>
        </div>
        <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
          {[{id: 'MAIN', name: 'MAIN BLOCK'}, {id: 'IT', name: 'IT CENTER'}, {id: 'DORM', name: 'DORMITORY'}].map(loc => (
            <button
              key={loc.id}
              onClick={() => setSelectedLocation(loc.name)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all ${
                selectedLocation === loc.name ? 'bg-primary text-black' : 'text-gray-500'
              }`}
            >
              {loc.id}
            </button>
          ))}
        </div>
      </div>

      {/* Main Scanner Area - Terminal Style on Mobile too */}
      <div className="relative w-[95%] h-[75vh] rounded-[30px] md:w-[500px] md:h-[700px] md:rounded-[40px] overflow-hidden bg-gray-900 z-10 my-auto border-2 border-white/10 shadow-2xl mt-24 md:mt-auto">
        {!hasStarted ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-black">
            <motion.div 
              whileTap={{ scale: 0.9 }}
              className="w-32 h-32 bg-primary/20 rounded-full flex items-center justify-center mb-6 border-2 border-primary shadow-[0_0_40px_rgba(16,185,129,0.3)]"
              onClick={() => { initAudio(); setHasStarted(true); }}
            >
              <Camera size={56} className="text-primary" />
            </motion.div>
            <h2 className="text-3xl font-black text-white mb-2">SCANNER</h2>
            <p className="text-gray-400 text-sm font-medium">Нажми, чтобы начать сканирование</p>
          </div>
        ) : !isModelLoaded ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-primary mt-4 font-mono text-xs tracking-widest uppercase">Initializing AI...</p>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef}
              autoPlay muted playsInline
              onPlay={handleVideoPlay}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            
            {/* HUD Overlay */}
            <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
               <div className="w-64 h-80 border-2 border-primary/40 rounded-[50px] relative">
                  <div className="absolute inset-0 border border-primary/20 rounded-[50px] animate-pulse"></div>
                  <div className="scanner-line absolute left-0 right-0"></div>
               </div>
            </div>

            <AnimatePresence>
              {scanResult && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className={`absolute inset-0 z-40 flex flex-col items-center justify-center backdrop-blur-md ${
                    scanResult.status === 'success' ? 'bg-primary/20' : 'bg-red-500/20'
                  }`}
                >
                  <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="text-center p-6 rounded-3xl bg-black/60 border border-white/10 shadow-2xl">
                     {scanResult.status === 'success' ? (
                        <CheckCircle size={80} className="text-primary mx-auto mb-4" />
                     ) : (
                        <XCircle size={80} className="text-red-500 mx-auto mb-4" />
                     )}
                     <h2 className="text-3xl font-black text-white mb-1 uppercase tracking-tighter">{scanResult.message}</h2>
                     <p className="text-primary font-bold text-lg">{scanResult.details}</p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-10 left-0 right-0 text-center z-20 md:hidden">
         <div className="inline-flex items-center gap-3 bg-black/60 backdrop-blur-lg px-6 py-3 rounded-2xl border border-white/5">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Biometric Stream Active</span>
         </div>
      </div>
    </div>
  );
};

export default KioskScanner;
