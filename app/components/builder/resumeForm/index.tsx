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
import { CustomForm } from './custom-form';

const formTypeToComponent: { [type in ShowForm]: () => JSX.Element } = {
	workExperiences: WorkexperiencesForm,
	educations: EducationsForm,
	projects: ProjectsForm,
	skills: SkillsForm,
	custom: CustomForm,
};

function ResumeForms({ resumeId }: { resumeId: string }) {
	useSetInitialStore(resumeId);
	useSaveStateToLocalStorageOnChange(resumeId);

	const formsOrder = useAppSelector(selectFormsOrder);

	return (
		<ScrollArea className='grid gap-6 p-4 pt-0 h-screen'>
			<ProfileForm />
			<div className='mt-2 invisible'>invisible</div>
			{formsOrder.map((form) => {
				const Component = formTypeToComponent[form];
				return (
					<>
						<Component key={form} />
						<div className='mt-2 invisible'>invisible</div>
					</>
				);
			})}
		</ScrollArea>
	);
}

export default ResumeForms;
