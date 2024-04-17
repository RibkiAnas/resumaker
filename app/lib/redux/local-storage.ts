import type { RootState } from './store';

// Reference: https://dev.to/igorovic/simplest-way-to-persist-redux-state-to-localstorage-e67

export const loadStateFromLocalStorage = () => {
	try {
		const LOCAL_STORAGE_KEY = 'resumaker';
		const stringifiedState = localStorage.getItem(LOCAL_STORAGE_KEY);
		if (!stringifiedState) return undefined;
		return JSON.parse(stringifiedState);
	} catch (e) {
		return undefined;
	}
};

export const deleteStateFromLocalStorage = () => {
	try {
		const LOCAL_STORAGE_KEY = 'resumaker';

		localStorage.removeItem(LOCAL_STORAGE_KEY);
	} catch (e) {
		return undefined;
	}
};

export const saveStateToLocalStorage = (state: RootState) => {
	try {
		const LOCAL_STORAGE_KEY = 'resumaker';
		const stringifiedState = JSON.stringify(state);
		localStorage.setItem(LOCAL_STORAGE_KEY, stringifiedState);
	} catch (e) {
		// Ignore
	}
};

export const getHasUsedAppBefore = () => Boolean(loadStateFromLocalStorage());
