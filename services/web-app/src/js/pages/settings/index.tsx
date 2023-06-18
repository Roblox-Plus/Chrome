import { Alert, Box, Link, Tab, Tabs, Typography } from '@mui/material';
import { LoadingState } from '@tix-factory/extension-utils';
import { Fragment } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import '../../../css/settings.scss';
import { extensionUrl, settingsPath } from '../../constants';
import useAuthenticatedUser from '../../hooks/useAuthenticatedUser';
import LoginRedirect from '../login/redirect';
import NavigationSettings from './tabs/navigation';
import NotificationSettings from './tabs/notifications';
import OtherSettings from './tabs/other';

const tabs = ['navigation', 'notifications', 'other'];

export default function Settings() {
  const navigate = useNavigate();
  const authenticatedUser = useAuthenticatedUser();
  const { tab } = useParams();

  if (authenticatedUser.loadingState !== LoadingState.Success) {
    // Loading and failure states are handled by the parent.
    return <Fragment />;
  } else if (!authenticatedUser.user) {
    console.warn(
      'Settings page: We finished loading, and there was no authenticated user. Must be time to redirect.',
      authenticatedUser
    );

    // This page requires you to be logged in first.
    return <LoginRedirect />;
  }

  if (!tabs.includes(tab || '')) {
    return <Navigate to={`${settingsPath}/${tabs[0]}`} />;
  }

  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="h2">Roblox+ Settings</Typography>
      {document.body.dataset.extensionId ? (
        <Typography variant="body1">
          On this page, you can modify settings for{' '}
          <Link href={extensionUrl}>the extension</Link>.
        </Typography>
      ) : (
        <Alert severity="warning">
          You must have <Link href={extensionUrl}>the extension</Link> installed
          to modify these settings.
        </Alert>
      )}
      <Box sx={{ display: 'flex' }}>
        <Tabs
          orientation="vertical"
          value={tabs.indexOf(tab || '')}
          sx={{
            minWidth: 200,
          }}
          onChange={(_, i) => {
            navigate(`${settingsPath}/${tabs[i]}`);
          }}
        >
          {tabs.map((tab, i) => {
            return (
              <Tab
                key={tab}
                label={tab}
                tabIndex={i}
                sx={{
                  flexDirection: 'row',
                  justifyContent: 'left',
                  textAlign: 'left',
                  borderRight: 1,
                }}
              />
            );
          })}
        </Tabs>
        <Box>
          <Box className="extension-settings-container">
            {tab === 'navigation' ? <NavigationSettings /> : <Fragment />}
            {tab === 'notifications' ? <NotificationSettings /> : <Fragment />}
            {tab === 'other' ? <OtherSettings /> : <Fragment />}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
