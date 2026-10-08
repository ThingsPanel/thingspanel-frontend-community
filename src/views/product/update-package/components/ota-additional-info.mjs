export function createOtaAdditionalInfo(currentValue, size) {
  let info = {};
  if (currentValue.trim()) {
    try {
      info = JSON.parse(currentValue);
    } catch {
      return null;
    }
    if (!info || Array.isArray(info) || typeof info !== 'object') return null;
  }

  return JSON.stringify({
    deliveryProtocol: 'ygsoul_http',
    orchestrationRoute: 'device_integration',
    ...info,
    size
  }, null, 2);
}
