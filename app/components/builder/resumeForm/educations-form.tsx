/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAppDispatch, useAppSelector } from '~/lib/redux/hooks';
import { changeEducations, selectEducations } from '~/lib/redux/resumeSlice';
import { Form, FormSection } from './form';
import { Label } from '~/components/ui/label';
import { Input } from '~/components/ui/input';
import { CreateHandleChangeArgsWithDescriptions } from './types';
import { ResumeEducation } from '~/lib/redux/types';
import { BulletListTextarea } from './form/input-group';

export const EducationsForm = () => {
	const educations = useAppSelector(selectEducations);
	const dispatch = useAppDispatch();
	const showDelete = educations.length > 1;
	const form = 'educations';

	return (
		<Form form={form} addButtonText='Add School'>
			{educations.map(({ school, degree, gpa, date, descriptions }, idx) => {
				const handleEducationChange = (
					...[
						field,
						value,
					]: CreateHandleChangeArgsWithDescriptions<ResumeEducation>
				) => {
					dispatch(changeEducations({ idx, field, value } as any));
				};

				const showMoveUp = idx !== 0;
				const showMoveDown = idx !== educations.length - 1;

				return (
					<FormSection
						key={idx}
						form='educations'
						idx={idx}
						showMoveUp={showMoveUp}
						showMoveDown={showMoveDown}
						showDelete={showDelete}
						deleteButtonTooltipText='Delete school'
					>
						<div className='grid grid-cols-2 gap-4'>
							<div className='grid gap-3'>
								<Label htmlFor='school'>School</Label>
								<Input
									id='school'
									name='school'
									placeholder='ALX Africa'
									value={school}
									onChange={(e) =>
										handleEducationChange('school', e.target.value)
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
										handleEducationChange('date', e.target.value)
									}
								/>
							</div>
						</div>
						<div className='grid grid-cols-2 gap-4'>
							<div className='grid gap-3'>
								<Label htmlFor='degree'>Degree & Major</Label>
								<Input
									id='degree'
									name='degree'
									placeholder='Bachelor of Science in Computer Engineering'
									value={degree}
									onChange={(e) =>
										handleEducationChange('degree', e.target.value)
									}
								/>
							</div>
							<div className='grid gap-3'>
								<Label htmlFor='gpa'>GPA</Label>
								<Input
									id='gpa'
									name='gpa'
									placeholder='3.81'
									value={gpa}
									onChange={(e) => handleEducationChange('gpa', e.target.value)}
								/>
							</div>
						</div>
						<div className='grid gap-3'>
							<BulletListTextarea
								label='Additional Information (Optional)'
								labelClassName='col-span-full'
								name='descriptions'
								placeholder='Free paragraph space to list out additional activities, courses, awards etc'
								value={descriptions}
								onChange={handleEducationChange}
							/>
						</div>
					</FormSection>
				);
			})}
		</Form>
	);
};
