// Fix: react-native-screens native views crash on Android New Architecture.
// enableScreens(false) makes React Navigation use JS-based screens instead.
// Must be called before ANY navigation code is imported.
// DO NOT add react-native-gesture-handler here — GestureHandlerRootView
// also causes the same String→Boolean cast crash on Android New Architecture.
import { enableScreens } from 'react-native-screens';
enableScreens(false);

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
