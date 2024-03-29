import { ResumeSkills } from '~/lib/redux/types';
import {
	ResumeFeaturedSkill,
	ResumePDFBulletList,
	ResumePDFSection,
} from './common';

export const ResumePDFSkills = ({
	heading,
	skills,
	themeColor,
	showBulletPoints,
}: {
	heading: string;
	skills: ResumeSkills;
	themeColor: string;
	showBulletPoints: boolean;
}) => {
	const { descriptions, featuredSkills } = skills;
	const featuredSkillsWithText = featuredSkills.filter((item) => item.skill);
	const featuredSkillsPair = [
		[featuredSkillsWithText[0], featuredSkillsWithText[3]],
		[featuredSkillsWithText[1], featuredSkillsWithText[4]],
		[featuredSkillsWithText[2], featuredSkillsWithText[5]],
	];

	return (
		<ResumePDFSection themeColor={themeColor} heading={heading}>
			{featuredSkillsWithText.length > 0 && (
				<div
					className='flex flex-row justify-between'
					style={{ marginTop: '1.5pt' }}
				>
					{featuredSkillsPair.map((pair, idx) => (
						<div className='flex flex-col' key={idx}>
							{pair.map((featuredSkill, idx) => {
								if (!featuredSkill) return null;
								return (
									<ResumeFeaturedSkill
										key={idx}
										skill={featuredSkill.skill}
										rating={featuredSkill.rating}
										themeColor={themeColor}
										style={{
											justifyContent: 'flex-end',
										}}
									/>
								);
							})}
						</div>
					))}
				</div>
			)}
			<div className='flex flex-col'>
				<ResumePDFBulletList
					items={descriptions}
					showBulletPoints={showBulletPoints}
				/>
			</div>
		</ResumePDFSection>
	);
};
