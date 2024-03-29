import { ResumeWorkExperience } from '~/lib/redux/types';
import { ResumePDFBulletList, ResumePDFSection, ResumePDFText } from './common';

export const ResumePDFWorkExperience = ({
	heading,
	workExperiences,
	themeColor,
}: {
	heading: string;
	workExperiences: ResumeWorkExperience[];
	themeColor: string;
}) => {
	return (
		<ResumePDFSection themeColor={themeColor} heading={heading}>
			{workExperiences.map(({ company, jobTitle, date, descriptions }, idx) => {
				// Hide company name if it is the same as the previous company
				const hideCompanyName =
					idx > 0 && company === workExperiences[idx - 1].company;

				return (
					<div key={idx} style={idx !== 0 ? { marginTop: '6pt' } : {}}>
						{!hideCompanyName && (
							<ResumePDFText bold={true}>{company}</ResumePDFText>
						)}
						<div
							className='flex flex-row justify-between'
							style={{
								marginTop: hideCompanyName ? '-' + '3pt' : '4.5pt',
							}}
						>
							<ResumePDFText>{jobTitle}</ResumePDFText>
							<ResumePDFText>{date}</ResumePDFText>
						</div>
						<div className='flex flex-col' style={{ marginTop: '4.5pt' }}>
							<ResumePDFBulletList items={descriptions} />
						</div>
					</div>
				);
			})}
		</ResumePDFSection>
	);
};
