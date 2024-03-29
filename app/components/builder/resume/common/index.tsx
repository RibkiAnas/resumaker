/* eslint-disable @typescript-eslint/no-explicit-any */
import { DEFAULT_FONT_COLOR } from '~/lib/redux/settingsSlice';

export const ResumePDFSection = ({
	themeColor,
	heading,
	style = {},
	children,
}: {
	themeColor?: string;
	heading?: string;
	style?: any;
	children: React.ReactNode;
}) => (
	<div
		className='flex flex-col gap-[8px] mt-3'
		style={{
			...style,
		}}
	>
		{heading && (
			<div className='flex flex-row items-center'>
				{themeColor && (
					<div
						style={{
							height: '3.75pt',
							width: '30pt',
							backgroundColor: themeColor,
							marginRight: '10.5pt',
						}}
					/>
				)}
				<p
					style={{
						fontWeight: 'bold',
						letterSpacing: '0.3pt', // tracking-wide -> 0.025em * 12 pt = 0.3pt
					}}
				>
					{heading}
				</p>
			</div>
		)}
		{children}
	</div>
);

export const ResumePDFText = ({
	bold = false,
	themeColor,
	style = {},
	children,
}: {
	bold?: boolean;
	themeColor?: string;
	style?: any;
	children: React.ReactNode;
}) => {
	return (
		<p
			style={{
				color: themeColor || DEFAULT_FONT_COLOR,
				fontWeight: bold ? 'bold' : 'normal',
				...style,
			}}
		>
			{children}
		</p>
	);
};

export const ResumePDFBulletList = ({
	items,
	showBulletPoints = true,
}: {
	items: string[];
	showBulletPoints?: boolean;
}) => {
	return (
		<>
			{items.map((item, idx) => (
				<div className='flex flex-row' key={idx}>
					{showBulletPoints && (
						<ResumePDFText
							style={{
								paddingLeft: '6pt',
								paddingRight: '6pt',
								lineHeight: '1.3',
							}}
							bold={true}
						>
							{'•'}
						</ResumePDFText>
					)}
					{/* A breaking change was introduced causing text layout to be wider than node's width
              https://github.com/diegomura/react-pdf/issues/2182. flexGrow & flexBasis fixes it */}
					<ResumePDFText
						style={{ lineHeight: '1.3', flexGrow: 1, flexBasis: 0 }}
					>
						{item}
					</ResumePDFText>
				</div>
			))}
		</>
	);
};

export const ResumePDFLink = ({
	src,
	children,
}: {
	src: string;
	children: React.ReactNode;
}) => {
	return (
		<a
			href={src}
			style={{ textDecoration: 'none' }}
			target='_blank'
			rel='noreferrer'
		>
			{children}
		</a>
	);
};

export const ResumeFeaturedSkill = ({
	skill,
	rating,
	themeColor,
	style = {},
}: {
	skill: string;
	rating: number;
	themeColor: string;
	style?: any;
}) => {
	const numCircles = 5;

	return (
		<div className='flex flex-row' style={{ alignItems: 'center', ...style }}>
			<ResumePDFText style={{ marginRight: '1.5pt' }}>{skill}</ResumePDFText>
			{[...Array(numCircles)].map((_, idx) => (
				<div
					key={idx}
					style={{
						height: '9pt',
						width: '9pt',
						marginLeft: '2.25pt',
						backgroundColor: rating >= idx ? themeColor : '#d9d9d9',
						borderRadius: '100%',
					}}
				/>
			))}
		</div>
	);
};
