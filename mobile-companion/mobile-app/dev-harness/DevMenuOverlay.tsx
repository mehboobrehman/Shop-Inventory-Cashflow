/**
 * Floating Developer Menu & Telemetry Status Overlay
 * Rendered ONLY when __DEV__ is true. In production builds, returns null.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import {
  getTelemetryStatus,
  setTelemetryServerIp,
  autodiscoverServer,
  subscribeTelemetryStatus,
  logToAgent,
  logNetwork,
  clearTelemetryQueue,
  TelemetryStatus
} from './logger';

declare const __DEV__: boolean;

export function DevMenuOverlay(): React.ReactElement | null {
  // Enforce zero UI footprint in production
  if (typeof __DEV__ !== 'undefined' && !__DEV__) {
    return null;
  }

  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<TelemetryStatus>(getTelemetryStatus());
  const [inputIp, setInputIp] = useState(status.serverIp);
  const [inputPort, setInputPort] = useState(String(status.serverPort));
  const [isSearching, setIsSearching] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeTelemetryStatus(() => {
      const s = getTelemetryStatus();
      setStatus(s);
    });
    return unsubscribe;
  }, []);

  const handleOpen = () => {
    const s = getTelemetryStatus();
    setStatus(s);
    setInputIp(s.serverIp);
    setInputPort(String(s.serverPort));
    setVisible(true);
  };

  const handleSave = async () => {
    const port = parseInt(inputPort, 10) || 8088;
    await setTelemetryServerIp(inputIp, port);
    showNotice(`Saved: ${inputIp}:${port}`);
  };

  const handleAutodiscover = async () => {
    setIsSearching(true);
    showNotice('Scanning LAN for Telemetry Server...');
    const found = await autodiscoverServer();
    setIsSearching(false);
    if (found) {
      const s = getTelemetryStatus();
      setInputIp(s.serverIp);
      setInputPort(String(s.serverPort));
      showNotice(`Found Telemetry Server: ${s.serverIp}:${s.serverPort}`);
    } else {
      showNotice('No server detected on local subnet.');
    }
  };

  const handleSendTestLog = () => {
    logToAgent(
      'INFO',
      'Test/Harness',
      'Telemetry test event dispatched from mobile overlay!',
      {
        sampleId: Math.floor(Math.random() * 10000),
        clientTime: new Date().toISOString(),
        deviceInfo: { app: 'Shop-Companion-Mobile', env: 'development' }
      },
      'LOG'
    );
    showNotice('Test log dispatched!');
  };

  const handleSendTestNetwork = () => {
    logNetwork(
      'POST',
      'http://api.local/v1/inventory/sync',
      200,
      138,
      { 'Content-Type': 'application/json', Authorization: 'Bearer eyJhbGciOiJIUzI1Ni...' },
      { itemsUpdated: 4, timestamp: Date.now(), token: 'secret-auth-token-123' }
    );
    showNotice('Test network event dispatched (PII scrubbed)!');
  };

  const handleClear = () => {
    clearTelemetryQueue();
    showNotice('Queue cleared');
  };

  const showNotice = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => {
      setActionMessage(null);
    }, 3000);
  };

  const getStatusColor = () => {
    if (status.connected) return '#4CAF50';
    if (status.connecting) return '#FF9800';
    return '#F44336';
  };

  const getStatusLabel = () => {
    if (status.connected) return 'Connected';
    if (status.connecting) return 'Connecting...';
    return 'Disconnected';
  };

  return (
    <>
      {/* Floating Dev Badge */}
      <TouchableOpacity
        style={[styles.floatingBadge, { borderColor: getStatusColor() }]}
        onPress={handleOpen}
        activeOpacity={0.8}
        accessibilityLabel="Open Dev Telemetry Menu"
      >
        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
        <Text style={styles.badgeText}>DEV</Text>
      </TouchableOpacity>

      {/* Dev Menu Modal */}
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <View style={[styles.statusDotLarge, { backgroundColor: getStatusColor() }]} />
                <Text style={styles.title}>Dev Telemetry Harness</Text>
              </View>
              <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
              {/* Status Banner */}
              <View style={[styles.statusBanner, { borderColor: getStatusColor() }]}>
                <Text style={styles.statusBannerText}>
                  Status: <Text style={{ color: getStatusColor(), fontWeight: 'bold' }}>{getStatusLabel()}</Text>
                </Text>
                <Text style={styles.statusDetailText}>
                  Target: {status.serverIp}:{status.serverPort}
                </Text>
              </View>

              {/* Action Message Notice */}
              {actionMessage && (
                <View style={styles.noticeBox}>
                  <Text style={styles.noticeText}>{actionMessage}</Text>
                </View>
              )}

              {/* Metrics Grid */}
              <View style={styles.metricsGrid}>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Queued</Text>
                  <Text style={styles.metricValue}>{status.queueLength}</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Sent</Text>
                  <Text style={[styles.metricValue, { color: '#4CAF50' }]}>{status.sentCount}</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Dropped</Text>
                  <Text style={[styles.metricValue, { color: status.droppedCount > 0 ? '#F44336' : '#888' }]}>
                    {status.droppedCount}
                  </Text>
                </View>
              </View>

              {/* Server Connection Form */}
              <Text style={styles.sectionHeader}>Server Configuration</Text>
              <View style={styles.inputRow}>
                <View style={{ flex: 3, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Host / IP</Text>
                  <TextInput
                    style={styles.textInput}
                    value={inputIp}
                    onChangeText={setInputIp}
                    placeholder="192.168.1.X or 10.0.2.2"
                    placeholderTextColor="#666"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                <View style={{ flex: 1.5 }}>
                  <Text style={styles.inputLabel}>Port</Text>
                  <TextInput
                    style={styles.textInput}
                    value={inputPort}
                    onChangeText={setInputPort}
                    placeholder="8088"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleSave}>
                  <Text style={styles.btnText}>Save & Connect</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn, styles.btnSecondary]}
                  onPress={handleAutodiscover}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>Autodiscover</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Test Utilities */}
              <Text style={styles.sectionHeader}>Diagnostic Actions</Text>
              <View style={styles.actionGrid}>
                <TouchableOpacity style={[styles.btn, styles.btnAction]} onPress={handleSendTestLog}>
                  <Text style={styles.btnText}>Emit Test Log</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnAction]} onPress={handleSendTestNetwork}>
                  <Text style={styles.btnText}>Emit Network Event</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={handleClear}>
                  <Text style={styles.btnText}>Clear Buffer</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.footerNote}>
                Zero-Release Footprint: This menu and all telemetry handlers are completely stripped in production builds.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingBadge: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    zIndex: 9999
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6
  },
  statusDotLarge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold'
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    backgroundColor: '#18181B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272A',
    overflow: 'hidden'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
    backgroundColor: '#202024'
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  title: {
    color: '#FAFAFA',
    fontSize: 16,
    fontWeight: 'bold'
  },
  closeButton: {
    padding: 4
  },
  closeButtonText: {
    color: '#A1A1AA',
    fontSize: 18,
    fontWeight: 'bold'
  },
  content: {
    padding: 16
  },
  contentContainer: {
    paddingBottom: 20
  },
  statusBanner: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#202024',
    borderWidth: 1,
    marginBottom: 12
  },
  statusBannerText: {
    color: '#D4D4D8',
    fontSize: 14,
    marginBottom: 4
  },
  statusDetailText: {
    color: '#71717A',
    fontSize: 12
  },
  noticeBox: {
    backgroundColor: '#1E3A8A',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12
  },
  noticeText: {
    color: '#93C5FD',
    fontSize: 12,
    textAlign: 'center'
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#202024',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4
  },
  metricLabel: {
    color: '#71717A',
    fontSize: 11,
    marginBottom: 4,
    textTransform: 'uppercase'
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold'
  },
  sectionHeader: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 6
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 12
  },
  inputLabel: {
    color: '#71717A',
    fontSize: 11,
    marginBottom: 4
  },
  textInput: {
    backgroundColor: '#27272A',
    color: '#FAFAFA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#3F3F46'
  },
  buttonRow: {
    flexDirection: 'row',
    marginBottom: 16
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: '#2563EB',
    marginRight: 8
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: '#3F3F46'
  },
  btnAction: {
    backgroundColor: '#27272A',
    borderWidth: 1,
    borderColor: '#3F3F46',
    marginBottom: 8
  },
  btnDanger: {
    backgroundColor: '#7F1D1D',
    marginBottom: 8
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600'
  },
  actionGrid: {
    marginBottom: 16
  },
  footerNote: {
    color: '#52525B',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 8
  }
});
