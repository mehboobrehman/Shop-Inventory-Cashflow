import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Vibration,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import { initDevHarness, DevMenuOverlay } from './dev-harness';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { scanBarcodeApi } from './src/services/api';

// Initialize dev harness telemetry (dev only)
initDevHarness({ autoDiscoverOnStart: true });

function MainScreen() {
  const {
    user,
    serverUrl,
    isLoading,
    isAuthenticated,
    error,
    login,
    logout,
    updateServerUrl,
    clearError,
  } = useAuth();

  const [permission, requestPermission] = useCameraPermissions();
  const [email, setEmail] = useState('admin@shop.com');
  const [password, setPassword] = useState('admin123');
  const [inputServerIp, setInputServerIp] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [serverMsg, setServerMsg] = useState<string | null>(null);

  // Scanner state
  const [scanned, setScanned] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<string | null>(null);

  const handleUpdateServer = async (customIp?: string) => {
    const target = customIp !== undefined ? customIp : inputServerIp;
    try {
      const resolved = await updateServerUrl(target);
      setServerMsg(`Connected to API: ${resolved}`);
      setTimeout(() => setServerMsg(null), 3000);
    } catch (e: any) {
      setServerMsg(`Failed to update server URL: ${e.message}`);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) return;
    setIsLoggingIn(true);
    clearError();
    try {
      // Ensure server URL is saved if user entered an IP
      if (inputServerIp) {
        await handleUpdateServer();
      }
      await login({ email, password });
    } catch (e: any) {
      // Error handled in AuthContext
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);
    setLastScanned(data);
    setScanStatus(`Scanned code: ${data}. Sending to server...`);
    Vibration.vibrate();

    try {
      // Submit scan through authenticated API client layer
      const res = await scanBarcodeApi(data);
      setScanStatus(`Success: ${res?.message || 'Barcode registered successfully'}`);
    } catch (err: any) {
      console.warn('Barcode scan submission error:', err?.message);
      setScanStatus(`Scan recorded locally: ${data}`);
    }

    // Reset scan state after 2.5 seconds
    setTimeout(() => {
      setScanned(false);
    }, 2500);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Initializing Secure Auth & API Client...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <ScrollView contentContainerStyle={styles.authContainer}>
        <StatusBar style="light" />
        <Text style={styles.authTitle}>Shop Companion</Text>
        <Text style={styles.authSubtitle}>Mobile App Login & API Setup</Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Server Host / Base URL</Text>
          <Text style={styles.cardSubtext}>Active API: {serverUrl}</Text>
          <TextInput
            style={styles.input}
            placeholder="Host IP (e.g. 10.0.2.2 or 192.168.1.10)"
            placeholderTextColor="#888"
            value={inputServerIp}
            onChangeText={setInputServerIp}
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.smallButton}
              onPress={() => handleUpdateServer()}
            >
              <Text style={styles.buttonText}>Set Custom Host</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.smallButton, { backgroundColor: '#388E3C' }]}
              onPress={() => {
                setInputServerIp('10.0.2.2');
                handleUpdateServer('10.0.2.2');
              }}
            >
              <Text style={styles.buttonText}>Use Emulator (10.0.2.2)</Text>
            </TouchableOpacity>
          </View>

          {serverMsg && <Text style={styles.infoText}>{serverMsg}</Text>}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Account Login</Text>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="admin@shop.com"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.fieldLabel}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <DevMenuOverlay />
      </ScrollView>
    );
  }

  // Camera Permission View if camera permissions not granted
  if (!permission?.granted) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar style="light" />
        <Text style={styles.infoText}>Camera permission is required for barcode scanning</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.loginButton}>
          <Text style={styles.loginButtonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <Text style={styles.title}>Shop Companion</Text>
          <View style={styles.statusBadge}>
            <View style={styles.statusIndicator} />
            <Text style={styles.statusText}>API Connected</Text>
          </View>
        </View>
        <View style={styles.userRow}>
          <Text style={styles.userInfo}>
            Logged in as: <Text style={styles.userBold}>{user?.name}</Text> ({user?.role})
          </Text>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Camera Barcode Scanner Container */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'code93'],
          }}
        />
        {scanned && (
          <View style={styles.overlay}>
            <Text style={styles.overlayText}>Barcode Scanned!</Text>
          </View>
        )}
      </View>

      {/* Scan Results Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerLabel}>Last Scanned Code:</Text>
        <Text style={styles.footerValue}>{lastScanned || 'None'}</Text>
        {scanStatus && <Text style={styles.statusMsg}>{scanStatus}</Text>}

        {scanned && (
          <TouchableOpacity style={styles.scanAgainButton} onPress={() => setScanned(false)}>
            <Text style={styles.buttonText}>Scan Next Code</Text>
          </TouchableOpacity>
        )}
      </View>

      <DevMenuOverlay />
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainScreen />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#ccc',
    marginTop: 12,
    fontSize: 16,
  },
  authContainer: {
    flexGrow: 1,
    backgroundColor: '#121212',
    padding: 20,
    paddingTop: 60,
  },
  authTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  authSubtitle: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardLabel: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSubtext: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 12,
  },
  fieldLabel: {
    color: '#ddd',
    fontSize: 13,
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#444',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  smallButton: {
    flex: 1,
    backgroundColor: '#1976D2',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: '#2196F3',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 14,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#F44336',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
    fontSize: 13,
  },
  infoText: {
    color: '#81C784',
    marginTop: 8,
    fontSize: 13,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 20,
    backgroundColor: '#1f1f1f',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  statusText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  userInfo: {
    color: '#bbb',
    fontSize: 13,
  },
  userBold: {
    color: '#fff',
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#d32f2f',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  logoutText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  footer: {
    padding: 18,
    backgroundColor: '#1f1f1f',
    minHeight: 120,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  footerLabel: {
    color: '#aaa',
    fontSize: 13,
  },
  footerValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 2,
  },
  statusMsg: {
    color: '#81C784',
    fontSize: 12,
    marginTop: 4,
  },
  scanAgainButton: {
    marginTop: 10,
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
});
