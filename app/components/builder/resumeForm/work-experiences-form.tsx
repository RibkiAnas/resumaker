/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAppDispatch, useAppSelector } from '~/lib/redux/hooks';
import {
	changeWorkExperiences,
	selectWorkExperiences,
} from '~/lib/redux/resumeSlice';
import { Form, FormSection } from './form';
import { CreateHandleChangeArgsWithDescriptions } from './types';
import { ResumeWorkExperience } from '~/lib/redux/types';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { BulletListTextarea } from './form/input-group';

export const WorkexperiencesForm = () => {
	const workExperiences = useAppSelector(selectWorkExperiences);
	const dispatch = useAppDispatch();

	const showDelete = workExperiences.length > 1;

	return (
		<Form form='workExperiences' addButtonText='Add Job'>
			{workExperiences.map(({ company, jobTitle, date, descriptions }, idx) => {
				const handleWorkExperienceChange = (
					...[
						field,
						value,
					]: CreateHandleChangeArgsWithDescriptions<ResumeWorkExperience>
				) => {
					// TS doesn't support passing union type to single call signature
					// https://github.com/microsoft/TypeScript/issues/54027
					// any is used here as a workaround
					dispatch(changeWorkExperiences({ idx, field, value } as any));
				};
				const showMoveUp = idx !== 0;
				const showMoveDown = idx !== workExperiences.length - 1;

				return (
					<FormSection
						key={idx}
						form='workExperiences'
						idx={idx}
						showMoveUp={showMoveUp}
						showMoveDown={showMoveDown}
						showDelete={showDelete}
						deleteButtonTooltipText='Delete job'
					>
						<div className='grid gap-3'>
							<Label htmlFor='company'>Company</Label>
							<Input
								id='company'
								name='company'
								placeholder='Google'
								value={company}
								onChange={(e) =>
									handleWorkExperienceChange('company', e.target.value)
								}
							/>
						</div>
						<div className='grid grid-cols-2 gap-4'>
							<div className='grid gap-3'>
								<Label htmlFor='jobTitle'>Job Title</Label>
								<Input
									id='jobTitle'
									name='jobTitle'
									placeholder='Software Engineer'
									value={jobTitle}
									onChange={(e) =>
										handleWorkExperienceChange('jobTitle', e.target.value)
									}
								/>
							</div>
							<div className='grid gap-3'>
								<Label htmlFor='date'>Date</Label>
								<Input
									id='date'
									name='date'
									placeholder='Jun 2023 - Present'
									value={date}
									onChange={(e) =>
										handleWorkExperienceChange('date', e.target.value)
									}
								/>
							</div>
						</div>
						<div className='grid gap-3'>
							<BulletListTextarea
								label='Description'
								labelClassName='col-span-full'
								name='descriptions'
								placeholder='Bullet points'
								value={descriptions}
								onChange={handleWorkExperienceChange}
							/>
						</div>
					</FormSection>
				);
			})}
		</Form>
	);
};
