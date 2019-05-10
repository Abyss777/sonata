
const devices = require('./../provision/vendors/');
const url = require('url-parse');
const timezones = require('./../provision/vendors/timezones');

const replacePhonebooksVars = (config, phonebooks) => {
  phonebooks.forEach((element, id) => {
    const maskUrl = '{{' + (
      ['phonebook', id + 1, 'url'].join('_')
    ) + '}}';
      // console.log('mask url', maskUrl);
    const pbUrl = url(element.url);
    config = config.replace(maskUrl, pbUrl['host'] + pbUrl['pathname']
        + pbUrl['query'] + pbUrl['hash']);

    const maskProtocol = '{{' + (
      ['phonebook', id + 1, 'protocol'].join('_')
    ) + '}}';
    const protocol = url(element.url).protocol === 'https:' ? '3' : '1';
    config = config.replace(maskProtocol, protocol);


    const maskFullUrl = '{{' + (
      ['phonebook', id + 1, 'fullurl'].join('_')
    ) + '}}';
    config = config.replace(maskFullUrl, element.url);

    const maskName = '{{' + (
      ['phonebook', id + 1, 'name'].join('_')
    ) + '}}';
    config = config.replace(maskName, element.name);
  });
  return config;
};

const replaceAccountsVars = (config, accounts) => {
  accounts.forEach((element) => {
    element = findEnabledAndSet(element);
    for (prop in element) {
      if (Object.prototype.hasOwnProperty.call(element, prop)) {
        const mask = '{{' + (
          ['account', element.line, prop].join('_')
        ) + '}}';
        config = config.replace(new RegExp(mask, 'g'), element[prop]);
      }
    }
  });
  return config;
};

const replaceFirmware = (config, firmware, device) => {
  if (firmware === true) {
    console.log('device', device);
    firmware = getVendorSpec(device.vendor).defaults.firmware;
  }
  if (typeof firmware === 'object') {
    config = config.replace('{{firmware_url}}', firmware.url);
  }
  return config;
};

const replaceTimezone = (config, device) => {
  console.log('---- device:', device);
  const tz = timezones
      .getTimezoneByOffset(device.timezone_offset, device.vendor);
  console.log('---- tz:', tz);
  return config.replace('{{timezone}}', tz);
};

const replaceNtpServer = (config, device) => {
  if (!device.ntp_server) {
    return config;
  }
  return config.replace('{{ntp_server}}', device.ntp_server);
};

const phoneReplace = (template, device) => {
  let config = template.toString('utf8')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\n\n/g, '\n');

  config = replaceNtpServer(config, device);

  config = replaceTimezone(config, device);

  if (device.accounts) {
    config = replaceAccountsVars(config, device.accounts);
  }

  if (device.phonebooks && device.phonebooks.length > 0) {
    // console.log('replace phonebooks');
    config = replacePhonebooksVars(config, device.phonebooks);
  }

  // console.log('device ------:', device);
  if (device.firmware) {
    config = replaceFirmware(config, device.firmware, device);
    // console.log('---- 1', config)
  }

  return config;
};

const findEnabledAndSet = (account) => {
  if (!account.hasOwnProperty('enabled')) {
    account.enabled = 1;
  }
  if (!account.enabled) {
    account.enabled = 0;
  } else {
    account.enabled = 1;
  }
  return account;
};

const replaceProfilesVars = (config, profiles) => {
  profiles.forEach((element) => {
    for (prop in element) {
      if (Object.prototype.hasOwnProperty.call(element, prop)) {
        const mask = '{{' + (
          ['profile', element.id, prop].join('_')
        ) + '}}';
          // console.log(mask)
        config = config.replace(mask, element[prop]);
      }
    }
  });
  return config;
};

const removeComments = (config) => {
  return config.replace(/<!--[\s\S]*?-->/g, '');
};

const removeEmptyStrings = (config) => {
  return config.replace(/\n\n/g, '\n');
};

const gatewayReplace = (template, device) => {
  let config = template.toString('utf8');

  config = removeComments(config);
  config = removeEmptyStrings(config);
  config = replaceNtpServer(config, device);
  config = replaceTimezone(config, device);

  if (device.accounts) {
    config = replaceAccountsVars(config, device.accounts);
  }

  if (device.profiles) {
    config = replaceProfilesVars(config, device.profiles);
  }

  return config;
};

const getVendorSpec = (vendor) => {
  const vendorSpec = devices.find((vendorSpec) => {
    return vendorSpec.id === vendor;
  });
  return vendorSpec;
};

const getDeviceSpec = (vendor, model) => {
  const vendorSpec = getVendorSpec(vendor);
  // console.log(vendorSpec);
  if (!vendorSpec.models || vendorSpec.models.length < 1) return null;

  const modelSpec = vendorSpec.models.find((modelSpec) => {
    return modelSpec.id === model;
  });

  return modelSpec;
};


module.exports = {
  gatewayReplace,
  phoneReplace,
  getDeviceSpec,
  getVendorSpec,
};