import { Settings } from 'lucide-react';
import { Label } from '~/components/ui/label';
import { useAppDispatch, useAppSelector } from '~/lib/redux/hooks';
import {
	changeSettings,
	DEFAULT_THEME_COLOR,
	GeneralSetting,
	selectSettings,
} from '~/lib/redux/settingsSlice';
import { THEME_COLORS } from './constants';
import {
	DocumentSizeSelections,
	FontFamilySelections,
	FontSizeSelections,
} from './selection';
import { FontFamily } from '../../fonts/constants';
import { ScrollArea } from '~/components/ui/scroll-area';

export const ThemeForm = () => {
	const settings = useAppSelector(selectSettings);
	const { fontSize, fontFamily, documentSize } = settings;
	const themeColor = settings.themeColor || DEFAULT_THEME_COLOR;
	const dispatch = useAppDispatch();

	const handleSettingsChange = (field: GeneralSetting, value: string) => {
		dispatch(changeSettings({ field, value }));
	};

	return (
		<ScrollArea className='grid gap-6 p-4 pt-0 h-screen'>
			<fieldset className='grid gap-6 rounded-lg border p-4 sm:mb-12'>
				<div className='flex flex-col gap-6'>
					<div className='flex items-center gap-2'>
						<Settings className='h-6 w-6 text-gray-600' aria-hidden='true' />
						<h1 className='text-lg font-semibold tracking-wide text-gray-900 '>
							Resume Setting
						</h1>
					</div>
					<div className='grid gap-2'>
						<label
							htmlFor='themeColor'
							className='flex gap-2 text-sm font-medium text-gray-700'
						>
							Theme Color
							<input
								className='w-[10rem] border-b border-gray-300 text-center font-semibold leading-3 outline-none'
								id='themeColor'
								name='themeColor'
								value={themeColor}
								placeholder={DEFAULT_THEME_COLOR}
								onChange={(e) =>
									handleSettingsChange('themeColor', e.target.value)
								}
								style={{ color: themeColor }}
							/>
						</label>
						<div className='mt-2 flex flex-wrap gap-2'>
							{THEME_COLORS.map((color, idx) => (
								<button
									className='flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-sm text-white'
									style={{ backgroundColor: color }}
									key={idx}
									onClick={() => handleSettingsChange('themeColor', color)}
									onKeyDown={(e) => {
										if (['Enter', ' '].includes(e.key))
											handleSettingsChange('themeColor', color);
									}}
									tabIndex={0}
								>
									{settings.themeColor === color ? '✓' : ''}
								</button>
							))}
						</div>
					</div>
					<div className='grid gap-2'>
						<Label>Font Family</Label>
						<FontFamilySelections
							selectedFontFamily={fontFamily}
							themeColor={themeColor}
							handleSettingsChange={handleSettingsChange}
						/>
					</div>
					<div className='grid gap-2'>
						<label
							htmlFor='fontSize'
							className='flex gap-2 text-sm font-medium text-gray-700'
						>
							Font Size (pt)
							<input
								className='w-[10rem] border-b border-gray-300 text-center font-semibold leading-3 outline-none'
								id='fontSize'
								name='fontSize'
								value={fontSize}
								placeholder={'11'}
								onChange={(e) =>
									handleSettingsChange('fontSize', e.target.value)
								}
							/>
						</label>
						<FontSizeSelections
							fontFamily={fontFamily as FontFamily}
							themeColor={themeColor}
							selectedFontSize={fontSize}
							handleSettingsChange={handleSettingsChange}
						/>
					</div>
					<div className='grid gap-2'>
						<Label>Document Size</Label>
						<DocumentSizeSelections
							themeColor={themeColor}
							selectedDocumentSize={documentSize}
							handleSettingsChange={handleSettingsChange}
						/>
					</div>
				</div>
			</fieldset>
		</ScrollArea>
	);
};
