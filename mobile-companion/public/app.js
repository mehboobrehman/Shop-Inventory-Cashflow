document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('status');
  const resultTextEl = document.getElementById('result-text');
  
  // Setup WebSocket
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;
  let ws = new WebSocket(wsUrl);

  function initWebSocket() {
    ws.onopen = () => {
      statusEl.textContent = 'Connected';
      statusEl.className = 'status-connected';
    };

    ws.onclose = () => {
      statusEl.textContent = 'Disconnected';
      statusEl.className = 'status-disconnected';
      // Attempt reconnect after 3 seconds
      setTimeout(() => {
        ws = new WebSocket(wsUrl);
        initWebSocket();
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };
  }

  initWebSocket();

  // Setup QR Code Scanner
  const html5QrCode = new Html5Qrcode("reader");
  
  const qrCodeSuccessCallback = (decodedText, decodedResult) => {
    // Show on UI
    resultTextEl.textContent = decodedText;
    
    // Play audio cue (simple beep)
    playBeep();
    
    // Send via WebSocket if connected
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'scan', data: decodedText }));
    }
  };

  const config = { fps: 10, qrbox: { width: 250, height: 250 } };
  
  // Start scanning
  html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback)
    .catch((err) => {
      console.error("Error starting scanner", err);
      resultTextEl.textContent = "Camera access denied/failed";
    });

  function playBeep() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 800;
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1);
      
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      console.warn('AudioContext not supported');
    }
  }
});
