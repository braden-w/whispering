import { createStore } from './createStore';

type Options = { copyToClipboard: boolean };
const initialOptions: Options = { copyToClipboard: true };
export const options = createStore('options', initialOptions);
