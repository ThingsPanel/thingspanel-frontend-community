import home from './home';
import groupPage from './groupPage';
import devicePage from './devicePage';
import groupingDetails from './grouping_details';
import deviceDetails from './device_details';
import management from './management';
import personalCenter from './personalCenter';
import plugin from './plugin';
import visualization from './visualization';

// Placeholder for associated devices translations
const associatedDevices = {
  selectDeviceFirst: 'Please select at least one device.'
};

// Placeholder for config edit translations
const configEdit = {
  parseProtocolError: 'Failed to parse protocol config',
  loadConfigError: 'Failed to load configuration'
};

export default {
  home,
  groupPage,
  devicePage,
  grouping_details: groupingDetails,
  device_details: deviceDetails,
  management,
  personalCenter,
  plugin,
  visualization,
  associatedDevices,
  configEdit
};
