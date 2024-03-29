import { ResumeProfile } from '~/lib/redux/types';
import { ResumePDFLink, ResumePDFSection, ResumePDFText } from './common';
import { IconType, ResumePDFIcon } from './common/resume-pdf-icon';

export const ResumeprofilePDF = ({
	profile,
	themeColor,
}: {
	profile: ResumeProfile;
	themeColor: string;
}) => {
	const { name, email, phone, url, summary, location } = profile;
	const iconProps = { email, phone, location, url };

	return (
		<ResumePDFSection style={{ marginTop: '12pt' }}>
			<ResumePDFText
				bold={true}
				themeColor={themeColor}
				style={{ fontSize: '20pt' }}
			>
				{name}
			</ResumePDFText>
			{summary && <ResumePDFText>{summary}</ResumePDFText>}
			<div
				className='flex flex-row justify-between'
				style={{
					flexWrap: 'wrap',
					marginTop: '1.5pt',
				}}
			>
				{Object.entries(iconProps).map(([key, value]) => {
					if (!value) return null;

					let iconType = key as IconType;
					if (key === 'url') {
						if (value.includes('github')) {
							iconType = 'url_github';
						} else if (value.includes('linkedin')) {
							iconType = 'url_linkedin';
						}
					}

					const shouldUseLinkWrapper = ['email', 'url', 'phone'].includes(key);
					const Wrapper = ({ children }: { children: React.ReactNode }) => {
						if (!shouldUseLinkWrapper) return <>{children}</>;

						let src = '';
						switch (key) {
							case 'email': {
								src = `mailto:${value}`;
								break;
							}
							case 'phone': {
								src = `tel:${value.replace(/[^\d+]/g, '')}`; // Keep only + and digits
								break;
							}
							default: {
								src = value.startsWith('http') ? value : `https://${value}`;
							}
						}

						return <ResumePDFLink src={src}>{children}</ResumePDFLink>;
					};

					return (
						<div
							className='flex flex-row'
							key={key}
							style={{
								alignItems: 'center',
								gap: '3pt',
							}}
						>
							<ResumePDFIcon type={iconType} />
							<Wrapper>
								<ResumePDFText>{value}</ResumePDFText>
							</Wrapper>
						</div>
					);
				})}
			</div>
		</ResumePDFSection>
	);
};
