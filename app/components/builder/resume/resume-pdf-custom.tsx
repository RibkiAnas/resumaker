import { ResumeCustom } from '~/lib/redux/types';
import { ResumePDFBulletList, ResumePDFSection } from './common';

export const ResumePDFCustom = ({
	heading,
	custom,
	themeColor,
	showBulletPoints,
}: {
	heading: string;
	custom: ResumeCustom;
	themeColor: string;
	showBulletPoints: boolean;
}) => {
	const { descriptions } = custom;

	return (
		<ResumePDFSection themeColor={themeColor} heading={heading}>
			<div className='flex flex-col'>
				<ResumePDFBulletList
					items={descriptions}
					showBulletPoints={showBulletPoints}
				/>
			</div>
		</ResumePDFSection>
	);
};
