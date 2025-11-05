import { Platform } from 'react-native';

export const fonts = {
  semibold: Platform.select({ ios: 'HelveticaNeue-Medium', android: 'sans-serif-medium', default: 'System' })!,
  regular: Platform.select({ ios: 'HelveticaNeue', android: 'sans-serif', default: 'System' })!,
};
