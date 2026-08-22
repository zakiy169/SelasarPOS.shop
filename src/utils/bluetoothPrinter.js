// Web Bluetooth API Integration for ESC/POS Thermal Printers (58mm & 80mm)
import { getReceiptLines } from './receipt';
import { canvasToEscPosRaster, receiptElementToCanvas } from './receiptRaster';

class BluetoothPrinterManager {
  constructor() {
    this.device = null;
    this.server = null;
    this.characteristic = null;
    this.serialPort = null;
    this.serialWriter = null;
    this.transport = null;
    this.isConnected = false;
    this.deviceName = (typeof localStorage !== 'undefined' && localStorage.getItem('selasar_bt_printer_name')) || '';
  }

  isSupported() {
    return typeof window !== 'undefined' && Boolean(window.navigator) && 'bluetooth' in window.navigator;
  }

  isSerialSupported() {
    return typeof window !== 'undefined' && Boolean(window.navigator) && 'serial' in window.navigator;
  }

  notifyStatus() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('selasar_bt_status_change'));
    }
  }

  async scanAndConnect() {
    // Standard Bluetooth Thermal Printer & Serial GATT Services
    const standardServices = [
      '000018f0-0000-1000-8000-00805f9b34fb', // Standard Printer Service
      '00001101-0000-1000-8000-00805f9b34fb', // Serial Port Profile (SPP)
      '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10 BLE Serial
      '0000ffe1-0000-1000-8000-00805f9b34fb',
      '0000ff00-0000-1000-8000-00805f9b34fb',
      '0000af00-0000-1000-8000-00805f9b34fb',
      '0000ae30-0000-1000-8000-00805f9b34fb',
      'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
      '49535343-fe7d-4ae5-8fa9-9fafd205e455'
    ];

    if (this.isSupported()) {
      try {
        // Request bluetooth device via Web Bluetooth browser popup
        this.device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: standardServices
        });

        this.deviceName = this.device.name || 'Bluetooth Thermal Printer';

        this.device.addEventListener('gattserverdisconnected', () => {
          this.isConnected = false;
          this.transport = null;
          this.server = null;
          this.characteristic = null;
          this.notifyStatus();
        });

        this.server = await this.device.gatt.connect();

        // Find primary service and writable characteristic
        try {
          const services = await this.server.getPrimaryServices();
          if (services.length > 0) {
            for (const service of services) {
              const characteristics = await service.getCharacteristics();
              for (const char of characteristics) {
                if (char.properties.write || char.properties.writeWithoutResponse) {
                  this.characteristic = char;
                  break;
                }
              }
              if (this.characteristic) break;
            }
          }
        } catch (e) {
          console.warn('Could not resolve GATT characteristic', e);
        }

        if (!this.characteristic) {
          this.device.gatt.disconnect();
          throw new Error('Printer BLE tidak memiliki kanal cetak yang bisa ditulis.');
        }

        this.transport = 'ble';
        this.isConnected = true;

        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('selasar_bt_printer_name', this.deviceName);
        }
        this.notifyStatus();

        return {
          success: true,
          deviceName: this.deviceName
        };
      } catch (error) {
        if (error.name === 'NotFoundError') {
          throw error; // User cancelled browser popup
        }
        console.warn('Native Web Bluetooth scan failed, enabling in-app picker fallback:', error);
      }
    }

    throw new Error('WEB_BLUETOOTH_FALLBACK');
  }

  async scanAndConnectSerial() {
    if (!this.isSerialSupported()) {
      throw new Error('Browser ini tidak mendukung pemilih port COM/SPP. Buka aplikasi lewat Chrome atau Edge desktop, lalu pasangkan printer lebih dulu dari pengaturan Bluetooth perangkat.');
    }

    // Printer thermal Bluetooth klasik biasanya muncul sebagai port COM setelah
    // dipasangkan di pengaturan Bluetooth OS.
    const port = await window.navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });
    this.serialPort = port;
    this.serialWriter = port.writable?.getWriter();
    if (!this.serialWriter) {
      await port.close();
      this.serialPort = null;
      throw new Error('Port printer tidak dapat ditulis.');
    }
    this.transport = 'serial';
    this.isConnected = true;
    this.deviceName = port.getInfo ? 'Bluetooth Thermal Printer (COM)' : 'Bluetooth Thermal Printer';
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('selasar_bt_printer_name', this.deviceName);
    }
    this.notifyStatus();
    return { success: true, deviceName: this.deviceName };
  }

  async disconnect() {
    if (this.device && this.device.gatt && this.device.gatt.connected) {
      try { this.device.gatt.disconnect(); } catch {}
    }
    if (this.serialWriter) {
      try { await this.serialWriter.close(); } catch {}
      try { this.serialWriter.releaseLock(); } catch {}
    }
    if (this.serialPort) {
      try { await this.serialPort.close(); } catch {}
    }
    this.isConnected = false;
    this.deviceName = '';
    this.characteristic = null;
    this.device = null;
    this.server = null;
    this.serialWriter = null;
    this.serialPort = null;
    this.transport = null;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('selasar_bt_printer_name');
    }
    this.notifyStatus();
  }

  async sendRawData(data) {
    if (!this.isConnected) {
      throw new Error('Printer Bluetooth belum terhubung.');
    }

    const encoder = new TextEncoder();
    const bytes = typeof data === 'string' ? encoder.encode(data) : data;

    if (this.transport === 'ble' && this.server && this.server.connected) {
      const chunkSize = 512;
      if (this.characteristic) {
        for (let i = 0; i < bytes.length; i += chunkSize) {
          const chunk = bytes.slice(i, i + chunkSize);
          if (this.characteristic.properties.writeWithoutResponse) {
            await this.characteristic.writeValueWithoutResponse(chunk);
          } else {
            await this.characteristic.writeValue(chunk);
          }
        }
        return;
      }
    }

    if (this.transport === 'serial' && this.serialWriter) {
      await this.serialWriter.write(bytes);
      return;
    }

    this.isConnected = false;
    throw new Error('Koneksi printer sudah terputus. Silakan sambungkan ulang.');
  }

  // Format receipt in raw ESC/POS commands
  formatESCPOSTransaction(transaction, appSettings = {}) {
    const is80mm = appSettings.printerWidth === '80mm';
    const width = is80mm ? 48 : 32; // Line width in chars
    const divider = '-'.repeat(width) + '\n';
    const normalizeText = (text) => String(text || '').replace(/\u00a0/g, ' ').replace(/[\t ]+/g, ' ').trim();
    const wrapToLines = (text, maxLength) => {
      const paragraphs = String(text || '').split(/\r?\n/);
      const lines = [];
      paragraphs.forEach(paragraph => {
        const words = normalizeText(paragraph).split(' ').filter(Boolean);
        let current = '';
        words.forEach(word => {
          const pieces = [];
          for (let index = 0; index < word.length; index += maxLength) pieces.push(word.slice(index, index + maxLength));
          pieces.forEach(piece => {
            const candidate = current ? `${current} ${piece}` : piece;
            if (candidate.length <= maxLength) current = candidate;
            else {
              if (current) lines.push(current);
              current = piece;
            }
          });
        });
        if (current) lines.push(current);
        else if (!words.length) lines.push('');
      });
      return lines.length ? lines : [''];
    };
    const centerLine = (text) => wrapToLines(text, width).map(value => {
      const leftPad = Math.max(0, Math.floor((width - value.length) / 2));
      return `${' '.repeat(leftPad)}${value}`;
    }).join('\n') + '\n';
    const wrapLine = (text, indent = '') => wrapToLines(text, Math.max(1, width - indent.length)).map(line => indent + line).join('\n') + '\n';
    const padReceiptLine = (left, right) => {
      const leftStr = normalizeText(left);
      const rightStr = normalizeText(right);
      if (!rightStr) return wrapLine(leftStr);
      if (!leftStr) return `${rightStr.padStart(width)}\n`;
      const availableLeft = Math.max(8, width - rightStr.length - 1);
      const leftLines = wrapToLines(leftStr, availableLeft);
      const first = leftLines.shift() || '';
      const firstRow = `${first}${' '.repeat(Math.max(1, width - first.length - rightStr.length))}${rightStr}`;
      return [firstRow, ...leftLines].join('\n') + '\n';
    };

    let receiptOutput = '\x1B\x40';
    getReceiptLines(transaction, appSettings).forEach(line => {
      if (line.type === 'divider') {
        receiptOutput += divider;
        return;
      }

      if (line.type === 'center') {
        receiptOutput += '\x1B\x61\x01';
        receiptOutput += line.strong ? '\x1B\x45\x01' : '\x1B\x45\x00';
        receiptOutput += centerLine(line.text);
        receiptOutput += '\x1B\x45\x00';
        return;
      }

      receiptOutput += '\x1B\x61\x00';
      if (line.type === 'row') {
        receiptOutput += (line.strong || line.total || line.strongRight) ? '\x1B\x45\x01' : '\x1B\x45\x00';
        receiptOutput += padReceiptLine(line.left, line.right);
        receiptOutput += '\x1B\x45\x00';
        return;
      }

      receiptOutput += line.type === 'subtext' ? wrapLine(line.text, '  ') : wrapLine(line.text);
    });
    receiptOutput += '\n\n\n\x1D\x56\x00';
    return receiptOutput;
  }

  async printReceiptPreview(receiptElement, appSettings = {}) {
    if (!this.isConnected) {
      throw new Error('Printer Bluetooth belum terhubung.');
    }
    const dots = appSettings.printerWidth === '80mm' ? 576 : 384;
    const canvas = await receiptElementToCanvas(receiptElement, dots);
    const escData = canvasToEscPosRaster(canvas);
    await this.sendRawData(escData);
  }

  // Kept as a compatibility fallback for callers outside the receipt modal.
  async printTransaction(transaction, appSettings = {}) {
    if (!this.isConnected) throw new Error('Printer Bluetooth belum terhubung.');
    await this.sendRawData(this.formatESCPOSTransaction(transaction, appSettings));
  }

  async printTestReceipt() {
    if (!this.isConnected) {
      throw new Error('Printer tidak terhubung!');
    }

    const text = 
      "\x1B\x40" + // ESC @ Reset
      "\x1B\x61\x01" + // Center Align
      "\x1B\x21\x30" + "KEDAI KOPI SELASAR\n" + "\x1B\x21\x00" +
      "--------------------------------\n" +
      "TEST PRINT PRINTER BLUETOOTH\n" +
      "Koneksi Berhasil Disambungkan!\n" +
      "--------------------------------\n\n\n\x1D\x56\x00"; // Cut paper

    await this.sendRawData(text);
  }
}

export const bluetoothPrinter = new BluetoothPrinterManager();
