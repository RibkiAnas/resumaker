import { useAppDispatch, useAppSelector } from '~/lib/redux/hooks';
import { changeSkills, selectSkills } from '~/lib/redux/resumeSlice';
import { selectThemeColor } from '~/lib/redux/settingsSlice';
import { Form } from './form';
import { Label } from '~/components/ui/label';
import { FeaturedSkillInput } from './form/featured-skill-input';
import { BulletListTextarea } from './form/input-group';

export const SkillsForm = () => {
	const skills = useAppSelector(selectSkills);
	const dispatch = useAppDispatch();
	const { featuredSkills, descriptions } = skills;
	const form = 'skills';
	const themeColor = useAppSelector(selectThemeColor) || '#38bdf8';

	const handleSkillsChange = (field: 'descriptions', value: string[]) => {
		dispatch(changeSkills({ field, value }));
	};
	const handleFeaturedSkillsChange = (
		idx: number,
		skill: string,
		rating: number
	) => {
		dispatch(changeSkills({ field: 'featuredSkills', idx, skill, rating }));
	};
	return (
		<Form form={form}>
			<div className='grid gap-3'>
				<BulletListTextarea
					label='Skills List'
					labelClassName='col-span-full'
					name='descriptions'
					placeholder='Bullet points'
					value={descriptions}
					onChange={handleSkillsChange}
				/>
			</div>
			<div className='col-span-full mb-4 mt-6 border-t-2 border-dotted border-gray-200' />
			<Label
			// className="col-span-full"
			>
				Featured Skills (Optional)
			</Label>
			<p className='mt-2 text-sm font-normal text-gray-600'>
				Featured skills is optional to highlight top skills, with more circles
				mean higher proficiency.
			</p>

			<div className='grid grid-cols-2 gap-4 mt-2'>
				{featuredSkills.map(({ skill, rating }, idx) => (
					<FeaturedSkillInput
						key={idx}
						className='gap-3'
						skill={skill}
						rating={rating}
						setSkillRating={(newSkill, newRating) => {
							handleFeaturedSkillsChange(idx, newSkill, newRating);
						}}
						placeholder={`Featured Skill ${idx + 1}`}
						circleColor={themeColor}
					/>
				))}
			</div>
		</Form>
	);
};
