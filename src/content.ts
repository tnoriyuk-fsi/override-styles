import { getSetting, watchSetting } from './lib/storage';
import { render } from './lib/inject';

const host = location.hostname;

async function init(): Promise<void> {
  const setting = await getSetting(host);
  render(setting);
  // storage 変更を監視してライブ反映する
  watchSetting(host, (setting) => render(setting));
}

void init();
