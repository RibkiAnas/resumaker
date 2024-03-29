import {
	ArrowDownIcon,
	ArrowUpIcon,
	EyeIcon,
	EyeOff,
	ListIcon,
	TrashIcon,
} from 'lucide-react';
import { IconButton } from './button';

export const ShowIconButton = ({
	show,
	setShow,
}: {
	show: boolean;
	setShow: (show: boolean) => void;
}) => {
	const tooltipText = show ? 'Hide section' : 'Show section';
	const onClick = () => {
		setShow(!show);
	};
	const Icon = show ? EyeIcon : EyeOff;

	return (
		<IconButton onClick={onClick} tooltipText={tooltipText}>
			<Icon className='h-6 w-6 text-gray-400' aria-hidden='true' />
			<span className='sr-only'>{tooltipText}</span>
		</IconButton>
	);
};

type MoveIconButtonType = 'up' | 'down';
export const MoveIconButton = ({
	type,
	size = 'medium',
	onClick,
}: {
	type: MoveIconButtonType;
	size?: 'small' | 'medium';
	onClick: (type: MoveIconButtonType) => void;
}) => {
	const tooltipText = type === 'up' ? 'Move up' : 'Move down';
	const sizeClassName = size === 'medium' ? 'h-6 w-6' : 'h-4 w-4';
	const Icon = type === 'up' ? ArrowUpIcon : ArrowDownIcon;

	return (
		<IconButton
			onClick={() => onClick(type)}
			tooltipText={tooltipText}
			size={size}
		>
			<Icon className={`${sizeClassName} text-gray-400`} aria-hidden='true' />
			<span className='sr-only'>{tooltipText}</span>
		</IconButton>
	);
};

export const DeleteIconButton = ({
	onClick,
	tooltipText,
}: {
	onClick: () => void;
	tooltipText: string;
}) => {
	return (
		<IconButton onClick={onClick} tooltipText={tooltipText} size='small'>
			<TrashIcon className='h-4 w-4 text-gray-400' aria-hidden='true' />
			<span className='sr-only'>{tooltipText}</span>
		</IconButton>
	);
};

export const BulletListIconButton = ({
	onClick,
	showBulletPoints,
}: {
	onClick: (newShowBulletPoints: boolean) => void;
	showBulletPoints: boolean;
}) => {
	const tooltipText = showBulletPoints
		? 'Hide bullet points'
		: 'Show bullet points';

	return (
		<IconButton
			onClick={() => onClick(!showBulletPoints)}
			tooltipText={tooltipText}
			size='small'
			className={showBulletPoints ? '!bg-sky-100' : ''}
		>
			<ListIcon
				className={`h-4 w-4 ${
					showBulletPoints ? 'text-gray-700' : 'text-gray-400'
				}`}
				aria-hidden='true'
			/>
			<span className='sr-only'>{tooltipText}</span>
		</IconButton>
	);
};
