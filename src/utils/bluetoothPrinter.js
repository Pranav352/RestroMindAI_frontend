/**
 * Web Bluetooth ESC/POS Thermal KOT Printer Driver for RestroMind AI
 */

// Common Thermal Printer Service UUIDs (ESC/POS over Bluetooth)
const THERMAL_PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard ESC/POS Service
  '00001101-0000-1000-8000-00805f9b34fb', // Serial Port Profile (SPP)
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2'  // Custom POS Bluetooth Service
];

/**
 * Format order data into ESC/POS binary command stream
 */

export const generateEscPosKotBuffer = (order, restaurantName = 'RestroMind AI') => {
  const encoder = new TextEncoder();
  const chunks = [];

  // Helper byte arrays
  const initPrinter = new Uint8Array([0x1b, 0x40]);           // ESC @ (Reset)
  const alignCenter = new Uint8Array([0x1b, 0x61, 0x01]);       // ESC a 1 (Center)
  const alignLeft = new Uint8Array([0x1b, 0x61, 0x00]);         // ESC a 0 (Left)
  const doubleSize = new Uint8Array([0x1d, 0x21, 0x11]);        // GS ! 11 (2x Width & Height)
  const boldOn = new Uint8Array([0x1b, 0x45, 0x01]);            // ESC E 1
  const boldOff = new Uint8Array([0x1b, 0x45, 0x00]);           // ESC E 0
  const resetSize = new Uint8Array([0x1d, 0x21, 0x00]);         // Normal Text
  const feedAndCut = new Uint8Array([0x1d, 0x56, 0x42, 0x00]);   // GS V 66 0 (Partial Cut)

  // 1. Initialize
  chunks.push(initPrinter);
  chunks.push(alignCenter);

  // 2. Header
  chunks.push(boldOn);
  chunks.push(encoder.encode(`${restaurantName.toUpperCase()}\n`));
  chunks.push(doubleSize);
  chunks.push(encoder.encode(`--- KOT --- \n`));
  chunks.push(resetSize);
  chunks.push(encoder.encode(`Table: ${order.table_number || 'Takeaway'}\n`));
  chunks.push(encoder.encode(`Order #${order.id ? String(order.id).slice(0, 8) : 'NEW'}\n`));
  chunks.push(encoder.encode(`Time: ${new Date(order.created_at || Date.now()).toLocaleTimeString()}\n`));
  chunks.push(boldOff);

  chunks.push(encoder.encode(`--------------------------------\n`));

  // 3. Items list
  chunks.push(alignLeft);
  chunks.push(boldOn);
  chunks.push(encoder.encode(`QTY   ITEM NAME\n`));
  chunks.push(boldOff);
  chunks.push(encoder.encode(`--------------------------------\n`));

  const items = order.items || [];
  items.forEach((item) => {
    const qty = String(item.quantity).padEnd(5, ' ');
    const name = item.name || item.menu_item_detail?.name || 'Item';
    chunks.push(boldOn);
    chunks.push(encoder.encode(`${qty}${name}\n`));
    chunks.push(boldOff);
    if (item.special_instructions) {
      chunks.push(encoder.encode(`      * Note: ${item.special_instructions}\n`));
    }
  });

  chunks.push(encoder.encode(`--------------------------------\n`));
  chunks.push(alignCenter);
  chunks.push(encoder.encode(`Chef Copy - Powered by RestroMind\n\n\n`));
  chunks.push(feedAndCut);

  // Combine Uint8Arrays
  const totalLength = chunks.reduce((acc, curr) => acc + curr.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  chunks.forEach((chunk) => {
    combined.set(chunk, offset);
    offset += chunk.length;
  });

  return combined;
};

/**
 * Pair Bluetooth thermal printer and transmit KOT receipt
 */
export const printThermalKOTViaBluetooth = async (order, restaurantName = 'RestroMind AI') => {
  if (!navigator.bluetooth) {
    throw new Error('Web Bluetooth is not supported in this browser. Please use Chrome or Edge.');
  }

  try {
    console.log('[Web Bluetooth] Requesting bluetooth thermal printer device...');
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: THERMAL_PRINTER_SERVICES
    });

    console.log(`[Web Bluetooth] Connecting to GATT server on ${device.name || 'Printer'}...`);
    const server = await device.gatt.connect();

    // Find primary service
    let service = null;
    for (const serviceUuid of THERMAL_PRINTER_SERVICES) {
      try {
        service = await server.getPrimaryService(serviceUuid);
        if (service) break;
      } catch (e) {
        // Continue checking other UUIDs
      }
    }

    if (!service) {
      const services = await server.getPrimaryServices();
      if (services.length > 0) {
        service = services[0];
      } else {
        throw new Error('Could not find supported thermal printer GATT service.');
      }
    }

    // Find write characteristic
    const characteristics = await service.getCharacteristics();
    const writeCharacteristic = characteristics.find(
      (c) => c.properties.write || c.properties.writeWithoutResponse
    );

    if (!writeCharacteristic) {
      throw new Error('Printer service has no writable GATT characteristic.');
    }

    // Format KOT commands and send in 512-byte chunks
    const kotBuffer = generateEscPosKotBuffer(order, restaurantName);
    const CHUNK_SIZE = 512;

    for (let i = 0; i < kotBuffer.length; i += CHUNK_SIZE) {
      const chunk = kotBuffer.subarray(i, i + CHUNK_SIZE);
      if (writeCharacteristic.properties.writeWithoutResponse) {
        await writeCharacteristic.writeValueWithoutResponse(chunk);
      } else {
        await writeCharacteristic.writeValue(chunk);
      }
    }

    console.log('[Web Bluetooth] KOT receipt printed successfully!');
    if (device.gatt.connected) {
      device.gatt.disconnect();
    }
    return true;
  } catch (err) {
    console.error('[Web Bluetooth Print Error]', err);
    throw err;
  }
};
