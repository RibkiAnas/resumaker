import {
	Building,
	GraduationCap,
	LightbulbIcon,
	Plus,
	WrenchIcon,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '~/lib/redux/hooks';
import {
	addSectionInForm,
	deleteSectionInFormByIdx,
	moveSectionInForm,
} from '~/lib/redux/resumeSlice';
import {
	changeFormHeading,
	changeFormOrder,
	changeShowForm,
	selectHeadingByForm,
	selectIsFirstForm,
	selectIsLastForm,
	selectShowByForm,
	ShowForm,
} from '~/lib/redux/settingsSlice';
import { cn } from '~/lib/utils';
import {
	DeleteIconButton,
	MoveIconButton,
	ShowIconButton,
} from './icon-button';
import { ExpanderWithHeightTransition } from '../../expander-with-height-transition';

export const BaseForm = ({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) => (
	<fieldset
		className={cn(
			'grid gap-6 rounded-lg border p-3 mb-3 transition-opacity duration-200',
			className
		)}
	>
		{children}
	</fieldset>
);

const FORM_TO_ICON: { [section in ShowForm]: typeof Building } = {
	workExperiences: Building,
	educations: GraduationCap,
	projects: LightbulbIcon,
	skills: WrenchIcon,
	custom: WrenchIcon,
};

export const Form = ({
	form,
	addButtonText,
	children,
	className,
}: {
	form: ShowForm;
	addButtonText?: string;
	children: React.ReactNode;
	className?: string;
}) => {
	const showForm = useAppSelector(selectShowByForm(form));
	const heading = useAppSelector(selectHeadingByForm(form));

	const dispatch = useAppDispatch();
	const setShowForm = (showForm: boolean) => {
		dispatch(changeShowForm({ field: form, value: showForm }));
	};
	const setHeading = (heading: string) => {
		dispatch(changeFormHeading({ field: form, value: heading }));
	};

	const isFirstForm = useAppSelector(selectIsFirstForm(form));
	const isLastForm = useAppSelector(selectIsLastForm(form));

	const handleMoveClick = (type: 'up' | 'down') => {
		dispatch(changeFormOrder({ form, type }));
	};

	const Icon = FORM_TO_ICON[form];

	return (
		<BaseForm
			className={`transition-opacity duration-200 ${
				showForm ? 'pb-6' : 'pb-2 opacity-60'
			} ${className}`}
		>
			<div className='flex items-center justify-between gap-4 p-1'>
				<div className='flex grow items-center gap-2'>
					<Icon className='h-6 w-6 text-gray-600' aria-hidden='true' />
					<input
						type='text'
						className='block w-full border-b border-transparent text-lg font-semibold tracking-wide text-gray-900 outline-none hover:border-gray-300 hover:shadow-sm focus:border-gray-300 focus:shadow-sm'
						value={heading}
						onChange={(e) => setHeading(e.target.value)}
					/>
				</div>
				<div className='flex items-center gap-0.5'>
					{!isFirstForm && (
						<MoveIconButton type='up' onClick={handleMoveClick} />
					)}
					{!isLastForm && (
						<MoveIconButton type='down' onClick={handleMoveClick} />
					)}
					<ShowIconButton show={showForm} setShow={setShowForm} />
				</div>
			</div>
			<ExpanderWithHeightTransition expanded={showForm}>
				{children}
			</ExpanderWithHeightTransition>
			{showForm && addButtonText && (
				<div className='mt-2 flex justify-end'>
					<button
						type='button'
						onClick={() => {
							dispatch(addSectionInForm({ form }));
						}}
						className='flex items-center rounded-md bg-white py-2 pl-3 pr-4 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
					>
						<Plus
							className='-ml-0.5 mr-1.5 h-5 w-5 text-gray-400'
							aria-hidden='true'
						/>
						{addButtonText}
					</button>
				</div>
			)}
		</BaseForm>
	);
};

export const FormSection = ({
	form,
	idx,
	showMoveUp,
	showMoveDown,
	showDelete,
	deleteButtonTooltipText,
	children,
}: {
	form: ShowForm;
	idx: number;
	showMoveUp: boolean;
	showMoveDown: boolean;
	showDelete: boolean;
	deleteButtonTooltipText: string;
	children: React.ReactNode;
}) => {
	const dispatch = useAppDispatch();
	const handleDeleteClick = () => {
		dispatch(deleteSectionInFormByIdx({ form, idx }));
	};
	const handleMoveClick = (direction: 'up' | 'down') => {
		dispatch(moveSectionInForm({ form, direction, idx }));
	};

	return (
		<>
			{idx !== 0 && (
				<div className='mb-4 mt-6 border-t-2 border-dotted border-gray-200' />
			)}
			<div className='relative grid gap-6'>
				{children}
				<div className={`absolute right-0 top-0 flex gap-0.5 `}>
					<div
						className={`transition-all duration-300 ${
							showMoveUp ? '' : 'invisible opacity-0'
						} ${showMoveDown ? '' : '-mr-6'}`}
					>
						<MoveIconButton
							type='up'
							size='small'
							onClick={() => handleMoveClick('up')}
						/>
					</div>
					<div
						className={`transition-all duration-300 ${
							showMoveDown ? '' : 'invisible opacity-0'
						}`}
					>
						<MoveIconButton
							type='down'
							size='small'
							onClick={() => handleMoveClick('down')}
						/>
					</div>
					<div
						className={`transition-all duration-300 ${
							showDelete ? '' : 'invisible opacity-0'
						}`}
					>
						<DeleteIconButton
							onClick={handleDeleteClick}
							tooltipText={deleteButtonTooltipText}
						/>
					</div>
				</div>
			</div>
		</>
	);
};
