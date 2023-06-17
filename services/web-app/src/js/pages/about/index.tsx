import { Box, Tab, Tabs } from '@mui/material';
import { Fragment, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import markdown from '../../../markdown.json';
import Markdown from '../../components/markdown';
import { aboutPath } from '../../constants';

const AboutTabs: { [path: string]: string } = {
  '': 'About',
  support: 'Support',
  'privacy-policy': 'Privacy Policy',
  'terms-of-service': 'Terms of Service',
};

const aboutTabPaths = Object.keys(AboutTabs);

export default function About() {
  const navigate = useNavigate();
  const { tab } = useParams();
  const tabIndex = useMemo(() => {
    const index = aboutTabPaths.indexOf(tab || '');
    return index >= 0 ? index : 0;
  }, [tab]);

  return (
    <Box sx={{ display: 'flex' }}>
      <Tabs
        value={tabIndex}
        orientation="vertical"
        sx={{
          minWidth: 200,
        }}
        onChange={(_, i) => {
          if (i > 0) {
            navigate(`${aboutPath}/${aboutTabPaths[i]}`);
          } else {
            navigate(aboutPath);
          }
        }}
      >
        {aboutTabPaths.map((path, i) => {
          return (
            <Tab
              key={path}
              tabIndex={i}
              label={AboutTabs[path]}
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
      <Box sx={{ p: 1, ml: 1 }}>
        {Object.entries(markdown).map(([markdownKey, markdownText]) => {
          if (
            (!tab && markdownKey === 'about') ||
            tab === markdownKey.replace(/([A-Z])/g, '-$1').toLowerCase()
          ) {
            return <Markdown key={markdownKey}>{markdownText}</Markdown>;
          }

          return <Fragment key={markdownKey} />;
        })}
      </Box>
    </Box>
  );
}