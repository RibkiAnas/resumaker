/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAppDispatch, useAppSelector } from '~/lib/redux/hooks';
import { changeProjects, selectProjects } from '~/lib/redux/resumeSlice';
import { Form, FormSection } from './form';
import { CreateHandleChangeArgsWithDescriptions } from './types';
import { ResumeProject } from '~/lib/redux/types';
import { Label } from '~/components/ui/label';
import { Input } from '~/components/ui/input';
import { BulletListTextarea } from './form/input-group';

export const ProjectsForm = () => {
	const projects = useAppSelector(selectProjects);
	const dispatch = useAppDispatch();
	const showDelete = projects.length > 1;

	return (
		<Form form='projects' addButtonText='Add Project'>
			{projects.map(({ project, date, descriptions }, idx) => {
				const handleProjectChange = (
					...[
						field,
						value,
					]: CreateHandleChangeArgsWithDescriptions<ResumeProject>
				) => {
					dispatch(changeProjects({ idx, field, value } as any));
				};
				const showMoveUp = idx !== 0;
				const showMoveDown = idx !== projects.length - 1;

				return (
					<FormSection
						key={idx}
						form='projects'
						idx={idx}
						showMoveUp={showMoveUp}
						showMoveDown={showMoveDown}
						showDelete={showDelete}
						deleteButtonTooltipText={'Delete project'}
					>
						<div className='grid grid-cols-2 gap-4'>
							<div className='grid gap-3'>
								<Label htmlFor='project'>Project Name</Label>
								<Input
									id='project'
									name='project'
									placeholder='Qode'
									value={project}
									onChange={(e) =>
										handleProjectChange('project', e.target.value)
									}
								/>
							</div>
							<div className='grid gap-3'>
								<Label htmlFor='date'>Date</Label>
								<Input
									id='date'
									name='date'
									placeholder='Winter 2023'
									value={date}
									onChange={(e) => handleProjectChange('date', e.target.value)}
								/>
							</div>
						</div>
						<div className='grid gap-3'>
							<BulletListTextarea
								name='descriptions'
								label='Description'
								placeholder='Bullet points'
								value={descriptions}
								onChange={handleProjectChange}
								labelClassName='col-span-full'
							/>
						</div>
					</FormSection>
				);
			})}
		</Form>
	);
};
