import { getFriendRequestCount } from '../../../services/friends';
import { getToggleSettingValue } from '../../../services/settings';
import { parseAuthenticatedUser } from '../../../utils/authenticatedUser';
import { getBubbleValue, setBubbleValue } from './bubble';
import { getRobux, setRobux } from './robux';

// Check if we should be refreshing the counter values.
const refreshEnabled = async (): Promise<boolean> => {
  try {
    return await getToggleSettingValue('navcounter');
  } catch (err) {
    console.warn(
      'Failed to check if live navigation counters are enabled',
      err
    );
    return false;
  }
};

// Fetches the count of friend requests
const getFriendRequestBubbleCount = async (
  refresh: boolean
): Promise<number> => {
  const authenticatedUser = parseAuthenticatedUser();
  if (refresh && authenticatedUser) {
    return await getFriendRequestCount(authenticatedUser.id);
  }

  return getBubbleValue('nav-friends');
};

// Update the navigation bar, periodically.
setInterval(async () => {
  const shouldRefresh = await refreshEnabled();

  // Update the Robux count.
  const robux = await getRobux(shouldRefresh);
  setRobux(robux);

  // Update the friend request count.
  const friendRequests = await getFriendRequestBubbleCount(shouldRefresh);
  setBubbleValue('nav-friends', friendRequests);
}, 500);

// Export to window, for debugging purposes.
declare global {
  var navigationBar: object;
}

window.navigationBar = {
  getRobux,
  setRobux,
  getBubbleValue,
  setBubbleValue,
};
