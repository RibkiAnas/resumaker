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
