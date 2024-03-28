import { ScrollArea } from '../../ui/scroll-area';
import {
	useSaveStateToLocalStorageOnChange,
	useSetInitialStore,
} from '~/lib/redux/hooks';
import { ProfileForm } from './profile-form';

function ResumeForms() {
	useSetInitialStore();
	useSaveStateToLocalStorageOnChange();

	return (
		<ScrollArea className='flex flex-col gap-2 p-4 pt-0 h-screen'>
			<ProfileForm />
		</ScrollArea>
	);
}

export default ResumeForms;
