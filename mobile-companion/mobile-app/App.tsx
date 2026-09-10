import { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Vibration } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import { initDevHarness, DevMenuOverlay } from './dev-harness';

// Initialize telemetry harness (active only in dev)
initDevHarness({ autoDiscoverOnStart: true });

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [serverIp, setServerIp] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const connectToServer = () => {
    if (!serverIp) return;

    if (ws.current) {
      ws.current.close();
    }

    try {
      // Assuming port 3000 as per companion server
      const url = `ws://${serverIp}:3000`;
      console.log('Connecting to:', url);
      
      const newWs = new WebSocket(url);

      newWs.onopen = () => {
        console.log('Connected to server');
        setIsConnected(true);
      };

      newWs.onclose = () => {
        console.log('Disconnected from server');
        setIsConnected(false);
      };

      newWs.onerror = (e) => {
        console.error('WebSocket Error:', e);
      };

      ws.current = newWs;
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  const handleBarCodeScanned = ({ data }: { type: string, data: string }) => {
    setScanned(true);
    setLastScanned(data);
    Vibration.vibrate();

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'scan', data: data }));
    }

    // Reset scanned state after a short delay to allow next scan
    setTimeout(() => {
      setScanned(false);
    }, 2000);
  };

  if (!permission) {
    // Camera permissions are still loading
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Shop Companion</Text>
        <View style={[styles.statusIndicator, { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }]} />
        <Text style={styles.statusText}>{isConnected ? 'Connected' : 'Disconnected'}</Text>
      </View>

      {!isConnected && (
        <View style={styles.configContainer}>
          <TextInput
            style={styles.input}
            placeholder="Server IP (e.g., 192.168.1.5)"
            value={serverIp}
            onChangeText={setServerIp}
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.button} onPress={connectToServer}>
            <Text style={styles.buttonText}>Connect</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr", "ean13", "ean8", "upc_a", "upc_e", "code128", "code39", "code93"],
          }}
        />
        {scanned && (
          <View style={styles.overlay}>
            <Text style={styles.overlayText}>Scanned!</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerLabel}>Last Scanned:</Text>
        <Text style={styles.footerValue}>{lastScanned || 'None'}</Text>
        {scanned && (
           <TouchableOpacity style={styles.scanAgainButton} onPress={() => setScanned(false)}>
             <Text style={styles.buttonText}>Scan Again</Text>
           </TouchableOpacity>
        )}
      </View>

      <DevMenuOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f1f1f',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    color: '#ccc',
    fontSize: 14,
  },
  configContainer: {
    padding: 20,
    backgroundColor: '#1f1f1f',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  input: {
    backgroundColor: '#333',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  cameraContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    backgroundColor: '#1f1f1f',
    minHeight: 120,
  },
  footerLabel: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 4,
  },
  footerValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  scanAgainButton: {
    marginTop: 10,
    backgroundColor: '#444',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  }
});
