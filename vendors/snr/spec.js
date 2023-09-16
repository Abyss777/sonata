module.exports = {
  version: '1.0',
  id: 'snr',
  name: 'SNR',
  instruction: 'В поле Server {{server}}, в поле file {{qs}}/{mac}.cfg',
  scopes: [
    'accounts',
    'phonebooks',
    'timezone',
    'ntp',
  ],
  models: require('./models'),
  timezones: {
    'GMT+01': '+1',
    'GMT+02': '+2',
    'GMT+03': '+3',
    'GMT+04': '+4',
    'GMT+05': '+5',
    'GMT+06': '+6',
    'GMT+07': '+7',
    'GMT+08': '+8',
    'GMT+09': '+9',
    'GMT+10': '+10',
    'GMT+11': '+11',
  },
};
