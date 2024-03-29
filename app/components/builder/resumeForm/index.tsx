import { ScrollArea } from '../../ui/scroll-area';
import {
	useAppSelector,
	useSaveStateToLocalStorageOnChange,
	useSetInitialStore,
} from '~/lib/redux/hooks';
import { ProfileForm } from './profile-form';
import { selectFormsOrder, ShowForm } from '~/lib/redux/settingsSlice';
import { WorkexperiencesForm } from './work-experiences-form';
import { EducationsForm } from './educations-form';
import { ProjectsForm } from './projects-form';
import { SkillsForm } from './skills-form';

const formTypeToComponent: { [type in ShowForm]: () => JSX.Element } = {
	workExperiences: WorkexperiencesForm,
	educations: EducationsForm,
	projects: ProjectsForm,
	skills: SkillsForm,
	custom: () => <></>,
};

function ResumeForms() {
	useSetInitialStore();
	useSaveStateToLocalStorageOnChange();

	const formsOrder = useAppSelector(selectFormsOrder);

	return (
		<ScrollArea className='flex flex-col gap-2 p-4 pt-0 h-screen'>
			<ProfileForm />
			{formsOrder.map((form) => {
				const Component = formTypeToComponent[form];
				return <Component key={form} />;
			})}
		</ScrollArea>
	);
}

export default ResumeForms;
