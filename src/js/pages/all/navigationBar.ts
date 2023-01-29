import { getRobuxBalance } from '../../services/currencyService';
import {
  getSettingValue,
  getSettingValueAndListenForChanges,
} from '../../services/settingsService';
import authenticatedUser from '../../utils/authenticatedUser';

const devexRate = 0.0035;
const abbreviations = [
  {
    value: 1000,
    abbreviation: 'K',
  },
  {
    value: 1_000_000,
    abbreviation: 'M',
  },
  {
    value: 1_000_000_000,
    abbreviation: 'B',
  },
  {
    value: 1_000_000_000_000,
    abbreviation: 'T',
  },
];

const getRobux = (): number => {
  const countElement = document.getElementById('nav-robux-amount');
  const count = Number(countElement?.getAttribute('count') || NaN);
  if (!isNaN(count)) {
    return count;
  }

  const element = document.getElementById('nav-robux-balance');
  const match = element?.innerText.match(/\d+/g) || [];
  if (match.length < 1) {
    return NaN;
  }

  const textCount = Number(match.join(''));
  if (!isNaN(textCount)) {
    countElement?.setAttribute('count', textCount.toString());
  }

  return textCount;
};

const setText = (element: HTMLElement, text: string) => {
  if (element.innerText === text) {
    return;
  }

  element.innerText = text;
};

const setAbbreviatedRobux = (count: number, abbreviationAt: number) => {
  const navbarElement = document.getElementById('nav-robux-amount');
  if (navbarElement) {
    navbarElement?.setAttribute('count', count.toString());

    if (count < abbreviationAt) {
      setText(navbarElement, count.toLocaleString());
    } else {
      for (let i = abbreviations.length - 1; i >= 0; i--) {
        if (count >= abbreviations[i].value) {
          setText(
            navbarElement,
            `${Math.floor(count / abbreviations[i].value).toLocaleString()}${
              abbreviations[i].abbreviation
            }+`
          );
          break;
        }
      }
    }
  }

  const fullBalanceElement = document.getElementById('nav-robux-balance');
  if (fullBalanceElement) {
    fullBalanceElement.innerText = count.toLocaleString() + ' Robux';

    let devexElement = document.getElementById('rplus-devex-rate');
    if (!devexElement) {
      const devexContainer = document.createElement('li');

      devexElement = document.createElement('a');
      devexElement.setAttribute('id', 'rplus-devex-rate');
      devexElement.setAttribute('href', 'https://create.roblox.com/devex');
      devexElement.classList.add('rbx-menu-item');
      devexContainer.append(devexElement);

      fullBalanceElement.parentElement?.after(devexContainer);
    }

    const devexBalance = count * devexRate;
    setText(
      devexElement,
      `$${Number(devexBalance.toFixed(2)).toLocaleString()} USD`
    );
  }
};

const setRobux = async (count: number) => {
  let abbreviation: number | null = null;
  try {
    abbreviation = await getSettingValue('navigation-counter-abbreviation');
  } catch (err) {
    console.warn('Failed to fetch navigation-counter-abbreviation', err);
  }

  setAbbreviatedRobux(count, abbreviation || abbreviations[0].value);
};

const updateRobux = async () => {
  if (!authenticatedUser) {
    return;
  }

  try {
    const robuxBalance = await getRobuxBalance(authenticatedUser.id);
    await setRobux(robuxBalance);
  } catch (e) {
    console.warn('Failed to update Robux balance', e);
  }
};

getSettingValueAndListenForChanges(
  'navigation-counter-abbreviation',
  async (abbreviation) => {
    if (!authenticatedUser || !abbreviation) {
      return;
    }

    const robuxBalance = await getRobuxBalance(authenticatedUser.id);
    setAbbreviatedRobux(robuxBalance, abbreviation);
  }
);

getSettingValueAndListenForChanges('show-devex-rate', async (enabled) => {
  const navbarRobux = document.getElementById('navbar-robux');
  navbarRobux?.classList.toggle('devex-rate-visible', !!enabled);
});

setInterval(async () => {
  const liveRobux = await getSettingValue('navigation-robux-live');
  if (liveRobux) {
    await updateRobux();
  }

  const showDevexRate = await getSettingValue('show-devex-rate');
  if (showDevexRate && !document.getElementById('rplus-devex-rate')) {
    const robux = getRobux();
    if (!isNaN(robux)) {
      // The user is expecting to see their USD balance, but the element doesn't exist.
      // Set the Robux, which will create the element.
      await setRobux(robux);
    }
  }
}, 250);

export { getRobux, setRobux };
