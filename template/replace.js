const url = require('url-parse');
const VendorStore = require('./../vendors/index');
const vendors = new VendorStore();

const replacePhonebooksVars = (config, phonebooks) => {
  phonebooks.forEach((element, id) => {
    const maskUrl = '{{' + (
      ['phonebook', id + 1, 'url'].join('_')
    ) + '}}';
      // console.log('mask url', maskUrl);
    const pbUrl = url(element.url);
    config = config.replace(maskUrl, pbUrl['host'] + pbUrl['pathname'] +
        pbUrl['query'] + pbUrl['hash']);

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

const getTypeId = (vendor, name) => {
  const types = {
    fanvil: {
      speeddial: '1',
      line: '2',
      keyevent: '3',
      dtmf: '4',
    },
    snom: {
      speeddial: 'speed',
      keyevent: 'keyevent',
      dtmf: 'dtmf',
      line: 'line',
    },
  };
  return types[vendor][name];
};


const replaceFunctionkeysVars = (config, functionkeys, device) => {
  functionkeys.forEach((element, id) => {
    const maskName = '{{' + (
      ['functionkey', id + 1, 'name'].join('_')
    ) + '}}';
    config = config.replace(maskName, element.name);

    const maskValue = '{{' + (
      ['functionkey', id + 1, 'value'].join('_')
    ) + '}}';
    config = config.replace(maskValue, element.value);

    const maskType = '{{' + (
      ['functionkey', id + 1, 'type'].join('_')
    ) + '}}';
    config = config.replace(maskType, getTypeId(device.vendor, element.type));
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
    firmware = vendors.getVendorSpec(device.vendor).defaults.firmware;
  }
  if (typeof firmware === 'object') {
    config = config.replace('{{firmware_url}}', firmware.url);
  }
  return config;
};

const replaceTimezone = (config, device) => {
  console.log('---- device:', device);
  const tz = vendors
      .getTimezoneByOffset(device.vendor, device.model, device.timezone_offset);
  console.log('---- tz:', tz);
  return config.replace('{{timezone}}', tz);
};

const replaceNtpServer = (config, device) => {
  if (!device.ntp_server) {
    return config;
  }
  return config.replace('{{ntp_server}}', device.ntp_server);
};

const removeComments = (config) => {
  return config.replace(/<!--[\s\S]*?-->/g, '');
};

const removeEmptyStrings = (config) => {
  return config.replace(/\n\n/g, '\n');
};

const phoneReplace = (template, device) => {
  let config = template;
  config = removeComments(config);
  config = removeEmptyStrings(config);
  config = replaceNtpServer(config, device);
  config = replaceTimezone(config, device);

  if (device.accounts) {
    config = replaceAccountsVars(config, device.accounts);
  }

  if (device.phonebooks && device.phonebooks.length > 0) {
    config = replacePhonebooksVars(config, device.phonebooks);
  }

  if (device.functionkeys && device.functionkeys.length > 0) {
    config = replaceFunctionkeysVars(config, device.functionkeys, device);
  }

  if (device.firmware) {
    config = replaceFirmware(config, device.firmware, device);
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

const gatewayReplace = (template, device) => {
  let config = phoneReplace(template, device);

  if (device.profiles) {
    config = replaceProfilesVars(config, device.profiles);
  }

  return config;
};

module.exports = {
  gatewayReplace,
  phoneReplace,
};
