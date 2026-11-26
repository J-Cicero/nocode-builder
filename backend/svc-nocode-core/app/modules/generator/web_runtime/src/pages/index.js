import siteConfig from '../site.config.json';
import HomePage from './HomePage';
import DetailsPage from './DetailsPage';

export const pages = [
  { path: siteConfig.pages[0].path, Component: HomePage },
  { path: siteConfig.pages[1].path, Component: DetailsPage },
];
