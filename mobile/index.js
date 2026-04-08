/**
 * @format
 */

import * as Sentry from '@sentry/react-native';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { SENTRY_DSN } from '@env';
import BackgroundFetch from 'react-native-background-fetch';
import { headlessTask } from './src/tasks/BackgroundJob';

// Initialize Sentry for error tracking
Sentry.init({
  dsn: SENTRY_DSN,
  debug: __DEV__,
  tracesSampleRate: __DEV__ ? 1.0 : 0.1,
  environment: __DEV__ ? 'development' : 'production',
});

// Register Android Headless Task
BackgroundFetch.registerHeadlessTask(headlessTask);

AppRegistry.registerComponent(appName, () => Sentry.wrap(App));
