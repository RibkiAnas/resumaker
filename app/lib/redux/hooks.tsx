import { useEffect } from 'react';
import {
	useDispatch,
	useSelector,
	type TypedUseSelectorHook,
} from 'react-redux';
import { store, type RootState, type AppDispatch } from './store';
import {
	loadStateFromLocalStorage,
	saveStateToLocalStorage,
} from './local-storage';
import { initialResumeState, setResume } from './resumeSlice';
import { initialSettings, setSettings, type Settings } from './settingsSlice';
import { deepMerge } from '../deep-merge';
import type { Resume } from './types';

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/**
 * Hook to save store to local storage on store change
 */
export const useSaveStateToLocalStorageOnChange = (id: string) => {
	useEffect(() => {
		const unsubscribe = store.subscribe(() => {
			saveStateToLocalStorage(id, store.getState());
		});
		return unsubscribe;
	}, [id]);
};

export const useSetInitialStore = (id: string) => {
	const dispatch = useAppDispatch();
	useEffect(() => {
		const state = loadStateFromLocalStorage(id);
		if (!state) return;
		if (state.resume) {
			// We merge the initial state with the stored state to ensure
			// backward compatibility, since new fields might be added to
			// the initial state over time.
			const mergedResumeState = deepMerge(
				initialResumeState,
				state.resume
			) as Resume;
			dispatch(setResume(mergedResumeState));
		}
		if (state.settings) {
			const mergedSettingsState = deepMerge(
				initialSettings,
				state.settings
			) as Settings;
			dispatch(setSettings(mergedSettingsState));
		}
	}, [dispatch, id]);
};
