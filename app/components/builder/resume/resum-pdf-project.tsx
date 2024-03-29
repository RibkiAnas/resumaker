import { ResumeProject } from '~/lib/redux/types';
import { ResumePDFBulletList, ResumePDFSection, ResumePDFText } from './common';

export const ResumPDFProject = ({
	heading,
	projects,
	themeColor,
}: {
	heading: string;
	projects: ResumeProject[];
	themeColor: string;
}) => {
	return (
		<ResumePDFSection themeColor={themeColor} heading={heading}>
			{projects.map(({ project, date, descriptions }, idx) => (
				<div key={idx}>
					<div
						className='flex flex-row justify-between'
						style={{
							marginTop: '1.5pt',
						}}
					>
						<ResumePDFText bold={true}>{project}</ResumePDFText>
						<ResumePDFText>{date}</ResumePDFText>
					</div>
					<div className='flex flex-col' style={{ marginTop: '1.5pt' }}>
						<ResumePDFBulletList items={descriptions} />
					</div>
				</div>
			))}
		</ResumePDFSection>
	);
};
